/**
 * Global Application Configuration
 * Berfungsi seperti file .env untuk mengatur variabel global aplikasi.
 */
export const ENV = {
    // -----------------------------------------------------
    // 1. DATA SOURCES
    // -----------------------------------------------------
    // Path/URL ke file JSON Dictionary (Kamus KBBI)
    DICTIONARY_JSON_URL: "assets/kbbi-words.json",

    // -----------------------------------------------------
    // 2. EXTRACTION RULES (Aturan Ekstraksi)
    // -----------------------------------------------------
    // Kata dengan jumlah huruf kurang dari atau sama dengan nilai ini akan diabaikan (contoh: "di", "ke")
    MIN_WORD_LENGTH: 2,

    // -----------------------------------------------------
    // 3. MICROSOFT WORD CONSTANTS
    // -----------------------------------------------------
    // LCID (Locale ID) bawaan Microsoft Word untuk identifikasi bahasa
    MS_WORD_LCID: {
        ENGLISH: 0x09,
        INDONESIAN: 0x21
    },

    // -----------------------------------------------------
    // 4. FORMATTING RULES
    // -----------------------------------------------------
    // Format yang akan diaplikasikan pada kata asing/target
    FORMAT_STYLE: {
        ITALIC: true,
        // BOLD: false,
        // COLOR: "#FF0000" // (Bisa ditambahkan jika butuh warna)
    }
};
