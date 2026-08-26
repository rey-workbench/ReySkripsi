import { IAiService } from '@/core/services/ai/iai-service';
import { fetchWithTimeout } from '@/core/utils/fetch';

export class GeminiService implements IAiService {
    public async generateContent(prompt: string, apiKey: string, model: string, systemInstruction?: string): Promise<string> {
        // API key dikirim via header `x-goog-api-key`, bukan ditaruh di query string,
        // agar tidak bocor ke URL/log/referrer. Timeout+AbortController agar tidak hang.
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

        try {
            const bodyPayload: {
                contents: { parts: { text: string }[] }[];
                system_instruction?: { parts: { text: string }[] };
            } = {
                contents: [{ parts: [{ text: prompt }] }]
            };

            if (systemInstruction) {
                bodyPayload.system_instruction = {
                    parts: [{ text: systemInstruction }]
                };
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
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Gagal mengambil respons dari Gemini API');
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            }
            return "Maaf, AI tidak dapat memberikan respons saat ini.";
        } catch (error: unknown) {
            const err = error as { name?: string; message?: string };
            if (err.name === 'AbortError') {
                throw new Error('Permintaan ke Gemini API melebihi waktu tunggu (60 detik).');
            }
            console.error("GeminiService error:", error);
            throw new Error(`Terjadi kesalahan: ${err.message || String(error)}`);
        }
    }
}
