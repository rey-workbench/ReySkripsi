import { ENV } from '@/config';
// @ts-ignore
import { Stemmer } from 'sastrawijs';

export class DictionaryService {
    private static kbbiDict: Set<string> | null = null;
    private static stemmer = new Stemmer();
    private static stemCache = new Map<string, string>();
    private static foreignCache = new Map<string, boolean>();

    public static async init(): Promise<void> {
        if (this.kbbiDict) return;
        try {
            const res = await fetch(ENV.DICTIONARY_JSON_URL);
            if (!res.ok) throw new Error("Gagal memuat kamus offline KBBI");
            const words: string[] = await res.json();
            this.kbbiDict = new Set(words.map((w: string) => String(w).toLowerCase()));
        } catch (e) {
            console.error("Gagal inisialisasi KBBI:", e);
            throw e;
        }
    }

    private static tokenizeWord(word: string): string[] {
        // Pecah istilah bersufiks/berslash/hyphen per bagian (mis. "pasca-pandemi").
        const parts = word.split(/[-\/\s]+/);
        const tokens: string[] = [];
        for (const part of parts) {
            const letters = part.toLowerCase().match(/[a-z]+/g);
            if (letters) {
                for (const token of letters) {
                    if (token.length > ENV.MIN_WORD_LENGTH) {
                        tokens.push(token);
                    }
                }
            }
        }
        return tokens;
    }

    public static isForeignWord(word: string): boolean {
        if (!this.kbbiDict) {
            console.warn("Kamus KBBI belum dimuat! Panggil init() terlebih dahulu.");
            return false;
        }

        const cacheKey = word.toLowerCase().trim();
        if (this.foreignCache.has(cacheKey)) {
            return this.foreignCache.get(cacheKey)!;
        }

        const tokens = this.tokenizeWord(cacheKey);
        if (tokens.length === 0) {
            this.foreignCache.set(cacheKey, false);
            return false;
        }

        // Istilah dianggap asing bila salah satu bagiannya tidak ada di KBBI.
        for (const token of tokens) {
            let baseWord: string;
            const cached = this.stemCache.get(token);
            if (cached !== undefined) {
                baseWord = cached;
            } else {
                baseWord = this.stemmer.stem(token) ?? token;
                this.stemCache.set(token, baseWord);
            }
            if (this.kbbiDict.has(token) || this.kbbiDict.has(baseWord)) {
                this.foreignCache.set(cacheKey, false);
                return false;
            }
        }

        this.foreignCache.set(cacheKey, true);
        return true;
    }

    /**
     * Ekstraksi kata asing; hasil selalu huruf kecil bila matchCase=false.
     * Kesalahan memuat kamus melempar error nyata, bukan pseudo-kata.
     */
    public static async extractForeignWordsFromText(text: string, matchCase: boolean = false): Promise<Set<string>> {
        const foreignWords = new Set<string>();
        if (!text) return foreignWords;

        await this.init();

        const allRawWords = text.match(/[a-zA-Z][a-zA-Z-\/]*/g) || [];
        const uniqueWords = matchCase
            ? Array.from(new Set(allRawWords))
            : Array.from(new Set(allRawWords.map(w => w.toLowerCase())));

        for (const word of uniqueWords) {
            if (this.isForeignWord(word)) {
                foreignWords.add(word);
            }
        }

        return foreignWords;
    }
}
