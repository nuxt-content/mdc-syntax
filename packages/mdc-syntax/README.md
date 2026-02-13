# MDC Syntax

A high-performance markdown parser with MDC (Markdown Components) support.

[![npm version](https://img.shields.io/npm/v/mdc-syntax)](https://www.npmjs.com/package/mdc-syntax)

## Features

- 🚀 Fast markdown-it based parser
- 📦 Stream API with both buffered and incremental modes
- ⚡ Incremental parsing for real-time UI updates
- 🔧 MDC component syntax support
- 🔒 Auto-close unclosed markdown syntax (perfect for streaming)
- 📝 Frontmatter parsing (YAML)
- 📑 Automatic table of contents generation
- 🎯 Full TypeScript support
- 📊 Progress tracking built-in for streams

## Installation

```bash
npm install mdc-syntax
# or
pnpm add mdc-syntax
```

Then, update your Tailwind `main.css` to include the following so that Tailwind can detect the utility classes used by MDC.

```css
@source "../node_modules/mdc-syntax/dist/*.mjs";
```

The path must be relative from your CSS file to the node_modules folder containing mdc-syntax.


## Usage

### Vue

```vue
<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import cjkPlugin from '@mdc-syntax/cjk'
import mathPlugin from '@mdc-syntax/math'
import { Math } from '@mdc-syntax/math/vue'

const chatMessage = ...
</script>

<template>
  <MDC :markdown="chatMessage" :components="{ Math }" :options="{ plugins: [cjkPlugin, mathPlugin] }" />
</template>
```

### React

```tsx
import { MDC } from 'mdc-syntax/react'
import cjkPlugin from '@mdc-syntax/cjk'
import mathPlugin from '@mdc-syntax/math'
import { Math } from '@mdc-syntax/math/react'

function App() {
  const chatMessage = ...
  return <MDC markdown={chatMessage} components={{ Math }} options={{ plugins: [cjkPlugin, mathPlugin] }} />
}
```


## License

MIT
