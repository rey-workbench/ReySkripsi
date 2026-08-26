/**
 * Logika murni untuk penomoran bab (Angka Romawi/Arab) dan parsing judul caption
 * hasil AI. Dipisahkan dari CaptionService agar mudah diuji unit.
 */

/**
 * Mengonversi Angka Romawi ke Angka Arab (misal "III" -> 3, "IV" -> 4).
 * Bila input tidak valid, mengembalikan NaN.
 */
export function romanToArabic(romanStr: string): number {
  const romanMap: { [key: string]: number } = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000
  };

  // Validasi: hanya karakter romawi yang diperbolehkan.
  if (!/^[IVXLCDM]+$/i.test(romanStr)) {
    return NaN;
  }

  const cleanRoman = romanStr.trim().toUpperCase();
  let num = 0;
  for (let i = 0; i < cleanRoman.length; i++) {
    const current = romanMap[cleanRoman[i]] ?? 0;
    const next = romanMap[cleanRoman[i + 1]] ?? 0;
    if (current < next) {
      num -= current;
    } else {
      num += current;
    }
  }
  return num;
}

/**
 * Mendeteksi nomor Bab saat ini dari teks dokumen sebelum lokasi kursor.
 * Mengambil BAB terakhir yang terdeteksi (Arab atau Romawi).
 * Mengembalikan 1 bila tidak ada BAB yang ditemukan.
 */
export function extractChapterNumber(text: string): number {
  const matches = Array.from(text.matchAll(/BAB\s+([IVXLCDM\d]+)/gi));
  if (!matches || matches.length === 0) return 1;

  const lastMatch = matches[matches.length - 1];
  const rawChapter = lastMatch[1].trim();

  if (/^\d+$/.test(rawChapter)) {
    return parseInt(rawChapter, 10);
  }
  const arabic = romanToArabic(rawChapter);
  return Number.isNaN(arabic) || arabic <= 0 ? 1 : arabic;
}

/**
 * Membersihkan dan membatasi sebuah judul caption menjadi maksimal N kata.
 */
export function cleanCaptionTitle(title: string, maxWords = 4): string {
  const clean = title.replace(/^[\"“'‘「」]+|[\"“'‘「」]+$/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  return words.length > maxWords ? words.slice(0, maxWords).join(" ") : clean;
}

/**
 * Mem-parse output JSON array of strings dari batch-prompt AI menjadi daftar
 * judul yang sudah dibersihkan. Robust terhadap JSON yang sedikit menyimpang
 * (bukan array, ada elemen non-string). Mengembalikan array kosong bila gagal.
 */
export function parseAiCaptionTitles(jsonString: string, maxWords = 4): string[] {
  try {
    const raw = JSON.parse(jsonString);
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((t): t is string => typeof t === 'string')
      .map(t => cleanCaptionTitle(t, maxWords));
  } catch {
    return [];
  }
}