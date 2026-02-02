<template>
  <!-- Hero Section -->
  <div class="">
    <!-- Background Pattern -->
    <div class="absolute z-[-1] inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

    <UPageHero>
      <template #title>
        <slot name="title" />
      </template>
      <template #description>
        <slot name="description" />
      </template>
      <template #links>
        <slot name="links" />
      </template>
    </UPageHero>
  </div>
</template>

<style scoped>
.bg-grid-slate-100 {
  background-image: linear-gradient(to right, rgb(241 245 249 / 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(241 245 249 / 0.2) 1px, transparent 1px);
  background-size: 4rem 4rem;
}

.dark .bg-grid-slate-700\/25 {
  background-image: linear-gradient(to right, rgb(51 65 85 / 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(51 65 85 / 0.25) 1px, transparent 1px);
  background-size: 4rem 4rem;
}
</style>
