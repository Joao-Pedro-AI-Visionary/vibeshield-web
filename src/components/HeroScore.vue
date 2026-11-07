<script setup lang="ts">
import { computed } from "vue";
import { GitBranch } from "@lucide/vue";
import { SEVERITIES } from "../api/types";
import type { ScanResult } from "../api/types";
import { SEVERITY_LABEL } from "../lib/labels";

const props = defineProps<{ result: ScanResult }>();

const bars = computed(() => {
  const by = props.result.summary.by_severity;
  const max = Math.max(1, ...SEVERITIES.map((s) => by[s] ?? 0));
  return SEVERITIES.map((s) => ({ severity: s, count: by[s] ?? 0, pct: Math.round(((by[s] ?? 0) / max) * 100) }));
});
const total = computed(() => bars.value.reduce((n, b) => n + b.count, 0));
</script>

<template>
  <section class="surface-hero relative min-w-0 overflow-hidden rounded-card p-5 sm:p-6" aria-labelledby="score-title" data-testid="hero">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 id="score-title" class="text-lg font-semibold">Security Score</h2>
        <a
          :href="result.repo.url"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-1 inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full text-sm text-on-hero-muted underline-offset-4 hover:underline"
        >
          <GitBranch class="size-4 shrink-0" aria-hidden="true" />
          <span class="truncate" data-testid="repo-name">{{ result.repo.owner }}/{{ result.repo.name }}</span>
          <span class="sr-only">(abre o repositório no GitHub em nova aba)</span>
        </a>
      </div>
      <p
        class="grid size-14 shrink-0 place-items-center rounded-full bg-on-hero text-2xl font-bold text-hero-from"
        data-testid="grade"
      >
        <span class="sr-only">Nota </span>{{ result.grade }}
      </p>
    </div>

    <p class="mt-4 flex items-baseline gap-1.5">
      <span class="text-6xl font-bold tracking-tight tabular-nums sm:text-7xl" data-testid="score">{{ result.score }}</span>
      <span class="text-lg text-on-hero-muted">/ 100</span>
    </p>

    <div class="mt-5">
      <p class="text-sm text-on-hero-muted">{{ total }} {{ total === 1 ? "achado" : "achados" }} por severidade</p>
      <ul class="mt-2 grid grid-cols-4 items-end gap-3" aria-label="Achados por severidade">
        <li v-for="b in bars" :key="b.severity" class="flex flex-col items-stretch gap-1">
          <span class="text-center text-sm font-semibold tabular-nums">{{ b.count }}</span>
          <span class="flex h-16 items-end rounded-lg bg-on-hero/15" aria-hidden="true">
            <span
              class="block w-full rounded-lg bg-on-hero transition-[height] duration-200"
              :style="{ height: `${Math.max(b.pct, b.count > 0 ? 8 : 0)}%` }"
            />
          </span>
          <span class="text-center text-xs text-on-hero-muted">{{ SEVERITY_LABEL[b.severity] }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>
