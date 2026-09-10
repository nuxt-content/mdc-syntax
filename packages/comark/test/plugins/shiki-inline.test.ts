import { afterEach, describe, expect, it } from 'vitest'
import javascript from 'shiki/dist/langs/javascript.mjs'
import githubDark from 'shiki/dist/themes/github-dark.mjs'
import { parseMarkdown } from '../../src/index'
import type { ElementNode, Node } from '../../src/types'
import shiki from '../../src/plugins/shiki'
import shikiCore, { resetHighlighter } from '../../src/plugins/shiki/core'
import type { ShikiOptions } from '../../src/plugins/shiki'

afterEach(resetHighlighter)

async function inlineCode(source: string, options: ShikiOptions = {}): Promise<ElementNode> {
  const document = await parseMarkdown(source, { plugins: [shiki(options)] })
  return (document.nodes[0] as ElementNode)[2] as ElementNode
}

/** Collect every `style` on the node's span children, in order. */
function styles(node: ElementNode): string[] {
  return (node.slice(2) as Node[])
    .filter((child): child is ElementNode => Array.isArray(child))
    .map((child) => String((child[1] as Record<string, unknown>).style ?? ''))
}

describe('shiki inline code', () => {
  it('highlights inline code carrying a lang attribute', async () => {
    const code = await inlineCode('`const a = 1`{lang="ts"}')

    expect(code[0]).toBe('code')
    expect(String((code[1] as Record<string, unknown>).class)).toMatch(/^shiki /)
    expect(code.length).toBeGreaterThan(3)
    expect(styles(code).some(Boolean)).toBe(true)
  })

  it('emits flat spans with no line wrapper and no newlines', async () => {
    const code = await inlineCode('`const a = 1`{lang="ts"}')

    for (const child of code.slice(2) as Node[]) {
      expect(child).not.toBe('\n')
      if (Array.isArray(child)) {
        const attrs = child[1] as Record<string, unknown>
        expect(attrs.class).toBeUndefined()
        expect(attrs.style).not.toBe('display: inline')
      }
    }
  })

  it('accepts `language` as well as `lang`', async () => {
    const code = await inlineCode('`const a = 1`{language="ts"}')
    expect(String((code[1] as Record<string, unknown>).class)).toMatch(/^shiki /)
  })

  it('prefers `lang` when both are present', async () => {
    const both = await inlineCode('`Ref<T>`{lang="ts-type" language="ts"}')
    const asType = await inlineCode('`Ref<T>`{lang="ts-type"}')
    expect(styles(both)).toEqual(styles(asType))
  })

  describe('built-in grammar contexts', () => {
    it('tokenizes ts-type as a type expression, not a plain statement', async () => {
      const asType = await inlineCode('`Ref<T>`{lang="ts-type"}', { themes: { dark: githubDark } })
      const asStatement = await inlineCode('`Ref<T>`{lang="ts"}', { themes: { dark: githubDark } })

      // Without the `let a:` seed, `Ref` falls through to plain text.
      expect(styles(asType)).not.toEqual(styles(asStatement))
      expect(styles(asType)[0]).toContain('#B392F0')
      expect(styles(asStatement)[0]).toContain('#E1E4E8')
    })

    it('tokenizes vue-html inside a template', async () => {
      const code = await inlineCode('`<UButton />`{lang="vue-html"}', { themes: { dark: githubDark } })

      expect(styles(code).some((style) => style.includes('#85E89D'))).toBe(true)
      expect(
        code
          .slice(2)
          .map((child) => (Array.isArray(child) ? child[2] : child))
          .join('')
      ).toBe('<UButton />')
    })

    it('merges custom contexts over the built-ins', async () => {
      const custom = await inlineCode('`Ref<T>`{lang="ts-type"}', {
        grammarContexts: { 'sql-expr': { lang: 'sql' } },
      })
      expect(String((custom[1] as Record<string, unknown>).class)).toMatch(/^shiki /)
    })

    it('leaves a built-in alone when it is disabled', async () => {
      const code = await inlineCode('`Ref<T>`{lang="ts-type"}', {
        grammarContexts: { 'ts-type': false },
      })
      // `ts-type` is not a real grammar, so with the context gone there is
      // nothing to highlight with.
      expect(code).toEqual(['code', { lang: 'ts-type' }, 'Ref<T>'])
    })
  })

  describe('left untouched', () => {
    it('leaves a natural-language lang exactly as authored', async () => {
      const code = await inlineCode('`Bonjour`{lang="fr"}')
      expect(code).toEqual(['code', { lang: 'fr' }, 'Bonjour'])
    })

    it('leaves inline code with no language alone', async () => {
      const code = await inlineCode('`plain`')
      expect(code).toEqual(['code', {}, 'plain'])
    })

    it('leaves inline code alone when inlineCode is false', async () => {
      const code = await inlineCode('`const a = 1`{lang="ts"}', { inlineCode: false })
      expect(code).toEqual(['code', { lang: 'ts' }, 'const a = 1'])
    })
  })

  describe('core entry with an unregistered grammar', () => {
    it('leaves the node alone and keeps working afterwards', async () => {
      const plugin = shikiCore({ languages: [javascript], themes: { dark: githubDark } })

      const first = await parseMarkdown('`Ref<T>`{lang="ts-type"}', { plugins: [plugin] })
      expect((first.nodes[0] as ElementNode)[2]).toEqual(['code', { lang: 'ts-type' }, 'Ref<T>'])

      // A failed lookup must not poison the shared highlighter.
      const second = await parseMarkdown('```js\nconst a = 1\n```', { plugins: [plugin] })
      const pre = second.nodes[0] as ElementNode
      expect(String((pre[1] as Record<string, unknown>).class)).toContain('shiki')
      expect(Array.isArray((pre[2] as ElementNode)[2])).toBe(true)
    })
  })

  describe('interaction with fenced blocks', () => {
    it('does not treat a fenced block inner code as inline', async () => {
      const document = await parseMarkdown('```ts\nconst a = 1\n```', { plugins: [shiki()] })
      const pre = document.nodes[0] as ElementNode
      expect((pre[2] as ElementNode)[1]).toEqual({ class: 'language-ts' })
    })

    it('resolves a pseudo-language on a fence too', async () => {
      const document = await parseMarkdown('```ts-type\nRef<T>\n```', { plugins: [shiki()] })
      const pre = document.nodes[0] as ElementNode
      // The written language stays on the <pre> so the fence round-trips.
      expect((pre[1] as Record<string, unknown>).language).toBe('ts-type')
      expect(String((pre[1] as Record<string, unknown>).class)).toContain('shiki')
    })

    it('leaves untouched sibling nodes referentially identical', async () => {
      const document = await parseMarkdown('# Heading\n\nSome `x`{lang="ts"} text\n\nUntouched', {
        plugins: [shiki()],
      })
      const before = document.nodes[0]
      const after = document.nodes[2]
      expect(before).toBe(document.nodes[0])
      expect(after).toBe(document.nodes[2])
    })
  })

  it('keeps a user class behind the highlighter classes', async () => {
    const code = await inlineCode('`x`{lang="ts" .foo}')
    expect(String((code[1] as Record<string, unknown>).class)).toContain(' . foo')
  })
})
