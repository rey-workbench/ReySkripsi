/// <reference types="office-js" />
import { ENV } from '../../config';
import { ICancellationToken, TProgressCallback } from '../interfaces';

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
        
        const allSearchResults = [];
        let batchCount = 0;
        const totalWords = wordsToMatch.length;

        for (const targetWord of wordsToMatch) {
            if (cancellationToken?.isCancelled) break;

            const searchResults = range.search(targetWord, { 
                matchWholeWord: true, 
                matchCase: matchCase 
            });
            searchResults.load("items/font, items/style, items/parentContentControlOrNullObject, items/parentBody/type");
            allSearchResults.push(searchResults);
            
            batchCount++;
            if (batchCount % 50 === 0) {
                await range.context.sync();
            }

            if (onProgress && batchCount % 10 === 0) {
                const percent = Math.floor((batchCount / totalWords) * 50); // First 50% for searching
                onProgress(percent, `Mencari kata: ${batchCount}/${totalWords}`);
            }
        }
        
        if (!cancellationToken?.isCancelled) {
            await range.context.sync();
        }
        
        const totalResults = allSearchResults.length;
        let resultCount = 0;

        for (const searchResults of allSearchResults) {
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

            resultCount++;
            if (onProgress && resultCount % 10 === 0) {
                const percent = 50 + Math.floor((resultCount / totalResults) * 50); // Second 50% for formatting
                onProgress(percent, `Memformat kata: ${resultCount}/${totalResults}`);
            }
        }

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
