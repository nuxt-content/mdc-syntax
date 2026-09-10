---
name: migrate-mdc-to-comark
description: >-
  Migrate a Nuxt project from @nuxtjs/mdc to Comark. Covers package changes, parse/render API mapping, AST format, Nuxt module config, components, slots, plugins, and Nuxt UI integration.
---

# Migrate from @nuxtjs/mdc to Comark

`@nuxtjs/mdc` was Nuxt-only. Comark is its successor: the markdown syntax is fully compatible, your `.md` files need no changes. What changes is the JavaScript API.

The migration has two parts: **Core Package** (programmatic API) and **Nuxt Module** (components, slots, config).

## Quick Overview

- **Package**: `@nuxtjs/mdc` → `comark` (core only) or `@comark/nuxt` (Nuxt module)
- **Parse**: `parseMarkdown()` → `parseMarkdown()` · factory: `createMarkdownParser()` (sync, no await)
- **Render**: `stringifyMarkdown()` → `renderMarkdown()` from `comark/render`
- **AST**: object tree → compact tuples `['tag', props, ...children]`
- **Result**: `result.body` / `result.data` → `document.nodes` / `document.frontmatter`
- **Renderer**: `<MDCRenderer :body :data>` → `<MarkdownDocument :value>`
- **All-in-one**: `<MDC :value>` → `<Markdown :value>`
- **Slots**: `<MDCSlot />` → native `<slot />`
- **Plugins**: global `nuxt.config` → per-component `defineMarkdownComponent({ plugins })`
- **Markdown files**: no changes needed

## Core Package

### API Mapping

| `@nuxtjs/mdc` | `comark` |
|---|---|
| `parseMarkdown(md, opts)` | `parseMarkdown(md, opts)` from `comark` |
| `createMarkdownParser(opts)` (async) | `createMarkdownParser(opts)` (sync, no await) |
| `stringifyMarkdown(body, data)` | `renderMarkdown(document)` from `comark/render` |
| `result.body` (`MDCRoot`) | `document.nodes` (`Node[]`) |
| `result.data` | `document.frontmatter` |
| `result.data.title` | `document.frontmatter.title` |
| `result.toc` | `document.meta.toc` (requires `toc` plugin) |
| `result.excerpt` | `document.meta.summary` (requires `summary` plugin) |

### AST Format

| `@nuxtjs/mdc` | `comark` |
|---|---|
| `{ type: 'root', children: MDCNode[] }` | `{ nodes: Node[], frontmatter: {}, meta: {} }` |
| `{ type: 'element', tag: 'p', props: {}, children: [] }` | `['p', {}, ...children]` |
| `{ type: 'text', value: 'hello' }` | `'hello'` (plain string) |

### Parse Options

```typescript
// Before: MDCOptions
{
  remark: { plugins: { /* record */ } },
  rehype: { options: {...}, plugins: { /* record */ } },
  highlight: { theme: '...', langs: [...] } | false,
  toc: { depth: 3, searchDepth: 2 } | false,
}

// After: ParserOptions
{
  plugins: ComarkPlugin[],   // ordered array, not a record
  autoUnwrap: true,          // removes <p> from single-paragraph containers
  autoClose: 'streaming',    // completes incomplete syntax while streaming
  // HTML, components, attributes, alerts, task-list, frontmatter are on by default
}
```

### Plugins

The `unified`/`remark`/`rehype` pipeline is replaced by Comark's own lighter plugin interface.

| Feature | Before | After |
|---|---|---|
| Syntax highlighting | `rehypeHighlight` via `createMarkdownParser` | `shiki()` from `comark/plugins/shiki` |
| Table of Contents | `parseMarkdown(md, { toc: { depth: 3 } })` | `toc({ depth: 3 })` plugin |
| Excerpt / Summary | `result.excerpt` (built-in) | `summary()` plugin → `document.meta.summary` |
| Emoji | `remark-emoji` (enabled by default) | `emoji()` plugin (opt-in) |

Available plugins: `comark/plugins/toc`, `comark/plugins/shiki`, `comark/plugins/emoji`, `comark/plugins/task-list`, `comark/plugins/summary`, `comark/plugins/security`, `comark/plugins/alert`, `comark/plugins/math`, `comark/plugins/mermaid`, `comark/plugins/punctuation`

## Nuxt Module

### Configuration

```typescript
// Before
export default defineNuxtConfig({
  modules: ['@nuxtjs/mdc'],
  mdc: { highlight: { ... }, remarkPlugins: { ... } },
})

// After
export default defineNuxtConfig({
  modules: ['@comark/nuxt'],
  // No plugin config here (plugins are defined per-component)
})
```

`@comark/nuxt` auto-imports: `Markdown`, `MarkdownDocument`, `defineMarkdownComponent`, `defineMarkdownDocumentComponent`.

### Components

| `@nuxtjs/mdc` | `@comark/nuxt` |
|---|---|
| `<MDCRenderer :body :data :components>` | `<MarkdownDocument :value :components>` |
| `<MDC :value :parser-options>` | `<Markdown :value :options>` or `<Markdown>{{ md }}</Markdown>` |
| `<MDCSlot />` | `<slot />` |
| `<MDCSlot unwrap="p" />` | `<slot unwrap="p" />` |
| `<slot mdc-unwrap="p" />` | `<slot unwrap="p" />` |

For a pre-parsed document, use `<MarkdownDocument>` directly instead of `<Markdown>`.

#### `<MarkdownDocument>` props changes

| MDC `<MDCRenderer>` | Comark `<MarkdownDocument>` | Notes |
|---|---|---|
| `body` (`MDCRoot`) | `value` (`MarkdownDocument`) | Different AST shape |
| `data` | — | Frontmatter is in `value.frontmatter` |
| `tag` | — | Wrapper is always `<div class="comark-content">` |
| `prose` | — | `Prose*` resolution is automatic |
| `unwrap` | — | Use `autoUnwrap` in parse options |
| `components` | `components` | Same purpose |
| — | `componentsManifest` | New: dynamic async component resolver |
| — | `streaming` | New: streaming mode |
| — | `caret` | New: animated caret for streaming |

#### Summary rendering

```vue
<!-- Before -->
<MDCRenderer :body="result.excerpt ?? result.body" :data="result.data" />

<!-- After -->
<Markdown summary>{{ markdown }}</Markdown>
```

### `defineMarkdownComponent`

Replaces global `mdc: { ... }` config. Define reusable components with their own plugins and component mappings:

```typescript
import { defineMarkdownComponent } from '@comark/vue'
import shiki from 'comark/plugins/shiki'
import toc from 'comark/plugins/toc'
import githubLight from '@shikijs/themes/github-light'
import githubDark from '@shikijs/themes/github-dark'

export const ArticleMarkdown = defineMarkdownComponent({
  name: 'ArticleMarkdown',
  plugins: [shiki({ themes: { light: githubLight, dark: githubDark } }), toc()],
  components: { alert: CustomAlert },
})
```

### Slots

`<MDCSlot />` → native `<slot />`. Named slots work the same (`#slotName` in markdown, `<slot name="slotName">` in component). The `unwrap` attribute (`<slot unwrap="p">`) strips wrapper tags from children.

### Prose Components

Same `Prose*.vue` naming convention in `components/prose/`. Resolution changed from kebab-case (`prose-p`) to PascalCase (`ProseP`) internally. No file changes needed.

### Nuxt UI Integration

When using Nuxt UI, `@comark/nuxt` registers Nuxt UI prose components automatically. Shorthand callout components are available:

```mdc
::note    (informational)
::tip     (helpful suggestion)
::warning (something to watch out for)
::caution (critical warning)
```

These are **only available with Nuxt UI**. Without it, use `::callout{icon="..." color="..."}`.

## Common Pitfalls

1. **`createMarkdownParser` is sync**: no `await` needed (unlike `createMarkdownParser`)
2. **Attribute naming**: Comark uses `attrs.lang`, not `attrs.language`
3. **Frontmatter**: stored in `document.frontmatter`, not passed separately
4. **`renderMarkdown` includes frontmatter**: reads `document.frontmatter` automatically
5. **No `unified` pipeline**: `mdc.config.ts` hooks (`pre`, `remark`, `rehype`, `post`) have no equivalent, use `ComarkPlugin` interface instead
6. **Emoji is opt-in**: not enabled by default like in MDC's `remark-emoji`

## Component Syntax

The MDC block and inline component syntax is identical, so no changes are needed in `.md` files.

## Unsupported Features

- **Binding syntax** (`{{ variable }}`): not supported, rendered as plain text
- **Props binding / data passing**: no equivalent for `parseMarkdown(md, { data: { ... } })`
