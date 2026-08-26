const keyNamespace = "ReySkripsi-key-v1";
const ivLength = 12;

function isCryptoAvailable(): boolean {
  return (
    typeof crypto !== "undefined" &&
    !!crypto.subtle &&
    !!crypto.getRandomValues
  );
}

function bytesToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getOrCreateKey(): Promise<CryptoKey> {
  return new Promise((resolve, reject) => {
    let storedRaw: string | null = null;
    try {
      storedRaw = localStorage.getItem(keyNamespace);
    } catch {
      storedRaw = null;
    }

    const raw = storedRaw !== null ? storedRaw : crypto.randomUUID();

    crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(raw),
      "AES-GCM",
      false,
      ["encrypt", "decrypt"]
    ).then((key) => {
      if (storedRaw === null) {
        try {
          localStorage.setItem(keyNamespace, raw);
        } catch {
          /* abaikan kegagalan penyimpanan kunci */
        }
      }
      resolve(key);
    }, reject);
  });
}

async function encryptWithCrypto(text: string): Promise<string> {
  const key = await getOrCreateKey();
  const iv = crypto.getRandomValues(new Uint8Array(ivLength));
  const encoded = new TextEncoder().encode(text);
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const cipherBytes = new Uint8Array(cipher);
  const out = new Uint8Array(iv.length + cipherBytes.length + 1);
  out[0] = 1;
  out.set(iv, 1);
  out.set(cipherBytes, 1 + iv.length);
  return "v1:" + bytesToBase64(out);
}

async function decryptWithCrypto(encrypted: string): Promise<string | null> {
  if (!encrypted.startsWith("v1:")) return null;
  const token = encrypted.slice(3);
  const bytes = base64ToBytes(token);
  if (bytes.length < 1 + ivLength + 16) return null;
  const version = bytes[0];
  if (version !== 1) return null;
  const iv = bytes.slice(1, 1 + ivLength);
  const cipher = bytes.slice(1 + ivLength);
  const key = await getOrCreateKey();
  try {
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, cipher);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

function obfuscate(text: string): string {
  if (!text) return "";
  try {
    const encoded = btoa(encodeURIComponent(text));
    return encoded.split("").reverse().join("");
  } catch {
    return text;
  }
}

function deobfuscate(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const reversed = encryptedText.split("").reverse().join("");
    return decodeURIComponent(atob(reversed));
  } catch {
    return encryptedText;
  }
}

const DB_NAME = "ReySkripsiSecureDB";
const STORE_NAME = "secure_keys";
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);
    request.onerror = (event) => reject((event.target as IDBRequest).error);
  });
}


async function encryptValue(text: string): Promise<string> {
  if (!text) return "";
  try {
    if (isCryptoAvailable()) {
      return await encryptWithCrypto(text);
    }
  } catch (e) {
    console.warn("WebCrypto gagal, jatuh ke obfuscation:", e);
  }
  return "legacy:" + obfuscate(text);
}

async function decryptValue(encrypted: string): Promise<string> {
  if (!encrypted) return "";
  if (encrypted.startsWith("v1:")) {
    if (isCryptoAvailable()) {
      try {
        const decrypted = await decryptWithCrypto(encrypted);
        if (decrypted !== null) return decrypted;
      } catch (e) {
        console.warn("Gagal mendekripsi nilai v1:", e);
      }
    }
    return "";
  }
  const raw = encrypted.startsWith("legacy:") ? encrypted.slice(7) : encrypted;
  return deobfuscate(raw);
}

export const STORAGE_KEYS = {
    GEMINI_API_KEY: "gemini_api_key",
    NVIDIA_API_KEY: "nvidia_api_key",
} as const;

export class StorageService {
  public static async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.removeItem(key);
    } catch { /* ignore */ }

    const encryptedVal = await encryptValue(value);

    if (typeof indexedDB !== "undefined") {
      try {
        const db = await openDB();
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.put(encryptedVal, key);
          request.onsuccess = () => resolve();
          request.onerror = (e) => reject((e.target as IDBRequest).error);
        });
      } catch (e) {
        console.warn("IndexedDB gagal, fallback ke Office roamingSettings:", e);
      }
    }

    if (Office?.context?.roamingSettings) {
      Office.context.roamingSettings.set(key, encryptedVal);
      Office.context.roamingSettings.saveAsync();
    }
  }

  public static async getItem(key: string): Promise<string> {
    let legacyVal: string | null = null;
    try {
      legacyVal = localStorage.getItem(key);
    } catch { /* ignore */ }
    if (legacyVal) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
      return await decryptValue(legacyVal);
    }

    if (typeof indexedDB !== "undefined") {
      try {
        const db = await openDB();
        return new Promise<string>((resolve) => {
          const transaction = db.transaction(STORE_NAME, "readonly");
          const store = transaction.objectStore(STORE_NAME);
          const request = store.get(key);
          request.onsuccess = (event) => {
            const encryptedVal = (event.target as IDBRequest).result;
            if (encryptedVal) {
              decryptValue(encryptedVal).then(resolve).catch(() => resolve(""));
            } else {
              resolve("");
            }
          };
          request.onerror = () => resolve("");
        });
      } catch (e) {
        console.warn("IndexedDB gagal dibaca:", e);
      }
    }

    if (Office?.context?.roamingSettings) {
      const encryptedVal = Office.context.roamingSettings.get(key);
      if (encryptedVal) {
        return await decryptValue(encryptedVal);
      }
    }
    return "";
  }

  public static async removeItem(key: string): Promise<void> {
    try { localStorage.removeItem(key); } catch { /* ignore */ }

    if (typeof indexedDB !== "undefined") {
      try {
        const db = await openDB();
        return new Promise<void>((resolve) => {
          const transaction = db.transaction(STORE_NAME, "readwrite");
          const store = transaction.objectStore(STORE_NAME);
          store.delete(key);
          transaction.oncomplete = () => resolve();
        });
      } catch { /* ignore */ }
    }
  }
}