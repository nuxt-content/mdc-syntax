---
title: Vue
description: A minimal example showing how to use MDC Syntax with Vue 3 and Vite.
icon: i-logos-vue
---

::code-tree{defaultValue="src/App.vue" expandAll}

```ts [src/main.ts]
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

```vue [src/App.vue]
<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
</script>

<template>
  <MDC markdown="# Hello *World*" />
</template>
```

```ts [vite.config.ts]
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
```

```json [package.json]
{
  "name": "mdc-syntax-vue-example",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "mdc-syntax": "workspace:*",
    "vue": "^3.5.27"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.4",
    "typescript": "^5.9.3",
    "vite": "^7.3.1",
    "vue-tsc": "^3.2.4"
  }
}
```

```html [index.html]
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MDC Syntax - Vue Example</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

```json [tsconfig.json]
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

::


This example demonstrates the simplest way to use MDC Syntax with Vue 3 - use the `h()` render function with the `MDC` component and pass it markdown content. The component handles parsing and rendering automatically.
