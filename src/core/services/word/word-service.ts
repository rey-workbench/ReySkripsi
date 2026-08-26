/// <reference types="office-js" />
import { ModalService } from '@/core/services/ui/modal-service';
import { ICancellationToken, TProgressCallback } from '@/core/interfaces';

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
        
        let totalMatches = 0;
        const progressCallback: TProgressCallback = (percent, msg) => {
           ModalService.showProgress(msg, percent, handleCancel);
        };

        const range = await this.getTargetRange(context, wholeDocument);
        if (!range) return;
        totalMatches += await scanner(range, true, cancellationToken, progressCallback);

        ModalService.hideProgress();

        if (cancellationToken.isCancelled) {
          ModalService.showAlert("Dibatalkan", "Pencarian dibatalkan oleh pengguna.");
          return;
        }

        if (totalMatches === 0) {
          ModalService.showAlert("Selesai", "Tidak ditemukan kata yang cocok. Periksa kembali Match Case atau pilihan teks.");
          return;
        }

        const isConfirmed = await ModalService.showConfirmation(`Ditemukan ${totalMatches} kata/kalimat yang cocok. Lanjutkan memiringkan?`);
        
        if (!isConfirmed) {
          ModalService.showAlert("Dibatalkan", "Proses dibatalkan oleh pengguna.");
          return;
        }

        let appliedCount = 0;
        const execRange = await this.getTargetRange(context, wholeDocument);
        if (execRange) {
          appliedCount += await scanner(execRange, false, cancellationToken, progressCallback);
        }

        ModalService.hideProgress();
        
        if (cancellationToken.isCancelled) {
           ModalService.showAlert("Selesai", `Proses dibatalkan di tengah jalan. Telah memiringkan ${appliedCount} kata sejauh ini.`);
        } else {
           ModalService.showAlert("Selesai", `Selesai! Berhasil memiringkan ${appliedCount} kata.`);
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(error);
      ModalService.hideProgress();
      ModalService.showAlert("Error", message);
    } finally {
      this.isProcessing = false;
    }
  }

  private static async getTargetRange(
    context: Word.RequestContext,
    wholeDocument: boolean
  ): Promise<Word.Range | Word.Body | null> {
    if (wholeDocument) return context.document.body;

    const range = context.document.getSelection();
    range.load("text");
    await context.sync();

    if (!range.text || range.text.trim() === "") {
      ModalService.hideProgress();
      ModalService.showAlert("Info", "Pilih teks di dalam dokumen Word terlebih dahulu!");
      return null;
    }
    return range;
  }
}
