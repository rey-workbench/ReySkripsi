/**
 * fetch dengan timeout otomatis (AbortController). Dipakai bersama oleh
 * GeminiService dan NvidiaService agar scaffolding timeout tidak diduplikasi.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
