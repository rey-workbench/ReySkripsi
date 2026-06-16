import { AiProviderFactory } from './ai-provider-factory';

export class AiOrchestrator {
    /**
     * Memanggil AI service yang sesuai (Gemini / NVIDIA) berdasarkan model yang dipilih
     * dan mengembalikan respons teksnya.
     */
    public static async generateResponse(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string> {
        if (!apiKey || !apiKey.trim()) {
            throw new Error("API Key tidak boleh kosong.");
        }
        
        const aiService = AiProviderFactory.getService(model);
        return await aiService.generateContent(prompt, apiKey, model, systemInstruction);
    }
}
