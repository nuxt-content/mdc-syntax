import { describe, expect, it } from 'vitest'
import { createMarkdownParser } from '../src/parse.ts'
import { defineComarkPlugin } from '../src/utils/helpers.ts'

/** Counts how many times the pipeline actually ran. */
function counter() {
  let calls = 0
  const plugin = defineComarkPlugin(() => ({
    name: 'counter',
    post() {
      calls++
    },
  }))
  return { plugin, calls: () => calls }
}

describe('ParserOptions.cache', () => {
  it('is off by default', async () => {
    const parse = createMarkdownParser()
    expect(await parse('hello')).not.toBe(await parse('hello'))
  })

  it('returns the identical document on a hit', async () => {
    const parse = createMarkdownParser({ cache: true })
    expect(await parse('hello **world**')).toBe(await parse('hello **world**'))
  })

  it('runs the pipeline once for concurrent identical calls', async () => {
    const { plugin, calls } = counter()
    const parse = createMarkdownParser({ cache: true, plugins: [plugin()] })

    await Promise.all(Array.from({ length: 20 }, () => parse('same source')))
    expect(calls()).toBe(1)
  })

  it('keys on the source, so different sources miss', async () => {
    const { plugin, calls } = counter()
    const parse = createMarkdownParser({ cache: true, plugins: [plugin()] })

    await parse('one')
    await parse('two')
    await parse('one')
    expect(calls()).toBe(2)
  })

  it('never serves or fills the cache for a streaming parse', async () => {
    const { plugin, calls } = counter()
    const parse = createMarkdownParser({ cache: true, plugins: [plugin()] })

    await parse('tail', { streaming: true })
    await parse('tail', { streaming: true })
    expect(calls()).toBe(2)

    // The streaming parses must not have populated the cache either.
    await parse('tail')
    expect(calls()).toBe(3)
  })

  it('does not cache a failed parse', async () => {
    let shouldThrow = true
    const plugin = defineComarkPlugin(() => ({
      name: 'flaky',
      post() {
        if (shouldThrow) {
          shouldThrow = false
          throw new Error('boom')
        }
      },
    }))
    const parse = createMarkdownParser({ cache: true, plugins: [plugin()] })

    await expect(parse('source')).rejects.toThrow('boom')
    await expect(parse('source')).resolves.toBeDefined()
  })

  it('evicts the coldest entry past the bound', async () => {
    const { plugin, calls } = counter()
    const parse = createMarkdownParser({ cache: 2, plugins: [plugin()] })

    await parse('a')
    await parse('b')
    await parse('a') // touch, so `b` is now coldest
    await parse('c') // evicts `b`
    expect(calls()).toBe(3)

    await parse('a')
    expect(calls()).toBe(3) // still cached

    await parse('b')
    expect(calls()).toBe(4) // was evicted
  })

  it('treats cache: 0 as disabled', async () => {
    const parse = createMarkdownParser({ cache: 0 })
    expect(await parse('hello')).not.toBe(await parse('hello'))
  })

  it('accepts a Map-compatible store', async () => {
    const store = new Map()
    const parse = createMarkdownParser({ cache: store })

    const first = await parse('hello')
    expect(store.size).toBe(1)
    expect(await parse('hello')).toBe(first)
  })
})
