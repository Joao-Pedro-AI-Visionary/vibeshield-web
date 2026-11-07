const UNITS = ["B", "KB", "MB", "GB", "TB"] as const;

function num(value: number, maxFractionDigits: number): string {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: maxFractionDigits }).format(value);
}

/** Bytes em base 1024, com vírgula decimal pt-BR. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${num(value, unit === 0 ? 0 : 1)} ${UNITS[unit]}`;
}

export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${num(ms / 1000, 1)} s`;
  const totalSeconds = Math.round(ms / 1000);
  return `${Math.floor(totalSeconds / 60)} min ${totalSeconds % 60} s`;
}

export function formatInt(value: number): string {
  return num(value, 0);
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
}
