<template>
  <div class="bento" aria-busy="true" data-testid="loading-state">
    <p class="sr-only" role="status">Escaneando o repositório. Isso pode levar até um minuto.</p>
    <div class="area-hero surface-hero min-h-64 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-5 w-32" />
      <div class="skeleton mt-6 h-16 w-40" />
      <div class="mt-6 grid grid-cols-4 gap-3">
        <div v-for="i in 4" :key="i" class="skeleton h-16" />
      </div>
    </div>
    <div class="area-findings surface-light min-h-96 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-6 w-28" />
      <div class="mt-4 flex gap-2">
        <div v-for="i in 4" :key="i" class="skeleton h-10 w-24 rounded-full" />
      </div>
      <div v-for="i in 3" :key="i" class="skeleton mt-4 h-28" />
    </div>
    <div class="area-donut surface-light min-h-56 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-6 w-36" />
      <div class="skeleton mt-4 size-36 rounded-full" />
    </div>
    <div class="area-cta surface-hero min-h-48 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-8 w-48" />
      <div class="skeleton mt-10 h-12 rounded-full" />
    </div>
    <div class="area-metrics surface-light min-h-48 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-6 w-40" />
      <div class="mt-4 grid grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="skeleton h-12" />
      </div>
    </div>
    <div class="area-history surface-dark min-h-48 rounded-card p-6" aria-hidden="true">
      <div class="skeleton h-6 w-36" />
      <div v-for="i in 3" :key="i" class="skeleton mt-3 h-12" />
    </div>
  </div>
</template>
