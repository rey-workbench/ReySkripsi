import { AiProviderFactory } from '@/core/services/ai/ai-provider-factory';
import { IAiRequestOptions, IAiToolResult } from '@/core/services/ai/iai-service';

const MAX_TOOL_ITERATIONS = 3;

export class AiOrchestrator {
    public static async generateResponse(
        prompt: string,
        apiKey: string,
        model: string,
        systemInstruction?: string,
        options?: IAiRequestOptions,
        executeTool?: (name: string, args: Record<string, unknown>) => Promise<unknown>
    ): Promise<string> {
        if (!apiKey || !apiKey.trim()) {
            throw new Error("API Key tidak boleh kosong.");
        }
        
        const aiService = AiProviderFactory.getService(model);

        let turn = await aiService.generateContent(prompt, apiKey, model, systemInstruction, options);
        let iterations = 0;
        while (turn.toolCalls.length > 0) {
            if (!executeTool) {
                throw new Error("Model meminta tool tetapi tidak ada executor.");
            }
            if (iterations++ >= MAX_TOOL_ITERATIONS) {
                throw new Error("Loop eksekusi tool melebihi batas iterasi.");
            }

            const toolResults: IAiToolResult[] = [];
            for (const call of turn.toolCalls) {
                const result = await executeTool(call.name, call.args);
                toolResults.push({ name: call.name, result });
            }

            turn = await aiService.generateContent(prompt, apiKey, model, systemInstruction, {
                ...options,
                toolCalls: turn.toolCalls,
                toolResults
            });
        }

        return turn.text;
    }
}
