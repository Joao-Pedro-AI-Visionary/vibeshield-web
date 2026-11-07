<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { Check, ClipboardCopy } from "@lucide/vue";
import type { Finding } from "../api/types";
import { copyText, joinFixPrompts } from "../lib/prompts";

const props = defineProps<{ findings: readonly Finding[] }>();
const status = ref("");
const copied = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

async function copyAll() {
  const ok = await copyText(joinFixPrompts(props.findings));
  copied.value = ok;
  status.value = ok ? `Copiado: ${props.findings.length} prompts de correção` : "Não foi possível copiar. Tente de novo.";
  clearTimeout(timer);
  timer = setTimeout(() => (copied.value = false), 2000);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <section class="surface-hero flex min-w-0 flex-col justify-between gap-6 rounded-card p-5 sm:p-6" aria-labelledby="cta-title">
    <div>
      <h2 id="cta-title" class="text-2xl leading-tight font-bold tracking-tight sm:text-3xl">Corrija tudo de uma vez</h2>
      <p class="mt-2 text-sm text-on-hero-muted">
        Junte os prompts de correção e cole no seu assistente de IA (Claude, Copilot, Cursor).
      </p>
    </div>
    <div>
      <button
        type="button"
        data-testid="copy-all"
        class="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-cta px-6 text-base font-semibold text-on-cta transition-transform duration-150 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        :disabled="findings.length === 0"
        @click="copyAll"
      >
        <component :is="copied ? Check : ClipboardCopy" class="size-5" aria-hidden="true" />
        {{ copied ? "Copiado" : "Copiar todos os prompts" }}
      </button>
      <p v-if="findings.length === 0" class="mt-2 text-sm text-on-hero-muted">Nada para corrigir neste scan.</p>
      <p class="sr-only" aria-live="polite" role="status">{{ status }}</p>
    </div>
  </section>
</template>
