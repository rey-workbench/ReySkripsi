import { IAiService } from './iai-service';

export class NvidiaService implements IAiService {
    public async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string> {
        // Menggunakan Vercel rewrite (dikonfigurasi di vercel.json) untuk mengatasi CORS
        const invokeUrl = "/api/nvidia";

        try {
            const messages: any[] = [];

            if (systemInstruction) {
                messages.push({ role: "system", content: systemInstruction });
            }

            messages.push({ role: "user", content: prompt });

            // Pastikan format model sesuai dengan yang dibutuhkan NVIDIA API
            let fullModelId = model;
            if (model === 'minimax-m3') {
                fullModelId = 'minimaxai/minimax-m3';
            }

            const payload = {
                model: fullModelId,
                messages: messages,
                max_tokens: 8192,
                temperature: 1.00,
                top_p: 0.95,
                stream: false
            };

            const response = await fetch(invokeUrl, {
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
                try {
                    const errorData = await response.json();
                    errorMessage += `: ${JSON.stringify(errorData)}`;
                } catch(e) {
                    // Ignore JSON parse error on error response
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            if (data.choices && data.choices.length > 0) {
                return data.choices[0].message.content;
            }
            
            return "Maaf, AI tidak dapat memberikan respons saat ini.";
        } catch (error: any) {
            console.error("NvidiaService error:", error);
            throw new Error(`Terjadi kesalahan: ${error.message}`);
        }
    }
}
