// Tipos espelhando docs/CONTRACT.md (v1). Fonte única: o contrato.

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Category = "SECRET" | "HIDDEN_UNICODE" | "SLOPSQUATTING" | "INSECURE_CODE";
export type Grade = "A" | "B" | "C" | "D" | "F";

export type RuleId =
  | "unicode.bidi"
  | "unicode.tag"
  | "unicode.zero-width"
  | "secret.known-prefix"
  | "secret.high-entropy"
  | "code.cors-wildcard"
  | "code.eval"
  | "code.dangerous-html"
  | "deps.not-found"
  | "deps.too-new";

export type ApiErrorCode =
  | "INVALID_REPO_URL"
  | "INVALID_BODY"
  | "REPO_NOT_FOUND"
  | "REPO_TOO_LARGE"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR"
  | "SCAN_TIMEOUT"
  | "INTERNAL";

/** Códigos produzidos só pelo cliente (não vêm da API). */
export type ClientErrorCode = "NETWORK_ERROR" | "CLIENT_TIMEOUT" | "INVALID_RESPONSE" | "UNKNOWN";

export interface ScanRequest {
  repo_url: string;
  check_dependencies?: boolean;
}

export interface RepoRef {
  owner: string;
  name: string;
  url: string;
}

export interface Finding {
  id: string;
  rule_id: RuleId;
  category: Category;
  severity: Severity;
  file: string;
  line: number;
  snippet: string;
  description: string;
  fix_prompt: string;
}

export interface ScanSummary {
  by_severity: Record<Severity, number>;
  by_category: Record<Category, number>;
}

export interface ScanResult {
  scan_id: string;
  repo: RepoRef;
  score: number;
  grade: Grade;
  files_scanned: number;
  files_skipped: number;
  bytes_downloaded: number;
  duration_ms: number;
  truncated: boolean;
  summary: ScanSummary;
  findings: Finding[];
}

export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

export interface HealthResponse {
  status: "ok";
  version: string;
}

export const SEVERITIES: readonly Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const CATEGORIES: readonly Category[] = ["SECRET", "HIDDEN_UNICODE", "SLOPSQUATTING", "INSECURE_CODE"];
export const API_ERROR_CODES: readonly ApiErrorCode[] = [
  "INVALID_REPO_URL",
  "INVALID_BODY",
  "REPO_NOT_FOUND",
  "REPO_TOO_LARGE",
  "RATE_LIMITED",
  "UPSTREAM_ERROR",
  "SCAN_TIMEOUT",
  "INTERNAL",
];
