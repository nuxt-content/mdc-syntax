import { describe, expect, it } from 'vitest'
import { createMarkdownParser } from '../src/parse'
import type { ComarkTracer, ComarkSpan, ComarkSpanOptions } from '../src/types'

interface RecordedSpan {
  name: string
  parent?: string
  attributes?: Record<string, unknown>
}

/**
 * Minimal OTel-shaped recorder with a parent stack (correct under serial /
 * nested async; concurrent overlapping parses need a real OTel context).
 */
function createRecorder() {
  const spans: RecordedSpan[] = []
  const stack: string[] = []
  let nextId = 0

  function start(name: string, options?: ComarkSpanOptions): ComarkSpan {
    const parent = stack[stack.length - 1]
    let ended = false
    return {
      end() {
        if (ended) return
        ended = true
        spans.push({ name, parent, attributes: options?.attributes })
      },
    }
  }

  const tracer: ComarkTracer = {
    startSpan(name, options) {
      return start(name, options)
    },
    startActiveSpan(
      name: string,
      optionsOrFn: ComarkSpanOptions | ((span: ComarkSpan) => unknown),
      fn?: (span: ComarkSpan) => unknown
    ) {
      const options = typeof optionsOrFn === 'function' ? undefined : optionsOrFn
      const run = typeof optionsOrFn === 'function' ? optionsOrFn : fn!
      const id = `${name}:${++nextId}`
      const parent = stack[stack.length - 1]
      stack.push(id)
      const span: ComarkSpan = {
        end() {
          const idx = stack.lastIndexOf(id)
          if (idx !== -1) stack.splice(idx, 1)
          spans.push({ name, parent, attributes: options?.attributes })
        },
      }
      // Note: real OTel leaves end() to the caller — same here; withSpan ends it.
      return run(span)
    },
  }

  return { tracer, spans }
}

const markdown = `---
title: Hello
---

# Hello **world**

::alert
hi
::
`

describe('ParserOptions.tracer', () => {
  it('records phase and per-plugin spans in pipeline order', async () => {
    const { tracer, spans } = createRecorder()
    // `autoClose: true` forces healing on a non-streaming parse so the
    // `comark:autoclose` span is recorded; the default only heals while streaming.
    const parse = createMarkdownParser({ tracer, autoClose: true })
    const tree = await parse(markdown)

    expect(tree.frontmatter).toEqual({ title: 'Hello' })

    const names = spans.map((span) => span.name)
    expect(names).toContain('comark:parse')
    expect(names).toContain('comark:autoclose')
    expect(names).toContain('comark:tokenize')
    expect(names).toContain('comark:nodes')
    // Default plugins with hooks record under their own name.
    expect(names).toContain('comark:pre:frontmatter')

    // Completion order: children finish before parent, so comark:parse is last.
    const order = ['comark:autoclose', 'comark:pre:frontmatter', 'comark:tokenize', 'comark:nodes', 'comark:parse']
    const indexes = order.map((name) => names.indexOf(name))
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it('nests children under the active comark:parse span', async () => {
    const { tracer, spans } = createRecorder()
    const parse = createMarkdownParser({
      tracer,
      plugins: [
        {
          name: 'my-plugin',
          pre: () => {},
          post: () => {},
        },
      ],
    })
    await parse(markdown)

    const root = spans.find((span) => span.name === 'comark:parse')
    expect(root).toBeTruthy()
    expect(root?.parent).toBeUndefined()

    const children = spans.filter((span) => span.name !== 'comark:parse')
    expect(children.length).toBeGreaterThan(0)
    // Every child recorded while parse was active → parent is the parse span id.
    for (const child of children) {
      expect(child.parent).toMatch(/^comark:parse:\d+$/)
    }
  })

  it('records user plugin pre/post hooks under their plugin name', async () => {
    const { tracer, spans } = createRecorder()
    const parse = createMarkdownParser({
      tracer,
      plugins: [
        {
          name: 'my-plugin',
          pre: () => {},
          post: () => {},
        },
      ],
    })
    await parse(markdown)

    const names = spans.map((span) => span.name)
    expect(names).toContain('comark:pre:my-plugin')
    expect(names).toContain('comark:post:my-plugin')
  })

  it('produces identical output with and without tracer', async () => {
    const { tracer } = createRecorder()
    const withTracer = await createMarkdownParser({ tracer })(markdown)
    const withoutTracer = await createMarkdownParser()(markdown)
    expect(withTracer).toEqual(withoutTracer)
  })

  it('records spans on the streaming path too', async () => {
    const { tracer, spans } = createRecorder()
    const parse = createMarkdownParser({ tracer })
    await parse('# Hello', { streaming: true })
    await parse('# Hello\n\nmore **text', { streaming: true })

    expect(spans.filter((span) => span.name === 'comark:parse').length).toBe(2)
    expect(spans.filter((span) => span.name === 'comark:tokenize').length).toBe(2)
  })
})
