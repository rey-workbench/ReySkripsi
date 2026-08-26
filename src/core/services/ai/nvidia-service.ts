import { AI_NO_RESPONSE_MESSAGE, aiTimeoutMessage, IAiRequestOptions, IAiService, IAiTurn } from '@/core/services/ai/iai-service';
import { fetchWithTimeout } from '@/core/utils/fetch';

export class NvidiaService implements IAiService {
    public async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string, options?: IAiRequestOptions): Promise<IAiTurn> {
        const invokeUrl = "/api/nvidia";

        try {
            const messages: { role: string; content: string }[] = [];

            if (systemInstruction) {
                messages.push({ role: "system", content: systemInstruction });
            }

            for (const m of options?.history ?? []) {
                messages.push({ role: m.role, content: m.text });
            }

            messages.push({ role: "user", content: prompt });

            const fullModelId = model === 'minimax-m3' ? 'minimaxai/minimax-m3' : model;

            const payload = {
                model: fullModelId,
                messages: messages,
                max_tokens: 8192,
                temperature: 1.00,
                top_p: 0.95,
                stream: false
            };

            const response = await fetchWithTimeout(invokeUrl, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                const errorData = await response.json().catch(() => null);
                if (errorData) errorMessage += `: ${JSON.stringify(errorData)}`;
                throw new Error(errorMessage);
            }

            const data = (await response.json()) as { choices?: { message: { content: string } }[] };
            if (data.choices && data.choices.length > 0) {
                return { text: data.choices[0].message.content, toolCalls: [] };
            }
            
            return { text: AI_NO_RESPONSE_MESSAGE, toolCalls: [] };
        } catch (error: unknown) {
            const err = error as { name?: string; message?: string };
            if (err.name === 'AbortError') {
                throw new Error(aiTimeoutMessage('NVIDIA'));
            }
            console.error("NvidiaService error:", error);
            throw new Error(`Terjadi kesalahan: ${err.message || String(error)}`);
        }
    }
}
