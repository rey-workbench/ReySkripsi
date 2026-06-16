export class GeminiService {
    public static async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string> {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        try {
            const bodyPayload: any = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            if (systemInstruction) {
                bodyPayload.system_instruction = {
                    parts: [{ text: systemInstruction }]
                };
            }

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bodyPayload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Gagal mengambil respons dari Gemini API');
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            }
            return "Maaf, AI tidak dapat memberikan respons saat ini.";
        } catch (error: any) {
            console.error("GeminiService error:", error);
            throw new Error(`Terjadi kesalahan: ${error.message}`);
        }
    }
}
