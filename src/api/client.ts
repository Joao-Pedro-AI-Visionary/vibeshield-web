import type { ApiErrorCode, ClientErrorCode, ScanRequest, ScanResult } from "./types";
import { API_ERROR_CODES } from "./types";

/** Regex EXATA do contrato (docs/CONTRACT.md, POST /scans → repo_url). */
export const REPO_URL_REGEX =
  /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9._-]{1,100}?(?:\.git)?\/?$/;

export const DEFAULT_API_BASE_URL = "http://localhost:8080/api/v1";
export const DEFAULT_TIMEOUT_MS = 90_000;

export type ErrorCode = ApiErrorCode | ClientErrorCode;

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_REPO_URL: "Essa URL não é de um repositório público do GitHub. Use o formato https://github.com/dono/repo.",
  INVALID_BODY: "A requisição saiu malformada. Recarregue a página e tente de novo.",
  REPO_NOT_FOUND: "Repositório não encontrado. Confira o endereço: ele precisa existir e ser público.",
  REPO_TOO_LARGE: "O repositório passa do limite de download do scanner. Tente um repositório menor.",
  RATE_LIMITED: "Muitos scans em pouco tempo. Espere um minuto e tente de novo.",
  UPSTREAM_ERROR: "O GitHub não respondeu como esperado. Tente de novo em instantes.",
  SCAN_TIMEOUT: "O scan passou do tempo limite no servidor. Tente um repositório menor ou sem checar dependências.",
  INTERNAL: "Erro interno na API. Tente de novo; se persistir, avise a equipe.",
  NETWORK_ERROR: "API fora do ar ou inacessível. Verifique sua conexão e se o servidor está rodando.",
  CLIENT_TIMEOUT: "A API demorou mais de 90 segundos para responder. Tente de novo.",
  INVALID_RESPONSE: "A API respondeu num formato inesperado.",
  UNKNOWN: "Algo deu errado ao falar com a API. Tente de novo.",
};

export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number | null;
  readonly serverMessage: string | null;

  constructor(code: ErrorCode, status: number | null = null, serverMessage: string | null = null) {
    super(ERROR_MESSAGES[code]);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.serverMessage = serverMessage;
  }
}

/** Devolve null se a URL é válida pelo contrato; senão, a mensagem de erro em pt-BR. */
export function validateRepoUrl(url: string): string | null {
  if (!url) return "Informe a URL do repositório.";
  if (!REPO_URL_REGEX.test(url)) {
    return "URL inválida. Use https://github.com/dono/repo (sem /tree, query, porta ou credenciais).";
  }
  const name = url.replace(/\/$/, "").split("/")[4] ?? "";
  const bare = name.replace(/\.git$/, "");
  if (name === "." || name === ".." || bare === "" || bare === "." || bare === "..") {
    return "Nome de repositório inválido.";
  }
  return null;
}

export function apiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL as string | undefined;
  return (fromEnv && fromEnv.trim() ? fromEnv.trim() : DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && (API_ERROR_CODES as readonly string[]).includes(value);
}

function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.scan_id === "string" &&
    typeof v.score === "number" &&
    typeof v.grade === "string" &&
    Array.isArray(v.findings) &&
    !!v.repo &&
    !!v.summary
  );
}

export interface ScanOptions {
  fetchImpl?: typeof fetch;
  baseUrl?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export async function scanRepo(req: ScanRequest, opts: ScanOptions = {}): Promise<ScanResult> {
  const invalid = validateRepoUrl(req.repo_url);
  if (invalid) throw new ApiError("INVALID_REPO_URL", null, invalid);

  const fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  const baseUrl = (opts.baseUrl ?? apiBaseUrl()).replace(/\/+$/, "");
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onExternalAbort = () => controller.abort();
  opts.signal?.addEventListener("abort", onExternalAbort);

  try {
    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          repo_url: req.repo_url,
          check_dependencies: req.check_dependencies ?? true,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (timedOut) throw new ApiError("CLIENT_TIMEOUT");
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      throw new ApiError("NETWORK_ERROR");
    }

    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    if (!response.ok) {
      const error = (body as { error?: { code?: unknown; message?: unknown } } | null)?.error;
      const serverMessage = typeof error?.message === "string" ? error.message : null;
      if (isApiErrorCode(error?.code)) throw new ApiError(error.code, response.status, serverMessage);
      throw new ApiError("UNKNOWN", response.status, serverMessage);
    }

    if (!isScanResult(body)) throw new ApiError("INVALID_RESPONSE", response.status);
    return body;
  } finally {
    clearTimeout(timer);
    opts.signal?.removeEventListener("abort", onExternalAbort);
  }
}
