import { describe, expect, it } from "vitest";
import { formatBytes, formatDuration } from "../../src/lib/format";
import { categorySegments } from "../../src/lib/stats";
import { joinFixPrompts } from "../../src/lib/prompts";
import type { Finding } from "../../src/api/types";

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1024, "1 KB"],
    [812345, "793,3 KB"],
    [52428800, "50 MB"],
    [1610612736, "1,5 GB"],
  ])("%i -> %s", (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });
  it("valor negativo ou inválido vira traço", () => {
    expect(formatBytes(-1)).toBe("—");
    expect(formatBytes(Number.NaN)).toBe("—");
  });
});

describe("formatDuration", () => {
  it.each([
    [830, "830 ms"],
    [1830, "1,8 s"],
    [61_000, "1 min 1 s"],
  ])("%i -> %s", (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});

describe("categorySegments (donut)", () => {
  it("soma o total e calcula frações e offsets na ordem do contrato", () => {
    const { total, segments } = categorySegments({ SECRET: 2, HIDDEN_UNICODE: 0, SLOPSQUATTING: 1, INSECURE_CODE: 1 });
    expect(total).toBe(4);
    expect(segments.map((s) => s.category)).toEqual(["SECRET", "HIDDEN_UNICODE", "SLOPSQUATTING", "INSECURE_CODE"]);
    expect(segments.map((s) => s.count)).toEqual([2, 0, 1, 1]);
    expect(segments.map((s) => s.fraction)).toEqual([0.5, 0, 0.25, 0.25]);
    expect(segments.map((s) => s.offset)).toEqual([0, 0.5, 0.5, 0.75]);
  });
  it("total zero não divide por zero", () => {
    const { total, segments } = categorySegments({ SECRET: 0, HIDDEN_UNICODE: 0, SLOPSQUATTING: 0, INSECURE_CODE: 0 });
    expect(total).toBe(0);
    expect(segments.every((s) => s.fraction === 0)).toBe(true);
  });
});

describe("joinFixPrompts", () => {
  it("concatena os fix_prompt numerados com arquivo:linha", () => {
    const findings = [
      { file: "a.ts", line: 1, severity: "HIGH", fix_prompt: "Corrija A" },
      { file: "b.ts", line: 2, severity: "LOW", fix_prompt: "Corrija B" },
    ] as Finding[];
    const text = joinFixPrompts(findings);
    expect(text).toContain("1. [HIGH] a.ts:1\nCorrija A");
    expect(text).toContain("2. [LOW] b.ts:2\nCorrija B");
  });
  it("lista vazia vira string vazia", () => {
    expect(joinFixPrompts([])).toBe("");
  });
});
