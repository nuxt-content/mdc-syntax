# Agent Instructions

This document provides guidance for AI agents working on the mdc-syntax codebase.

## Project Overview

**mdc-syntax** is a Markdown Component (MDC) parser that extends standard Markdown with component syntax. It provides:

- Fast synchronous and async parsing via markdown-it
- Streaming support for real-time/incremental parsing
- Vue and React renderers
- Syntax highlighting via Shiki
- Auto-close utilities for incomplete markdown (useful for AI streaming)

## Architecture

```
src/
├── index.ts              # Core parser: parse(), parseAsync(), renderHTML(), renderMarkdown()
├── stream.ts             # Streaming: parseStream(), parseStreamIncremental()
├── types.ts              # TypeScript interfaces
├── vue/                  # Vue components: MDC, MDCRenderer, ShikiCodeBlock
├── react/                # React components: MDC, MDCRenderer, ShikiCodeBlock
└── utils/
    ├── auto-close.ts     # Auto-close incomplete markdown/MDC syntax
    ├── auto-unwrap.ts    # Remove unnecessary <p> wrappers
    ├── front-matter.ts   # YAML frontmatter parsing/rendering
    ├── token-processor.ts # markdown-it token to Minimark AST conversion
    ├── table-of-contents.ts # TOC generation
    └── shiki-highlighter.ts # Syntax highlighting

examples/
├── vue-vite/             # Vue 3 + Vite + Tailwind CSS v4 example
└── react-vite/           # React 19 + Vite + Tailwind CSS v4 example

test/                     # Vitest test files
playground/               # Nuxt playground for development
docs/                     # Documentation site (Docus-based)
skills/                   # AI agent skills definitions
```

## Package Exports

```typescript
// Core parsing
import { parse, parseAsync, renderHTML, renderMarkdown, autoCloseMarkdown } from 'mdc-syntax'

// Stream parsing
import { parseStream, parseStreamIncremental } from 'mdc-syntax/stream'

// Vue components
import { MDC, MDCRenderer, ShikiCodeBlock } from 'mdc-syntax/vue'

// React components
import { MDC, MDCRenderer, ShikiCodeBlock } from 'mdc-syntax/react'
```

## Coding Principles

### Performance First

1. **Avoid regex when possible** - Use character-by-character scanning for O(n) algorithms
2. **Linear time complexity** - Strive for O(n) operations, avoid nested loops that could be O(n²) or worse
3. **Minimize allocations** - Reuse arrays/objects, avoid creating unnecessary intermediate structures

Example from auto-close.ts:
```typescript
// Good: Single-pass character scan in O(n)
for (let i = 0; i < len; i++) {
  const ch = line[i]
  if (ch === '*') asteriskCount++
  // ...
}

// Avoid: Regex that may have backtracking
const matches = line.match(/\*+/g)  // Don't do this
```

### TypeScript Conventions

1. Use explicit types for function parameters and return values
2. Export types alongside functions for consumer convenience
3. Use `Record<string, any>` for component props maps
4. Prefer interfaces over type aliases for object shapes

### Code Organization

1. Keep utility functions in `src/utils/`
2. Framework-specific code in `src/vue/` and `src/react/`
3. Export public APIs from entry points (`index.ts`, `stream.ts`)
4. Document exported functions with JSDoc including `@example`

## Testing Guidelines

Tests are in `test/` using Vitest:

```bash
pnpm test              # Run all tests
pnpm vitest run test/auto-close.test.ts  # Run specific test file
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

  it('should handle edge case', () => {
    // Test edge cases explicitly
  })
})
```

### What to Test

1. **Happy path** - Normal expected usage
2. **Edge cases** - Empty input, special characters, boundary conditions
3. **Error tolerance** - Invalid/malformed input should not crash
4. **Roundtrip** - Parse then render should preserve semantics

## Key APIs

### parse(source, options)

Synchronous parsing of MDC content:

```typescript
const result = parse(markdownContent, {
  autoUnwrap: true,   // Remove <p> wrappers from single-paragraph containers
  autoClose: true,    // Auto-close incomplete syntax
})

result.body   // MinimarkTree - Parsed AST
result.data   // Frontmatter data object
result.toc    // Table of contents
```

### parseStreamIncremental(stream, options)

For real-time streaming (e.g., AI chat):

```typescript
for await (const result of parseStreamIncremental(stream)) {
  // result.body - Current AST state (with auto-closed syntax)
  // result.chunk - Current chunk text
  // result.isComplete - Whether stream finished
}
```

### autoCloseMarkdown(markdown)

Closes unclosed inline syntax and MDC components:

```typescript
autoCloseMarkdown('**bold text')     // '**bold text**'
autoCloseMarkdown('::alert\nContent') // '::alert\nContent\n::'
```

## Minimark AST Format

The parser outputs Minimark AST - a compact array-based format:

```typescript
type MinimarkNode =
  | string  // Text node
  | [tag: string, props?: Record<string, any>, ...children: MinimarkNode[]]

interface MinimarkTree {
  type: 'minimark'
  value: MinimarkNode[]
}
```

Example:
```typescript
// Input: "# Hello **World**"
// Output:
{
  type: 'minimark',
  value: [
    ['h1', { id: 'hello' }, 'Hello ', ['strong', {}, 'World']]
  ]
}
```

## Vue/React Components

### MDC Component (High-level)

Accepts markdown string, handles parsing internally.

**Vue** (requires `<Suspense>` wrapper since MDC is async):

```vue
<Suspense>
  <MDC :markdown="content" :components="customComponents" />
</Suspense>
```

**React**:

```tsx
<MDC markdown={content} components={customComponents} />
```

### MDCRenderer Component (Low-level)

Renders pre-parsed Minimark AST:

```vue
<MDCRenderer :body="parsedAst" :components="customComponents" />
```

Use MDCRenderer when:
- Caching parsed results
- Working with streams
- Need more control over parsing

## Common Tasks

### Adding a new utility function

1. Create file in `src/utils/`
2. Export from `src/index.ts` if public API
3. Add tests in `test/`
4. Document with JSDoc

### Modifying the parser

1. Token processing is in `src/utils/token-processor.ts`
2. Test with `test/index.test.ts`
3. Check streaming still works with `test/stream.test.ts`

### Adding component features

1. Vue components in `src/vue/components/`
2. React components in `src/react/components/`
3. Both should have similar APIs for consistency

## Scripts

```bash
pnpm dev          # Run playground (Nuxt)
pnpm dev:vue      # Run Vue example (Vite)
pnpm dev:react    # Run React example (Vite)
pnpm docs         # Run documentation site
pnpm test         # Run tests
pnpm lint         # Run ESLint
pnpm typecheck    # Run TypeScript check
pnpm verify       # Run lint + test + typecheck
```

## Examples

Interactive examples are in `examples/`:

### Vue/Vite Example (`examples/vue-vite/`)

```bash
pnpm dev:vue
```

Features:
- Editor mode with live preview
- Streaming demo showing auto-close in action
- Custom component registration (alert, h1)
- Light/dark mode support via Tailwind CSS v4
- Uses `<Suspense>` wrapper for async MDC component

Key files:
- `src/App.vue` - Main app with editor/streaming modes
- `src/components/StreamingPreview.vue` - Streaming demo component
- `src/components/CustomAlert.vue` - Custom alert component
- `src/components/CustomHeading.vue` - Custom heading component

### React/Vite Example (`examples/react-vite/`)

```bash
pnpm dev:react
```

Features:
- Same feature set as Vue example
- Uses React hooks (useState, useMemo)
- Custom component registration

Key files:
- `src/App.tsx` - Main app
- `src/components/StreamingPreview.tsx` - Streaming demo
- `src/components/CustomAlert.tsx` - Custom alert
- `src/components/CustomHeading.tsx` - Custom heading

## Documentation Maintenance

**Important:** After completing any feature, bug fix, or significant change, update the relevant documentation:

### What to Update

1. **AGENTS.md** (this file)
   - Update architecture section if new files/modules added
   - Update package exports if new public APIs
   - Add new APIs to the Key APIs section
   - Update common tasks if workflows change

2. **Skills** (`skills/mdc/`)
   - Update `SKILL.md` if syntax or usage changes
   - Update reference files in `skills/mdc/references/` for:
     - `markdown-syntax.md` - MDC syntax changes
     - `parsing-ast.md` - Parser API or AST format changes
     - `rendering-vue.md` - Vue component changes
     - `rendering-react.md` - React component changes

3. **Documentation** (`docs/content/`)
   - Update relevant docs pages:
     - `1.getting-started/` - Installation or quick start changes
     - `2.syntax/` - MDC syntax changes
     - `3.rendering/` - Vue/React renderer changes
     - `4.api/` - API changes (parse, auto-close, reference)

### When to Update

- **New feature**: Update all three (AGENTS.md, skills, docs)
- **Bug fix**: Update docs if it changes expected behavior
- **API change**: Update AGENTS.md and docs API reference
- **Internal refactor**: Update AGENTS.md architecture if structure changes

### Documentation Checklist

After each change, ask:
- [ ] Does AGENTS.md reflect the current architecture?
- [ ] Are all public APIs documented in Key APIs?
- [ ] Do the skills references match current behavior?
- [ ] Are the docs pages accurate and up-to-date?


