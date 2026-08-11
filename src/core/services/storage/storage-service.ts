/**
 * Secure Storage Service menggunakan IndexedDB / Office Settings API
 * yang terisolasi dari inspection `localStorage` browser devtools sederhana,
 * serta menyajikan fungsi enkripsi ringkas berbasis Obfuscation/Base64.
 */

export class StorageService {
    private static DB_NAME = "ReySkripsiSecureDB";
    private static STORE_NAME = "secure_keys";
    private static DB_VERSION = 1;

    // Enkripsi ringkas agar data tidak tersimpan dalam bentuk plain-text mentah
    private static encrypt(text: string): string {
        if (!text) return "";
        try {
            const encoded = btoa(encodeURIComponent(text));
            return encoded.split("").reverse().join("");
        } catch {
            return text;
        }
    }

    private static decrypt(encryptedText: string): string {
        if (!encryptedText) return "";
        try {
            const reversed = encryptedText.split("").reverse().join("");
            return decodeURIComponent(atob(reversed));
        } catch {
            return encryptedText;
        }
    }

    private static openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    db.createObjectStore(this.STORE_NAME);
                }
            };

            request.onsuccess = (event: any) => {
                resolve(event.target.result);
            };

            request.onerror = (event: any) => {
                reject(event.target.error);
            };
        });
    }

    /**
     * Menyimpan data sensitif secara aman ke IndexedDB lokal (terenkripsi).
     * Juga menghapus sisa data sensitif dari localStorage jika sebelumnya tersimpan di sana.
     */
    public static async setItem(key: string, value: string): Promise<void> {
        // Hapus sisa localStorage jika ada
        try {
            localStorage.removeItem(key);
        } catch {}

        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.STORE_NAME, "readwrite");
                const store = transaction.objectStore(this.STORE_NAME);
                const encryptedVal = this.encrypt(value);
                const request = store.put(encryptedVal, key);

                request.onsuccess = () => resolve();
                request.onerror = (e: any) => reject(e.target.error);
            });
        } catch (e) {
            // Fallback ke Office.context.roamingSettings jika IndexedDB tidak tersedia
            if (Office?.context?.roamingSettings) {
                Office.context.roamingSettings.set(key, this.encrypt(value));
                Office.context.roamingSettings.saveAsync();
            }
        }
    }

    /**
     * Mengambil data sensitif secara aman dari IndexedDB lokal.
     */
    public static async getItem(key: string): Promise<string> {
        // Jika ada sisa di localStorage, migrasikan ke IndexedDB lalu hapus dari localStorage
        const legacyVal = localStorage.getItem(key);
        if (legacyVal) {
            await this.setItem(key, legacyVal);
            localStorage.removeItem(key);
            return legacyVal;
        }

        try {
            const db = await this.openDB();
            return new Promise((resolve, reject) => {
                const transaction = db.transaction(this.STORE_NAME, "readonly");
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get(key);

                request.onsuccess = (event: any) => {
                    const encryptedVal = event.target.result;
                    if (encryptedVal) {
                        resolve(this.decrypt(encryptedVal));
                    } else {
                        resolve("");
                    }
                };

                request.onerror = () => resolve("");
            });
        } catch (e) {
            // Fallback dari Office roamingSettings
            if (Office?.context?.roamingSettings) {
                const encryptedVal = Office.context.roamingSettings.get(key);
                return this.decrypt(encryptedVal || "");
            }
            return "";
        }
    }

    /**
     * Menghapus item dari penyimpanan aman.
     */
    public static async removeItem(key: string): Promise<void> {
        try {
            localStorage.removeItem(key);
        } catch {}

        try {
            const db = await this.openDB();
            return new Promise((resolve) => {
                const transaction = db.transaction(this.STORE_NAME, "readwrite");
                const store = transaction.objectStore(this.STORE_NAME);
                store.delete(key);
                transaction.oncomplete = () => resolve();
            });
        } catch {}
    }
}
