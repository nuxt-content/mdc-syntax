# Comark: AI Agents & LLM Streaming

A guide for using Comark in AI agent and LLM-powered applications where markdown is generated incrementally by a language model.

## Why Comark for AI?

LLMs stream markdown token-by-token. Standard markdown parsers expect complete input. They fail or produce broken output on partial streams. Comark was built to handle exactly this:

- **`autoClose`** (default: `'streaming'`): incomplete syntax like `**bold text` is closed when you parse with `{ streaming: true }`, so partial tokens always render correctly. A plain parse leaves it as written; set `autoClose: true` to close on every parse
- **Streaming mode**: re-renders efficiently as content arrives
- **Caret indicator**: shows a live cursor during generation
- **ANSI rendering**: styled terminal output for CLI agents

---

## Vue

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Markdown } from '@comark/vue'

const content = ref('')
const streaming = ref(false)

async function generate(prompt: string) {
  content.value = ''
  streaming.value = true

  const res = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    content.value += decoder.decode(value, { stream: true })
  }

  streaming.value = false
}
</script>

<template>
  <Markdown :streaming="streaming" caret>{{ content }}</Markdown>
</template>
```

---

## React

```tsx
import { useState } from 'react'
import { Markdown } from '@comark/react'

export default function Chat() {
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)

  async function generate(prompt: string) {
    setContent('')
    setStreaming(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setContent(prev => prev + decoder.decode(value, { stream: true }))
    }

    setStreaming(false)
  }

  return <Markdown streaming={streaming} caret>{content}</Markdown>
}
```

---

## Svelte

```svelte
<script lang="ts">
  import { Markdown } from '@comark/svelte'

  let content = $state('')
  let streaming = $state(false)

  async function generate(prompt: string) {
    content = ''
    streaming = true

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      content += decoder.decode(value, { stream: true })
    }

    streaming = false
  }
</script>

<Markdown value={content} {streaming} caret />
```

---

## Angular

```typescript
import { Component } from '@angular/core'
import { Markdown } from '@comark/angular'

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [Markdown],
  template: `
    <comark-markdown
      [value]="content"
      [streaming]="streaming"
      [caret]="streaming"
    />
  `,
})
export class ChatComponent {
  content = ''
  streaming = false

  async generate(prompt: string) {
    this.content = ''
    this.streaming = true

    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      this.content += decoder.decode(value, { stream: true })
    }

    this.streaming = false
  }
}
```

---

## Terminal / CLI Agents

Use `@comark/ansi` to render LLM markdown output in terminal-based agents:

```typescript
import { printAnsi } from '@comark/ansi'

// Print a complete LLM response to stdout with ANSI styling
await printAnsi(llmResponse)
```

For repeated terminal output, use `createAnsiPrinter` with a custom `writer` function:

```typescript
import { createAnsiPrinter } from '@comark/ansi'

const writeMarkdown = createAnsiPrinter({
  writer: (output) => process.stdout.write(output),
})

await writeMarkdown(markdown)
```

---

## Caret Customization

The `caret` prop appends a blinking cursor to the last text node while `streaming` is `true`. Customize it with a CSS class:

```vue
<Markdown :streaming="streaming" :caret="{ class: 'animate-blink' }">{{ content }}</Markdown>
```

```tsx
<Markdown streaming={streaming} caret={{ class: 'animate-blink' }}>{content}</Markdown>
```

```svelte
<Markdown value={content} {streaming} caret={{ class: 'animate-blink' }} />
```

```html
<!-- Angular -->
<comark-markdown [value]="content" [streaming]="streaming" [caret]="{ class: 'animate-blink' }" />
```

---

## With Custom Components

If your LLM produces Comark component syntax (e.g., `::alert`), register components before streaming begins:

```vue
<script setup lang="ts">
import { Markdown } from '@comark/vue'
import Alert from './Alert.vue'
import CodeBlock from './CodeBlock.vue'
</script>

<template>
  <Markdown :components="{ alert: Alert, pre: CodeBlock }" :streaming="streaming" caret>
    {{ content }}
  </Markdown>
</template>
```

---

## With Syntax Highlighting

Syntax highlighting works during streaming: each re-parse will highlight newly completed code blocks:

```vue
<script setup lang="ts">
import { Markdown } from '@comark/vue'
import shiki from '@comark/vue/plugins/shiki'
import githubDark from '@shikijs/themes/github-dark'

const plugins = [shiki({ themes: { light: githubDark, dark: githubDark } })]
</script>

<template>
  <Suspense>
    <Markdown :plugins="plugins" :streaming="streaming" caret>{{ content }}</Markdown>
  </Suspense>
</template>
```

```tsx
import { Markdown } from '@comark/react'
import shiki from '@comark/react/plugins/shiki'
import githubDark from '@shikijs/themes/github-dark'

const plugins = [shiki({ themes: { light: githubDark, dark: githubDark } })]

export default function Chat({ content, streaming }) {
  return (
    <Markdown plugins={plugins} streaming={streaming} caret>
      {content}
    </Markdown>
  )
}
```

---

## defineMarkdownComponent for AI Chat

Pre-configure a Comark component for your AI chat UI once, then reuse it everywhere:

```typescript
// markdown.ts
import { defineMarkdownComponent } from '@comark/vue'
import shiki from '@comark/vue/plugins/shiki'
import math, { Math } from '@comark/vue/plugins/math'
import githubDark from '@shikijs/themes/github-dark'
import Alert from './components/Alert.vue'

export const ChatMarkdown = defineMarkdownComponent({
  name: 'ChatMarkdown',
  plugins: [
    math(),
    shiki({ themes: { light: githubDark, dark: githubDark } }),
  ],
  components: { Math, alert: Alert },
  autoClose: 'streaming',
})
```

```vue
<template>
  <ChatMarkdown :streaming="streaming" caret>{{ content }}</ChatMarkdown>
</template>
```

---

[← Back to Skills Guide](./SKILL.md)
