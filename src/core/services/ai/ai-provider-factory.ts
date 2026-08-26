import { IAiService } from '@/core/services/ai/iai-service';
import { GeminiService } from '@/core/services/ai/gemini-service';
import { NvidiaService } from '@/core/services/ai/nvidia-service';
import { isNvidiaModel } from '@/core/services/ai/ai-models';

export class AiProviderFactory {
    public static getService(model: string): IAiService {
        if (model.startsWith('gemini-')) {
            return new GeminiService();
        }
        if (isNvidiaModel(model)) {
            return new NvidiaService();
        }
        throw new Error(`Model AI tidak dikenali: “${model}”. Pilih model dari daftar yang tersedia.`);
    }
}
