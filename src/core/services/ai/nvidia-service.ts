import { IAiService } from '@/core/services/ai/iai-service';
import { fetchWithTimeout } from '@/core/utils/fetch';

export class NvidiaService implements IAiService {
    public async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string> {
        // Menggunakan Vercel rewrite (dikonfigurasi di vercel.json) untuk mengatasi CORS
        const invokeUrl = "/api/nvidia";

        try {
            const messages: { role: string; content: string }[] = [];

            if (systemInstruction) {
                messages.push({ role: "system", content: systemInstruction });
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
        } catch (error: unknown) {
            const err = error as { name?: string; message?: string };
            if (err.name === 'AbortError') {
                throw new Error('Permintaan ke NVIDIA API melebihi waktu tunggu (60 detik).');
            }
            console.error("NvidiaService error:", error);
            throw new Error(`Terjadi kesalahan: ${err.message || String(error)}`);
        }
    }
}
