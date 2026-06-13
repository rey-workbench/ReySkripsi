import { ENV } from '../../config';
// @ts-ignore
import { Stemmer } from 'sastrawijs';

export class DictionaryService {
    private static kbbiDict: Set<string> | null = null;
    private static stemmer = new Stemmer();

    public static async init(): Promise<void> {
        if (this.kbbiDict) return;
        try {
            const res = await fetch(ENV.DICTIONARY_JSON_URL);
            if (!res.ok) throw new Error("Gagal memuat kamus offline KBBI");
            const words = await res.json();
            this.kbbiDict = new Set(words);
        } catch (e) {
            console.error("Gagal inisialisasi KBBI:", e);
            throw e;
        }
    }

    public static isForeignWord(word: string): boolean {
        if (!this.kbbiDict) {
            console.warn("Kamus KBBI belum dimuat! Panggil init() terlebih dahulu.");
            return false;
        }
        
        const cleanWord = word.toLowerCase().trim();
        
        if (cleanWord.length <= ENV.MIN_WORD_LENGTH) {
            return false;
        }
        
        const baseWord = this.stemmer.stem(cleanWord);
        
        if (this.kbbiDict.has(cleanWord) || this.kbbiDict.has(baseWord)) {
            return false;
        }
        
        return true;
    }

    public static async extractForeignWordsFromText(text: string, matchCase: boolean = false): Promise<Set<string>> {
        const foreignWords = new Set<string>();
        if (!text) return foreignWords;

        try {
            await this.init();

            const allWordsInDoc = text.match(/[a-zA-Z]+/g) || [];
            const uniqueWords = matchCase 
                ? Array.from(new Set(allWordsInDoc))
                : Array.from(new Set(allWordsInDoc.map(w => w.toLowerCase())));

            for (const word of uniqueWords) {
                if (this.isForeignWord(word)) {
                    foreignWords.add(word);
                }
            }
        } catch (e: any) {
            foreignWords.add("debug_api_error_" + e.message.replace(/\s+/g, '_'));
        }

        return foreignWords;
    }
}
