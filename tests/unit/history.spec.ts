import { afterEach, describe, expect, it, vi } from "vitest";
import {
  HISTORY_FINDINGS_LIMIT,
  HISTORY_KEY,
  HISTORY_LIMIT,
  loadHistory,
  saveToHistory,
} from "../../src/lib/history";
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

  it("guarda só os 100 primeiros findings e marca findings_clipped", () => {
    const f0 = base.findings[0]!;
    const many: ScanResult = {
      ...base,
      scan_id: "many",
      findings: Array.from({ length: 250 }, (_, i) => ({ ...f0, id: `f-${i}` })),
    };
    saveToHistory(many);
    const saved = loadHistory()[0]!;
    expect(HISTORY_FINDINGS_LIMIT).toBe(100);
    expect(saved.result.findings).toHaveLength(100);
    expect(saved.result.findings[99]!.id).toBe("f-99");
    expect(saved.findings_clipped).toBe(true);
    saveToHistory(make(2));
    expect(loadHistory()[0]!.findings_clipped).toBe(false);
  });

  it("QuotaExceededError: descarta o mais antigo e tenta de novo uma vez", () => {
    for (let i = 0; i < 3; i++) saveToHistory(make(i));
    const original = Storage.prototype.setItem;
    const spy = vi.spyOn(Storage.prototype, "setItem");
    spy.mockImplementationOnce(() => {
      throw new DOMException("cheio", "QuotaExceededError");
    });
    spy.mockImplementation(function (this: Storage, k: string, v: string) {
      original.call(this, k, v);
    });
    saveToHistory(make(3));
    expect(spy).toHaveBeenCalledTimes(2);
    const ids = loadHistory().map((e) => e.result.scan_id);
    expect(ids).toEqual(["id-3", "id-2", "id-1"]);
  });

  it("QuotaExceededError duas vezes: desiste sem quebrar (só uma nova tentativa)", () => {
    saveToHistory(make(1));
    saveToHistory(make(2));
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("cheio", "QuotaExceededError");
    });
    expect(() => saveToHistory(make(9))).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
