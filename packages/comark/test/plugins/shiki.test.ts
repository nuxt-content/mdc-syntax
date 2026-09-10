import { describe, expect, it } from 'vitest'
import type { MarkdownDocument } from '../../src/types'
import { renderMarkdown } from '../../src/render'
import { parseMarkdown } from '../../src/index'
import shiki from '../../src/plugins/shiki'

describe('shiki code block round-trip', () => {
  // The highlight plugin's injected attrs have no markdown form, so a
  // highlighted block must serialize to a plain fence, never a `::pre{...}`.
  function preTree(preClass: string): MarkdownDocument {
    return {
      frontmatter: {},
      meta: {},
      nodes: [['pre', { language: 'bash', class: preClass }, ['code', { class: 'language-bash' }, 'npx install']]],
    }
  }

  it('serializes a bare `shiki` class back to a plain fence', async () => {
    // Single-theme shiki emits a bare `class="shiki"`.
    const md = await renderMarkdown(preTree('shiki'))
    expect(md.trim()).toBe('```bash\nnpx install\n```')
    expect(md).not.toContain('::pre')
  })

  it('serializes a multi-token shiki class back to a plain fence', async () => {
    // Dual-theme shiki emits `shiki shiki-themes <theme> dark:<theme>`.
    const md = await renderMarkdown(preTree('shiki shiki-themes github-dark dark:github-dark'))
    expect(md.trim()).toBe('```bash\nnpx install\n```')
    expect(md).not.toContain('::pre')
  })

  it('keeps a plain fence for a highlighted code block inside a component slot', async () => {
    const document: MarkdownDocument = {
      frontmatter: {},
      meta: {},
      nodes: [
        [
          'code-preview',
          {},
          [
            'template',
            { name: 'code' },
            ['pre', { language: 'bash', class: 'shiki' }, ['code', { class: 'language-bash' }, 'npx install']],
          ],
        ],
      ],
    }
    const md = await renderMarkdown(document)
    expect(md).not.toContain('::pre')
    expect(md).toContain('```bash\nnpx install\n```')
  })
})

describe('shiki inline code round-trip', () => {
  // The plugin merges its injected classes onto the node behind a ` . `
  // sentinel, so a highlighted span must serialize back to `` `text`{lang=…} ``
  // rather than leaking `.shiki.shiki-themes…`.
  function inlineTree(codeClass: string): MarkdownDocument {
    return {
      frontmatter: {},
      meta: {},
      nodes: [
        [
          'p',
          {},
          'Type ',
          [
            'code',
            { lang: 'ts-type', class: codeClass },
            ['span', { style: 'color:#B392F0' }, 'Ref'],
            ['span', { style: 'color:#E1E4E8' }, '<T>'],
          ],
        ],
      ],
    }
  }

  it('drops the injected classes', async () => {
    const md = await renderMarkdown(inlineTree('shiki shiki-themes github-dark'))
    expect(md).toBe('Type `Ref<T>`{lang="ts-type"}')
    expect(md).not.toContain('.shiki')
  })

  it('keeps the user class after the sentinel', async () => {
    const md = await renderMarkdown(inlineTree('shiki shiki-themes github-dark . foo'))
    expect(md).toBe('Type `Ref<T>`{lang="ts-type" .foo}')
    expect(md).not.toContain('.shiki')
  })

  it('round-trips a parsed document unchanged', async () => {
    const source = 'Mix `a`{lang="ts-type"} and `<b />`{lang="vue-html"} and `plain` here'
    const document = await parseMarkdown(source, { plugins: [shiki()] })
    expect(await renderMarkdown(document)).toBe(source)
  })
})

describe('highlighter class detection', () => {
  // Matched on whole tokens, not a prefix, so an authored class that merely
  // starts with `shiki` or `shj` is not mistaken for highlighter output.
  function render(node: MarkdownDocument['nodes'][number]) {
    return renderMarkdown({ frontmatter: {}, meta: {}, nodes: [node] })
  }

  it('keeps an authored class that starts with the highlighter prefix', async () => {
    expect(await render(['pre', { language: 'ts', class: 'shiki-custom' }, ['code', {}, 'x']])).toContain(
      '::pre{.shiki-custom}'
    )
    expect(await render(['p', {}, ['code', { lang: 'ts', class: 'shj-custom' }, 'x']])).toBe(
      '`x`{lang="ts" .shj-custom}'
    )
  })

  it('strips shiki output', async () => {
    expect(await render(['pre', { language: 'ts', class: 'shiki themes' }, ['code', {}, 'x']])).not.toContain('::pre')
    expect(await render(['p', {}, ['code', { lang: 'ts', class: 'shiki themes' }, 'x']])).toBe('`x`{lang="ts"}')
  })

  it('strips rangi output, including a custom class prefix', async () => {
    expect(await render(['pre', { language: 'ts', class: 'shj shiki shj-lang-ts' }, ['code', {}, 'x']])).not.toContain(
      '::pre'
    )
    expect(await render(['pre', { language: 'ts', class: 'myhl shiki shj-lang-ts' }, ['code', {}, 'x']])).not.toContain(
      '::pre'
    )
  })
})
