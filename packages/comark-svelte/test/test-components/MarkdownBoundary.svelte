<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import type Markdown from '../../src/components/Markdown.svelte'

  let { component: Component, ...props }: ComponentProps<typeof Markdown> & { component: typeof Markdown } = $props()
</script>

<svelte:boundary>
  <Component {...props} />
  {#snippet pending()}<p>Loading</p>{/snippet}
  {#snippet failed(error)}<p role="alert">{error instanceof Error ? error.message : String(error)}</p>{/snippet}
</svelte:boundary>
