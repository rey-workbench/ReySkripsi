/// <reference types="office-js" />
import { ENV } from '@/config';
import { ICancellationToken, TProgressCallback } from '@/core/interfaces';

type SearchHit = {
  style?: string;
  font: { italic: boolean };
  parentBody?: { type: string };
  parentContentControlOrNullObject: { isNullObject: boolean };
};

export type SearchCollectionLike = { items: SearchHit[] };

export class WordScannerService {
    public static async scanAndFormat(
        range: Word.Range | Word.Body | Word.Paragraph, 
        wordsToMatch: string[], 
        matchCase: boolean,
        isDryRun: boolean,
        cancellationToken?: ICancellationToken,
        onProgress?: TProgressCallback,
        searchCache?: Map<string, SearchCollectionLike>
    ): Promise<number> {
        let count = 0;
        let hasChanges = false;
        
        const totalWords = wordsToMatch.length;
        let searchCount = 0;
        let formatCount = 0;

        const SEARCH_BATCH_SIZE = 25;

        for (let batchStart = 0; batchStart < totalWords; batchStart += SEARCH_BATCH_SIZE) {
            if (cancellationToken?.isCancelled) break;

            const batch = wordsToMatch.slice(batchStart, batchStart + SEARCH_BATCH_SIZE);
            const batchResults: SearchCollectionLike[] = [];

            for (const targetWord of batch) {
                if (cancellationToken?.isCancelled) break;

                // Gunakan hasil pencarian fase dry-run agar tidak mencari ulang saat eksekusi.
                const cached = searchCache?.get(targetWord);
                let searchResults: SearchCollectionLike;
                if (cached) {
                    searchResults = cached;
                } else {
                    const fresh = range.search(targetWord, {
                        matchWholeWord: true,
                        matchCase: matchCase
                    });
                    fresh.load("items/font, items/style, items/parentContentControlOrNullObject, items/parentBody/type");
                    searchResults = fresh;
                    searchCache?.set(targetWord, fresh);
                }
                batchResults.push(searchResults);

                searchCount++;
                if (onProgress && searchCount % 10 === 0) {
                    const percent = Math.floor((searchCount / totalWords) * 50);
                    onProgress(percent, `Mencari kata: ${searchCount}/${totalWords}`);
                }
            }

            if (cancellationToken?.isCancelled) break;
            await range.context.sync();

            for (const searchResults of batchResults) {
                if (cancellationToken?.isCancelled) break;

                for (let i = 0; i < searchResults.items.length; i++) {
                    if (cancellationToken?.isCancelled) break;

                    const item = searchResults.items[i];
                    const styleName = (item.style || "").toLowerCase();

                    if (styleName.includes("footnote") || styleName.includes("endnote") || styleName.includes("bibliography")) {
                        continue;
                    }

                    if (item.parentBody && (item.parentBody.type === "Footnote" || item.parentBody.type === "Endnote")) {
                        continue;
                    }

                    if (!item.parentContentControlOrNullObject.isNullObject) {
                        continue;
                    }

                    count++;
                    if (!isDryRun) {
                        if (ENV.FORMAT_STYLE.ITALIC) {
                            item.font.italic = true;
                        }
                        hasChanges = true;
                    }
                }

                formatCount++;
                if (onProgress && formatCount % 10 === 0) {
                    const percent = 50 + Math.floor((formatCount / Math.max(totalWords, 1)) * 50);
                    onProgress(percent, `Memformat kata: ${formatCount}/${totalWords}`);
                }
            }
        }

        if (hasChanges && !isDryRun) {
            await range.context.sync();

            // Hilangkan italic pada field sitasi (Zotero, Mendeley, Word Citation).
            if (Office.context.requirements.isSetSupported('WordApi', '1.4') && range.fields) {
                try {
                    const fields = range.fields;
                    fields.load("items/code, items/result/font");
                    await range.context.sync();
                    
                    let fieldChanges = false;
                    for (const field of fields.items) {
                        if (cancellationToken?.isCancelled) break;
                        const code = (field.code || "").toUpperCase();
                        if (code.includes("ADDIN ZOTERO_ITEM") || code.includes("ADDIN MENDELEY") || code.includes("CITATION")) {
                            field.result.font.italic = false;
                            fieldChanges = true;
                        }
                    }
                    if (fieldChanges && !cancellationToken?.isCancelled) {
                        await range.context.sync();
                    }
                } catch (e) {
                    console.warn("Gagal memproses field sitasi", e);
                }
            }
        }
        
        return count;
    }
}
