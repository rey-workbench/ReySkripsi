/// <reference types="office-js" />
import { ENV } from '@/config';
import { ICancellationToken, TProgressCallback } from '@/core/interfaces';

// Bentuk struktural minimal dari hasil `range.search(...)`. Tidak bergantung pada
// member `Word.SearchResultCollection` agar tetap compile walau @types/office-js
// belum tersedia, sekaligus menjaga null-safety properti yang kita pakai.
type SearchHit = {
  style?: string;
  font: { italic: boolean };
  parentBody?: { type: string };
  parentContentControlOrNullObject: { isNullObject: boolean };
};

type SearchCollectionLike = { items: SearchHit[] };

export class WordScannerService {
    /**
     * Scans the range for specific words and formats them, skipping footnotes and citations.
     * @returns number of matches found and formatted
     */
    public static async scanAndFormat(
        range: Word.Range | Word.Body | Word.Paragraph, 
        wordsToMatch: string[], 
        matchCase: boolean,
        isDryRun: boolean,
        cancellationToken?: ICancellationToken,
        onProgress?: TProgressCallback
    ): Promise<number> {
        let count = 0;
        let hasChanges = false;
        
        const totalWords = wordsToMatch.length;
        let searchCount = 0;
        let formatCount = 0;

        // BATCH: proses per kelompok kata agar `context.sync()` tidak dipanggil satu
        // kali dengan hasil raksasa (mencegah timeout Office add-in pd dok. besar).
        const SEARCH_BATCH_SIZE = 25;

        for (let batchStart = 0; batchStart < totalWords; batchStart += SEARCH_BATCH_SIZE) {
            if (cancellationToken?.isCancelled) break;

            const batch = wordsToMatch.slice(batchStart, batchStart + SEARCH_BATCH_SIZE);
            const batchResults: SearchCollectionLike[] = [];

            for (const targetWord of batch) {
                if (cancellationToken?.isCancelled) break;

                const searchResults = range.search(targetWord, {
                    matchWholeWord: true,
                    matchCase: matchCase
                });
                searchResults.load("items/font, items/style, items/parentContentControlOrNullObject, items/parentBody/type");
                batchResults.push(searchResults);

                searchCount++;
                if (onProgress && searchCount % 10 === 0) {
                    const percent = Math.floor((searchCount / totalWords) * 50); // First 50% for searching
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

                    // Skip if it is physically inside a footnote/endnote
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
                    const percent = 50 + Math.floor((formatCount / Math.max(totalWords, 1)) * 50); // Second 50% for formatting
                    onProgress(percent, `Memformat kata: ${formatCount}/${totalWords}`);
                }
            }
        }

        // Flush semua perubahan yang dijadwalkan pada batch terakhir
        if (hasChanges && !isDryRun) {
            await range.context.sync();

            // Tahap post-processing: Hilangkan italic pada field sitasi (Zotero, Mendeley, Word Citation)
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
