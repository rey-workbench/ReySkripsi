/// <reference types="office-js" />

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

  /**
   * Menyisipkan Caption dengan Field Asli Word (SEQ Field) dan mempertahankan font bawaan dokumen / pilihan.
   */
  public static async insertCaptionForSelection(label: 'Tabel' | 'Gambar', captionTitle: string): Promise<string> {
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

      // Font yang digunakan: mengikuti font paragraf sekitar (atau fallback ke Times New Roman jika kosong)
      const targetFontName = parentParagraph.font.name || "Times New Roman";
      const targetFontSize = parentParagraph.font.size || 12;

      // Sisipkan paragraf caption baru
      const insertLocation = label === 'Tabel' ? Word.InsertLocation.before : Word.InsertLocation.after;
      const insertedParagraph = selection.insertParagraph(labelPrefix, insertLocation);
      insertedParagraph.font.bold = true;
      insertedParagraph.font.name = targetFontName;
      insertedParagraph.font.size = targetFontSize;
      insertedParagraph.alignment = Word.Alignment.centered;

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
   * Auto caption untuk semua Tabel di dokumen menggunakan Native Word Field (SEQ Field) & font inheritan dokumen.
   */
  public static async autoCaptionAllTables(): Promise<number> {
    let processedCount = 0;

    await Word.run(async (context) => {
      const body = context.document.body;
      const tables = body.tables;
      tables.load("items");
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
        const targetFontSize = parentParagraph.font.size || 12;

        const insertedParagraph = table.insertParagraph(labelPrefix, Word.InsertLocation.before);
        insertedParagraph.font.bold = true;
        insertedParagraph.font.name = targetFontName;
        insertedParagraph.font.size = targetFontSize;
        insertedParagraph.alignment = Word.Alignment.centered;

        const seqFieldName = `Tabel_Bab${chapter}`;
        const endOfLabel = insertedParagraph.getRange("End");

        if (Office.context.requirements.isSetSupported('WordApi', '1.4')) {
          endOfLabel.insertField(Word.InsertLocation.after, Word.FieldType.seq, seqFieldName, true);
        } else {
          endOfLabel.insertText("1", Word.InsertLocation.after);
        }

        processedCount++;
      }

      await context.sync();
    });

    return processedCount;
  }
}
