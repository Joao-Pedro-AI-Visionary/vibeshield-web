<script setup lang="ts">
import { CATEGORIES } from "../api/types";
import { CATEGORY_LABEL, RULES } from "../lib/labels";
import SeverityBadge from "../components/SeverityBadge.vue";
</script>

<template>
  <div class="space-y-3">
    <section class="surface-hero rounded-card p-6 sm:p-8" aria-labelledby="method-title">
      <h1 id="method-title" class="text-3xl font-bold tracking-tight sm:text-4xl">Metodologia</h1>
      <p class="mt-2 max-w-3xl text-on-hero-muted">
        O scanner lê os arquivos de texto do repositório (respeitando o .gitignore e pulando node_modules, dist, build,
        vendor, target, binários e arquivos grandes) e aplica dez regras. Cada achado tem severidade e um prompt de
        correção.
      </p>
    </section>

    <div class="grid gap-3 md:grid-cols-2">
      <section class="surface-light rounded-card p-6" aria-labelledby="score-calc-title">
        <h2 id="score-calc-title" class="text-xl font-semibold">Como o score é calculado</h2>
        <p class="mt-2 text-muted">
          Score = máximo entre 0 e (100 − soma dos pesos). Pesos: Crítica 25, Alta 10, Média 4, Baixa 1.
        </p>
        <ul class="mt-3 grid grid-cols-5 gap-2 text-center text-sm" aria-label="Faixas de nota">
          <li class="rounded-xl bg-subtle p-2"><b class="block text-lg">A</b>≥ 90</li>
          <li class="rounded-xl bg-subtle p-2"><b class="block text-lg">B</b>≥ 80</li>
          <li class="rounded-xl bg-subtle p-2"><b class="block text-lg">C</b>≥ 70</li>
          <li class="rounded-xl bg-subtle p-2"><b class="block text-lg">D</b>≥ 50</li>
          <li class="rounded-xl bg-subtle p-2"><b class="block text-lg">F</b>&lt; 50</li>
        </ul>
      </section>
      <section class="surface-dark rounded-card p-6" aria-labelledby="privacy-title">
        <h2 id="privacy-title" class="text-xl font-semibold">Limites e privacidade</h2>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-muted-dark">
          <li>Só repositórios públicos do GitHub.</li>
          <li>Segredos aparecem mascarados (no máximo 4 caracteres de cada ponta).</li>
          <li>No máximo 500 achados por scan, dos mais graves para os mais leves.</li>
          <li>O histórico fica só no seu navegador (localStorage), com os 10 últimos scans.</li>
        </ul>
      </section>
    </div>

    <section
      v-for="cat in CATEGORIES"
      :key="cat"
      class="surface-light rounded-card p-6"
      :aria-labelledby="`cat-${cat}`"
    >
      <h2 :id="`cat-${cat}`" class="text-xl font-semibold">{{ CATEGORY_LABEL[cat] }}</h2>
      <dl class="mt-3 space-y-4">
        <div
          v-for="rule in RULES.filter((r) => r.category === cat)"
          :key="rule.rule_id"
          class="rounded-2xl border border-ink/10 p-4"
          data-testid="rule"
        >
          <dt class="flex flex-wrap items-center gap-2">
            <code class="rounded-lg bg-subtle px-2 py-0.5 font-mono text-sm">{{ rule.rule_id }}</code>
            <SeverityBadge :severity="rule.severity" />
            <span class="font-semibold">{{ rule.title }}</span>
          </dt>
          <dd class="mt-2 text-sm text-muted"><b class="text-ink">O que detecta:</b> {{ rule.what }}</dd>
          <dd class="mt-1 text-sm text-muted"><b class="text-ink">Por que importa:</b> {{ rule.why }}</dd>
        </div>
      </dl>
    </section>
  </div>
</template>
