/// <reference types="office-js" />
import { ToastService } from './toast-service';
import { ModalService } from './modal-service';
import { ENV } from '../../config';

// @ts-ignore
import { Stemmer } from 'sastrawijs';

export class WordService {
  private static kbbiDict: Set<string> | null = null;
  private static stemmer = new Stemmer();

  /**
   * Menginisialisasi kamus KBBI offline (dipanggil sebelum scanning)
   */
  public static async initDictionary(): Promise<void> {
      if (this.kbbiDict) return; // Sudah dimuat
      try {
          const res = await fetch(ENV.DICTIONARY_JSON_URL);
          if (!res.ok) throw new Error("Gagal memuat kamus offline KBBI");
          const words = await res.json();
          this.kbbiDict = new Set(words);
      } catch (e) {
          console.error("Gagal inisialisasi KBBI:", e);
          throw e;
      }
  }

  /**
   * Mengecek apakah satu kata adalah kata asing dengan mencocokkannya ke KBBI
   */
  public static isForeignWord(word: string): boolean {
      if (!this.kbbiDict) {
          console.warn("Kamus KBBI belum dimuat! Panggil initDictionary() terlebih dahulu.");
          return false;
      }
      
      const cleanWord = word.toLowerCase().trim();
      
      // Jika kata terlalu pendek (misal: "di", "ke"), abaikan
      if (cleanWord.length <= ENV.MIN_WORD_LENGTH) {
          return false;
      }
      
      const baseWord = this.stemmer.stem(cleanWord);
      
      // Jika kata asli ADA di KBBI, atau kata dasarnya ADA di KBBI, berarti BUKAN kata asing
      if (this.kbbiDict.has(cleanWord) || this.kbbiDict.has(baseWord)) {
          return false;
      }
      
      // Jika tidak ada di KBBI sama sekali, berarti kata asing!
      return true;
  }

  /**
   * Mengekstrak kata-kata asing dari seluruh dokumen.
   */
  public static async extractForeignWords(context: Word.RequestContext): Promise<Set<string>> {
      const foreignWords = new Set<string>();

      const body = context.document.body;
      body.load("text");
      await context.sync();

      const bodyText = body.text;
      if (!bodyText) return foreignWords;

      try {
          await this.initDictionary();

          const allWordsInDoc = bodyText.match(/[a-zA-Z]+/g) || [];
          const uniqueWords = Array.from(new Set(allWordsInDoc.map(w => w.toLowerCase())));

          for (const word of uniqueWords) {
              if (this.isForeignWord(word)) {
                  foreignWords.add(word);
              }
          }
      } catch (e: any) {
          foreignWords.add("debug_api_error_" + e.message.replace(/\s+/g, '_'));
      }

      return foreignWords;
  }

  /** 
   * Helper to process document with an optional preview/dry-run step.
   * 1. Scans and counts matches.
   * 2. Asks user for confirmation via ModalService.
   * 3. If confirmed, applies the changes.
   */
  public static async processWithConfirmation(
    wholeDocument: boolean,
    scanner: (range: Word.Range | Word.Paragraph, isDryRun: boolean) => Promise<number>
  ): Promise<void> {
    return Word.run(async (context) => {
      ToastService.show("Scanning document...");
      
      // Phase 1: Dry Run (Count only)
      let totalMatches = 0;
      if (wholeDocument) {
        const paragraphs = context.document.body.paragraphs;
        paragraphs.load("items");
        await context.sync();

        for (let p = 0; p < paragraphs.items.length; p++) {
          ToastService.show(`Scanning paragraph ${p + 1} of ${paragraphs.items.length}...`);
          totalMatches += await scanner(paragraphs.items[p], true);
          await new Promise(resolve => setTimeout(resolve, 5)); // Yield
        }
      } else {
        const range = context.document.getSelection();
        range.load("text");
        await context.sync();
        
        if (!range.text || range.text.trim() === "") {
            ToastService.show("Pilih teks di dalam dokumen Word terlebih dahulu!", true);
            return;
        }
        
        totalMatches += await scanner(range, true);
      }

      if (totalMatches === 0) {
        ToastService.show("Tidak ditemukan kata yang cocok. Periksa kembali Match Case atau pilihan teks.", true);
        return;
      }

      // Phase 2: Confirmation
      ToastService.show(`Found ${totalMatches} matches. Waiting for confirmation...`);
      const isConfirmed = await ModalService.showConfirmation(`Ditemukan ${totalMatches} kata/kalimat yang cocok. Lanjutkan memiringkan?`);
      
      if (!isConfirmed) {
        ToastService.show("Proses dibatalkan oleh pengguna.");
        return;
      }

      // Phase 3: Execution
      ToastService.show("Menerapkan format...");
      let appliedCount = 0;
      
      if (wholeDocument) {
        const paragraphs = context.document.body.paragraphs;
        paragraphs.load("items");
        await context.sync();

        for (let p = 0; p < paragraphs.items.length; p++) {
          ToastService.show(`Applying to paragraph ${p + 1} of ${paragraphs.items.length}...`);
          appliedCount += await scanner(paragraphs.items[p], false);
          await new Promise(resolve => setTimeout(resolve, 10)); // Yield
        }
      } else {
        const range = context.document.getSelection();
        appliedCount += await scanner(range, false);
      }

      ToastService.show(`Selesai! Berhasil memiringkan ${appliedCount} kata.`);
    }).catch((error) => {
      console.error(error);
      ToastService.show("Error: " + error.message, true);
    });
  }
}
