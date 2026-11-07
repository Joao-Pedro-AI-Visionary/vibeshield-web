import type { Finding } from "../api/types";

export function joinFixPrompts(findings: readonly Finding[]): string {
  return findings
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.file}:${f.line}\n${f.fix_prompt}`)
    .join("\n\n");
}

/** Copia texto para a área de transferência. Devolve true se conseguiu. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // cai no fallback abaixo
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  } catch {
    return false;
  }
}
