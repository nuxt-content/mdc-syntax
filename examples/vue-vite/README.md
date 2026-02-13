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
import Alert from './components/Alert.vue'

const markdown = `
# Hello *World*

::alert{type="info"}
This is an alert!
::
`
</script>

<template>
  <Suspense>
    <MDC
      :markdown="markdown"
      :components="{ Alert }"
    />
  </Suspense>
</template>
```

```vue [src/components/Alert.vue]
<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'success' | 'danger'
}>(), {
  type: 'info',
})

const config = {
  info: 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/50 dark:border-blue-500/50 dark:text-blue-200',
  warning: 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/50 dark:border-amber-500/50 dark:text-amber-200',
  success: 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500/50 dark:text-emerald-200',
  danger: 'bg-red-50 border-red-400 text-red-900 dark:bg-red-950/50 dark:border-red-500/50 dark:text-red-200',
}
</script>

<template>
  <div
    :class="config[props.type]"
    class="my-4 rounded-lg border-l-4 px-4 py-3 text-sm leading-relaxed"
    role="alert"
  >
    <slot />
  </div>
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
    "mdc-syntax": "^1.0.0",
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
