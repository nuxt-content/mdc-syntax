---
title: Nuxt UI
description: A minimal example showing how to use MDC Syntax with Nuxt UI.
---

::code-tree{defaultValue="app/app.vue" expandAll}

```vue [app/app.vue]
<script setup lang="ts">
const markdown = `
# MDC + Nuxt UI

MDC Syntax automatically detects Nuxt UI and uses its components for rendering.
`
</script>
<template>
  <MDC :markdown="markdown" />
</template>
```

```ts [nuxt.config.ts]
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['mdc-syntax/nuxt', '@nuxt/ui'],
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: true }
})
```

```css [app/assets/css/main.css]
@import "tailwindcss";
@import "@nuxt/ui";
```

```json [package.json]
{
  "name": "mdc-syntax-nuxt-ui",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "@nuxt/ui": "^4.4.0",
    "mdc-syntax": "^1.0.0",
    "nuxt": "^4.3.1",
    "tailwindcss": "^4.1.18"
  }
}
```

```json [tsconfig.json]
{
  // https://nuxt.com/docs/guide/concepts/typescript
  "files": [],
  "references": [
    {
      "path": "./.nuxt/tsconfig.app.json"
    },
    {
      "path": "./.nuxt/tsconfig.server.json"
    },
    {
      "path": "./.nuxt/tsconfig.shared.json"
    },
    {
      "path": "./.nuxt/tsconfig.node.json"
    }
  ]
}
```

::


This example demonstrates how to use MDC Syntax with Nuxt UI. MDC Syntax automatically detects when Nuxt UI is installed and uses its components for rendering. Simply add both `mdc-syntax/nuxt` and `@nuxt/ui` modules to your Nuxt config, and the `MDC` component will use Nuxt UI components automatically.
