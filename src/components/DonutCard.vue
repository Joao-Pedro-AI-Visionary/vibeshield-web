<script setup lang="ts">
import { computed } from "vue";
import type { ScanSummary } from "../api/types";
import { categorySegments } from "../lib/stats";
import { CATEGORY_BG, CATEGORY_LABEL, CATEGORY_STROKE } from "../lib/labels";

const props = defineProps<{ summary: ScanSummary }>();

const R = 40;
const C = 2 * Math.PI * R;
const data = computed(() => categorySegments(props.summary.by_category));
const arcs = computed(() => {
  const visible = data.value.segments.filter((s) => s.count > 0);
  const gap = visible.length > 1 ? 1.5 : 0;
  return visible.map((s) => ({
    category: s.category,
    dash: `${Math.max(s.fraction * C - gap, 0.5)} ${C}`,
    offset: -s.offset * C,
  }));
});
const label = computed(
  () =>
    "Achados por categoria: " +
    data.value.segments.map((s) => `${CATEGORY_LABEL[s.category]} ${s.count}`).join(", ") +
    `. Total ${data.value.total}.`,
);
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });
</script>

<template>
  <section class="surface-light min-w-0 rounded-card p-5 sm:p-6" aria-labelledby="donut-title">
    <h2 id="donut-title" class="text-xl font-semibold tracking-tight">Por categoria</h2>
    <div class="mt-4 flex flex-col items-center gap-5 sm:flex-row">
      <div class="relative size-40 shrink-0">
        <svg viewBox="0 0 100 100" class="size-full -rotate-90" role="img" :aria-label="label">
          <circle cx="50" cy="50" :r="R" fill="none" class="stroke-subtle" stroke-width="12" />
          <circle
            v-for="a in arcs"
            :key="a.category"
            cx="50"
            cy="50"
            :r="R"
            fill="none"
            stroke-width="12"
            :class="CATEGORY_STROKE[a.category]"
            :stroke-dasharray="a.dash"
            :stroke-dashoffset="a.offset"
          />
        </svg>
        <div class="absolute inset-0 grid place-items-center text-center" aria-hidden="true">
          <div>
            <p class="text-3xl font-bold tabular-nums">{{ data.total }}</p>
            <p class="text-xs text-muted">achados</p>
          </div>
        </div>
      </div>
      <ul class="w-full space-y-2" aria-label="Legenda por categoria">
        <li v-for="s in data.segments" :key="s.category" class="flex items-center justify-between gap-3 text-sm">
          <span class="flex items-center gap-2">
            <span class="size-3 shrink-0 rounded-full" :class="CATEGORY_BG[s.category]" aria-hidden="true" />
            {{ CATEGORY_LABEL[s.category] }}
          </span>
          <span class="text-muted tabular-nums">
            <span class="font-semibold text-ink">{{ s.count }}</span> · {{ percent.format(s.fraction) }}
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>
