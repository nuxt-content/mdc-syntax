# Agent Instructions

This document provides guidance for AI agents working on the comark monorepo.

## Project Overview

This is a **monorepo** containing the Comark Markdown parser, document model, plugins, and renderers. The main package is `comark`.

**comark** is a JavaScript library for parsing CommonMark and GFM into a compact, serializable document that can be rendered to HTML, ANSI, Vue, React, Svelte, or Angular. It provides:

- Fast synchronous and async parsing via markdown-exit, a TypeScript rewrite of markdown-it
- CommonMark and GitHub Flavored Markdown support
- Streaming support for real-time/incremental parsing
- HTML, ANSI, Vue, React, Svelte and Angular renderers
- Component and attribute syntax plus an extensible plugin system
- Syntax highlighting via Shiki
- Auto-close utilities for incomplete markdown (useful for AI streaming)

## Monorepo Structure

```
/                         # Root workspace
├── packages/             # All publishable packages
│   ├── comark/           # Main Comark parser + core plugins
│   ├── comark-html/      # HTML renderer (@comark/html)
│   ├── comark-ansi/      # ANSI terminal renderer (@comark/ansi)
│   ├── comark-vue/       # Vue renderer + plugins (@comark/vue)
│   ├── comark-react/     # React renderer + plugins (@comark/react)
│   ├── comark-svelte/    # Svelte renderer + plugins (@comark/svelte)
│   ├── comark-angular/   # Angular renderer + plugins (@comark/angular)
│   └── comark-nuxt/      # Nuxt module (@comark/nuxt)
├── examples/             # Example applications
│   ├── 1.frameworks/     # Framework examples (Nuxt, Next.js, Astro, SvelteKit, ...)
│   ├── 2.vite/           # Vite examples (Vue, React, Svelte, Angular, HTML, ANSI)
│   └── 3.plugins/        # Plugin examples (math, mermaid, highlight, ...)
├── docs/                 # Documentation site (comark-docs layer)
├── scripts/              # Build/sync scripts
├── pnpm-workspace.yaml   # Workspace configuration
├── tsconfig.json         # Root TypeScript config
├── eslint.config.mjs     # ESLint configuration
└── package.json          # Root package (private, scripts only)
```

## Package: comark

Located at `packages/comark/`:

```
packages/comark/
├── src/
│   ├── index.ts              # Core parser: parseMarkdown(), autoCloseMarkdown()
│   ├── render.ts             # String rendering: renderMarkdown() (renderHtmlFromDocument() moved to @comark/html)
│   ├── types.ts              # TypeScript interfaces (ParserOptions, etc.)
│   ├── ast/                  # Comark AST types and utilities
│   │   ├── index.ts          # Re-exports (comark/ast entry point)
│   │   ├── types.ts          # MarkdownDocument, Node, ElementNode, TextNode
│   │   └── utils.ts          # textContent(), visit() document utilities
│   ├── plugins/              # Built-in and optional plugins
│   │   ├── alert.ts          # Alert/callout blocks
│   │   ├── frontmatter.ts    # YAML frontmatter extraction (default via registerDefaultPlugins)
│   │   ├── html.ts           # HTML block/inline parsing (default via registerDefaultPlugins)
│   │   ├── components.ts     # Block/inline components + spans (`::name`, `:name`, `[text]`)
│   │   ├── attributes.ts     # Inline attributes (`{props}` after tokens)
│   │   ├── emoji.ts          # Emoji shortcodes
│   │   ├── shiki.ts          # Shiki with bundled default theme + language loaders (peer: shiki)
│   │   ├── shiki/core.ts     # Shiki without default theme/language imports
│   │   ├── shiki/language-comark.ts # Comark TextMate grammar and its Shiki dependencies
│   │   ├── highlight.ts      # Deprecated alias → shiki (remove next major)
│   │   ├── rangi.ts          # Lightweight highlighting via rangi (peer: rangi)
│   │   ├── rangi/language-comark.ts # Standalone Comark grammar for rangi
│   │   ├── math.ts           # LaTeX math via KaTeX (peer: katex)
│   │   ├── mermaid.ts        # Mermaid diagrams (peer: beautiful-mermaid)
│   │   ├── security.ts       # XSS/security sanitization
│   │   ├── summary.ts        # Summary extraction
│   │   ├── task-list.ts      # GFM task lists
│   │   └── toc.ts            # Table of contents
│   ├── utils/                # Shared utilities (comark/utils entry point)
│   │   ├── index.ts          # textContent(), visit(), visitAsync(), escapeHtml(), string/object utils
│   │   ├── helpers.ts        # defineComarkPlugin(), dedupePlugins()
│   │   └── caret.ts          # Caret utilities for streaming
│   └── internal/             # Internal implementation (not exported)
│       ├── shiki.ts          # Shared Shiki runtime used by both entry points
│       ├── front-matter.ts
│       ├── parse/            # Parsing pipeline
│       └── stringify/        # AST → string rendering
├── test/                 # Vitest test files
├── package.json
└── tsconfig.build.json
```

### Peer dependencies

| Peer | Required by |
|------|-------------|
| `shiki` | `comark/plugins/shiki` |
| `rangi` | `comark/plugins/rangi` |
| `katex` | `comark/plugins/math` |
| `beautiful-mermaid` | `comark/plugins/mermaid` |

All are optional — only install what you use.

## Package: @comark/html

Located at `packages/comark-html/`. Framework-free HTML string rendering.

### Exports

```json
{
  ".": "./dist/index.js",
  "./plugins/*": "./dist/plugins/*.js",
  "./render": "./dist/render.js"
}
```

### Usage

```typescript
import { createHtmlRenderer, renderHtml, renderHtmlFromDocument } from '@comark/html'
import shiki from '@comark/html/plugins/shiki'
import math, { Math } from '@comark/html/plugins/math'

// Flat options — ParserOptions & RendererOptions merged at top level
const renderHtml = createHtmlRenderer({
  plugins: [shiki({ themes: { light: 'github-light', dark: 'github-dark' } })],
  components: {
    Math,
    alert: async ([, attrs, ...children], { render }) =>
      `<div class="alert alert-${attrs.type}">${await render(children)}</div>`
  },
})

const html = await renderHtml(markdownString)
```

---

## Package: @comark/ansi

Located at `packages/comark-ansi/`. ANSI terminal renderer.

### Exports

```json
{
  ".": "./dist/index.js",
  "./plugins/*": "./dist/plugins/*.js",
  "./render": "./dist/render.js"
}
```

### Usage

```typescript
import { createAnsiRenderer, createAnsiPrinter, printAnsi, renderAnsi, renderAnsiFromDocument } from '@comark/ansi'
import shiki from '@comark/ansi/plugins/shiki'
import math, { Math } from '@comark/ansi/plugins/math'

// Flat options — ParserOptions & AnsiRendererOptions merged at top level
const printAnsi = createAnsiPrinter({
  plugins: [shiki(), math()],
  components: { Math },
  width: 120,                      // terminal width
  colors: true,                    // emit ANSI escape codes
  writer: (output) => process.stderr.write(output),
})

await printAnsi(markdownString)
```

---

## Package: @comark/vue

Located at `packages/comark-vue/`. Vue 3 renderer with framework-specific plugin wrappers.

```
packages/comark-vue/
├── src/
│   ├── index.ts              # Entry point
│   ├── components/
│   │   ├── Markdown.ts       # High-level markdown → render component
│   │   ├── MarkdownDocument.ts # Low-level AST → render component
│   │   ├── Math.ts           # Math rendering component
│   │   └── Mermaid.ts        # Mermaid rendering component
│   └── plugins/
│       ├── math.ts           # Re-exports comark/plugins/math + Math component
│       └── mermaid.ts        # Re-exports comark/plugins/mermaid + Mermaid component
├── package.json
└── tsconfig.build.json
```

### Exports

```json
{
  ".": "./dist/index.js",
  "./plugins/*": "./dist/plugins/*.js"
}
```

### Usage

```typescript
import { Markdown, MarkdownDocument, defineMarkdownComponent } from '@comark/vue'
import math, { Math } from '@comark/vue/plugins/math'
import mermaid, { Mermaid } from '@comark/vue/plugins/mermaid'
```

## Package: @comark/react

Located at `packages/comark-react/`. React renderer with framework-specific plugin wrappers.

```
packages/comark-react/
├── src/
│   ├── index.ts              # Entry point
│   ├── components/
│   │   ├── Markdown.tsx      # High-level markdown → render component
│   │   ├── MarkdownDocument.tsx # Low-level AST → render component
│   │   ├── MarkdownClient.tsx # Client-only markdown component
│   │   ├── MarkdownLive.tsx  # Streaming/live markdown component
│   │   ├── Math.tsx          # Math rendering component
│   │   └── Mermaid.tsx       # Mermaid rendering component
│   └── plugins/
│       ├── math.ts           # Re-exports comark/plugins/math + Math component
│       └── mermaid.ts        # Re-exports comark/plugins/mermaid + Mermaid component
├── package.json
└── tsconfig.build.json
```

### Exports

```json
{
  ".": "./dist/index.js",
  "./plugins/*": "./dist/plugins/*.js"
}
```

### Usage

```typescript
import { Markdown, MarkdownDocument, defineMarkdownComponent } from '@comark/react'
import math, { Math } from '@comark/react/plugins/math'
import mermaid, { Mermaid } from '@comark/react/plugins/mermaid'
```

## Package: @comark/svelte

Svelte 5 renderer for Comark. Located at `packages/comark-svelte/`:

```
packages/comark-svelte/
├── src/
│   ├── index.ts              # Entry point (@comark/svelte)
│   ├── types.ts              # Shared prop interfaces
│   ├── components/
│   │   ├── Markdown.svelte       # High-level markdown → render ($state + $effect)
│   │   ├── MarkdownDocument.svelte # Low-level AST → render component
│   │   ├── MarkdownNode.svelte   # Recursive AST node renderer
│   │   ├── ComarkComponent.svelte # Custom component renderer with named snippets
│   │   └── Resolve.svelte        # Stable promise resolver for lazy components
│   ├── async/
│   │   ├── index.ts              # Async export (@comark/svelte/async)
│   │   ├── MarkdownAsync.svelte  # High-level markdown → render (experimental await)
│   │   └── ResolveAsync.svelte   # Async SSR resolver for lazy components
│   └── plugins/
│       ├── math.ts           # Re-exports comark/plugins/math
│       ├── Math.svelte       # Math rendering component
│       ├── mermaid.ts        # Re-exports comark/plugins/mermaid
│       └── Mermaid.svelte    # Mermaid rendering component
├── svelte.config.js          # Svelte config (experimental.async enabled)
├── vitest.config.ts          # Dual test config (server + browser)
└── package.json
```

### Exports

```json
{
  ".": { "svelte": "./dist/index.js" },
  "./async": { "svelte": "./dist/async/index.js" },
  "./plugins/*": { "svelte": "./dist/plugins/*.js" },
  "./components/*": { "svelte": "./dist/components/*" }
}
```

### Build

Uses `@sveltejs/package` (`svelte-package`) — the standard Svelte library packaging tool.

### Testing

Uses Vitest with two test projects:
- **`server`**: Node environment, `*.test.ts` files — SSR tests using `svelte/server` `render()`
- **`client`**: Browser environment (Playwright/Chromium), `*.svelte.test.ts` files — real DOM tests using `vitest-browser-svelte`

### Usage

```svelte
<script>
  import { Markdown } from '@comark/svelte'
  import math, { Math } from '@comark/svelte/plugins/math'
  import mermaid, { Mermaid } from '@comark/svelte/plugins/mermaid'
</script>

<Markdown value={content} components={{ math: Math }} plugins={[math()]} />
```

**Experimental async** (requires `experimental.async` in Svelte config):
```svelte
<script>
  import { MarkdownAsync } from '@comark/svelte/async'
</script>
<svelte:boundary>
  <MarkdownAsync value={content} components={customComponents} />
  {#snippet pending()}
    <p>Loading...</p>
  {/snippet}
</svelte:boundary>
```

## Package: @comark/angular

Located at `packages/comark-angular/`. Angular 17+ renderer with standalone components.

```
packages/comark-angular/
├── src/
│   ├── index.ts                          # Entry point
│   ├── define.ts                         # defineMarkdownComponent / defineMarkdownDocumentComponent
│   ├── components/
│   │   ├── markdown.component.ts         # High-level markdown → render component
│   │   ├── markdown-parsed.component.ts  # Low-level AST → render component
│   │   ├── markdown-node.component.ts    # Recursive AST node renderer
│   │   ├── binding.component.ts          # Binding rendering component
│   │   ├── math.component.ts             # Math rendering component
│   │   └── mermaid.component.ts          # Mermaid rendering component
│   ├── plugins/
│   │   ├── binding.ts                    # Re-exports comark/plugins/binding + Binding component
│   │   ├── math.ts                       # Re-exports comark/plugins/math + Math component
│   │   └── mermaid.ts                    # Re-exports comark/plugins/mermaid + Mermaid component
│   └── utils/
│       ├── caret.ts                      # Caret utilities for streaming
│       └── index.ts                      # Re-exports comark/utils
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Build

Uses the Angular compiler (`ngc`) in partial-compilation mode so published
JavaScript and declarations contain the Angular metadata required by both JIT
and AOT consumers.

### Exports

```json
{
  ".": "./dist/index.js",
  "./plugins/*": "./dist/plugins/*.js",
  "./utils": "./dist/utils/index.js"
}
```

### Usage

```typescript
import { Markdown, MarkdownDocument, defineMarkdownComponent, defineMarkdownDocumentComponent } from '@comark/angular'
import math, { Math } from '@comark/angular/plugins/math'
import mermaid, { Mermaid } from '@comark/angular/plugins/mermaid'
```

```html
<!-- In Angular template -->
<comark-markdown [value]="content" [components]="customComponents" />
```

## Package Exports Reference

```typescript
// Core parsing
import { parseMarkdown, autoCloseMarkdown } from 'comark'

// HTML rendering (parse + render in one step)
import { createHtmlRenderer, renderHtml, renderHtmlFromDocument } from '@comark/html'

// ANSI terminal rendering
import { createAnsiRenderer, createAnsiPrinter, printAnsi, renderAnsi, renderAnsiFromDocument } from '@comark/ansi'

// Markdown string rendering (AST → markdown)
import { renderMarkdown } from 'comark/render'

// AST types and utilities
import type { MarkdownDocument, Node, ElementNode, TextNode } from 'comark'
import { textContent, visit, escapeHtml } from 'comark/utils'

// Core plugins — use when calling parseMarkdown() directly (framework-agnostic)
import shiki from 'comark/plugins/shiki'
import shikiCore from 'comark/plugins/shiki/core' // ShikiCoreOptions: required themes + languages, no defaults
import rangi, { comarkLanguage, comarkLanguages } from 'comark/plugins/rangi'
import shikiComarkLanguages from 'comark/plugins/shiki/language-comark'
import rangiComarkLanguage from 'comark/plugins/rangi/language-comark'
// import highlight from 'comark/plugins/highlight' // deprecated alias → shiki
import math from 'comark/plugins/math'
import mermaid from 'comark/plugins/mermaid'
import emoji from 'comark/plugins/emoji'
import toc from 'comark/plugins/toc'
import alert from 'comark/plugins/alert'
import frontmatter from 'comark/plugins/frontmatter' // default via registerDefaultPlugins
import components from 'comark/plugins/components'   // default via registerDefaultPlugins
import attributes from 'comark/plugins/attributes'   // default via registerDefaultPlugins
import html from 'comark/plugins/html'               // default via registerDefaultPlugins

// markdown-it / markdown-exit adapters (e.g. VitePress)
import { markdownItComponents } from 'comark/plugins/components'
import { markdownItAttributes } from 'comark/plugins/attributes'

// NOTE: All framework packages re-export every core plugin via their own subpath.
// Prefer the framework-specific path when using a framework renderer:
//   @comark/vue/plugins/shiki, @comark/react/plugins/shiki, etc.
// Nested entries are re-exported too: @comark/vue/plugins/shiki/core, etc.
// Use comark/plugins/* only when calling parseMarkdown() without a framework renderer.

// HTML rendering — parse + render to HTML string
import { createHtmlRenderer, renderHtml, renderHtmlFromDocument } from '@comark/html'
import shiki from '@comark/html/plugins/shiki'
import math, { Math } from '@comark/html/plugins/math'
import mermaid, { Mermaid } from '@comark/html/plugins/mermaid'

// ANSI terminal rendering — parse + render to styled terminal string
import { createAnsiRenderer, createAnsiPrinter, printAnsi, renderAnsi, renderAnsiFromDocument } from '@comark/ansi'
import shiki from '@comark/ansi/plugins/shiki'
import math from '@comark/ansi/plugins/math'

// Vue — renderer + plugin wrappers (plugin fn + Vue component)
import { Markdown, MarkdownDocument, defineMarkdownComponent } from '@comark/vue'
import math, { Math } from '@comark/vue/plugins/math'
import mermaid, { Mermaid } from '@comark/vue/plugins/mermaid'

// React — renderer + plugin wrappers (plugin fn + React component)
import { Markdown, MarkdownDocument, defineMarkdownComponent } from '@comark/react'
import math, { Math } from '@comark/react/plugins/math'
import mermaid, { Mermaid } from '@comark/react/plugins/mermaid'

// Svelte — renderer + plugin wrappers (plugin fn + Svelte component)
import { Markdown, MarkdownDocument } from '@comark/svelte'
import { MarkdownAsync } from '@comark/svelte/async' // requires experimental.async
import math, { Math } from '@comark/svelte/plugins/math'
import mermaid, { Mermaid } from '@comark/svelte/plugins/mermaid'

// Angular — renderer + plugin wrappers (plugin fn + Angular component)
import { Markdown, MarkdownDocument, defineMarkdownComponent, defineMarkdownDocumentComponent } from '@comark/angular'
import math, { Math } from '@comark/angular/plugins/math'
import mermaid, { Mermaid } from '@comark/angular/plugins/mermaid'
```

## Coding Principles

### Performance First

1. **Avoid regex when possible** - Use character-by-character scanning for O(n) algorithms
2. **Linear time complexity** - Strive for O(n) operations, avoid nested loops that could be O(n²) or worse
3. **Minimize allocations** - Reuse arrays/objects, avoid creating unnecessary intermediate structures

### TypeScript Conventions

1. Use explicit types for function parameters and return values
2. Export types alongside functions for consumer convenience
3. Use `Record<string, any>` for component props maps
4. Prefer interfaces over type aliases for object shapes

### Code Organization

1. Keep internal implementation in `packages/comark/src/internal/`
2. AST types and utilities in `packages/comark/src/ast/`
3. Core plugins (parser-only) in `packages/comark/src/plugins/`
4. Framework renderers in separate packages (`comark-vue`, `comark-react`, `comark-svelte`, `comark-angular`)
5. Framework plugin wrappers (plugin fn + component) in `packages/comark-{framework}/src/plugins/`

## Testing Guidelines

```bash
pnpm test                                              # Run all package tests
cd packages/comark && pnpm test                        # Run comark tests
cd packages/comark && pnpm vitest run test/auto-close.test.ts  # Run specific test
```

### Test Structure

```typescript
import { describe, expect, it } from 'vitest'
import { functionUnderTest } from '../src/utils/module'

describe('functionUnderTest', () => {
  it('should handle basic case', () => {
    const input = 'test input'
    const expected = 'expected output'
    expect(functionUnderTest(input)).toBe(expected)
  })
})
```

### What to Test

1. **Happy path** - Normal expected usage
2. **Edge cases** - Empty input, special characters, boundary conditions
3. **Error tolerance** - Invalid/malformed input should not crash
4. **Roundtrip** - Parse then render should preserve semantics

## Key APIs

### parseMarkdown(source, options)

```typescript
const result = await parseMarkdown(markdownContent, {
  autoUnwrap: true,             // Remove <p> wrappers from single-paragraph containers
  autoClose: 'streaming',       // Heal incomplete syntax while streaming; `true` heals every parse, also accepts (markdown) => string
  unwrap: 'p',                  // Strip top-level wrapper tags (MDC unwrap); merges paragraphs
  registerDefaultPlugins: true, // frontmatter, html, alert, task-list, components, attributes; false to disable
})

result.nodes       // Node[]
result.frontmatter // Record<string, any>
result.meta        // Record<string, any>
```

### autoCloseMarkdown(markdown, options?)

Self-healing markdown for streaming. Heals incomplete CommonMark/GFM per
`packages/comark/SPEC/auto-close.md`, then completes Comark components / tables / frontmatter.

```typescript
autoCloseMarkdown('**bold text')     // '**bold text**'
autoCloseMarkdown('::alert\nContent') // '::alert\nContent\n::'

// Incomplete links get a safe placeholder URL (default protocol mode)
autoCloseMarkdown('[partial')
// '[partial](comark:incomplete-link)'

// Math (inline `$` and block `$$`) is off by default on bare autoCloseMarkdown
autoCloseMarkdown('$x = 5') // '$x = 5'
autoCloseMarkdown('$x = 5', { math: true }) // '$x = 5$'
// parseMarkdown / createMarkdownParser pass math: true when math plugin provided

// Plain markdown without Comark component fences
autoCloseMarkdown('**bold', { syntax: false })

// Streaming: drop a half-typed opener after whitespace so it does not flash
autoCloseMarkdown('hello *', { dropTrailingOpeners: true }) // 'hello'
```

Key options: `linkMode: 'protocol' | 'text-only'`, `math` (default false; on in parse),
`dropTrailingOpeners` (default false; on when parsing with `streaming: true`),
`incompleteLinkPlaceholder`, `incompleteImagePlaceholder`, `frontmatter`, `syntax`, `attributes`.
Behavioral SPEC: `packages/comark/SPEC/auto-close.md` (run via `test/auto-close-spec.test.ts`).

## Markdown Document Model

```typescript
type TextNode = string
type ElementNodeAttributes = { [key: string]: unknown; $?: { line?: number; html?: 0 | 1; block?: 0 | 1 } }
type ElementNode = [string, ElementNodeAttributes, ...Node[]]
type CommentNode = [null, ElementNodeAttributes, string]
type Node = ElementNode | TextNode | CommentNode
type MarkdownDocument = {
  nodes: Node[]
  frontmatter: Record<string, any>
  meta: Record<string, any>
}
```

Example:
```typescript
// Input: "# Hello **World**"
// Output:
{
  nodes: [
    ['h1', { id: 'hello' }, 'Hello ', ['strong', {}, 'World']]
  ],
  frontmatter: {},
  meta: {}
}
```

## Indentation Inside Components

A block component's children may be indented (aligned under the `::` marker) or
not — both are valid input. Two rules keep the two forms interchangeable and
lossless through `parseMarkdown` → `renderMarkdown`:

**Parse — dedent the children, don't raise the floor.** A child indented *less*
than its own component marker is never dropped. Each child line is shifted left
by `min(markerIndent, its own indentation)` and the region is tokenized against
a zero floor (`comark_block` in `src/plugins/components.ts` via
`src/internal/parse/indent.ts`, mirroring the line-mark mutation `blockquote`
uses to strip its markers). Lines inside a
fenced code block all take the *opening fence's* shift, so the fence and its
body move together. The shift is all or nothing: a tab that would have to be
split into columns puts the region back and keeps the marker floor. A component
with no outdented child is untouched.

**Stringify — re-indent a block, never a line.** Nested components indent their
rendered output by 2 spaces per level (`indent()` in `src/utils/index.ts`). The
prefix is added to every line of the block, including the body of a fenced code
block, so the fence and its content always move together.

Uniform shifting is what makes fenced code survive. Indentation inside a fence
is significant whitespace, and the parser cannot tell padding apart from code:

```md
::tabs
  :::tabs-item{label="Code"}
```mdc
  ::accordion
  ::
```
  :::
::
```

The fence sits at indent 0 under a marker at indent 2, so fence and body shift
by 0 and the body keeps the two spaces it has relative to its fence
(`"  ::accordion\n  ::"`). Rendering back aligns the fence with its parent and
carries the body along, which is a fixed point on re-parse:

```md
::tabs
  :::tabs-item{label="Code"}
  ```mdc
    ::accordion
    ::
  ```
  :::
::
```

SPEC coverage: `SPEC/COMARK/component-nested-*-outdented.md`,
`SPEC/COMARK/component-nested-codeblock-indented.md`,
`SPEC/COMARK/codeblock-indented-content.md`.

## Vue/React/Svelte/Angular Components

### Markdown Component (High-level)

**Vue** (requires `<Suspense>` wrapper since Markdown is async):

```vue
<Suspense>
  <Markdown :components="customComponents">{{ content }}</Markdown>
</Suspense>
```

**React**:

```tsx
<Markdown components={customComponents}>{content}</Markdown>
```

**Svelte** (stable, uses `$state` + `$effect`):

```svelte
<Markdown value={content} components={customComponents} />
```

**Svelte** (experimental async — requires `experimental.async` in Svelte config):

```svelte
<svelte:boundary>
  <MarkdownAsync value={content} components={customComponents} />
  {#snippet pending()}<p>Loading...</p>{/snippet}
</svelte:boundary>
```

**Angular**:

```html
<comark-markdown [value]="content" [components]="customComponents" />
```

### defineMarkdownComponent (Vue, React & Angular)

Creates a pre-configured Markdown component with default plugins and components:

```typescript
// Vue
import { defineMarkdownComponent } from '@comark/vue'
import math, { Math } from '@comark/vue/plugins/math'
import mermaid, { Mermaid } from '@comark/vue/plugins/mermaid'

export const DocsMarkdown = defineMarkdownComponent({
  name: 'DocsMarkdown',
  plugins: [math(), mermaid()],
  components: { Math, Mermaid },
})

// React
import { defineMarkdownComponent } from '@comark/react'
import math, { Math } from '@comark/react/plugins/math'

export const DocsMarkdown = defineMarkdownComponent({
  name: 'DocsMarkdown',
  plugins: [math()],
  components: { Math },
})

// Angular
import { defineMarkdownComponent } from '@comark/angular'
import math, { Math } from '@comark/angular/plugins/math'

export const DocsMarkdown = defineMarkdownComponent({
  plugins: [math()],
  components: { Math },
})
```

## Common Tasks

### Adding a new utility function

1. Create file in `packages/comark/src/internal/`
2. Export from `packages/comark/src/index.ts` if public API
3. Add tests in `packages/comark/test/`
4. Document with JSDoc

### Modifying the parser

1. Token processing is in `packages/comark/src/internal/parse/token-processor.ts`
2. Test with `packages/comark/test/index.test.ts`
3. Check streaming still works with `packages/comark/test/stream.test.ts`

### Adding component features

1. Vue components in `packages/comark-vue/src/components/`
2. React components in `packages/comark-react/src/components/`
3. Svelte components in `packages/comark-svelte/src/`
4. Angular components in `packages/comark-angular/src/components/`
5. All four should have similar APIs for consistency

### Adding a new core plugin

1. Create `packages/comark/src/plugins/{name}.ts`
2. Available as `comark/plugins/{name}` via the `"./plugins/*"` wildcard export
3. Add framework wrappers if it needs a render component:
   - `packages/comark-vue/src/plugins/{name}.ts` (re-export plugin + Vue component)
   - `packages/comark-react/src/plugins/{name}.ts` (re-export plugin + React component)
   - `packages/comark-svelte/src/plugins/{name}.ts` (re-export plugin + Svelte component)
   - `packages/comark-angular/src/plugins/{name}.ts` (re-export plugin + Angular component)
4. Run `node scripts/sync-plugins.mjs` to sync plain re-exports for plugins without components

### Adding a new package

1. Create directory in `packages/`
2. Add `package.json` with appropriate name and dependencies
3. Use `workspace:*` protocol for local package dependencies
4. Package is automatically included via `pnpm-workspace.yaml`

## Scripts

Root workspace scripts:

```bash
pnpm docs         # Run documentation site
pnpm build        # Build all packages
pnpm test         # Run all package tests
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript check
pnpm verify       # Run lint + test + typecheck
```

Utility scripts:

```bash
node scripts/stub.mjs          # Generate stub dist files for local dev
node scripts/sync-plugins.mjs  # Sync plugin re-exports to framework packages
```

## Continuous Integration

Workflows live in `.github/workflows/`:

| Workflow | Purpose |
|----------|---------|
| `ci.yml` | lint → prepack → test → publish preview → bundle size check |
| `commit-signature.yml` | Fails PRs containing unsigned commits |
| `bundle-snapshot.yml` | Reports bundle-size snapshot drift and updates it on demand |

### Bundle size snapshot

`test/bundle.test.ts` asserts an inline snapshot of the published size of every
package (measured with `npm pack --dry-run`). It only makes sense after a real
build, so CI runs it after `pnpm prepack`:

```bash
pnpm prepack && pnpm vitest run bundle      # check
pnpm prepack && pnpm vitest run bundle -u   # accept the new sizes
```

When the check fails on a PR, `ci.yml` uploads a `bundle-report` artifact and
`bundle-snapshot.yml` posts a comment with the diff plus a checkbox button.
A maintainer (write access required) can:

- tick **🔄 Update the bundle snapshot** in that comment,
- comment `/update-bundle-snapshot`, or
- run the workflow manually with a PR number.

The workflow then rebuilds, runs `vitest run bundle --update`, re-runs the check
to verify the refreshed snapshot, and commits `test/bundle.test.ts` back to the
PR branch via the GitHub API (so the commit is verified, satisfying
`commit-signature.yml`). PR code always executes in the tokenless `build` job
(`permissions: {}`); only its artifact reaches the write-scoped `update` job,
which verifies the artifact against the run's head SHA and uses comment fences
longer than any backtick run in PR-controlled text. For fork PRs it cannot
push, so it posts the patch in the comment instead. The comment is deleted
automatically once the check passes.

GitHub suppresses the events a `GITHUB_TOKEN` commit would raise, so `ci` does
not reliably re-run after the snapshot lands — hence the in-job verification.
Re-run `ci` manually to refresh a stale red check.

Requires **Settings → Actions → General → Workflow permissions** to be set to
*Read and write*, otherwise the update job cannot commit.

## Releasing

Uses [release-it](https://github.com/release-it/release-it) with conventional changelog.

### Commit message format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streaming support          # Minor version bump
fix: correct parsing edge case       # Patch version bump
feat!: breaking API change           # Major version bump
perf: optimize auto-close algorithm  # Patch version bump
docs: update README                  # No version bump
chore: update dependencies           # No version bump
```

## Documentation Maintenance

**Important:** After completing any feature, bug fix, or significant change, update the relevant documentation:

### What to Update

1. **AGENTS.md** (this file)
   - Update architecture section if new files/modules added
   - Update Package Exports Reference if new public APIs
   - Update Common Tasks if workflows change

2. **Documentation** (`docs/content/`)
   - `1.getting-started/` — Installation or quick start changes
   - `3.rendering/` — Vue/React/Svelte/Angular/HTML/ANSI renderer changes
   - `4.plugins/` — Plugin changes

### Documentation Checklist

After each change, ask:
- [ ] Does AGENTS.md reflect the current architecture?
- [ ] Are all public APIs documented in Package Exports Reference?
- [ ] Are the docs pages accurate and up-to-date?
