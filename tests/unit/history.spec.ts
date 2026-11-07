import { afterEach, describe, expect, it, vi } from "vitest";
import { HISTORY_KEY, HISTORY_LIMIT, loadHistory, saveToHistory } from "../../src/lib/history";
import type { ScanResult } from "../../src/api/types";
import sample from "../../e2e/fixtures/scan.json";

const base = sample as ScanResult;
const make = (i: number): ScanResult => ({ ...base, scan_id: `id-${i}`, repo: { ...base.repo, name: `r${i}` } });

afterEach(() => {
  localStorage.clear();
});

describe("histórico em localStorage", () => {
  it("salva no topo, sem duplicar scan_id, com no máximo 10", () => {
    for (let i = 0; i < 12; i++) saveToHistory(make(i));
    saveToHistory(make(11));
    const list = loadHistory();
    expect(list).toHaveLength(HISTORY_LIMIT);
    expect(list[0]?.result.scan_id).toBe("id-11");
    expect(new Set(list.map((e) => e.result.scan_id)).size).toBe(HISTORY_LIMIT);
  });

  it("leitura com getItem lançando exceção devolve lista vazia", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(loadHistory()).toEqual([]);
  });

  it("escrita com setItem lançando (quota) não quebra e devolve a lista em memória", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const list = saveToHistory(make(1));
    expect(list[0]?.result.scan_id).toBe("id-1");
  });

  it("JSON corrompido ou formato errado é ignorado", () => {
    localStorage.setItem(HISTORY_KEY, "{not json");
    expect(loadHistory()).toEqual([]);
    localStorage.setItem(HISTORY_KEY, JSON.stringify([{ foo: 1 }, "x"]));
    expect(loadHistory()).toEqual([]);
  });
});
