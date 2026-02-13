<script setup lang="ts">
const markdown = `
# MDC + Nuxt UI

MDC Syntax automatically detects Nuxt UI and uses its components for rendering.
`
</script>

<template>
  <MDC :markdown="markdown" />
</template>
