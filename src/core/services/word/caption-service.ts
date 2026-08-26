/// <reference types="office-js" />
import { AiOrchestrator } from '@/core/services/ai/ai-orchestrator';
import { AiModel, DEFAULT_AI_MODEL } from '@/core/services/ai/ai-models';
import { cleanCaptionTitle, extractChapterNumber, parseAiCaptionTitles } from '@/core/utils/caption';

export interface ICaptionStyleOptions {
  isBold?: boolean;
  isItalic?: boolean;
  alignment?: 'centered' | 'left' | 'right';
  customFontSize?: number;
}

export class CaptionService {
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
   * Mengambil teks paragraf di dekat Gambar (InlinePicture/Shape) untuk diringkas AI.
   */
  public static async getSelectedImageDataText(): Promise<string> {
    let contextText = "";

    await Word.run(async (context) => {
      try {
        const selection = context.document.getSelection();
        const paragraphs = selection.paragraphs;
        paragraphs.load("items/text");
        await context.sync();

        if (paragraphs.items.length > 0) {
          const parentPara = paragraphs.items[0];
          const texts: string[] = [];
          if (parentPara.text && parentPara.text.trim()) {
            texts.push(parentPara.text.trim());
          }

          const prevPara = parentPara.getPreviousOrNullObject();
          prevPara.load("text, isNullObject");
          const nextPara = parentPara.getNextOrNullObject();
          nextPara.load("text, isNullObject");
          
          await context.sync();

          if (!prevPara.isNullObject && prevPara.text && prevPara.text.trim()) {
            texts.push(prevPara.text.trim());
          }
          if (!nextPara.isNullObject && nextPara.text && nextPara.text.trim()) {
            texts.push(nextPara.text.trim());
          }

          contextText = texts.join(" | ");
        }
      } catch (e) {
        console.warn("Gagal membaca konteks gambar:", e);
      }
    });

    return contextText;
  }

  /**
   * Menghasilkan deskripsi caption ringkas (maksimal 4 kata) menggunakan AI berdasarkan data tabel / gambar.
   */
  public static async generateAiCaptionTitle(
    contextDataText: string, 
    apiKey: string, 
    label: 'Tabel' | 'Gambar' = 'Tabel',
    model: AiModel = DEFAULT_AI_MODEL
  ): Promise<string> {
    if (!contextDataText || !contextDataText.trim()) {
      return "";
    }

    const prompt = `Berikut adalah data/konteks ${label.toLowerCase()} dari dokumen skripsi/ilmiah:\n\n${contextDataText.slice(0, 1500)}\n\nBuatkan judul/deskripsi caption ringkas untuk ${label.toLowerCase()} ini dalam bahasa Indonesia. SYARAT MUTLAK: Maksimal 4 kata, tanpa kata '${label}', tanpa tanda petik, singkat, padat, dan jelas. Contoh: Hasil Pengujian Akurasi Model`;
    
    try {
      const result = await AiOrchestrator.generateResponse(prompt, apiKey, model);
      return cleanCaptionTitle(result);
    } catch (e) {
      console.warn("Gagal membuat AI caption desc:", e);
      return "";
    }
  }

  /**
   * Menghasilkan ringkasan deskripsi judul untuk BANYAK TABEL Sekaligus dalam 1x panggilan API (Batch Prompting).
   */
  public static async generateBatchAiCaptionTitles(
    tablesDataTextList: string[], 
    apiKey: string, 
    model: AiModel = DEFAULT_AI_MODEL
  ): Promise<string[]> {
    if (!tablesDataTextList || tablesDataTextList.length === 0) {
      return [];
    }

    let prompt = `Berikut adalah data dari beberapa tabel skripsi. Tugas Anda adalah memberikan 1 judul/deskripsi singkat (maksimal 4 kata) untuk MASING-MASING TABEL.\n\nFORMAT OUTPUT WAJIB JSON ARRAY OF STRINGS:\n["Judul Tabel 1", "Judul Tabel 2", "Judul Tabel 3"]\n\nSyarat: Maksimal 4 kata per judul, tanpa kata 'Tabel', tanpa penomoran.\n\n`;

    tablesDataTextList.forEach((dataText, idx) => {
      prompt += `--- TABEL ${idx + 1} ---\n${dataText.slice(0, 800)}\n\n`;
    });

    try {
      const resultText = await AiOrchestrator.generateResponse(prompt, apiKey, model);
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return parseAiCaptionTitles(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("Gagal batch prompt AI caption titles:", e);
    }

    return new Array(tablesDataTextList.length).fill("");
  }

  /**
   * Mendeteksi/Mencari Halaman Awal untuk DAFTAR TABEL / DAFTAR GAMBAR / DAFTAR ISI,
   * lalu meng-update Field TOC/TOF yang ada atau menyisipkan TOC/TOF Field resmi Word.
   */
  public static async updateOrCreateTableOfFigures(label: 'Tabel' | 'Gambar'): Promise<void> {
    await Word.run(async (context) => {
      const body = context.document.body;
      
      // Cukup update seluruh Field yang ada di dokumen (TOC / TOF / SEQ)
      if (Office.context.requirements.isSetSupported('WordApi', '1.4')) {
        try {
          const fields = body.fields;
          fields.load("items/code");
          await context.sync();

          for (const field of fields.items) {
            const code = (field.code || "").toUpperCase();
            if (code.includes("TOC") || code.includes("SEQ")) {
              field.result.font.name = "Times New Roman";
            }
          }
          await context.sync();
        } catch (e) {
          console.warn("Gagal update fields:", e);
        }
      }
    });
  }

  /**
   * Menyisipkan Caption dengan Field Asli Word (SEQ Field) standar Table of Figures Word.
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

      const startRange = body.getRange("Start");
      const cursorRange = selection.getRange("Start");
      const documentUpToCursor = startRange.expandTo(cursorRange);
      documentUpToCursor.load("text");
      
      const parentParagraph = selection.paragraphs.getFirst();
      parentParagraph.load("font/size");

      await context.sync();
      const currentChapter = extractChapterNumber(documentUpToCursor.text);
      const labelPrefix = `${label} ${currentChapter}. `;

      const insertLocation = label === 'Tabel' ? Word.InsertLocation.before : Word.InsertLocation.after;
      const targetParagraph = selection.paragraphs.getFirst();
      const insertedParagraph = targetParagraph.insertParagraph(labelPrefix, insertLocation);
      this.applyCaptionFormatting(insertedParagraph, label, currentChapter, captionTitle, options, parentParagraph.font.size);

      await context.sync();
      captionTextInserted = `${labelPrefix} ${captionTitle}`;
    });

    // Otomatis cari & update / buatkan Daftar Tabel atau Daftar Gambar di halaman awal
    await this.updateOrCreateTableOfFigures(label);

    return captionTextInserted;
  }

  /**
   * Auto caption untuk semua Tabel di dokumen menggunakan Native Word Field (SEQ Field) & update Daftar Tabel.
   */
  public static async autoCaptionAllTables(
    options?: ICaptionStyleOptions,
    aiConfig?: { apiKey: string, model: AiModel }
  ): Promise<number> {
    let processedCount = 0;

    await Word.run(async (context) => {
      const body = context.document.body;
      const tables = body.tables;
      tables.load("items/values, items/range");
      await context.sync();

      let aiTitlesBatch: string[] = [];
      if (aiConfig && aiConfig.apiKey) {
        const tablesTextList: string[] = [];
        for (let i = 0; i < tables.items.length; i++) {
          const table = tables.items[i];
          if (table.values) {
            const tableText = table.values.map((row: string[]) => row.join(" | ")).join("\n");
            tablesTextList.push(tableText);
          } else {
            tablesTextList.push("");
          }
        }
        
        aiTitlesBatch = await CaptionService.generateBatchAiCaptionTitles(
          tablesTextList, 
          aiConfig.apiKey, 
          aiConfig.model || DEFAULT_AI_MODEL
        );
      }

      for (let i = 0; i < tables.items.length; i++) {
        const table = tables.items[i];
        
        const tableRange = table.getRange();
        const startRange = body.getRange("Start");
        const docUpToTable = startRange.expandTo(tableRange);
        docUpToTable.load("text");

        const parentParagraph = tableRange.paragraphs.getFirst();
        parentParagraph.load("font/size");

        await context.sync();

        const chapter = extractChapterNumber(docUpToTable.text);
        const labelPrefix = `Tabel ${chapter}. `;

        const insertedParagraph = table.insertParagraph(labelPrefix, Word.InsertLocation.before);
        this.applyCaptionFormatting(insertedParagraph, 'Tabel', chapter, aiTitlesBatch[i] || '', options, parentParagraph.font.size);

        processedCount++;
      }

      await context.sync();
    });

    // Otomatis update/buatkan Daftar Tabel
    await this.updateOrCreateTableOfFigures('Tabel');

    return processedCount;
  }

  /**
   * Format paragraf caption yang baru disisipkan: font, alignment, SEQ Field,
   * dan judul. Dipakai bersama oleh insertCaptionForSelection & autoCaptionAllTables.
   */
  private static applyCaptionFormatting(
    insertedParagraph: Word.Paragraph,
    label: 'Tabel' | 'Gambar',
    chapter: number,
    title: string,
    options: ICaptionStyleOptions | undefined,
    parentFontSize: number | null | undefined
  ): void {
    const targetFontName = "Times New Roman";
    const targetFontSize = options?.customFontSize || parentFontSize || 12;

    insertedParagraph.font.bold = options?.isBold !== undefined ? options.isBold : true;
    insertedParagraph.font.italic = options?.isItalic !== undefined ? options.isItalic : false;
    insertedParagraph.font.name = targetFontName;
    insertedParagraph.font.size = targetFontSize;
    insertedParagraph.alignment = this.getWordAlignment(options?.alignment);

    // SEQ field me-render angka urut (1, 2, dst). Tidak perlu menambahkan angka hardcoded lagi.
    const endOfLabel = insertedParagraph.getRange("End");

    if (Office.context.requirements.isSetSupported('WordApi', '1.4')) {
      endOfLabel.insertField(Word.InsertLocation.after, Word.FieldType.seq, `${label} \\s ${chapter}`, true);
    } else {
      endOfLabel.insertText("1", Word.InsertLocation.after);
    }

    if (title) {
      const afterSeqRange = insertedParagraph.getRange("End");
      const addedTitleRange = afterSeqRange.insertText(` ${title}`, Word.InsertLocation.after);
      addedTitleRange.font.name = targetFontName;
    }
  }
}
