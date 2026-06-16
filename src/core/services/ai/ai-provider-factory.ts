import { IAiService } from './iai-service';
import { GeminiService } from './gemini-service';
import { NvidiaService } from './nvidia-service';

export class AiProviderFactory {
    public static getService(model: string): IAiService {
        if (model.startsWith('gemini-')) {
            return new GeminiService();
        } else if (model.includes('minimax') || model.startsWith('meta/')) {
            return new NvidiaService();
        }
        
        // Default fallback
        return new GeminiService();
    }
}
