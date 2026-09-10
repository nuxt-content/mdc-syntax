---
title: Rangi (Highlight)
description: Lightweight syntax highlighting for code blocks using rangi.
seo:
  title: Syntax Highlighting using Rangi
navigation:
  icon: i-lucide-zap
links:
  - label: Parse API
    icon: i-lucide-file-code
    to: /reference/parse
    color: neutral
    variant: soft
  - label: Shiki
    icon: i-lucide-code
    to: /plugins/built-in/shiki
    color: neutral
    variant: soft
  - label: rangi
    icon: i-simple-icons-github
    to: https://github.com/pi0/rangi
    color: neutral
    variant: soft
---

The `comark/plugins/rangi` plugin highlights code blocks with [`rangi`](https://github.com/pi0/rangi) — a tiny, zero-dependency, fully synchronous highlighter (~13kB with all languages, or ~1.5kB core). Prefer this when bundle size and cold-start matter more than TextMate grammar depth.

`rangi` is a peer dependency:

```bash [terminal]
npm install rangi
```

::tip
Use [`comark/plugins/shiki`](/plugins/built-in/shiki) when you need transformers, Twoslash, or the full VS Code grammar set. Use `rangi` for a faster, smaller highlighter with built-in light/dark themes.
::

Inline code highlighting with `{lang="…"}` is currently shiki only. Rangi highlights fenced blocks.

## Usage

```typescript
import { parseMarkdown } from 'comark'
import rangi from 'comark/plugins/rangi'

const result = await parseMarkdown(content, {
  plugins: [rangi()]
})
```

With framework components:

::code-group

```vue [Vue]
<script setup lang="ts">
import { Markdown } from '@comark/vue'
import rangi from '@comark/vue/plugins/rangi'
import { github } from 'rangi/themes'
</script>

<template>
  <Suspense>
    <Markdown :plugins="[rangi({ theme: github })]">{{ content }}</Markdown>
  </Suspense>
</template>
```

```tsx [React]
import { Markdown } from '@comark/react'
import rangi from '@comark/react/plugins/rangi'
import { github } from 'rangi/themes'

<Markdown plugins={[rangi({ theme: github })]}>
  {content}
</Markdown>
```

```svelte [Svelte]
<script>
  import { Markdown } from '@comark/svelte'
  import rangi from '@comark/svelte/plugins/rangi'
  import { github } from 'rangi/themes'
  let { content } = $props()
</script>

<Markdown value={content} plugins={[rangi({ theme: github })]} />
```

::

---

## Features

### Inline theme colors

Tokens get **inline colors** — no stylesheet required. Pass a single theme or a `{ light, dark }` pair from `rangi/themes` (defaults to rangi's built-in light/dark pair):

```typescript
import { githubDark, githubLight, github } from 'rangi/themes'

// single theme
rangi({ theme: githubDark })

// light/dark pair (ready-made)
rangi({ theme: github })

// or explicit pair — also emits --shiki-dark* vars for class-based dark toggles
rangi({ theme: { light: githubLight, dark: githubDark } })
```

### Comark language

Comark ships its own rangi grammar, registered automatically for the `comark`, `mdc`, `md` and `markdown` fence languages. It is built on [rangi's official markdown grammar](https://github.com/pi0/rangi/blob/main/src/languages/md.ts) and adds the Comark syntax on top:

````comark
---
title: Frontmatter is highlighted as YAML
---

# Heading{#slug .lead}

::alert{type="warning" .rounded}
A :icon{name="lucide:check"} inline component, a [span]{.accent},
and a {{ user.name || Anonymous }} binding.

#footer
Named slot body
::
````

The grammar also has a dedicated entry when you want Comark highlighting with rangi without importing the plugin runtime:

```typescript
import { tokenize } from 'rangi'
import { comarkLanguages } from 'comark/plugins/rangi/language-comark'

const tokens = tokenize(source, {
  lang: 'comark',
  languages: comarkLanguages
})
```

`comark/plugins/rangi/language-comark` contains only the rangi grammar and does not import Shiki. Its default export is the individual `comarkLanguage` definition; `comarkLanguages` maps it to all four supported aliases.

### Language aliases

Rangi ships aliases built-in (`javascript`→`js`, `typescript`→`ts`, `python`→`py`, `yml`→`yaml`, …). Comark passes the fence info string straight through. Unknown languages fall back to plain text (no throw).

### Line highlighting

Fence info `{2-3,5}` wraps the code in line spans and marks the selected lines with the `.highlight` class — same as the Shiki plugin. No `lineNumbers` option is required.

### Pre styles

Set `preStyles: true` to add inline background and foreground colors to `<pre>` elements based on the active theme.

---

## API

### `rangi(options?)`

Returns a `ComarkPlugin` that enables rangi syntax highlighting.

---

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| [`theme`](#theme) | `ShjTheme \| { light, dark }` | rangi default pair | Inline colors |
| [`lineNumbers`](#linenumbers) | `boolean` | `false` | Always wrap each line in `<span class="line">` |
| [`classPrefix`](#classprefix) | `string` | `'shj'` | Class prefix on the highlighted `<pre>` |
| [`languages`](#languages) | `Record<string, grammar>` | — | Extra custom grammars, merged over the Comark ones |
| [`preStyles`](#prestyles) | `boolean` | `false` | Add inline background/foreground styles to `<pre>` |

### `theme`

```typescript
import { github, atomDark, geist } from 'rangi/themes'

rangi({ theme: github })
rangi({ theme: atomDark })
rangi({ theme: geist }) // light/dark pair
```

Or a plain object:

```typescript
rangi({
  theme: {
    name: 'mine',
    scheme: 'dark',
    bg: '#0d1117',
    fg: '#e6edf3',
    tokens: {
      kwd: '#ff7b72',
      str: '#a5d6ff',
      cmnt: '#8b949e',
      num: '#79c0ff',
      func: '#d2a8ff',
    },
  },
})
```

### `lineNumbers`

When `true`, each source line is always wrapped in `<span class="line">` so CSS gutters can number them. Highlight metadata such as `{1,3-5}` enables line wrappers automatically, even when this option is `false`:

```typescript
rangi({ lineNumbers: true })
```

**Default:** `false`

### `classPrefix`

```typescript
rangi({ classPrefix: 'code' })
// → class="code shiki shj-lang-js"
```

### `languages`

Pass custom grammars through to rangi (see [rangi docs](https://github.com/pi0/rangi)). They are merged over the built-in [Comark grammar](#comark-language), so a key such as `md` overrides it:

```typescript
rangi({ languages: { mine: myGrammar } })
```

### `preStyles`

Add inline background and foreground color styles to `<pre>` elements based on the active theme.

```typescript
rangi({ preStyles: true })
```

**Default:** `false`

---

## Examples

### Minimal

```typescript
import { parseMarkdown } from 'comark'
import rangi from 'comark/plugins/rangi'

const result = await parseMarkdown(content, {
  plugins: [rangi()]
})
```

### GitHub dual theme

```typescript
import { github } from 'rangi/themes'

rangi({ theme: github })
```

### With HTML renderer

```typescript
import { createHtmlRenderer } from '@comark/html'
import rangi from '@comark/html/plugins/rangi'
import { githubDark } from 'rangi/themes'

const renderHtml = createHtmlRenderer({
  plugins: [rangi({ theme: githubDark })],
})
```

### Live example

::card{icon="i-lucide-zap" title="Vue + Vite Rangi" to="https://github.com/comarkdown/comark/tree/main/examples/3.plugins/vue-vite-rangi"}
Rangi dual themes as inline colors, line highlights, light/dark toggle.
::

---

## Styling

Colors are inlined on tokens. For dual themes with a class-based dark toggle:

```css
html.dark .shj span {
  color: var(--shiki-dark) !important;
}
html.dark pre.shj {
  background-color: var(--shiki-dark-bg) !important;
  color: var(--shiki-dark) !important;
}
```

### Line highlight

```css
.shj span.line.highlight {
  background-color: rgba(255, 255, 0, 0.1);
  display: inline-block;
  width: calc(100% + 2rem);
  margin: 0 -1rem;
  padding: 0 1rem;
}
```

---

## Supported languages

46 languages including `js`/`javascript`, `ts`/`typescript`, `tsx`, `jsx`, `py`/`python`, `rs`/`rust`, `go`, `vue`, `svelte`, `astro`, `css`, `html`, `json`, `yaml`/`yml`, `bash`/`sh`/`shell`, and more — plus Comark itself under `comark`/`mdc`/`md`/`markdown`.

Full list: [rangi languages](https://github.com/pi0/rangi#languages-supported-).
