import { describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { defineComarkPlugin, getMarkdownParser } from 'comark'
import { Markdown } from '../src/index'

/**
 * A plugin whose `markdownItPlugins` array is consumed once per parser
 * construction, so the spy's call count is the construction count.
 */
function constructionCounter() {
  let constructions = 0
  const plugin = defineComarkPlugin(() => ({
    name: 'construction-counter',
    markdownItPlugins: [
      () => {
        constructions++
      },
    ],
  }))
  return { plugin, constructions: () => constructions }
}

async function renderAll(props: Record<string, any>[]) {
  const app = createSSRApp({
    setup() {
      return () => props.map((p, i) => h(Markdown, { key: i, ...p }))
    },
  })
  return renderToString(app as any)
}

describe('parser reuse', () => {
  it('builds one parser for many instances with the same config', async () => {
    const { plugin, constructions } = constructionCounter()
    const plugins = [plugin()]

    const html = await renderAll(Array.from({ length: 50 }, (_, i) => ({ value: `Item **${i}**`, plugins })))

    expect(constructions()).toBe(1)
    expect(html).toContain('<strong>0</strong>')
    expect(html).toContain('<strong>49</strong>')
  })

  it('gives a streaming instance its own parser', async () => {
    const { plugin, constructions } = constructionCounter()
    const plugins = [plugin()]

    await renderAll([
      { value: 'Plain **one**', plugins },
      { value: 'Stream **two**', plugins, streaming: true },
      { value: 'Plain **three**', plugins },
    ])

    // One shared parser for the two non-streaming instances, one private
    // parser for the streaming one.
    expect(constructions()).toBe(2)
  })

  it('does not construct a parser at all when one is passed in', async () => {
    const { plugin, constructions } = constructionCounter()
    const parser = getMarkdownParser({ unwrap: 'parser-prop-probe' })

    const html = await renderAll([{ value: 'Passed **in**', plugins: [plugin()], parser }])

    expect(constructions()).toBe(0)
    expect(html).toContain('<strong>in</strong>')
  })

  it('rebuilds when the options change', async () => {
    const { plugin, constructions } = constructionCounter()
    const plugins = [plugin()]

    await renderAll([
      { value: 'One **a**', plugins, options: { linkify: true } },
      { value: 'Two **b**', plugins, options: { linkify: false } },
    ])

    expect(constructions()).toBe(2)
  })
})
