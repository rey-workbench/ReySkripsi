/// <reference types="office-js" />
import { ToastService } from './toast-service';
import { ModalService } from './modal-service';
import { LoadingService } from './loading-service';

export class WordService {

  /** 
   * Helper to process document with an optional preview/dry-run step.
   * 1. Scans and counts matches.
   * 2. Asks user for confirmation via ModalService.
   * 3. If confirmed, applies the changes.
   */
  public static async processWithConfirmation(
    wholeDocument: boolean,
    scanner: (range: Word.Range | Word.Body | Word.Paragraph, isDryRun: boolean) => Promise<number>
  ): Promise<void> {
    return Word.run(async (context) => {
      LoadingService.show("Memindai dokumen...");
      
      // Phase 1: Dry Run (Count only)
      let totalMatches = 0;
      if (wholeDocument) {
        totalMatches += await scanner(context.document.body, true);
      } else {
        const range = context.document.getSelection();
        range.load("text");
        await context.sync();
        
        if (!range.text || range.text.trim() === "") {
            LoadingService.hide();
            ToastService.show("Pilih teks di dalam dokumen Word terlebih dahulu!", true);
            return;
        }
        
        totalMatches += await scanner(range, true);
      }

      LoadingService.hide();

      if (totalMatches === 0) {
        ToastService.show("Tidak ditemukan kata yang cocok. Periksa kembali Match Case atau pilihan teks.", true);
        return;
      }

      // Phase 2: Confirmation
      const isConfirmed = await ModalService.showConfirmation(`Ditemukan ${totalMatches} kata/kalimat yang cocok. Lanjutkan memiringkan?`);
      
      if (!isConfirmed) {
        ToastService.show("Proses dibatalkan oleh pengguna.");
        return;
      }

      // Phase 3: Execution
      LoadingService.show("Menerapkan format...");
      let appliedCount = 0;
      
      if (wholeDocument) {
        appliedCount += await scanner(context.document.body, false);
      } else {
        const range = context.document.getSelection();
        appliedCount += await scanner(range, false);
      }

      LoadingService.hide();
      ToastService.show(`Selesai! Berhasil memiringkan ${appliedCount} kata.`);
    }).catch((error) => {
      console.error(error);
      LoadingService.hide();
      ToastService.show("Error: " + error.message, true);
    });
  }
}
