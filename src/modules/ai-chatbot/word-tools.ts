import { IAiToolDefinition } from '@/core/services/ai/iai-service';
import { DictionaryService } from '@/core/services/dictionary/dictionary-service';
import { WordScannerService } from '@/core/services/word/word-scanner-service';
import { ToastService } from '@/core/services/ui/toast-service';

export type TRevertAction = 
  | { type: 'insertText'; insertedText: string; previousText: string }
  | { type: 'formatForeignWordsItalic'; formattedWords: string[] };

export const WORD_TOOLS: IAiToolDefinition[] = [
  {
    name: 'insertText',
    description: 'Menyisipkan teks ke dokumen Word pada posisi kursor pengguna saat ini.',
    parameters: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Teks lengkap yang akan disisipkan' }
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

let lastAiAction: TRevertAction | null = null;

export function getLastAiAction(): TRevertAction | null {
    return lastAiAction;
}

export async function revertLastAiAction(): Promise<boolean> {
    if (!lastAiAction) {
        ToastService.show("Tidak ada perubahan AI yang dapat dibatalkan.", true);
        return false;
    }

    try {
        if (lastAiAction.type === 'insertText') {
            const { insertedText, previousText } = lastAiAction;
            await Word.run(async (context) => {
                const searchResults = context.document.body.search(insertedText.substring(0, 100), {
                    matchCase: true,
                    matchWholeWord: false
                });
                searchResults.load('items');
                await context.sync();

                if (searchResults.items.length > 0) {
                    searchResults.items[0].insertText(previousText, Word.InsertLocation.replace);
                    await context.sync();
                    ToastService.show("Perubahan teks AI berhasil dibatalkan (Revert sukses).");
                } else {
                    ToastService.show("Teks hasil AI tidak ditemukan atau sudah dimodifikasi.", true);
                }
            });
            lastAiAction = null;
            return true;
        } else if (lastAiAction.type === 'formatForeignWordsItalic') {
            const { formattedWords } = lastAiAction;
            await Word.run(async (context) => {
                const body = context.document.body;
                for (const word of formattedWords) {
                    const searchResults = body.search(word, {
                        matchCase: false,
                        matchWholeWord: true
                    });
                    searchResults.load('items/font');
                    await context.sync();

                    for (const item of searchResults.items) {
                        item.font.italic = false;
                    }
                    await context.sync();
                }
                ToastService.show(`Format miring pada ${formattedWords.length} kata berhasil dibatalkan.`);
            });
            lastAiAction = null;
            return true;
        }
    } catch (e) {
        const error = e as Error;
        ToastService.show(`Gagal membatalkan perubahan AI: ${error.message}`, true);
        return false;
    }
    return false;
}

export async function executeWordTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
        case 'insertText': {
            let text = String(args.text ?? '');
            if (!text) return { insertedChars: 0 };

            // Bersihkan literal escape '\n' jika model mengoper string ter-escape ganda
            text = text.replace(/\\n/g, '\n');

            return await Word.run(async (context) => {
                const selection = context.document.getSelection();
                selection.load('text');
                await context.sync();

                const previousText = selection.text || '';
                selection.insertText(text, Word.InsertLocation.replace);
                await context.sync();

                lastAiAction = {
                    type: 'insertText',
                    insertedText: text,
                    previousText
                };

                ToastService.show("Berhasil menyisipkan teks. Anda dapat membatalkan melalui tombol Revert.");
                return { insertedChars: text.length };
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
                lastAiAction = {
                    type: 'formatForeignWordsItalic',
                    formattedWords: wordsList
                };
                ToastService.show(`Selesai memiringkan ${count} kata asing di dokumen. Anda dapat membatalkan via Revert.`);
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
