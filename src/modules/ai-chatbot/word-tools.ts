import { IAiToolDefinition } from '@/core/services/ai/iai-service';
import { DictionaryService } from '@/core/services/dictionary/dictionary-service';
import { ToastService } from '@/core/services/ui/toast-service';

export const WORD_TOOLS: IAiToolDefinition[] = [
  {
    name: 'insertText',
    description: 'Menyisipkan teks ke dokumen Word di posisi kursor. Gunakan saat pengguna meminta menulis atau menyisipkan teks.',
    parameters: {
      type: 'object',
      properties: { text: { type: 'string', description: 'Teks lengkap yang akan disisipkan' } },
      required: ['text'],
    },
  },
  {
    name: 'scanDocument',
    description: 'Memindai seluruh dokumen dan mengembalikan daftar kata asing (tidak ada di kamus KBBI).',
    parameters: { type: 'object', properties: {} },
  },
];

export async function executeWordTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
        case 'insertText': {
            const text = String(args.text ?? '');
            if (!text) return { insertedChars: 0 };
            return await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.insertText(text, Word.InsertLocation.replace);
                await context.sync();
                return { insertedChars: text.length };
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
