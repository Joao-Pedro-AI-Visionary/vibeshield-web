<script setup lang="ts">
import { ref } from "vue";
import { Loader, ScanSearch } from "@lucide/vue";
import { validateRepoUrl } from "../api/client";
import type { ScanRequest } from "../api/types";

defineProps<{ loading: boolean }>();
const emit = defineEmits<{ submit: [req: ScanRequest] }>();

const url = defineModel<string>("url", { default: "" });
const checkDeps = defineModel<boolean>("checkDeps", { default: true });
const error = ref("");
const input = ref<HTMLInputElement | null>(null);

function submit() {
  const value = url.value.trim();
  url.value = value;
  const problem = validateRepoUrl(value);
  error.value = problem ?? "";
  if (problem) {
    input.value?.focus();
    return;
  }
  emit("submit", { repo_url: value, check_dependencies: checkDeps.value });
}

defineExpose({ submit });
</script>

<template>
  <form
    class="surface-light min-w-0 rounded-card p-3 sm:p-4"
    role="search"
    aria-label="Escanear repositório"
    novalidate
    @submit.prevent="submit"
  >
    <label for="repo-url" class="block px-3 text-sm font-medium text-ink">URL do repositório GitHub</label>
    <div class="mt-1.5 flex flex-col gap-2 md:flex-row md:items-center">
      <div
        class="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-full bg-subtle px-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink"
        :class="error ? 'outline-2 outline-sev-critical' : ''"
      >
        <ScanSearch class="size-5 shrink-0 text-muted" aria-hidden="true" />
        <input
          id="repo-url"
          ref="input"
          v-model="url"
          type="url"
          inputmode="url"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="https://github.com/dono/repo"
          class="min-h-12 w-full min-w-0 bg-transparent text-base text-ink placeholder:text-muted focus:outline-none"
          :aria-invalid="error ? 'true' : 'false'"
          :aria-describedby="error ? 'repo-url-error' : 'repo-url-hint'"
          @input="error = ''"
        />
      </div>
      <label class="flex min-h-11 cursor-pointer items-center gap-3 rounded-full px-3 text-sm text-ink select-none">
        <input
          v-model="checkDeps"
          type="checkbox"
          role="switch"
          class="peer sr-only"
          data-testid="check-deps"
        />
        <span
          class="relative inline-block h-7 w-12 shrink-0 rounded-full bg-muted transition-colors duration-150 peer-checked:bg-ok peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink after:absolute after:top-1 after:left-1 after:size-5 after:rounded-full after:bg-card after:transition-transform after:duration-150 peer-checked:after:translate-x-5"
          aria-hidden="true"
        />
        Checar dependências (npm/PyPI)
      </label>
      <button
        type="submit"
        data-testid="scan-button"
        class="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 font-semibold text-card transition-opacity duration-150 hover:opacity-90 disabled:cursor-progress disabled:opacity-70"
        :disabled="loading"
      >
        <Loader v-if="loading" class="size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {{ loading ? "Escaneando…" : "Escanear" }}
      </button>
    </div>
    <p v-if="error" id="repo-url-error" class="mt-2 px-3 text-sm font-medium text-sev-critical" role="alert">{{ error }}</p>
    <p v-else id="repo-url-hint" class="mt-2 px-3 text-xs text-muted">Só repositórios públicos. Nada é clonado no seu computador.</p>
  </form>
</template>
