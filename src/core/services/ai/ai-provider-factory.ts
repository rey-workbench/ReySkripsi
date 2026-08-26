import { IAiService } from '@/core/services/ai/iai-service';
import { GeminiService } from '@/core/services/ai/gemini-service';
import { NvidiaService } from '@/core/services/ai/nvidia-service';

export class AiProviderFactory {
    public static getService(model: string): IAiService {
        if (model.startsWith('gemini-')) {
            return new GeminiService();
        } else if (model.includes('minimax') || model.startsWith('meta/')) {
            return new NvidiaService();
        }

        // Jangan membisu ke Gemini saat model tak dikenal — bisa menyebabkan
        // error JSON yang membingungkan (model non-Gemini dipanggil ke Gemini).
        throw new Error(`Model AI tidak dikenali: “${model}”. Pilih model dari daftar yang tersedia.`);
    }
}
