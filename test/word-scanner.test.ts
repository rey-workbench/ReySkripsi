import { describe, it, expect } from 'vitest';
import { WordScannerService } from '../src/core/services/word/word-scanner-service';

type Hit = {
  style?: string;
  font: { italic: boolean };
  parentBody?: { type: string };
  parentContentControlOrNullObject: { isNullObject: boolean };
};

function makeHit(italic: boolean, extra: Partial<Hit> = {}): Hit {
  return {
    font: { italic },
    parentContentControlOrNullObject: { isNullObject: true },
    ...extra,
  };
}

describe('WordScannerService.scanAndFormat', () => {
  it('melewatkan hit yang sudah miring saat menghitung', async () => {
    const perWord: Record<string, Hit[]> = {
      server: [makeHit(true), makeHit(false)],
      database: [makeHit(true), makeHit(true)],
    };

    const context = { sync: async () => {} };
    const range = {
      context,
      search(_w: string) {
        const c = { items: perWord[_w] ?? [] };
        (c as unknown as { load: () => void }).load = () => {};
        return c;
      },
    } as unknown as Parameters<typeof WordScannerService.scanAndFormat>[0];

    const count = await WordScannerService.scanAndFormat(
      range,
      ['server', 'database'],
      false,
      true // dry run: tidak menyentuh Office global
    );

    expect(count).toBe(1);
  });

  it('tetap memformat semua kata jika belum ada yang miring', async () => {
    const items = [makeHit(false), makeHit(false)];
    const context = { sync: async () => {} };
    const range = {
      context,
      search() {
        const c = { items };
        (c as unknown as { load: () => void }).load = () => {};
        return c;
      },
    } as unknown as Parameters<typeof WordScannerService.scanAndFormat>[0];

    const count = await WordScannerService.scanAndFormat(range, ['server'], false, true);
    expect(count).toBe(2);
  });
});
