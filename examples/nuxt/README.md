---
title: Nuxt
description: A minimal example showing how to use MDC Syntax with Nuxt 4.
---

::code-tree{defaultValue="app/app.vue" expandAll}

```vue [app/app.vue]
<template>
  <div>
    <MDC markdown="# Hello *World*" />
  </div>
</template>
```

```ts [nuxt.config.ts]
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['mdc-syntax/nuxt'],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
```

```json [package.json]
{
  "name": "mdc-syntax-nuxt",
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
    "nuxt": "^4.3.1",
    "vue": "^3.5.28",
    "mdc-syntax": "^1.0.0"
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


This example demonstrates the simplest way to use MDC Syntax with Nuxt - just add the `mdc-syntax/nuxt` module to your Nuxt config, and the `MDC` component will be automatically available in your templates. The module handles parsing and rendering automatically.
