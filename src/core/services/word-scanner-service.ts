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
            searchResults.load("items/font, items/style, items/parentContentControlOrNullObject");
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
        }
        
        return count;
    }
}
