import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { GeminiService } from '@/core/services/ai/gemini-service';
import { AiOrchestrator } from '@/core/services/ai/ai-orchestrator';
import { AiProviderFactory } from '@/core/services/ai/ai-provider-factory';
import { IAiService, IAiTurn } from '@/core/services/ai/iai-service';

vi.mock('@/core/services/ai/ai-provider-factory', () => ({
  AiProviderFactory: { getService: vi.fn() },
}));

function stubFetchJson(data: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => data });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function stubFetchStream(chunks: string[]) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function sentBody(fetchMock: ReturnType<typeof vi.fn>) {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse((init as RequestInit).body as string) as {
    contents: unknown[];
    tools?: unknown[];
    generationConfig?: { thinkingConfig: { includeThoughts: boolean } };
    system_instruction?: { parts: { text: string }[] };
  };
}

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.clearAllMocks());

describe('GeminiService.generateContent', () => {
  it('mengirim tools googleSearch saat searchGrounding aktif', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', undefined, { searchGrounding: true });
    const body = sentBody(fetchMock);
    expect(body.tools).toEqual([{ googleSearch: {} }]);
    expect(body.generationConfig).toBeUndefined();
  });

  it('mengirim tools codeExecution saat codeExecution aktif', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', undefined, { codeExecution: true });
    expect(sentBody(fetchMock).tools).toEqual([{ codeExecution: {} }]);
  });

  it('mengirim thinkingConfig saat thinking aktif', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', undefined, { thinking: true });
    const body = sentBody(fetchMock);
    expect(body.generationConfig).toEqual({ thinkingConfig: { includeThoughts: true } });
    expect(body.tools).toBeUndefined();
  });

  it('menyertakan system_instruction bila diberikan', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', 'instruksi sistem');
    expect(sentBody(fetchMock).system_instruction).toEqual({ parts: [{ text: 'instruksi sistem' }] });
  });

  it('mengirim riwayat percakapan ke contents sebelum prompt terbaru', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', undefined, {
      history: [
        { role: 'user', text: 'turn 1 user' },
        { role: 'model', text: 'turn 1 model' },
      ],
    });
    const body = sentBody(fetchMock);
    expect(body.contents).toEqual([
      { role: 'user', parts: [{ text: 'turn 1 user' }] },
      { role: 'model', parts: [{ text: 'turn 1 model' }] },
      { role: 'user', parts: [{ text: 'p' }] },
    ]);
  });

  it('mempertahankan hasil eksekusi kode pada respons', async () => {
    stubFetchJson({
      candidates: [{
        content: {
          parts: [
            { execution_result: { outcome: 'ok', output: '42\n43' } },
            { text: 'Hasil: 42 dan 43.' },
          ],
        },
      }],
    });
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, { codeExecution: true });
    expect(result.text).toContain('42\n43');
    expect(result.text).toContain('Hasil: 42 dan 43.');
  });

  it('tidak menambah tools/generationConfig tanpa opsi', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm');
    const body = sentBody(fetchMock);
    expect(body.tools).toBeUndefined();
    expect(body.generationConfig).toBeUndefined();
  });

  it('mengabaikan part thought (reasoning internal) pada respons', async () => {
    stubFetchJson({
      candidates: [{
        content: {
          parts: [
            { thought: true, text: 'analisis internal...' },
            { text: 'Jawaban akhir.' },
          ],
        },
      }],
    });
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, { thinking: true });
    expect(result.text).toBe('Jawaban akhir.');
  });

  it('mengembalikan fallback bila kandidat kosong', async () => {
    stubFetchJson({ candidates: [] });
    const result = await new GeminiService().generateContent('p', 'key', 'm');
    expect(result.text).toBe('Maaf, AI tidak dapat memberikan respons saat ini.');
    expect(result.toolCalls).toEqual([]);
  });

  it('streaming: memakai endpoint streamGenerateContent dan memanggil onStream dengan teks kumulatif', async () => {
    const fetchMock = stubFetchStream([
      'data: {"candidates":[{"content":{"parts":[{"text":"Halo"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" dunia"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"!"}]}}]}\n\n',
    ]);
    const received: string[] = [];
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, {
      onStream: (t) => received.push(t),
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain(':streamGenerateContent?alt=sse');
    expect(received).toEqual(['Halo', 'Halo dunia', 'Halo dunia!']);
    expect(result.text).toBe('Halo dunia!');
    expect(result.toolCalls).toEqual([]);
  });

  it('menerjemahkan error project denied access menjadi pesan yang bisa ditindaklanjuti', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Your project has been denied access. Please contact support.' } }),
    }));
    await expect(new GeminiService().generateContent('p', 'key', 'm')).rejects.toThrow('flag di akun/project');
  });

  it('menerjemahkan error quota menjadi pesan retry yang jelas', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'You exceeded your current quota, please check your plan and billing details.' } }),
    }));
    await expect(new GeminiService().generateContent('p', 'key', 'm')).rejects.toThrow('Tunggu 1 menit');
  });

  it('streaming: robust terhadap CRLF dan event terakhir tanpa newline (regresi parser)', async () => {
    const fetchMock = stubFetchStream([
      'data: {"candidates":[{"content":{"parts":[{"text":"Halo"}]}}]}\r\n\r\n',
      'data: {"candidates":[{"content":{"parts":[{"text":" dunia"}]}}]}\r\n\r\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"!"}]}}]}\r\n',
    ]);
    const received: string[] = [];
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, {
      onStream: (t) => received.push(t),
    });
    expect(received).toEqual(['Halo', 'Halo dunia', 'Halo dunia!']);
    expect(result.text).toBe('Halo dunia!');
  });

  it('streaming: mengumpulkan functionCall dan menahan part thought', async () => {
    stubFetchStream([
      'data: {"candidates":[{"content":{"parts":[{"thought":true,"text":"analisis internal"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"text":"Saya cek dulu"}]}}]}\n\n',
      'data: {"candidates":[{"content":{"parts":[{"functionCall":{"name":"scanDocument","args":{}}}]}}]}\n\n',
    ]);
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, {
      onStream: () => {},
    });
    expect(result.text).toBe('Saya cek dulu');
    expect(result.toolCalls).toEqual([{ name: 'scanDocument', args: {} }]);
  });
});

describe('GeminiService function calling', () => {
  it('mengembalikan toolCalls dari part functionCall', async () => {
    stubFetchJson({
      candidates: [{
        content: {
          parts: [
            { functionCall: { name: 'scanDocument', args: {} } },
          ],
        },
      }],
    });
    const result = await new GeminiService().generateContent('p', 'key', 'm', undefined, { tools: [] });
    expect(result.text).toBe('');
    expect(result.toolCalls).toEqual([{ name: 'scanDocument', args: {} }]);
  });

  it('mengirim functionDeclarations saat opsi tools diberikan', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    const tools = [{ name: 'insertText', description: 'sisip teks', parameters: { type: 'object', properties: {} } }];
    await new GeminiService().generateContent('p', 'key', 'm', undefined, { tools });
    expect(sentBody(fetchMock).tools).toEqual([{ functionDeclarations: tools }]);
  });

  it('menyertakan functionCall + functionResponse di contents saat toolResults diberikan', async () => {
    const fetchMock = stubFetchJson({ candidates: [{ content: { parts: [{ text: 'ok' }] } }] });
    await new GeminiService().generateContent('p', 'key', 'm', undefined, {
      toolCalls: [{ name: 'insertText', args: { text: 'halo' } }],
      toolResults: [{ name: 'insertText', result: { insertedChars: 4 } }],
    });
    expect(sentBody(fetchMock).contents).toEqual([
      { role: 'user', parts: [{ text: 'p' }] },
      { role: 'model', parts: [{ functionCall: { name: 'insertText', args: { text: 'halo' } } }] },
      { role: 'user', parts: [{ functionResponse: { name: 'insertText', response: { insertedChars: 4 } } }] },
    ]);
  });
});

describe('AiOrchestrator tool loop', () => {
  it('mengeksekusi tool lalu mengembalikan jawaban final', async () => {
    const fakeService = {
      generateContent: vi.fn<IAiService['generateContent']>()
        .mockResolvedValueOnce({ text: '', toolCalls: [{ name: 'scanDocument', args: {} }] } satisfies IAiTurn)
        .mockResolvedValueOnce({ text: 'hasil akhir', toolCalls: [] } satisfies IAiTurn),
    };
    (AiProviderFactory.getService as ReturnType<typeof vi.fn>).mockReturnValue(fakeService);

    const executed: string[] = [];
    const result = await AiOrchestrator.generateResponse(
      'p', 'key', 'gemini-x', undefined, undefined,
      async (name) => { executed.push(name); return { ok: true }; }
    );

    expect(result).toBe('hasil akhir');
    expect(executed).toEqual(['scanDocument']);
    expect(fakeService.generateContent).toHaveBeenCalledTimes(2);
    expect(fakeService.generateContent.mock.calls[1][4]).toMatchObject({
      toolCalls: [{ name: 'scanDocument', args: {} }],
      toolResults: [{ name: 'scanDocument', result: { ok: true } }],
    });
  });

  it('melempar error bila tool diminta tanpa executor', async () => {
    const fakeService = {
      generateContent: vi.fn<IAiService['generateContent']>()
        .mockResolvedValue({ text: '', toolCalls: [{ name: 'x', args: {} }] } satisfies IAiTurn),
    };
    (AiProviderFactory.getService as ReturnType<typeof vi.fn>).mockReturnValue(fakeService);

    await expect(AiOrchestrator.generateResponse('p', 'key', 'gemini-x'))
      .rejects.toThrow('tidak ada executor');
  });

  it('menghentikan loop setelah batas iterasi', async () => {
    const fakeService = {
      generateContent: vi.fn<IAiService['generateContent']>()
        .mockResolvedValue({ text: '', toolCalls: [{ name: 'x', args: {} }] } satisfies IAiTurn),
    };
    (AiProviderFactory.getService as ReturnType<typeof vi.fn>).mockReturnValue(fakeService);

    await expect(AiOrchestrator.generateResponse(
      'p', 'key', 'gemini-x', undefined, undefined,
      async () => ({ ok: true })
    )).rejects.toThrow('batas iterasi');
    expect(fakeService.generateContent).toHaveBeenCalledTimes(4);
  });
});
