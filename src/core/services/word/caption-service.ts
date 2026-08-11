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
   * Menyisipkan caption di atas/bawah seleksi kursor saat ini.
   */
  public static async insertCaptionForSelection(label: 'Tabel' | 'Gambar', captionTitle: string): Promise<string> {
    let captionTextInserted = "";

    await Word.run(async (context) => {
      const selection = context.document.getSelection();
      const body = context.document.body;

      // Dapatkan seluruh teks sebelum kursor
      const startRange = body.getRange("Start");
      const cursorRange = selection.getRange("Start");
      const documentUpToCursor = startRange.expandTo(cursorRange);
      documentUpToCursor.load("text");
      await context.sync();

      const currentChapter = this.extractChapterNumber(documentUpToCursor.text);

      // Hitung urutan Tabel/Gambar dalam Bab tersebut sejauh ini
      const chapterMatches = documentUpToCursor.text.match(new RegExp(`${label}\\s+${currentChapter}\\.\\d+`, "gi"));
      const sequenceNumber = (chapterMatches ? chapterMatches.length : 0) + 1;

      const formattedLabel = `${label} ${currentChapter}.${sequenceNumber}`;
      captionTextInserted = captionTitle ? `${formattedLabel} ${captionTitle}` : formattedLabel;

      // Sisipkan paragraf caption baru
      const insertLocation = label === 'Tabel' ? Word.InsertLocation.before : Word.InsertLocation.after;
      const insertedParagraph = selection.insertParagraph(captionTextInserted, insertLocation);
      insertedParagraph.font.bold = true;
      insertedParagraph.font.name = "Times New Roman";
      insertedParagraph.font.size = 12;
      insertedParagraph.alignment = Word.Alignment.centered;

      await context.sync();
    });

    return captionTextInserted;
  }

  /**
   * Auto caption untuk semua Tabel di dokumen berdasar Bab otomatis.
   */
  public static async autoCaptionAllTables(): Promise<number> {
    let processedCount = 0;

    await Word.run(async (context) => {
      const body = context.document.body;
      const tables = body.tables;
      tables.load("items");
      await context.sync();

      const chapterTableCounters: { [chapter: number]: number } = {};

      for (let i = 0; i < tables.items.length; i++) {
        const table = tables.items[i];
        
        const tableRange = table.getRange();
        const startRange = body.getRange("Start");
        const docUpToTable = startRange.expandTo(tableRange);
        docUpToTable.load("text");
        await context.sync();

        const chapter = this.extractChapterNumber(docUpToTable.text);
        if (!chapterTableCounters[chapter]) {
          chapterTableCounters[chapter] = 1;
        } else {
          chapterTableCounters[chapter]++;
        }

        const seq = chapterTableCounters[chapter];
        const captionLabel = `Tabel ${chapter}.${seq}`;

        const insertedParagraph = table.insertParagraph(captionLabel, Word.InsertLocation.before);
        insertedParagraph.font.bold = true;
        insertedParagraph.font.name = "Times New Roman";
        insertedParagraph.font.size = 12;
        insertedParagraph.alignment = Word.Alignment.centered;
        processedCount++;
      }

      await context.sync();
    });

    return processedCount;
  }
}
