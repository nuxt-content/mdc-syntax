import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parse'

// Regression tests for https://github.com/comarkdown/comark/issues/322
//
// `comark_block_yaml`, `comark_block_shorthand`, and `comark_block_slots` each
// narrowed `state.lineMax` after matching and never restored it, unlike
// `comark_block`. Since `skipEmptyLines` is bounded by `state.lineMax`, a
// *second* consecutive blank line inside a nested component fell through it
// unskipped, then failed the tokenizer's indent check: `comark_block_yaml`/
// `comark_block_shorthand` broke out of the loop and dropped every later
// sibling; `comark_block_slots` emitted a spurious empty paragraph instead.
//
// The fixes restore (or stop touching) `state.lineMax` so a blank-line run of
// any length is treated as a single separator, as in CommonMark.
describe('nested component with a run of blank lines between siblings', () => {
  describe('YAML props fence (`---`/`---`)', () => {
    const build = (blanks: number) =>
      `::outer\n  ::mid\n  ---\n  columns: 3\n  ---\n${['A', 'B', 'C']
        .map((name) => `    ::${name}\n    ---\n    display: "flex"\n    ---\n    ::`)
        .join('\n' + '\n'.repeat(blanks))}\n  ::\n::`

    const expected = [
      [
        'outer',
        {},
        [
          'mid',
          { ':columns': '3' },
          ['a', { display: 'flex' }],
          ['b', { display: 'flex' }],
          ['c', { display: 'flex' }],
        ],
      ],
    ]

    it.each([1, 2, 3, 7])('keeps every sibling with %i consecutive blank line(s) between them', async (blanks) => {
      const tree = await parseMarkdown(build(blanks))
      expect(tree.nodes).toEqual(expected)
    })

    it('still closes the enclosing component at its own marker after a blank run (no over-absorption)', async () => {
      // `mid` must still close at its own `::`, not swallow `after` too.
      const src = '::outer\n  ::mid\n  ---\n  columns: 3\n  ---\n    ::A\n    ::\n\n\n  ::\nafter\n::'
      const tree = await parseMarkdown(src)
      expect(tree.nodes).toEqual([['outer', {}, ['mid', { ':columns': '3' }, ['a', {}]], ['p', {}, 'after']]])
    })
  })

  describe('shorthand block (`:name[content]`)', () => {
    const build = (blanks: number) =>
      `::outer\n  :leaf1[hi]\n${'\n'.repeat(blanks)}  ::leaf2\n  ::\n${'\n'.repeat(blanks)}  ::leaf3\n  ::\n::`

    const expected = [['outer', {}, ['leaf1', {}, 'hi'], ['leaf2', {}], ['leaf3', {}]]]

    it.each([1, 2, 3, 7])('keeps every sibling with %i consecutive blank line(s) after it', async (blanks) => {
      const tree = await parseMarkdown(build(blanks))
      expect(tree.nodes).toEqual(expected)
    })

    it('still closes the enclosing component at its own marker after a blank run (no over-absorption)', async () => {
      const src = '::outer\n  :leaf1[hi]\n\n\nafter\n::'
      const tree = await parseMarkdown(src)
      expect(tree.nodes).toEqual([['outer', {}, ['leaf1', {}, 'hi'], ['p', {}, 'after']]])
    })
  })

  describe('template slot (`#slotname`)', () => {
    const build = (blanks: number) =>
      `::outer\n  #title\n  Hello\n  ::childA\n  ::\n${'\n'.repeat(blanks)}  ::childB\n  ::\n::`

    const expected = [
      ['outer', {}, ['template', { name: 'title' }, ['p', {}, 'Hello'], ['child-a', {}], ['child-b', {}]]],
    ]

    it.each([1, 2, 3, 7])(
      'keeps every sibling with %i consecutive blank line(s) between them, with no spurious paragraph token',
      async (blanks) => {
        const tree = await parseMarkdown(build(blanks))
        expect(tree.nodes).toEqual(expected)
      }
    )

    it('still terminates at the next `#slot` marker regardless of a preceding blank run', async () => {
      const src = '::outer\n  #title\n  Hello\n\n\n  #footer\n  Bye\n  ::'
      const tree = await parseMarkdown(src)
      expect(tree.nodes).toEqual([
        ['outer', {}, ['template', { name: 'title' }, 'Hello'], ['template', { name: 'footer' }, 'Bye']],
      ])
    })

    it('still terminates at the parent close after a blank run (no over-absorption)', async () => {
      const src = '::outer\n  #title\n  Hello\n\n\n  ::\nafter'
      const tree = await parseMarkdown(src)
      expect(tree.nodes).toEqual([
        ['outer', {}, ['template', { name: 'title' }, 'Hello']],
        ['p', {}, 'after'],
      ])
    })
  })
})
