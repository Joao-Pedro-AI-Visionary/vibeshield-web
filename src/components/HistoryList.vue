<script setup lang="ts">
import type { ScanResult } from "../api/types";
import type { HistoryEntry } from "../lib/history";
import { formatDate } from "../lib/format";
import { GRADE_BAR_DARK } from "../lib/labels";

defineProps<{ entries: readonly HistoryEntry[]; activeId?: string | null; limit?: number }>();
const emit = defineEmits<{ select: [result: ScanResult] }>();
</script>

<template>
  <ul v-if="entries.length > 0" class="space-y-2" aria-label="Scans recentes">
    <li v-for="e in limit ? entries.slice(0, limit) : entries" :key="e.result.scan_id">
      <button
        type="button"
        data-testid="history-item"
        class="w-full min-h-11 cursor-pointer rounded-2xl border border-line-dark px-4 py-3 text-left transition-colors duration-150 hover:bg-ink-dark/5"
        :class="activeId === e.result.scan_id ? 'bg-ink-dark/10' : ''"
        :aria-current="activeId === e.result.scan_id ? 'true' : undefined"
        @click="emit('select', e.result)"
      >
        <span class="flex items-center justify-between gap-3">
          <span class="min-w-0 truncate font-medium">{{ e.result.repo.owner }}/{{ e.result.repo.name }}</span>
          <span class="shrink-0 text-sm tabular-nums">
            <span class="sr-only">Score </span>{{ e.result.score }}<span class="text-muted-dark"> · nota {{ e.result.grade }}</span>
          </span>
        </span>
        <span class="mt-2 block h-1.5 overflow-hidden rounded-full bg-line-dark" aria-hidden="true">
          <span class="block h-full rounded-full" :class="GRADE_BAR_DARK[e.result.grade]" :style="{ width: `${e.result.score}%` }" />
        </span>
        <span class="mt-1.5 block text-xs text-muted-dark">
          {{ formatDate(e.saved_at) }} · {{ e.result.findings.length }} achados
        </span>
      </button>
    </li>
  </ul>
  <p v-else class="text-sm text-muted-dark">
    Nenhum scan ainda. Os últimos 10 resultados ficam salvos só neste navegador.
  </p>
</template>
