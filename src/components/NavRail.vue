<script setup lang="ts">
import { BookOpen, Clock, ScanSearch, ShieldCheck } from "@lucide/vue";

export type View = "scan" | "historico" | "metodologia";
defineProps<{ current: View }>();

const ITEMS = [
  { id: "scan", label: "Scan", icon: ScanSearch },
  { id: "historico", label: "Histórico", icon: Clock },
  { id: "metodologia", label: "Metodologia", icon: BookOpen },
] as const;
</script>

<template>
  <nav
    aria-label="Navegação principal"
    class="fixed inset-x-0 bottom-0 z-20 border-t border-line-dark bg-rail pb-[env(safe-area-inset-bottom)] md:sticky md:top-4 md:bottom-auto md:flex md:h-[calc(100dvh-2rem)] md:w-20 md:flex-col md:items-center md:rounded-card md:border-0 md:py-5"
    style="--focus-ring: var(--color-ink-dark)"
  >
    <a
      href="#/scan"
      class="mb-8 hidden size-14 place-items-center rounded-full bg-logo text-on-hero md:grid"
      aria-label="VibeShield, ir para o scan"
    >
      <ShieldCheck class="size-7" aria-hidden="true" />
    </a>
    <ul class="grid grid-cols-3 md:flex md:flex-col md:gap-3">
      <li v-for="item in ITEMS" :key="item.id">
        <a
          :href="`#/${item.id}`"
          :data-testid="`nav-${item.id}`"
          :aria-current="current === item.id ? 'page' : undefined"
          class="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors duration-150 md:size-14 md:rounded-full"
          :class="current === item.id ? 'bg-card-dark text-ink-dark md:bg-ink-dark md:text-ink' : 'text-muted-dark hover:text-ink-dark md:hover:bg-card-dark'"
          :title="item.label"
        >
          <component :is="item.icon" class="size-6" aria-hidden="true" />
          <span class="md:sr-only">{{ item.label }}</span>
        </a>
      </li>
    </ul>
  </nav>
</template>
