/// <reference types="office-js" />
import { ToastService } from './toast-service';
import { ModalService } from './modal-service';
import { ICancellationToken, TProgressCallback } from '../interfaces';

export class WordService {
  private static isProcessing = false;

  public static async processWithConfirmation(
    wholeDocument: boolean,
    scanner: (range: Word.Range | Word.Body | Word.Paragraph, isDryRun: boolean, token: ICancellationToken, onProgress: TProgressCallback) => Promise<number>
  ): Promise<void> {
    if (this.isProcessing) {
      ToastService.show("Ada proses yang sedang berjalan. Harap tunggu...", true);
      return;
    }
    
    this.isProcessing = true;
    const cancellationToken: ICancellationToken = { isCancelled: false };
    const handleCancel = () => { cancellationToken.isCancelled = true; };

    try {
      await Word.run(async (context) => {
        ToastService.showProgress("Memindai dokumen...", 0, handleCancel);
        
        // Phase 1: Dry Run (Count only)
        let totalMatches = 0;
        const progressCallback: TProgressCallback = (percent, msg) => {
           ToastService.showProgress(msg, percent, handleCancel);
        };

        if (wholeDocument) {
          totalMatches += await scanner(context.document.body, true, cancellationToken, progressCallback);
        } else {
          const range = context.document.getSelection();
          range.load("text");
          await context.sync();
          
          if (!range.text || range.text.trim() === "") {
              ToastService.hide();
              ToastService.show("Pilih teks di dalam dokumen Word terlebih dahulu!", true);
              return;
          }
          
          totalMatches += await scanner(range, true, cancellationToken, progressCallback);
        }

        ToastService.hide();

        if (cancellationToken.isCancelled) {
          ToastService.show("Pencarian dibatalkan oleh pengguna.");
          return;
        }

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
        let appliedCount = 0;
        
        if (wholeDocument) {
          appliedCount += await scanner(context.document.body, false, cancellationToken, progressCallback);
        } else {
          const range = context.document.getSelection();
          appliedCount += await scanner(range, false, cancellationToken, progressCallback);
        }

        ToastService.hide();
        
        if (cancellationToken.isCancelled) {
           ToastService.show(`Proses dibatalkan di tengah jalan. Telah memiringkan ${appliedCount} kata sejauh ini.`, false, true);
        } else {
           ToastService.show(`Selesai! Berhasil memiringkan ${appliedCount} kata.`, false, true);
        }
      });
    } catch (error: any) {
      console.error(error);
      ToastService.hide();
      ToastService.show("Error: " + error.message, true);
    } finally {
      this.isProcessing = false;
    }
  }
}
