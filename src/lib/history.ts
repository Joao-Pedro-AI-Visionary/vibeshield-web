import type { ScanResult } from "../api/types";

export const HISTORY_KEY = "vibeshield:history:v1";
export const HISTORY_LIMIT = 10;
/** Só os N primeiros achados (os mais graves, pela ordenação do contrato) vão para o storage. */
export const HISTORY_FINDINGS_LIMIT = 100;

export interface HistoryEntry {
  saved_at: string;
  /** true quando o scan tinha mais de HISTORY_FINDINGS_LIMIT achados e a lista salva foi recortada. */
  findings_clipped: boolean;
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

function normalize(entry: HistoryEntry): HistoryEntry {
  return { ...entry, findings_clipped: entry.findings_clipped === true };
}

/** Lê o histórico. Qualquer falha (storage bloqueado, JSON quebrado) devolve []. */
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).map(normalize).slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

function isQuotaError(err: unknown): boolean {
  return (
    err instanceof DOMException &&
    (err.name === "QuotaExceededError" || err.name === "NS_ERROR_DOM_QUOTA_REACHED" || err.code === 22)
  );
}

function write(list: HistoryEntry[]): void {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

/**
 * Salva no topo (sem duplicar scan_id), com no máximo HISTORY_FINDINGS_LIMIT achados por scan.
 * Cota estourada: descarta o item mais antigo e tenta uma única vez. Qualquer outra falha: segue só em memória.
 */
export function saveToHistory(result: ScanResult, now: Date = new Date()): HistoryEntry[] {
  const clipped = result.findings.length > HISTORY_FINDINGS_LIMIT;
  const entry: HistoryEntry = {
    saved_at: now.toISOString(),
    findings_clipped: clipped,
    result: clipped ? { ...result, findings: result.findings.slice(0, HISTORY_FINDINGS_LIMIT) } : result,
  };
  let next = [entry, ...loadHistory().filter((e) => e.result.scan_id !== result.scan_id)].slice(0, HISTORY_LIMIT);
  try {
    write(next);
  } catch (err) {
    if (isQuotaError(err) && next.length > 1) {
      next = next.slice(0, -1);
      try {
        write(next);
      } catch {
        // segunda falha: desiste, fica em memória
      }
    }
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
