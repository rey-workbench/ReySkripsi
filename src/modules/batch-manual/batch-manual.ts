/// <reference types="office-js" />
import { WordService } from '../../core/services/word-service';
import { DictionaryService } from '../../core/services/dictionary-service';
import { WordScannerService } from '../../core/services/word-scanner-service';
import { ToastService } from '../../core/services/toast-service';
import { IModule } from '../../core/interfaces';
import { Button } from '../../core/components/button';
import { Textarea } from '../../core/components/textarea';
import { Checkbox } from '../../core/components/checkbox';
import { LoadingService } from '../../core/services/loading-service';

export class BatchManualModule implements IModule {
  public id = "module-batch";
  public name = "Batch Manual";
  public iconClass = "ms-Icon--TextDocument";
  public iconColor = "#107C41";
  
  public get htmlContent(): string {
      const extractBtn = Button.render({
          id: 'btn-extract-words',
          text: 'Extrak Kata Asing Otomatis',
          variant: 'secondary'
      });

      return `
                <p class="ms-font-s" style="margin-bottom: 16px; color: #4b5563;">Miringkan kata-kata spesifik secara manual di seluruh dokumen.</p>

                ${Textarea.render({
                    id: 'batch-input', 
                    label: 'Daftar Kata (Pisahkan dengan koma)', 
                    placeholder: 'Contoh: server, download, database', 
                    rows: 5
                })}

                <div style="margin-top: 8px; margin-bottom: 16px;">
                    ${extractBtn}
                </div>
                ${Checkbox.render({
                    id: 'match-case', 
                    label: 'Match Case (Sensitif huruf besar/kecil)'
                })}
                
                <div style="display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 24px;">
                    ${Button.render({
                        id: 'run-batch-sel', 
                        text: 'Italicize Selection', 
                        variant: 'primary'
                    })}
                    ${Button.render({
                        id: 'run-batch-doc', 
                        text: 'Whole Document', 
                        variant: 'secondary'
                    })}
                </div>
      `;
  }

  public onInit(): void {
    const btnSel = document.getElementById("run-batch-sel");
    const btnDoc = document.getElementById("run-batch-doc");
    const btnExtract = document.getElementById("btn-extract-words");

    if (btnSel) btnSel.addEventListener("click", () => this.execute(false));
    if (btnDoc) btnDoc.addEventListener("click", () => this.execute(true));
    if (btnExtract) btnExtract.addEventListener("click", () => this.extractForeignWords());
  }

  private async extractForeignWords() {
    LoadingService.show(`Memindai kata asing di dokumen...`);
    const matchCase = (document.getElementById("match-case") as HTMLInputElement).checked;
    
    try {
      await Word.run(async (context) => {
        const body = context.document.body;
        body.load("text");
        await context.sync();

        const foreignWords = await DictionaryService.extractForeignWordsFromText(body.text, matchCase);

        const uniqueWordsArray = Array.from(foreignWords);
        if (uniqueWordsArray.length > 0) {
            const textarea = document.getElementById("batch-input") as HTMLTextAreaElement;
            const currentVal = textarea.value.trim();
            
            // Only append words that aren't already in the textarea
            const existingWords = currentVal.split(/[\n,]+/).map(w => w.trim().toLowerCase());
            const newWords = uniqueWordsArray.filter(w => !existingWords.includes(w));

            if (newWords.length > 0) {
                const prefix = currentVal.length > 0 && !currentVal.endsWith(',') ? currentVal + ", " : currentVal;
                textarea.value = prefix + newWords.join(", ");
                ToastService.show(`Berhasil mengekstrak ${newWords.length} kata asing unik.`);
            } else {
                ToastService.show("Semua kata asing yang ditemukan sudah ada di kotak input.");
            }
        } else {
            ToastService.show("Tidak ditemukan kata asing.", true);
        }
      });
    } catch (e) {
      const error = e as Error;
      console.error(error);
      ToastService.show("Gagal mengekstrak: " + error.message, true);
    } finally {
      LoadingService.hide();
    }
  }

  private execute(wholeDocument: boolean) {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    const rawInput = (document.getElementById("batch-input") as HTMLTextAreaElement).value;
    const wordsToMatch = rawInput.split(/[\n,;]+/).map(w => w.trim()).filter(w => w.length > 0);
    const matchCase = (document.getElementById("match-case") as HTMLInputElement).checked;

    if (wordsToMatch.length === 0) {
      ToastService.show("Harap masukkan daftar kata terlebih dahulu.", true);
      return;
    }

    WordService.processWithConfirmation(wholeDocument, async (range, isDryRun) => {
      return await WordScannerService.scanAndFormat(range, wordsToMatch, matchCase, isDryRun);
    });
  }
}
