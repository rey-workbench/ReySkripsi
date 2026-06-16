/// <reference types="office-js" />
import { ToastService } from '../ui/toast-service';
import { ModalService } from '../ui/modal-service';
import { ICancellationToken, TProgressCallback } from '../../interfaces';

export class WordService {
  private static isProcessing = false;

  public static async processWithConfirmation(
    wholeDocument: boolean,
    scanner: (range: Word.Range | Word.Body | Word.Paragraph, isDryRun: boolean, token: ICancellationToken, onProgress: TProgressCallback) => Promise<number>
  ): Promise<void> {
    if (this.isProcessing) {
      ModalService.showAlert("Info", "Ada proses yang sedang berjalan. Harap tunggu...");
      return;
    }
    
    this.isProcessing = true;
    const cancellationToken: ICancellationToken = { isCancelled: false };
    const handleCancel = () => { cancellationToken.isCancelled = true; };

    try {
      await Word.run(async (context) => {
        ModalService.showProgress("Memindai dokumen...", 0, handleCancel);
        
        // Phase 1: Dry Run (Count only)
        let totalMatches = 0;
        const progressCallback: TProgressCallback = (percent, msg) => {
           ModalService.showProgress(msg, percent, handleCancel);
        };

        if (wholeDocument) {
          totalMatches += await scanner(context.document.body, true, cancellationToken, progressCallback);
        } else {
          const range = context.document.getSelection();
          range.load("text");
          await context.sync();
          
          if (!range.text || range.text.trim() === "") {
              ModalService.hideProgress();
              ModalService.showAlert("Info", "Pilih teks di dalam dokumen Word terlebih dahulu!");
              return;
          }
          
          totalMatches += await scanner(range, true, cancellationToken, progressCallback);
        }

        ModalService.hideProgress();

        if (cancellationToken.isCancelled) {
          ModalService.showAlert("Dibatalkan", "Pencarian dibatalkan oleh pengguna.");
          return;
        }

        if (totalMatches === 0) {
          ModalService.showAlert("Selesai", "Tidak ditemukan kata yang cocok. Periksa kembali Match Case atau pilihan teks.");
          return;
        }

        // Phase 2: Confirmation
        const isConfirmed = await ModalService.showConfirmation(`Ditemukan ${totalMatches} kata/kalimat yang cocok. Lanjutkan memiringkan?`);
        
        if (!isConfirmed) {
          ModalService.showAlert("Dibatalkan", "Proses dibatalkan oleh pengguna.");
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

        ModalService.hideProgress();
        
        if (cancellationToken.isCancelled) {
           ModalService.showAlert("Selesai", `Proses dibatalkan di tengah jalan. Telah memiringkan ${appliedCount} kata sejauh ini.`);
        } else {
           ModalService.showAlert("Selesai", `Selesai! Berhasil memiringkan ${appliedCount} kata.`);
        }
      });
    } catch (error: any) {
      console.error(error);
      ModalService.hideProgress();
      ModalService.showAlert("Error", error.message);
    } finally {
      this.isProcessing = false;
    }
  }
}
