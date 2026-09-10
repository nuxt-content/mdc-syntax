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
  import { createSerializedMarkdownParser, getMarkdownParser } from 'comark'
  import type { ComarkParseFn } from 'comark'
  import { isMarkdownDocument } from 'comark/utils'
  import MarkdownDocument from '../components/MarkdownDocument.svelte'
  import ResolveAsync from './ResolveAsync.svelte'

  let {
    value,
    options = {},
    plugins = [],
    parser,
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
    parser?: ComarkParseFn
    unwrap?: boolean | string | string[]
    components?: Record<string, any>
    componentsManifest?: ComponentManifest
    streaming?: boolean
    caret?: boolean | { class: string }
    data?: Record<string, unknown>
    class?: string
  } = $props()

  // Streaming keeps incremental state inside the parser closure, and every
  // non-streaming parse resets it, so a streaming instance must own its parser.
  // Non-streaming instances share one, which is where the win is.
  function resolveParser() {
    if (parser) return parser
    const parseOptions = { ...options, ...(unwrap ? { unwrap } : {}), plugins: [...plugins] }
    return streaming ? createSerializedMarkdownParser(parseOptions) : getMarkdownParser(parseOptions)
  }

  let content = $derived(typeof value === 'string' ? value.trim() : '')
  let parsed = $derived(
    isMarkdownDocument(value)
      ? value
      : // `parse` directly mutates `plugins` which creates an infinite effect loop
        // so we copy it before passing it in so it gets a regular JS array and we get to still
        // track dependencies from an external perspective
        await resolveParser()(content),
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
