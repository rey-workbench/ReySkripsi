/// <reference types="office-js" />
import { ENV } from '../../config';

export class WordScannerService {
    /**
     * Scans the range for specific words and formats them, skipping footnotes and citations.
     * @returns number of matches found and formatted
     */
    public static async scanAndFormat(
        range: Word.Range | Word.Body | Word.Paragraph, 
        wordsToMatch: string[], 
        matchCase: boolean,
        isDryRun: boolean
    ): Promise<number> {
        let count = 0;
        let hasChanges = false;
        
        const allSearchResults = [];
        let batchCount = 0;
        for (const targetWord of wordsToMatch) {
            const searchResults = range.search(targetWord, { 
                matchWholeWord: true, 
                matchCase: matchCase 
            });
            searchResults.load("items/font");
            searchResults.load("items/style");
            searchResults.load("items/parentContentControlOrNullObject");
            allSearchResults.push(searchResults);
            
            batchCount++;
            if (batchCount % 50 === 0) {
                await range.context.sync();
            }
        }
        
        await range.context.sync();
        
        for (const searchResults of allSearchResults) {
            for (let i = 0; i < searchResults.items.length; i++) {
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
        }

        if (hasChanges && !isDryRun) {
            await range.context.sync();
        }
        
        return count;
    }
}
