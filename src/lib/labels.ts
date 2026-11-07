import type { Category, Grade, RuleId, Severity } from "../api/types";

export const SEVERITY_LABEL: Record<Severity, string> = {
  CRITICAL: "Crítica",
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  SECRET: "Segredos",
  HIDDEN_UNICODE: "Unicode oculto",
  SLOPSQUATTING: "Slopsquatting",
  INSECURE_CODE: "Código inseguro",
};

/** Classes de cor por severidade (tokens do @theme). */
export const SEVERITY_TEXT_LIGHT: Record<Severity, string> = {
  CRITICAL: "text-sev-critical",
  HIGH: "text-sev-high",
  MEDIUM: "text-sev-medium",
  LOW: "text-sev-low",
};

export const CATEGORY_STROKE: Record<Category, string> = {
  SECRET: "stroke-sev-critical",
  HIDDEN_UNICODE: "stroke-sev-high",
  SLOPSQUATTING: "stroke-sev-medium",
  INSECURE_CODE: "stroke-sev-low",
};

export const CATEGORY_BG: Record<Category, string> = {
  SECRET: "bg-sev-critical",
  HIDDEN_UNICODE: "bg-sev-high",
  SLOPSQUATTING: "bg-sev-medium",
  INSECURE_CODE: "bg-sev-low",
};

/** Cor da barra de score em fundo escuro, por nota. */
export const GRADE_BAR_DARK: Record<Grade, string> = {
  A: "bg-ok-dark",
  B: "bg-ok-dark",
  C: "bg-sev-medium-dark",
  D: "bg-sev-high-dark",
  F: "bg-sev-critical-dark",
};

export interface RuleDoc {
  rule_id: RuleId;
  category: Category;
  severity: Severity;
  title: string;
  what: string;
  why: string;
}

export const RULES: readonly RuleDoc[] = [
  {
    rule_id: "unicode.bidi",
    category: "HIDDEN_UNICODE",
    severity: "CRITICAL",
    title: "Controle bidirecional (Trojan Source)",
    what: "Caracteres U+202A–U+202E e U+2066–U+2069 no código.",
    why: "Invertem a ordem visual do texto: o revisor lê uma lógica e o compilador executa outra.",
  },
  {
    rule_id: "unicode.tag",
    category: "HIDDEN_UNICODE",
    severity: "CRITICAL",
    title: "Tags Unicode (ASCII smuggling)",
    what: "Caracteres no bloco U+E0000–U+E007F.",
    why: "São invisíveis para humanos, mas modelos de IA os leem: servem para esconder instruções maliciosas (prompt injection).",
  },
  {
    rule_id: "unicode.zero-width",
    category: "HIDDEN_UNICODE",
    severity: "HIGH",
    title: "Caracteres de largura zero",
    what: "U+200B, U+200C, U+200D, U+2060 e U+FEFF (exceto o BOM no início do arquivo).",
    why: "Criam identificadores que parecem iguais mas são diferentes e escondem texto em strings.",
  },
  {
    rule_id: "secret.known-prefix",
    category: "SECRET",
    severity: "CRITICAL",
    title: "Segredo com prefixo conhecido",
    what: "Chaves AWS (AKIA…), tokens do GitHub (ghp_, gho_, ghs_, github_pat_), Anthropic (sk-ant-), OpenAI (sk-proj-, sk-), Slack (xox…), Google (AIza…), Stripe (sk_live_) e chaves privadas PEM.",
    why: "Credencial real exposta em repositório público costuma ser explorada em minutos. Revogue antes de remover do código.",
  },
  {
    rule_id: "secret.high-entropy",
    category: "SECRET",
    severity: "HIGH",
    title: "Segredo por entropia",
    what: "Token de 20–200 caracteres com entropia de Shannon ≥ 4,5 atribuído a nome sugestivo (key, secret, token, password, api, auth…) ou ≥ 5,0 em qualquer lugar.",
    why: "Pega chaves sem prefixo conhecido. Lockfiles, hashes, UUIDs, URLs, .min.js, .map e .svg são ignorados para reduzir falso positivo.",
  },
  {
    rule_id: "code.cors-wildcard",
    category: "INSECURE_CODE",
    severity: "MEDIUM",
    title: "CORS liberado para qualquer origem",
    what: "Access-Control-Allow-Origin: *, origin: '*', allow_origin(Any), CORS_ALLOW_ALL_ORIGINS = True.",
    why: "Qualquer site pode chamar sua API pelo navegador da vítima.",
  },
  {
    rule_id: "code.eval",
    category: "INSECURE_CODE",
    severity: "MEDIUM",
    title: "Execução dinâmica de código",
    what: "eval( e new Function( em JS/TS; eval( e exec( em Python.",
    why: "Com entrada do usuário vira execução remota de código.",
  },
  {
    rule_id: "code.dangerous-html",
    category: "INSECURE_CODE",
    severity: "LOW",
    title: "HTML cru no DOM",
    what: "dangerouslySetInnerHTML, v-html e .innerHTML =.",
    why: "Sem sanitização, abre espaço para XSS.",
  },
  {
    rule_id: "deps.not-found",
    category: "SLOPSQUATTING",
    severity: "HIGH",
    title: "Dependência inexistente",
    what: "Pacote do package.json ou requirements.txt que retorna 404 no npm ou no PyPI.",
    why: "IAs inventam nomes de pacote. Um atacante pode registrar esse nome e entregar código malicioso no próximo install.",
  },
  {
    rule_id: "deps.too-new",
    category: "SLOPSQUATTING",
    severity: "MEDIUM",
    title: "Dependência recém-criada",
    what: "Pacote que existe, mas foi publicado há menos de 30 dias.",
    why: "Padrão típico de pacote registrado para explorar um nome alucinado. Confira autor, downloads e código antes de usar.",
  },
];
