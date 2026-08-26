import { describe, it, expect } from 'vitest';
import {
  romanToArabic,
  extractChapterNumber,
  cleanCaptionTitle,
  parseAiCaptionTitles,
} from '@/core/utils/caption';

describe('romanToArabic', () => {
  it('converts basic numerals', () => {
    expect(romanToArabic('I')).toBe(1);
    expect(romanToArabic('III')).toBe(3);
    expect(romanToArabic('IV')).toBe(4);
    expect(romanToArabic('IX')).toBe(9);
    expect(romanToArabic('XII')).toBe(12);
    expect(romanToArabic('XL')).toBe(40);
    expect(romanToArabic('CMXCIX')).toBe(999);
    expect(romanToArabic('M')).toBe(1000);
  });

  it('is case-insensitive', () => {
    expect(romanToArabic('iii')).toBe(3);
    expect(romanToArabic('Iv')).toBe(4);
  });

  it('returns NaN for invalid input', () => {
    expect(romanToArabic('')).toBeNaN();
    expect(romanToArabic('ABC')).toBeNaN();
    expect(romanToArabic('12')).toBeNaN();
    expect(romanToArabic('IIII')).toBe(4);
  });
});

describe('extractChapterNumber', () => {
  it('returns 1 when no BAB found', () => {
    expect(extractChapterNumber('Pendahuluan dokumen biasa')).toBe(1);
    expect(extractChapterNumber('')).toBe(1);
  });

  it('detects roman chapter from the last occurrence', () => {
    expect(extractChapterNumber('BAB I Pendahuluan')).toBe(1);
    expect(extractChapterNumber('BAB IV Metode Penelitian')).toBe(4);
  });

  it('detects arabic chapter', () => {
    expect(extractChapterNumber('Ini BAB 2 dari dokumen')).toBe(2);
  });

  it('takes the last BAB when multiple', () => {
    expect(extractChapterNumber('BAB I Pendahuluan\nBAB II Tinjauan')).toBe(2);
  });

  it('handles lowercase "bab" and trailing text', () => {
    expect(extractChapterNumber('lihat bab iii di atas')).toBe(3);
  });
});

describe('cleanCaptionTitle', () => {
  it('trims quotes and limits to 4 words', () => {
    expect(cleanCaptionTitle('"Hasil Pengujian Akurasi Model"')).toBe('Hasil Pengujian Akurasi Model');
    expect(cleanCaptionTitle('Satu dua tiga empat lima')).toBe('Satu dua tiga empat');
  });

  it('leaves short titles untouched', () => {
    expect(cleanCaptionTitle('Hasil Uji')).toBe('Hasil Uji');
  });
});

describe('parseAiCaptionTitles', () => {
  it('parses a valid JSON array of strings', () => {
    const input = '["Judul Tabel 1", "Judul Tabel 2", "Hasil Pengujian Akurasi Model Lengkap"]';
    expect(parseAiCaptionTitles(input)).toEqual([
      'Judul Tabel 1',
      'Judul Tabel 2',
      'Hasil Pengujian Akurasi Model',
    ]);
  });

  it('returns empty array for non-array JSON', () => {
    expect(parseAiCaptionTitles('{"foo": "bar"}')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseAiCaptionTitles('not json at all')).toEqual([]);
  });

  it('filters out non-string elements', () => {
    const input = '["Valid", 42, true, null, "Juga Valid"]';
    expect(parseAiCaptionTitles(input)).toEqual(['Valid', 'Juga Valid']);
  });
});