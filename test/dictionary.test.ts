import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DictionaryService } from '@/core/services/dictionary/dictionary-service';

const KBBI_MINI = [
  'data', 'model', 'penelitian', 'hasil', 'uji', 'belajar', 'mesin',
  'sistem', 'informasi', 'akurasi', 'pengujian', 'tabel', 'gambar',
  'bab', 'pendahuluan', 'metode', 'kesimpulan', 'latar', 'belakang',
  'rumusan', 'masalah', 'tujuan', 'manfaat', 'batasan', 'kerangka',
];

function stubFetch(words: string[]) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    text: async () => words.join('\n'),
  }));
}

beforeEach(() => {
  vi.unstubAllGlobals();
  (DictionaryService as any).kbbiDict = null;
  (DictionaryService as any).stemCache = new Map();
  (DictionaryService as any).foreignCache = new Map();
});

describe('DictionaryService.extractForeignWordsFromText', () => {
  it('flags words absent from KBBI and skips known ones', async () => {
    stubFetch(KBBI_MINI);
    const result = await DictionaryService.extractForeignWordsFromText(
      'penelitian data model dashboard server database',
      false
    );
    expect(result.has('dashboard')).toBe(true);
    expect(result.has('server')).toBe(true);
    expect(result.has('database')).toBe(true);
    expect(result.has('penelitian')).toBe(false);
    expect(result.has('data')).toBe(false);
    expect(result.has('model')).toBe(false);
  });

  it('skips very short connector words', async () => {
    stubFetch(KBBI_MINI);
    const result = await DictionaryService.extractForeignWordsFromText('di ke', false);
    expect([...result]).toEqual([]);
  });

  it('treats hyphenated/slashed terms as tokens', async () => {
    stubFetch(KBBI_MINI);
    const result = await DictionaryService.extractForeignWordsFromText('pasca-pandemi', false);
    expect(result.has('pasca-pandemi')).toBe(true);
  });

  it('throws (not synthesizes pseudo-words) when KBBI fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => [] }));
    await expect(DictionaryService.extractForeignWordsFromText('beberapa kata', false))
      .rejects.toThrow('Gagal memuat kamus');
  });
});