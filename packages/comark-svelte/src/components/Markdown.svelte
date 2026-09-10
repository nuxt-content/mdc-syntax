<!--
@component
High-level Markdown component that accepts a markdown string, parses it, and renders it.

Uses `$state` and `$effect` for async parsing — no experimental features required.
Renders nothing until the first parse completes.

@example
```svelte
<script>
  import { Markdown } from '@comark/svelte'
  import Alert from './Alert.svelte'

  let content = `
# Hello World

::alert{type="info"}
This is an alert component
::
`
</script>

<Markdown value={content} components={{ alert: Alert }} />
```
-->
<script lang="ts">
  import type { MarkdownDocument as MarkdownDocumentType, ComarkPlugin, ComponentManifest } from 'comark'
  import { isMarkdownDocument } from 'comark/utils'
  import { createComponentParser } from '../internal/parse'
  import MarkdownDocument from './MarkdownDocument.svelte'

  let {
    value,
    options = {},
    plugins = [],
    unwrap = false,
    components = {},
    componentsManifest,
    streaming = false,
    caret = false,
    data,
    class: className = '',
  }: {
    value?: string | MarkdownDocumentType
    options?: Record<string, any>
    plugins?: ComarkPlugin[]
    unwrap?: boolean | string | string[]
    components?: Record<string, any>
    componentsManifest?: ComponentManifest
    streaming?: boolean
    caret?: boolean | { class: string }
    data?: Record<string, unknown>
    class?: string
  } = $props()

  let parsed: MarkdownDocumentType | null = $state(null)

  let content = $derived(typeof value === 'string' ? value.trim() : '')
  // Compare config values before creating a parser when parent props are spread.
  let parserOptions = $derived(options)
  let parserPlugins = $derived(plugins)
  let parserUnwrap = $derived(unwrap)
  let parse = $derived(createComponentParser({
    ...parserOptions,
    ...(parserUnwrap ? { unwrap: parserUnwrap } : {}),
    plugins: [...parserPlugins],
  }))

  let isDocument = $derived(isMarkdownDocument(value))
  $effect(() => {
    if (isDocument) return
    const parseMarkdown = parse
    let active = true
    $effect(() => {
      parseMarkdown(content, { streaming }).then((result) => {
        if (active) parsed = result
      })
    })
    return () => { active = false }
  })
</script>

{#if isMarkdownDocument(value)}
  <MarkdownDocument
    {value}
    {components}
    {componentsManifest}
    {streaming}
    {caret}
    {data}
    class={className}
  />
{:else if parsed}
  <MarkdownDocument
    value={parsed}
    {components}
    {componentsManifest}
    {streaming}
    {caret}
    {data}
    class={className}
  />
{/if}
