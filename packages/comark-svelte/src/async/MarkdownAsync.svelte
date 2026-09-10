<!--
@component
High-level Markdown component using experimental Svelte 5 async support.

Uses `$derived` with `await` to parse markdown reactively. Requires the
consumer to enable `experimental: { async: true }` in their Svelte config
and wrap this component in a `<svelte:boundary>` for pending/error states.

@example
```svelte
<script>
  import { MarkdownAsync } from '@comark/svelte/async'
  import Alert from './Alert.svelte'

  let content = $state('# Hello World')
</script>

<svelte:boundary>
  <MarkdownAsync value={content} components={{ alert: Alert }} />
  {#snippet pending()}
    <p>Loading...</p>
  {/snippet}
  {#snippet failed(error, reset)}
    <p>Error: {error.message}</p>
    <button onclick={reset}>Retry</button>
  {/snippet}
</svelte:boundary>
```
-->
<script lang="ts">
  import type { MarkdownDocument as MarkdownDocumentType, ComarkPlugin, ComponentManifest } from 'comark'
  import { isMarkdownDocument } from 'comark/utils'
  import { createComponentParser } from '../internal/parse'
  import MarkdownDocument from '../components/MarkdownDocument.svelte'
  import ResolveAsync from './ResolveAsync.svelte'

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
  let parsed = $derived(
    isMarkdownDocument(value)
      ? value
      : await parse(content, { streaming }),
  )
</script>

{#if parsed}
  <MarkdownDocument
    value={parsed}
    {components}
    {componentsManifest}
    resolver={ResolveAsync}
    {streaming}
    {caret}
    {data}
    class={className}
  />
{/if}
