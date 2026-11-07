<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ShieldCheck, Trash2 } from "@lucide/vue";
import type { ScanRequest, ScanResult } from "./api/types";
import { useScan } from "./composables/useScan";
import { clearHistory } from "./lib/history";
import NavRail from "./components/NavRail.vue";
import type { View } from "./components/NavRail.vue";
import ScanForm from "./components/ScanForm.vue";
import HeroScore from "./components/HeroScore.vue";
import FindingsCard from "./components/FindingsCard.vue";
import DonutCard from "./components/DonutCard.vue";
import CopyAllCard from "./components/CopyAllCard.vue";
import MetricsCard from "./components/MetricsCard.vue";
import HistoryList from "./components/HistoryList.vue";
import SkeletonBento from "./components/SkeletonBento.vue";
import StateCards from "./components/StateCards.vue";
import MethodologyView from "./views/MethodologyView.vue";

const { status, result, errorMessage, errorCode, history, run, retry, show } = useScan();

const url = ref("");
const checkDeps = ref(true);
const view = ref<View>(parseHash());
const mainEl = ref<HTMLElement | null>(null);

function parseHash(): View {
  const h = typeof window === "undefined" ? "" : window.location.hash.replace(/^#\/?/, "");
  return h === "historico" || h === "metodologia" ? h : "scan";
}

async function onHashChange() {
  view.value = parseHash();
  await nextTick();
  window.scrollTo({ top: 0 });
  mainEl.value?.focus({ preventScroll: true });
}

onMounted(() => window.addEventListener("hashchange", onHashChange));
onBeforeUnmount(() => window.removeEventListener("hashchange", onHashChange));

function scan(req: ScanRequest) {
  void run(req);
}

function pickExample(example: string) {
  url.value = example;
  scan({ repo_url: example, check_dependencies: checkDeps.value });
}

function openSaved(saved: ScanResult) {
  show(saved);
  url.value = saved.repo.url;
  if (view.value !== "scan") window.location.hash = "#/scan";
}

function wipeHistory() {
  clearHistory();
  history.value = [];
}

const activeId = computed(() => result.value?.scan_id ?? null);
</script>

<template>
  <div class="min-h-dvh bg-shell p-3 pb-28 md:flex md:gap-4 md:p-4">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-cta focus:px-4 focus:py-3 focus:text-on-cta"
      >Pular para o conteúdo</a
    >
    <NavRail :current="view" />

    <main id="conteudo" ref="mainEl" tabindex="-1" class="min-w-0 flex-1 space-y-3 focus:outline-none md:space-y-4">
      <template v-if="view === 'scan'">
        <header class="grid gap-3 xl:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] xl:items-center">
          <div class="flex items-center gap-3 px-1">
            <span class="grid size-11 shrink-0 place-items-center rounded-full bg-logo md:hidden" aria-hidden="true">
              <ShieldCheck class="size-6 text-on-hero" />
            </span>
            <div>
              <h1 class="text-2xl font-bold tracking-tight text-ink-dark sm:text-3xl">VibeShield</h1>
              <p class="text-sm text-muted-dark">Scanner de segurança para código gerado com IA</p>
            </div>
          </div>
          <ScanForm
            v-model:url="url"
            v-model:check-deps="checkDeps"
            :loading="status === 'loading'"
            @submit="scan"
          />
        </header>

        <SkeletonBento v-if="status === 'loading'" />

        <div v-else-if="status === 'success' && result" class="bento" data-testid="result">
          <HeroScore class="area-hero" :result="result" />
          <FindingsCard :key="result.scan_id" class="area-findings" :findings="result.findings" :summary="result.summary" :truncated="result.truncated" />
          <DonutCard class="area-donut" :summary="result.summary" />
          <CopyAllCard class="area-cta" :findings="result.findings" />
          <MetricsCard class="area-metrics" :result="result" />
          <section class="area-history surface-dark min-w-0 rounded-card p-5 sm:p-6" aria-labelledby="recent-title">
            <h2 id="recent-title" class="mb-4 text-xl font-semibold tracking-tight">Scans recentes</h2>
            <HistoryList :entries="history" :active-id="activeId" :limit="4" @select="openSaved" />
          </section>
        </div>

        <template v-else>
          <StateCards
            v-if="status === 'error'"
            kind="error"
            :message="errorMessage"
            :code="errorCode"
            @retry="retry"
          />
          <StateCards v-else kind="empty" @pick="pickExample" />
          <section v-if="history.length > 0" class="surface-dark rounded-card p-5 sm:p-6" aria-labelledby="recent-title-2">
            <h2 id="recent-title-2" class="mb-4 text-xl font-semibold tracking-tight">Scans recentes</h2>
            <HistoryList :entries="history" :active-id="activeId" :limit="4" @select="openSaved" />
          </section>
        </template>
      </template>

      <section v-else-if="view === 'historico'" class="surface-dark rounded-card p-5 sm:p-8" aria-labelledby="history-title">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 id="history-title" class="text-3xl font-bold tracking-tight">Histórico</h1>
            <p class="text-sm text-muted-dark">Últimos 10 scans, salvos só neste navegador. Clique para reabrir.</p>
          </div>
          <button
            v-if="history.length > 0"
            type="button"
            class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-line-dark px-4 text-sm font-medium transition-colors duration-150 hover:bg-ink-dark/5"
            @click="wipeHistory"
          >
            <Trash2 class="size-4" aria-hidden="true" />
            Limpar histórico
          </button>
        </div>
        <div class="mt-5">
          <HistoryList :entries="history" :active-id="activeId" @select="openSaved" />
        </div>
      </section>

      <MethodologyView v-else />
    </main>
  </div>
</template>
