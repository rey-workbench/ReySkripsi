import { IAiToolDefinition } from '@/core/services/ai/iai-service';
import { DictionaryService } from '@/core/services/dictionary/dictionary-service';
import { WordScannerService } from '@/core/services/word/word-scanner-service';
import { ToastService } from '@/core/services/ui/toast-service';

export const WORD_TOOLS: IAiToolDefinition[] = [
  {
    name: 'insertText',
    description: 'Menyisipkan teks ke dokumen Word. Jika targetHeading diisi (misalnya "ABSTRAK" atau "PENDAHULUAN"), teks akan disisipkan di bawah bagian tersebut. Jika targetHeading tidak diisi, teks disisipkan di posisi kursor.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Teks lengkap yang akan disisipkan' },
        targetHeading: { type: 'string', description: 'Judul bagian target di dokumen (misal: "ABSTRAK", "PENDAHULUAN"). Opsional.' }
      },
      required: ['text'],
    },
  },
  {
    name: 'formatForeignWordsItalic',
    description: 'Memindai seluruh dokumen Word dan secara otomatis mengubah semua istilah asing yang tidak baku/tidak ada di KBBI menjadi cetak miring (italic).',
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'scanDocument',
    description: 'Memindai seluruh dokumen dan mengembalikan daftar kata asing (tidak ada di kamus KBBI) tanpa memformat.',
    parameters: { type: 'object', properties: {} },
  },
];

export async function executeWordTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
        case 'insertText': {
            const text = String(args.text ?? '');
            if (!text) return { insertedChars: 0 };
            const targetHeading = typeof args.targetHeading === 'string' ? args.targetHeading.trim() : '';

            return await Word.run(async (context) => {
                let inserted = false;

                if (targetHeading) {
                    const searchResults = context.document.body.search(targetHeading, {
                        matchCase: false,
                        matchWholeWord: false
                    });
                    searchResults.load('items');
                    await context.sync();

                    if (searchResults.items.length > 0) {
                        const headingItem = searchResults.items[0];
                        headingItem.insertParagraph(text, Word.InsertLocation.after);
                        inserted = true;
                    }
                }

                if (!inserted) {
                    const selection = context.document.getSelection();
                    selection.insertText(text, Word.InsertLocation.replace);
                }

                await context.sync();
                ToastService.show(`Berhasil menyisipkan teks${targetHeading ? ` ke bagian ${targetHeading}` : ''}.`);
                return { insertedChars: text.length, target: targetHeading || 'kursor' };
            });
        }
        case 'formatForeignWordsItalic': {
            await DictionaryService.init();
            return await Word.run(async (context) => {
                const body = context.document.body;
                body.load('text');
                await context.sync();

                const foreignWords = await DictionaryService.extractForeignWordsFromText(body.text, false);
                const wordsList = Array.from(foreignWords);

                if (wordsList.length === 0) {
                    ToastService.show("Tidak ada kata asing yang perlu dimiringkan.");
                    return { formattedCount: 0 };
                }

                const count = await WordScannerService.scanAndFormat(body, wordsList, false, false);
                ToastService.show(`Selesai memiringkan ${count} kata asing di dokumen.`);
                return { formattedCount: count };
            });
        }
        case 'scanDocument': {
            await DictionaryService.init();
            return await Word.run(async (context) => {
                const body = context.document.body;
                body.load('text');
                await context.sync();
                const words = await DictionaryService.extractForeignWordsFromText(body.text, false);
                return { foreignWords: Array.from(words).slice(0, 100) };
            });
        }
        default:
            throw new Error(`Tool tidak dikenal: ${name}`);
    }
}

export async function jumpToText(searchText: string): Promise<void> {
    try {
        await Word.run(async (context) => {
            const cleanSearchText = searchText.replace(/^["']|["']$/g, '').trim();
            const searchResults = context.document.body.search(cleanSearchText.substring(0, 100), {
                matchCase: false,
                matchWholeWord: false
            });

            searchResults.load("items");
            await context.sync();

            if (searchResults.items.length > 0) {
                searchResults.items[0].select();
                await context.sync();
                ToastService.show("Teks referensi ditemukan.", false);
            } else {
                ToastService.show("Teks referensi tidak ditemukan di dokumen saat ini.", true);
            }
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ToastService.show("Gagal mencari referensi: " + message, true);
    }
}
