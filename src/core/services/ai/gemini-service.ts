import { AI_NO_RESPONSE_MESSAGE, aiErrorMessage, aiTimeoutMessage, IAiRequestOptions, IAiService, IAiToolCall } from '@/core/services/ai/iai-service';
import { fetchWithTimeout } from '@/core/utils/fetch';

type GeminiTool =
  | { googleSearch?: object }
  | { codeExecution?: object }
  | { functionDeclarations: { name: string; description: string; parameters: object }[] };

type GeminiPart = {
  text?: string;
  thought?: boolean;
  thought_signature?: string;
  thoughtSignature?: string;
  executable_code?: { code: string };
  execution_result?: { outcome?: string; output?: string };
  functionCall?: { name: string; args: Record<string, unknown>; thought_signature?: string; thoughtSignature?: string };
  functionResponse?: { name: string; response: unknown };
};

type GeminiPayload = {
  contents: { role: string; parts: GeminiPart[] }[];
  system_instruction?: { parts: { text: string }[] };
  tools?: GeminiTool[];
  generationConfig?: { thinkingConfig: { includeThoughts: boolean } };
};

export class GeminiService implements IAiService {
    public async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string, options?: IAiRequestOptions): Promise<{ text: string; toolCalls: IAiToolCall[] }> {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

        try {
            const bodyPayload = this.buildPayload(prompt, systemInstruction, options);

            if (options?.onStream) {
                return await this.generateStreaming(apiUrl, bodyPayload, apiKey, options.onStream);
            }

            const response = await fetchWithTimeout(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': apiKey
                },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) {
                const errorData = (await response.json()) as { error?: { message?: string } };
                throw new Error(errorData.error?.message || 'Gagal mengambil respons dari Gemini API');
            }

            const data = (await response.json()) as {
                candidates?: { content: { parts: GeminiPart[] } }[];
            };
            if (data.candidates && data.candidates.length > 0) {
                const parts = data.candidates[0].content.parts;

                const toolCalls: IAiToolCall[] = [];
                for (const p of parts) {
                    if (p.functionCall) {
                        const sig = p.thought_signature || p.thoughtSignature || p.functionCall.thought_signature || p.functionCall.thoughtSignature;
                        toolCalls.push({
                            name: p.functionCall.name,
                            args: p.functionCall.args,
                            thoughtSignature: sig
                        });
                    }
                }

                const text = parts
                    .filter((p) => !p.thought)
                    .map((p) => {
                        if (typeof p.text === 'string') return p.text;
                        if (p.execution_result?.output) return `\`\`\`\n${p.execution_result.output}\n\`\`\``;
                        return '';
                    })
                    .filter(Boolean)
                    .join('\n');

                return { text, toolCalls };
            }
            return { text: AI_NO_RESPONSE_MESSAGE, toolCalls: [] };
        } catch (error: unknown) {
            const err = error as { name?: string; message?: string };
            if (err.name === 'AbortError') {
                throw new Error(aiTimeoutMessage('Gemini'));
            }
            console.error("GeminiService error:", error);
            throw new Error(`Terjadi kesalahan: ${aiErrorMessage(err.message || String(error))}`);
        }
    }

    private buildPayload(prompt: string, systemInstruction?: string, options?: IAiRequestOptions): GeminiPayload {
        const bodyPayload: GeminiPayload = {
            contents: [
                ...(options?.history ?? []).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
                { role: 'user', parts: [{ text: prompt }] },
                ...(options?.toolCalls ?? []).map((c) => ({
                    role: 'model',
                    parts: [{
                        functionCall: {
                            name: c.name,
                            args: c.args
                        },
                        ...(c.thoughtSignature ? { thoughtSignature: c.thoughtSignature } : {})
                    }],
                })),
                ...(options?.toolResults ?? []).map((r) => ({
                    role: 'user',
                    parts: [{ functionResponse: { name: r.name, response: r.result } }],
                })),
            ]
        };

        if (systemInstruction) {
            bodyPayload.system_instruction = {
                parts: [{ text: systemInstruction }]
            };
        }

        const tools: GeminiTool[] = [];
        if (options?.searchGrounding) tools.push({ googleSearch: {} });
        if (options?.codeExecution) tools.push({ codeExecution: {} });
        if (options?.tools?.length) tools.push({ functionDeclarations: options.tools });
        if (tools.length > 0) bodyPayload.tools = tools;

        if (options?.thinking) {
            bodyPayload.generationConfig = { thinkingConfig: { includeThoughts: true } };
        }

        return bodyPayload;
    }

    private async generateStreaming(apiUrl: string, body: GeminiPayload, apiKey: string, onStream: (text: string) => void): Promise<{ text: string; toolCalls: IAiToolCall[] }> {
        const streamUrl = apiUrl.replace(':generateContent', ':streamGenerateContent') + '?alt=sse';
        const response = await fetchWithTimeout(streamUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = (await response.json()) as { error?: { message?: string } };
            throw new Error(errorData.error?.message || 'Gagal mengambil respons dari Gemini API');
        }
        if (!response.body) {
            throw new Error('Streaming tidak didukung di lingkungan ini.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let text = '';
        const toolCalls: IAiToolCall[] = [];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let nlIdx: number;
            while ((nlIdx = buffer.indexOf('\n')) !== -1) {
                const line = buffer.slice(0, nlIdx).replace(/\r$/, '');
                buffer = buffer.slice(nlIdx + 1);
                text = this.consumeSseLine(line, toolCalls, text, onStream);
            }
        }

        buffer += decoder.decode();
        if (buffer.trim()) {
            text = this.consumeSseLine(buffer.replace(/\r$/, ''), toolCalls, text, onStream);
        }

        return { text, toolCalls };
    }

    private consumeSseLine(line: string, toolCalls: IAiToolCall[], text: string, onStream: (text: string) => void): string {
        let nextText = text;
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) return nextText;
        const data = trimmed.slice(5).trim();
        if (!data || data === '[DONE]') return nextText;

        let chunk: { candidates?: { content: { parts: GeminiPart[] } }[] };
        try {
            chunk = JSON.parse(data);
        } catch {
            return nextText;
        }

        for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
            if (part.functionCall) {
                const sig = part.thought_signature || part.thoughtSignature || part.functionCall.thought_signature || part.functionCall.thoughtSignature;
                toolCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args,
                    thoughtSignature: sig
                });
            }
            if (part.thought) continue;
            if (typeof part.text === 'string' && part.text) {
                nextText += part.text;
                onStream(nextText);
            } else if (part.execution_result?.output) {
                nextText += `\`\`\`\n${part.execution_result.output}\n\`\`\``;
                onStream(nextText);
            }
        }
        return nextText;
    }
}
