/// <reference types="office-js" />
import { WordService } from '../../core/services/word-service';
import { DictionaryService } from '../../core/services/dictionary-service';
import { WordScannerService } from '../../core/services/word-scanner-service';
import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { ToastService } from '../../core/services/toast-service';
import { LoadingService } from '../../core/services/loading-service';
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
        LoadingService.show("Memuat Kamus KBBI Offline...");
        await DictionaryService.init();
        LoadingService.hide();

        WordService.processWithConfirmation(wholeDocument, async (range, isDryRun) => {
          // Extrak teks dari range
          range.load("text");
          await range.context.sync();
          
          const foreignWords = await DictionaryService.extractForeignWordsFromText(range.text, false);
          const wordsToMatch = Array.from(foreignWords);

          if (wordsToMatch.length === 0) {
              return 0; // No foreign words found
          }

          // Gunakan scanner untuk apply
          return await WordScannerService.scanAndFormat(range, wordsToMatch, false, isDryRun);
        });
    } catch (e) {
        const error = e as Error;
        ToastService.show("Error memuat KBBI: " + error.message, true);
    }
  }
}
