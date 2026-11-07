<script setup lang="ts">
import { computed } from "vue";
import { CircleAlert, Info, OctagonAlert, TriangleAlert } from "@lucide/vue";
import type { Severity } from "../api/types";
import { SEVERITY_LABEL } from "../lib/labels";

const props = defineProps<{ severity: Severity }>();

const ICONS = { CRITICAL: OctagonAlert, HIGH: TriangleAlert, MEDIUM: CircleAlert, LOW: Info } as const;
const TONE: Record<Severity, string> = {
  CRITICAL: "text-sev-critical border-sev-critical",
  HIGH: "text-sev-high border-sev-high",
  MEDIUM: "text-sev-medium border-sev-medium",
  LOW: "text-sev-low border-sev-low",
};
const icon = computed(() => ICONS[props.severity]);
</script>

<template>
  <span
    class="inline-flex items-center gap-1 rounded-full border bg-card px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
    :class="TONE[severity]"
  >
    <component :is="icon" class="size-3.5" aria-hidden="true" />
    <span><span class="sr-only">Severidade </span>{{ SEVERITY_LABEL[severity] }}</span>
  </span>
</template>
