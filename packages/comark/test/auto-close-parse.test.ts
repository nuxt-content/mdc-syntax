import { describe, expect, it } from 'vitest'
import { createMarkdownParser } from '../src/parse.ts'

// The string-level contract lives in SPEC/auto-close.md. These pin the same fixes
// at AST level, so a healed string that still parses wrongly cannot slip through.
const parse = createMarkdownParser({ plugins: [] })
const heal = (markdown: string) => parse(markdown, { streaming: true })

describe('auto-close, parsed', () => {
  describe('code span delimiter runs', () => {
    it('does not leak a backtick after a finished double-backtick span', async () => {
      const tree = await heal('a ``x`` b')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a ', ['code', {}, 'x'], ' b']])
    })

    it('closes markers after the span without leaking a backtick', async () => {
      const tree = await heal('use ``a _b`` then _c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'use ', ['code', {}, 'a _b'], ' then ', ['em', {}, 'c']]])
    })

    it('keeps a single backtick inside a double-backtick span literal', async () => {
      const tree = await heal('``Use `code` in your Markdown file.``')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, ['code', {}, 'Use `code` in your Markdown file.']]])
    })

    it('closes an unclosed double-backtick span with a matching run', async () => {
      const tree = await heal('``{ modelValue: _Number<T> }')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, ['code', {}, '{ modelValue: _Number<T> }']]])
    })
  })

  describe('multiple openers on one line', () => {
    it('emits one closer for a repeated marker instead of nesting em in em', async () => {
      const tree = await heal('a _b and _c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a _b and ', ['em', {}, 'c']]])
    })

    it('collapses a repeated strong marker', async () => {
      const tree = await heal('a __b and __c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a __b and ', ['strong', {}, 'c']]])
    })

    it('collapses a repeated strikethrough marker', async () => {
      const tree = await heal('a ~~b and ~~c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a ~~b and ', ['del', {}, 'c']]])
    })

    it('still nests markers of different families', async () => {
      const tree = await heal('_a **b _c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, ['em', {}, 'a ', ['strong', {}, 'b ', ['em', {}, 'c']]]]])
    })

    it('still closes a strong opened inside an em', async () => {
      const tree = await heal('a _b and __c')
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a ', ['em', {}, 'b and ', ['strong', {}, 'c']]]])
    })
  })
})
