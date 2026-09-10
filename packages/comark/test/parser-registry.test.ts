import { describe, expect, it, vi } from 'vitest'
import { createMarkdownParser, getMarkdownParser, parseMarkdown } from '../src/parse.ts'
import { defineComarkPlugin } from '../src/utils/helpers.ts'

const noop = defineComarkPlugin(() => ({ name: 'noop' }))

describe('getMarkdownParser', () => {
  it('returns the same parser for equivalent options', () => {
    expect(getMarkdownParser()).toBe(getMarkdownParser())
    expect(getMarkdownParser({ linkify: false })).toBe(getMarkdownParser({ linkify: false }))
  })

  it('ignores key order', () => {
    expect(getMarkdownParser({ autoUnwrap: true, linkify: true })).toBe(
      getMarkdownParser({ linkify: true, autoUnwrap: true })
    )
  })

  it('treats an explicit undefined as absent', () => {
    expect(getMarkdownParser({ autoUnwrap: undefined })).toBe(getMarkdownParser())
  })

  it('returns different parsers for different options', () => {
    expect(getMarkdownParser({ linkify: false })).not.toBe(getMarkdownParser({ linkify: true }))
    expect(getMarkdownParser({ unwrap: 'p' })).not.toBe(getMarkdownParser({ unwrap: 'div' }))
  })

  it('matches a fresh array holding the same plugin instances', () => {
    const plugin = noop()
    expect(getMarkdownParser({ plugins: [plugin] })).toBe(getMarkdownParser({ plugins: [plugin] }))
  })

  it('matches a fresh array of primitives', () => {
    expect(getMarkdownParser({ unwrap: ['p'] })).toBe(getMarkdownParser({ unwrap: ['p'] }))
  })

  it('does not match two instances from the same factory', () => {
    expect(getMarkdownParser({ plugins: [noop()] })).not.toBe(getMarkdownParser({ plugins: [noop()] }))
  })

  it('distinguishes plugin order', () => {
    const a = noop()
    const b = defineComarkPlugin(() => ({ name: 'other' }))()
    expect(getMarkdownParser({ plugins: [a, b] })).not.toBe(getMarkdownParser({ plugins: [b, a] }))
  })

  it('evicts the least recently used configuration past the bound', () => {
    const first = getMarkdownParser({ unwrap: 'lru-probe' })
    // The registry holds 32 parsers; 40 distinct configurations push it out.
    for (let i = 0; i < 40; i++) getMarkdownParser({ unwrap: `lru-filler-${i}` })
    expect(getMarkdownParser({ unwrap: 'lru-probe' })).not.toBe(first)
  })

  it('warns once when used for a streaming parse', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const parse = getMarkdownParser({ unwrap: 'streaming-warn-probe' })

    await parse('a', { streaming: true })
    await parse('a b', { streaming: true })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]?.[0])).toContain('getMarkdownParser')
    warn.mockRestore()
  })

  it('parses concurrently on one shared parser', async () => {
    const parse = getMarkdownParser()
    const source = 'Hello **world** and `code`'
    const baseline = await parse(source)

    const results = await Promise.all(Array.from({ length: 50 }, () => parse(source)))
    for (const result of results) expect(result.nodes).toEqual(baseline.nodes)
  })
})

describe('createMarkdownParser', () => {
  it('still returns a fresh parser every call', () => {
    expect(createMarkdownParser()).not.toBe(createMarkdownParser())
  })
})

describe('parseMarkdown', () => {
  it('still parses correctly through the shared registry', async () => {
    const tree = await parseMarkdown('Hello **world**')
    expect(tree.nodes).toEqual([['p', {}, 'Hello ', ['strong', {}, 'world']]])
  })
})
