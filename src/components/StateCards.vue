<script setup lang="ts">
import { ArrowRight, RefreshCw, ShieldCheck, TriangleAlert } from "@lucide/vue";

defineProps<{ kind: "empty" | "error"; message?: string; code?: string }>();
const emit = defineEmits<{ pick: [url: string]; retry: [] }>();

const EXAMPLES = ["https://github.com/expressjs/express", "https://github.com/vuejs/core"];
</script>

<template>
  <section
    v-if="kind === 'empty'"
    class="surface-light min-w-0 rounded-card p-6 sm:p-8"
    aria-labelledby="empty-title"
    data-testid="empty-state"
  >
    <ShieldCheck class="size-10 text-logo" aria-hidden="true" />
    <h2 id="empty-title" class="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">Seu código feito com IA está seguro?</h2>
    <p class="mt-2 max-w-2xl text-muted">
      O VibeShield baixa um repositório público do GitHub e procura em segundos: segredos vazados (chaves de API,
      tokens), caracteres Unicode invisíveis usados em ataques, dependências inventadas por IA (slopsquatting) e
      padrões de código inseguro. Cada achado vem com um prompt pronto para você colar no seu assistente de IA.
    </p>
    <p class="mt-5 text-sm font-medium">Experimente com um destes:</p>
    <ul class="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <li v-for="ex in EXAMPLES" :key="ex">
        <button
          type="button"
          data-testid="example-repo"
          class="inline-flex min-h-11 max-w-full cursor-pointer items-center gap-2 rounded-full bg-subtle px-4 font-mono text-sm text-ink transition-colors duration-150 hover:bg-ink/10"
          @click="emit('pick', ex)"
        >
          <span class="truncate">{{ ex.replace("https://github.com/", "") }}</span>
          <ArrowRight class="size-4 shrink-0" aria-hidden="true" />
          <span class="sr-only">escanear este repositório de exemplo</span>
        </button>
      </li>
    </ul>
  </section>

  <section
    v-else
    class="surface-dark min-w-0 rounded-card p-6 sm:p-8"
    role="alert"
    aria-labelledby="error-title"
    data-testid="error-state"
  >
    <TriangleAlert class="size-9 text-sev-critical-dark" aria-hidden="true" />
    <h2 id="error-title" class="mt-3 text-2xl font-bold tracking-tight">Não deu para escanear</h2>
    <p class="mt-2 max-w-2xl text-ink-dark" data-testid="error-message">{{ message }}</p>
    <p v-if="code" class="mt-1 font-mono text-xs text-muted-dark">código: {{ code }}</p>
    <button
      type="button"
      data-testid="retry"
      class="mt-5 inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-full bg-cta px-6 font-semibold text-on-cta transition-transform duration-150 hover:scale-[1.02]"
      @click="emit('retry')"
    >
      <RefreshCw class="size-5" aria-hidden="true" />
      Tentar de novo
    </button>
  </section>
</template>
