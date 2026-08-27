import { ENV } from '@/config';
// @ts-ignore
import { Stemmer } from 'sastrawijs';

export class DictionaryService {
    private static kbbiDict: Set<string> | null = null;
    private static stemmer = new Stemmer();
    private static readonly MAX_CACHE_SIZE = 5000;
    private static stemCache = new Map<string, string>();
    private static foreignCache = new Map<string, boolean>();

    private static setCacheWithLimit<K, V>(map: Map<K, V>, key: K, value: V): void {
        if (map.size >= this.MAX_CACHE_SIZE) {
            map.clear();
        }
        map.set(key, value);
    }

    public static async init(): Promise<void> {
        if (this.kbbiDict) return;
        try {
            const res = await fetch(ENV.DICTIONARY_URL);
            if (!res.ok) throw new Error("Gagal memuat kamus offline KBBI");
            const text = await res.text();
            this.kbbiDict = new Set(
                text.split("\n").map((w: string) => w.trim().toLowerCase()).filter(Boolean)
            );
        } catch (e) {
            console.error("Gagal inisialisasi KBBI:", e);
            throw e;
        }
    }

    private static tokenizeWord(word: string): string[] {
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
            this.setCacheWithLimit(this.foreignCache, cacheKey, false);
            return false;
        }

        for (const token of tokens) {
            // Short-circuit: jika token mentah sudah ada di KBBI, skip stemmer O(1)
            if (this.kbbiDict.has(token)) {
                this.setCacheWithLimit(this.foreignCache, cacheKey, false);
                return false;
            }

            let baseWord: string;
            const cached = this.stemCache.get(token);
            if (cached !== undefined) {
                baseWord = cached;
            } else {
                baseWord = this.stemmer.stem(token) ?? token;
                this.setCacheWithLimit(this.stemCache, token, baseWord);
            }
            if (this.kbbiDict.has(baseWord)) {
                this.setCacheWithLimit(this.foreignCache, cacheKey, false);
                return false;
            }
        }

        this.setCacheWithLimit(this.foreignCache, cacheKey, true);
        return true;
    }

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
