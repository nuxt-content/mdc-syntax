import { describe, expect, it } from 'vitest'
import { createMarkdownParser, parseMarkdown } from '../src/parse.ts'

describe('ParserOptions.autoClose', () => {
  describe("default ('streaming')", () => {
    it('leaves an unmatched emphasis opener literal on a plain parse', async () => {
      const tree = await parseMarkdown('a _b')
      expect(tree.nodes).toEqual([['p', {}, 'a _b']])
    })

    it('leaves an unmatched asterisk opener literal on a plain parse', async () => {
      const tree = await parseMarkdown('a *b')
      expect(tree.nodes).toEqual([['p', {}, 'a *b']])
    })

    it('heals when the parse call opts into streaming', async () => {
      const parse = createMarkdownParser()
      const tree = await parse('a _b', { streaming: true })
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a ', ['em', {}, 'b']]])
    })

    it('is equivalent to passing the string explicitly', async () => {
      const explicit = await parseMarkdown('a _b', { autoClose: 'streaming' })
      expect(explicit.nodes).toEqual([['p', {}, 'a _b']])
    })

    it('leaves an unclosed component fence to the components plugin', async () => {
      const tree = await parseMarkdown('::alert\nHello')
      expect(tree.nodes).toEqual([['alert', {}, 'Hello']])
    })
  })

  describe('true', () => {
    it('heals on a plain, non-streaming parse', async () => {
      const tree = await parseMarkdown('a _b', { autoClose: true })
      expect(tree.nodes).toEqual([['p', {}, 'a ', ['em', {}, 'b']]])
    })
  })

  describe('false', () => {
    it('never heals, even while streaming', async () => {
      const parse = createMarkdownParser({ autoClose: false })
      const tree = await parse('a _b', { streaming: true })
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a _b']])
    })
  })

  describe('custom function', () => {
    it('runs on a non-streaming parse', async () => {
      const tree = await parseMarkdown('a _b', { autoClose: (markdown) => `${markdown}_` })
      expect(tree.nodes).toEqual([['p', {}, 'a ', ['em', {}, 'b']]])
    })

    it('runs on a streaming parse', async () => {
      const parse = createMarkdownParser({ autoClose: (markdown) => `${markdown}_` })
      const tree = await parse('a _b', { streaming: true })
      expect(tree.nodes).toEqual([['p', { $: { line: 1 } }, 'a ', ['em', {}, 'b']]])
    })
  })
})
