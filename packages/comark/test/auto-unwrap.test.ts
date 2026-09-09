import { describe, expect, it } from 'vitest'
import { applyAutoUnwrap } from '../src/internal/parse/utils'
import { TREE_WALK_MAX_DEPTH } from 'comark/utils'
import type { Node } from 'comark'

describe('applyAutoUnwrap', () => {
  it('should not modify elements without paragraph children', () => {
    const node: Node = ['div', {}, ['span', {}, 'Text']]

    const result = applyAutoUnwrap(node)
    expect(result).toEqual(['div', {}, ['span', {}, 'Text']])
  })

  it('should unwrap single paragraph in container components', () => {
    const node: Node = ['alert', {}, ['p', {}, 'This is ', ['strong', {}, 'bold'], ' text']]

    const result = applyAutoUnwrap(node)

    // Paragraph should be unwrapped, content hoisted up
    expect(result.length).toBe(2 + 3 /* text, strong, text */)
    expect(result).toEqual(['alert', {}, 'This is ', ['strong', {}, 'bold'], ' text'])
  })

  it('should not unwrap when there are multiple paragraphs', () => {
    const node: Node = ['card', {}, ['p', {}, 'First paragraph'], ['p', {}, 'Second paragraph']]

    const result = applyAutoUnwrap(node)
    // Should not unwrap when there are multiple paragraphs
    expect(result).toEqual(['card', {}, ['p', {}, 'First paragraph'], ['p', {}, 'Second paragraph']])
  })

  it('should not unwrap when paragraph is mixed with other block elements', () => {
    const node: Node = ['note', {}, ['p', {}, 'Text'], ['ul', {}, ['li', {}, 'item']]]

    const result = applyAutoUnwrap(node)
    // Should not unwrap when there are other block elements
    expect(result).toEqual(['note', {}, ['p', {}, 'Text'], ['ul', {}, ['li', {}, 'item']]])
  })

  it('should not unwrap when there are code blocks', () => {
    const node: Node = ['tip', {}, ['pre', {}, ['code', {}, 'code']]]

    const result = applyAutoUnwrap(node)
    // Should not unwrap code blocks (no p element)
    expect(result).toEqual(['tip', {}, ['pre', {}, ['code', {}, 'code']]])
  })

  it('should not unwrap when there are tables', () => {
    const node: Node = ['card', {}, ['table', {}, ['tbody', {}, ['tr', {}, ['td', {}, 'Cell']]]]]

    const result = applyAutoUnwrap(node)
    expect(result).toEqual(['card', {}, ['table', {}, ['tbody', {}, ['tr', {}, ['td', {}, 'Cell']]]]])
  })

  it('should not unwrap when there are template elements (named slots)', () => {
    const node: Node = ['callout', {}, ['template', { '#title': '' }, 'Title']]

    const result = applyAutoUnwrap(node)
    // Template elements should be preserved
    expect(result).toEqual(['callout', {}, ['template', { '#title': '' }, 'Title']])
  })

  it('should handle empty children array', () => {
    const node: Node = ['alert', {}]

    const result = applyAutoUnwrap(node)
    expect(result).toEqual(['alert', {}])
  })

  it('should preserve node props and other properties', () => {
    const node: Node = ['alert', { variant: 'danger', id: 'alert-1' }, ['p', {}, 'Error']]

    const result = applyAutoUnwrap(node)

    expect(result[0]).toBe('alert')
    expect(result[1]).toEqual({ variant: 'danger', id: 'alert-1' })
    // Should unwrap the paragraph
    expect(result).toEqual(['alert', { variant: 'danger', id: 'alert-1' }, 'Error'])
  })

  it('should unwrap paragraph even with empty text nodes', () => {
    const node: Node = ['warning', {}, '\n', ['p', {}, 'Warning text'], '\n']

    const result = applyAutoUnwrap(node)
    // Should unwrap the paragraph and filter out whitespace
    expect(result).toEqual(['warning', {}, 'Warning text'])
  })

  it('should not unwrap a markdown paragraph next to HTML siblings', () => {
    const node: Node = [
      'details',
      { $: { html: 1, block: 1 } },
      ['summary', { $: { html: 1, block: 0 } }, 'Top'],
      ['p', {}, 'Body'],
    ]

    const result = applyAutoUnwrap(node)
    // Paragraph is not the sole child — keep the wrapper.
    expect(result).toEqual([
      'details',
      { $: { html: 1, block: 1 } },
      ['summary', { $: { html: 1, block: 0 } }, 'Top'],
      ['p', {}, 'Body'],
    ])
  })

  it('should still unwrap a sole markdown paragraph under an HTML container', () => {
    const node: Node = ['details', { $: { html: 1, block: 1 } }, ['p', {}, 'Only body']]

    const result = applyAutoUnwrap(node)
    expect(result).toEqual(['details', { $: { html: 1, block: 1 } }, 'Only body'])
  })

  it('should unwrap a nested paragraph within the depth cap', () => {
    // TREE_WALK_MAX_DEPTH wrappers (d0…dN-1) + paragraph — last wrapper is still processed.
    let node: Node = ['p', {}, 'Deep']
    for (let i = TREE_WALK_MAX_DEPTH - 1; i >= 0; i--) {
      node = [`d${i}`, {}, node]
    }

    const result = applyAutoUnwrap(node)
    let cursor = result as Node[]
    for (let i = 0; i < TREE_WALK_MAX_DEPTH; i++) {
      expect(cursor[0]).toBe(`d${i}`)
      cursor = cursor[2] as Node[]
    }
    expect(cursor).toBe('Deep')
  })

  it('should not walk past TREE_WALK_MAX_DEPTH element levels', () => {
    // TREE_WALK_MAX_DEPTH + 1 wrappers (d0…dN) + paragraph — last wrapper is past the cap.
    let node: Node = ['p', {}, 'Too deep']
    for (let i = TREE_WALK_MAX_DEPTH; i >= 0; i--) {
      node = [`d${i}`, {}, node]
    }

    const result = applyAutoUnwrap(node)
    let cursor = result as Node[]
    for (let i = 0; i <= TREE_WALK_MAX_DEPTH; i++) {
      expect(cursor[0]).toBe(`d${i}`)
      cursor = cursor[2] as Node[]
    }
    expect(cursor).toEqual(['p', {}, 'Too deep'])
  })
})
