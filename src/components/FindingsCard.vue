<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { Check, CircleCheck, Copy } from "@lucide/vue";
import { CATEGORIES, SEVERITIES } from "../api/types";
import type { Category, Finding, Severity } from "../api/types";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "../lib/labels";
import { copyText } from "../lib/prompts";
import SeverityBadge from "./SeverityBadge.vue";

const props = defineProps<{ findings: readonly Finding[]; truncated?: boolean }>();

const category = ref<Category | null>(null);
const severity = ref<Severity | null>(null);
const copiedId = ref<string | null>(null);
const status = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;

const filtered = computed(() =>
  props.findings.filter(
    (f) => (category.value === null || f.category === category.value) && (severity.value === null || f.severity === severity.value),
  ),
);

const countByCategory = computed(() => {
  const out = { SECRET: 0, HIDDEN_UNICODE: 0, SLOPSQUATTING: 0, INSECURE_CODE: 0 } as Record<Category, number>;
  for (const f of props.findings) out[f.category]++;
  return out;
});
const countBySeverity = computed(() => {
  const out = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<Severity, number>;
  for (const f of props.findings) out[f.severity]++;
  return out;
});

function toggleCategory(c: Category | null) {
  category.value = category.value === c ? null : c;
}
function toggleSeverity(s: Severity | null) {
  severity.value = severity.value === s ? null : s;
}

async function copy(f: Finding) {
  const ok = await copyText(f.fix_prompt);
  copiedId.value = ok ? f.id : null;
  status.value = ok
    ? `Copiado: prompt de correção de ${f.file}:${f.line}`
    : "Não foi possível copiar. Selecione o texto manualmente.";
  clearTimeout(timer);
  timer = setTimeout(() => {
    copiedId.value = null;
  }, 2000);
}

onBeforeUnmount(() => clearTimeout(timer));

const chipBase =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition-colors duration-150 cursor-pointer";
const chipOff = "bg-subtle text-ink hover:bg-ink/10";
const chipOn = "bg-ink text-card";
</script>

<template>
  <section class="surface-light flex min-w-0 flex-col rounded-card p-5 sm:p-6" aria-labelledby="findings-title">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 id="findings-title" class="text-xl font-semibold tracking-tight">Achados</h2>
      <p class="text-sm text-muted">
        {{ filtered.length }} de {{ findings.length }}<span v-if="truncated"> (lista truncada em 500)</span>
      </p>
    </div>

    <template v-if="findings.length > 0">
      <div class="mt-4 space-y-3">
        <div role="group" aria-label="Filtrar por categoria" class="flex flex-wrap gap-2">
          <button
            type="button"
            :class="[chipBase, category === null ? chipOn : chipOff]"
            :aria-pressed="category === null"
            data-testid="filter-category-ALL"
            @click="toggleCategory(null)"
          >
            Todas as categorias
          </button>
          <button
            v-for="c in CATEGORIES"
            :key="c"
            type="button"
            :class="[chipBase, category === c ? chipOn : chipOff]"
            :aria-pressed="category === c"
            :data-testid="`filter-category-${c}`"
            @click="toggleCategory(c)"
          >
            {{ CATEGORY_LABEL[c] }}
            <span class="tabular-nums opacity-80">{{ countByCategory[c] }}</span>
          </button>
        </div>
        <div role="group" aria-label="Filtrar por severidade" class="flex flex-wrap gap-2">
          <button
            type="button"
            :class="[chipBase, severity === null ? chipOn : chipOff]"
            :aria-pressed="severity === null"
            data-testid="filter-severity-ALL"
            @click="toggleSeverity(null)"
          >
            Todas as severidades
          </button>
          <button
            v-for="s in SEVERITIES"
            :key="s"
            type="button"
            :class="[chipBase, severity === s ? chipOn : chipOff]"
            :aria-pressed="severity === s"
            :data-testid="`filter-severity-${s}`"
            @click="toggleSeverity(s)"
          >
            {{ SEVERITY_LABEL[s] }}
            <span class="tabular-nums opacity-80">{{ countBySeverity[s] }}</span>
          </button>
        </div>
      </div>

      <ul v-if="filtered.length > 0" class="findings-scroll mt-4 -mx-1 space-y-3 px-1" aria-label="Lista de achados">
        <li
          v-for="f in filtered"
          :key="f.id"
          data-testid="finding"
          class="min-w-0 rounded-2xl border border-ink/10 p-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <SeverityBadge :severity="f.severity" />
            <span class="text-xs font-medium text-muted">{{ CATEGORY_LABEL[f.category] }} · {{ f.rule_id }}</span>
          </div>
          <p class="mt-2 font-mono text-sm break-all text-ink">{{ f.file }}:{{ f.line }}</p>
          <p class="mt-1 text-sm text-muted">{{ f.description }}</p>
          <pre class="mt-2 max-w-full overflow-x-auto rounded-xl bg-subtle px-3 py-2 text-xs"><code class="font-mono text-ink">{{ f.snippet }}</code></pre>
          <button
            type="button"
            data-testid="copy-prompt"
            class="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-card transition-opacity duration-150 hover:opacity-90"
            @click="copy(f)"
          >
            <component :is="copiedId === f.id ? Check : Copy" class="size-4" aria-hidden="true" />
            {{ copiedId === f.id ? "Copiado" : "Copiar prompt de correção" }}
            <span class="sr-only">para {{ f.file }}:{{ f.line }}</span>
          </button>
        </li>
      </ul>
      <p v-else class="mt-6 rounded-2xl bg-subtle p-4 text-sm text-muted">
        Nenhum achado com esses filtros. Escolha outra categoria ou severidade.
      </p>
    </template>

    <div v-else class="mt-4 flex items-start gap-3 rounded-2xl border-2 border-ok p-4" data-testid="no-findings">
      <CircleCheck class="mt-0.5 size-6 shrink-0 text-ok" aria-hidden="true" />
      <div>
        <p class="font-semibold text-ok">Nenhum problema encontrado</p>
        <p class="text-sm text-muted">
          O scanner não achou segredos, Unicode oculto, dependências suspeitas nem padrões de código inseguro.
        </p>
      </div>
    </div>

    <p data-testid="copy-status" class="sr-only" aria-live="polite" role="status">{{ status }}</p>
  </section>
</template>
