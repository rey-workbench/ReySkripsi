/// <reference types="office-js" />
import { AiOrchestrator } from '../ai/ai-orchestrator';

export interface ICaptionStyleOptions {
  isBold?: boolean;
  isItalic?: boolean;
  alignment?: 'centered' | 'left' | 'right';
  customFontSize?: number;
}

export class CaptionService {
  /**
   * Mengonversi Angka Romawi ke Angka Arab (misal "III" -> 3)
   */
  private static romanToArabic(romanStr: string): number {
    const romanMap: { [key: string]: number } = {
      I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
    };
    const cleanRoman = romanStr.trim().toUpperCase();
    let num = 0;
    for (let i = 0; i < cleanRoman.length; i++) {
      const current = romanMap[cleanRoman[i]] || 0;
      const next = romanMap[cleanRoman[i + 1]] || 0;
      if (current < next) {
        num -= current;
      } else {
        num += current;
      }
    }
    return num || 1;
  }

  /**
   * Mendeteksi Bab saat ini dari teks paragraf dokumen sebelum lokasi kursor.
   */
  public static extractChapterNumber(text: string): number {
    const matches = Array.from(text.matchAll(/BAB\s+([IVXLCDM\d]+)/gi));
    if (!matches || matches.length === 0) return 1;

    const lastMatch = matches[matches.length - 1];
    const rawChapter = lastMatch[1].trim();

    if (/^\d+$/.test(rawChapter)) {
      return parseInt(rawChapter, 10);
    }
    return this.romanToArabic(rawChapter);
  }

  private static getWordAlignment(alignStr?: string): Word.Alignment {
    if (alignStr === 'left') return Word.Alignment.left;
    if (alignStr === 'right') return Word.Alignment.right;
    return Word.Alignment.centered;
  }

  /**
   * Mengambil isi teks data dari tabel terpilih/terdekat untuk diringkas AI.
   */
  public static async getSelectedTableDataText(): Promise<string> {
    let tableText = "";

    await Word.run(async (context) => {
      const selection = context.document.getSelection();
      const parentTable = selection.parentTableOrNullObject;
      parentTable.load("isNullObject, values");
      await context.sync();

      if (!parentTable.isNullObject && parentTable.values) {
        tableText = parentTable.values.map((row: string[]) => row.join(" | ")).join("\n");
      } else {
        // Jika kursor tepat di atas tabel (sebelum tabel), ambil tabel setelah kursor
        const nextPara = selection.paragraphs.getFirst().getNext();
        const nextTable = nextPara.parentTableOrNullObject;
        nextTable.load("isNullObject, values");
        await context.sync();
        if (!nextTable.isNullObject && nextTable.values) {
          tableText = nextTable.values.map((row: string[]) => row.join(" | ")).join("\n");
        }
      }
    });

    return tableText;
  }

  /**
   * Menghasilkan deskripsi caption ringkas (maksimal 4 kata) menggunakan AI berdasarkan data tabel.
   */
  public static async generateAiCaptionTitle(tableDataText: string, apiKey: string, model: string = "gemini-3.5-flash"): Promise<string> {
    if (!tableDataText || !tableDataText.trim()) {
      return "";
    }

    const prompt = `Berikut adalah data tabel dari dokumen skripsi/ilmiah:\n\n${tableDataText.slice(0, 1500)}\n\nBuatkan judul/deskripsi caption ringkas untuk tabel ini dalam bahasa Indonesia. SYARAT MUTLAK: Maksimal 4 kata, tanpa kata 'Tabel', tanpa tanda petik, singkat, padat, dan jelas. Contoh: Hasil Pengujian Akurasi Model`;
    
    try {
      const result = await AiOrchestrator.generateResponse(prompt, apiKey, model);
      let cleanTitle = result.replace(/^["'「」]+|["'「」]+$/g, '').trim();
      // Jaga agar maks 4 kata
      const words = cleanTitle.split(/\s+/);
      if (words.length > 4) {
        cleanTitle = words.slice(0, 4).join(" ");
      }
      return cleanTitle;
    } catch (e) {
      console.warn("Gagal membuat AI caption desc:", e);
      return "";
    }
  }

  /**
   * Menyisipkan Caption dengan Field Asli Word (SEQ Field) serta pengondisian Bold, Italic, Alignment, & Font Size.
   */
  public static async insertCaptionForSelection(
    label: 'Tabel' | 'Gambar', 
    captionTitle: string,
    options?: ICaptionStyleOptions
  ): Promise<string> {
    let captionTextInserted = "";

    await Word.run(async (context) => {
      const selection = context.document.getSelection();
      const body = context.document.body;

      // Ambil seluruh teks sebelum lokasi kursor untuk deteksi Bab
      const startRange = body.getRange("Start");
      const cursorRange = selection.getRange("Start");
      const documentUpToCursor = startRange.expandTo(cursorRange);
      documentUpToCursor.load("text");
      
      // Ambil sampel font dari paragraf terdekat tempat kursor berada
      const parentParagraph = selection.paragraphs.getFirst();
      parentParagraph.load("font/name, font/size");

      await context.sync();

      const currentChapter = this.extractChapterNumber(documentUpToCursor.text);
      const labelPrefix = `${label} ${currentChapter}. `;

      const targetFontName = parentParagraph.font.name || "Times New Roman";
      const targetFontSize = options?.customFontSize || parentParagraph.font.size || 12;

      // Sisipkan paragraf caption baru
      const insertLocation = label === 'Tabel' ? Word.InsertLocation.before : Word.InsertLocation.after;
      const insertedParagraph = selection.insertParagraph(labelPrefix, insertLocation);
      insertedParagraph.font.bold = options?.isBold !== undefined ? options.isBold : true;
      insertedParagraph.font.italic = options?.isItalic !== undefined ? options.isItalic : false;
      insertedParagraph.font.name = targetFontName;
      insertedParagraph.font.size = targetFontSize;
      insertedParagraph.alignment = this.getWordAlignment(options?.alignment);

      // Sisipkan Native Word Field (SEQ) untuk penomoran otomatis yang bisa di-Update Field
      const seqFieldName = `${label}_Bab${currentChapter}`;
      const endOfLabel = insertedParagraph.getRange("End");

      if (Office.context.requirements.isSetSupported('WordApi', '1.4')) {
        endOfLabel.insertField(Word.InsertLocation.after, Word.FieldType.seq, seqFieldName, true);
      } else {
        endOfLabel.insertText("1", Word.InsertLocation.after);
      }

      // Jika ada Judul / Deskripsi Caption
      if (captionTitle) {
        const afterSeqRange = insertedParagraph.getRange("End");
        afterSeqRange.insertText(` ${captionTitle}`, Word.InsertLocation.after);
      }

      await context.sync();
      captionTextInserted = `${label} ${currentChapter}.[SEQ ${seqFieldName}] ${captionTitle}`;
    });

    return captionTextInserted;
  }

  /**
   * Auto caption untuk semua Tabel di dokumen menggunakan Native Word Field (SEQ Field) & style custom + AI opsional.
   */
  public static async autoCaptionAllTables(
    options?: ICaptionStyleOptions,
    aiConfig?: { apiKey: string, model: string }
  ): Promise<number> {
    let processedCount = 0;

    await Word.run(async (context) => {
      const body = context.document.body;
      const tables = body.tables;
      tables.load("items/values, items/range");
      await context.sync();

      for (let i = 0; i < tables.items.length; i++) {
        const table = tables.items[i];
        
        const tableRange = table.getRange();
        const startRange = body.getRange("Start");
        const docUpToTable = startRange.expandTo(tableRange);
        docUpToTable.load("text");

        // Ambil sampel font dari paragraf tabel / sekitar
        const parentParagraph = tableRange.paragraphs.getFirst();
        parentParagraph.load("font/name, font/size");

        await context.sync();

        const chapter = this.extractChapterNumber(docUpToTable.text);
        const labelPrefix = `Tabel ${chapter}. `;

        const targetFontName = parentParagraph.font.name || "Times New Roman";
        const targetFontSize = options?.customFontSize || parentParagraph.font.size || 12;

        const insertedParagraph = table.insertParagraph(labelPrefix, Word.InsertLocation.before);
        insertedParagraph.font.bold = options?.isBold !== undefined ? options.isBold : true;
        insertedParagraph.font.italic = options?.isItalic !== undefined ? options.isItalic : false;
        insertedParagraph.font.name = targetFontName;
        insertedParagraph.font.size = targetFontSize;
        insertedParagraph.alignment = this.getWordAlignment(options?.alignment);

        const seqFieldName = `Tabel_Bab${chapter}`;
        const endOfLabel = insertedParagraph.getRange("End");

        if (Office.context.requirements.isSetSupported('WordApi', '1.4')) {
          endOfLabel.insertField(Word.InsertLocation.after, Word.FieldType.seq, seqFieldName, true);
        } else {
          endOfLabel.insertText("1", Word.InsertLocation.after);
        }

        // Jika AI Config tersedia, buatkan deskripsi otomatis dari isi tabel
        if (aiConfig && aiConfig.apiKey && table.values) {
          const tableText = table.values.map(row => row.join(" | ")).join("\n");
          const aiTitle = await CaptionService.generateAiCaptionTitle(tableText, aiConfig.apiKey, aiConfig.model);
          if (aiTitle) {
            const afterSeqRange = insertedParagraph.getRange("End");
            afterSeqRange.insertText(` ${aiTitle}`, Word.InsertLocation.after);
          }
        }

        processedCount++;
      }

      await context.sync();
    });

    return processedCount;
  }
}
