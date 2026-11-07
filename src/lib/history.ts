import type { ScanResult } from "../api/types";

export const HISTORY_KEY = "vibeshield:history:v1";
export const HISTORY_LIMIT = 10;

export interface HistoryEntry {
  saved_at: string;
  result: ScanResult;
}

function isEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as { saved_at?: unknown; result?: Record<string, unknown> };
  return (
    typeof v.saved_at === "string" &&
    !!v.result &&
    typeof v.result.scan_id === "string" &&
    typeof v.result.score === "number" &&
    Array.isArray(v.result.findings) &&
    !!v.result.repo &&
    !!v.result.summary
  );
}

/** Lê o histórico. Qualquer falha (storage bloqueado, JSON quebrado) devolve []. */
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

/** Salva no topo (sem duplicar scan_id). Se a escrita falhar, devolve a lista em memória mesmo assim. */
export function saveToHistory(result: ScanResult, now: Date = new Date()): HistoryEntry[] {
  const next = [
    { saved_at: now.toISOString(), result },
    ...loadHistory().filter((e) => e.result.scan_id !== result.scan_id),
  ].slice(0, HISTORY_LIMIT);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // storage cheio ou bloqueado: segue só em memória
  }
  return next;
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY);
  } catch {
    // ignorado
  }
}
