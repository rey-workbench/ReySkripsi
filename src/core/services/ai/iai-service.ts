export interface IAiService {
    generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string>;
}
