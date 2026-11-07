<script setup lang="ts">
import { FileX, Files, HardDrive, Scissors, Timer } from "@lucide/vue";
import type { ScanResult } from "../api/types";
import { formatBytes, formatDuration, formatInt } from "../lib/format";

defineProps<{ result: ScanResult }>();
</script>

<template>
  <section class="surface-light min-w-0 rounded-card p-5 sm:p-6" aria-labelledby="metrics-title">
    <h2 id="metrics-title" class="text-xl font-semibold tracking-tight">Métricas do scan</h2>
    <dl class="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
      <div>
        <dt class="flex items-center gap-1.5 text-sm text-muted"><Files class="size-4" aria-hidden="true" />Arquivos varridos</dt>
        <dd class="text-2xl font-bold tabular-nums">{{ formatInt(result.files_scanned) }}</dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-sm text-muted"><FileX class="size-4" aria-hidden="true" />Pulados</dt>
        <dd class="text-2xl font-bold tabular-nums">{{ formatInt(result.files_skipped) }}</dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-sm text-muted"><HardDrive class="size-4" aria-hidden="true" />Baixados</dt>
        <dd class="text-2xl font-bold tabular-nums" data-testid="bytes">{{ formatBytes(result.bytes_downloaded) }}</dd>
      </div>
      <div>
        <dt class="flex items-center gap-1.5 text-sm text-muted"><Timer class="size-4" aria-hidden="true" />Duração</dt>
        <dd class="text-2xl font-bold tabular-nums">{{ formatDuration(result.duration_ms) }}</dd>
      </div>
      <div class="col-span-2">
        <dt class="flex items-center gap-1.5 text-sm text-muted"><Scissors class="size-4" aria-hidden="true" />Truncado</dt>
        <dd class="font-semibold">
          {{ result.truncated ? "Sim: só os 500 achados mais graves aparecem" : "Não: todos os achados aparecem" }}
        </dd>
      </div>
    </dl>
  </section>
</template>
