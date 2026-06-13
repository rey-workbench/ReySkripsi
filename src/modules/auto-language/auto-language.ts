/// <reference types="office-js" />
import { WordService } from '../../core/services/word-service';
import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { ENV } from "../../config";
import { ToastService } from '../../core/services/toast-service';
export class AutoLanguageModule implements IModule {
  public id = "module-lang";
  public name = "Auto Language";
  public iconClass = "ms-Icon--LocaleLanguage";
  public iconColor = "#0078D4";
  
  public get htmlContent(): string {
      return `
        <div class="module-header">
            <h3 class="ms-font-l" style="margin: 0; color: #111827;">Miringkan Otomatis (KBBI)</h3>
            <p class="ms-font-s" style="color: #6b7280; margin-top: 4px;">Pindai seluruh kata dan otomatis cetak miring jika tidak ditemukan di kamus KBBI.</p>
        </div>
        <div class="module-content">
            <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 16px;">
                ${Button.render({
                    id: 'run-auto-sel', 
                    text: 'Pindai Teks Terpilih', 
                    variant: 'primary'
                })}
                ${Button.render({
                    id: 'run-auto-doc', 
                    text: 'Pindai Seluruh Dokumen', 
                    variant: 'secondary'
                })}
            </div>
        </div>
      `;
  }

  public onInit(): void {
    const btnSel = document.getElementById("run-auto-sel");
    const btnDoc = document.getElementById("run-auto-doc");

    if (btnSel) btnSel.addEventListener("click", () => this.execute(false));
    if (btnDoc) btnDoc.addEventListener("click", () => this.execute(true));
  }

  private async execute(wholeDocument: boolean) {
    try {
        ToastService.show("Memuat Kamus KBBI Offline...");
        await WordService.initDictionary();

        WordService.processWithConfirmation(wholeDocument, async (range: any, isDryRun: boolean) => {
          let count = 0;
          let hasChanges = false;
          
          // Use the Word API context to get the document text and find foreign words
          const foreignWords = await WordService.extractForeignWords(range.context, false);
          const wordsToMatch = Array.from(foreignWords);

          if (wordsToMatch.length === 0) {
              return 0; // No foreign words found
          }

          for (const targetWord of wordsToMatch) {
              const searchResults = range.search(targetWord, { 
                  matchWholeWord: true, 
                  matchCase: false 
              });
              searchResults.load("items");
              await range.context.sync();
              
              for (let i = 0; i < searchResults.items.length; i++) {
                  count++;
                  if (!isDryRun) {
                      if (ENV.FORMAT_STYLE.ITALIC) {
                          searchResults.items[i].font.italic = true;
                      }
                      hasChanges = true;
                  }
              }
          }

          if (hasChanges && !isDryRun) {
              await range.context.sync();
          }
          
          return count;
        });
    } catch (e: any) {
        ToastService.show("Error memuat KBBI: " + e.message, true);
    }
  }
}
