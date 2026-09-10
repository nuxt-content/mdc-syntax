import { describe, expect, it } from 'vitest'
import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { Markdown } from '../src/index'

async function renderAsync(element: React.ReactElement): Promise<string> {
  const stream = await renderToReadableStream(element)
  await stream.allReady
  return new Response(stream).text()
}

// The `streaming` prop drives the renderer (caret, stream components) but it also
// has to reach the parser: auto-close heals only on a streaming parse.
describe('<Markdown streaming>', () => {
  it('heals incomplete markdown while streaming', async () => {
    const html = await renderAsync(
      <Markdown
        value="Hello **wor"
        streaming
      />
    )
    expect(html).toContain('<strong>')
    expect(html).toContain('wor')
  })

  it('leaves incomplete markdown alone when not streaming', async () => {
    const html = await renderAsync(<Markdown value="Hello **wor" />)
    expect(html).not.toContain('<strong>')
    expect(html).toContain('**wor')
  })

  it('still heals a non-streaming parse when asked explicitly', async () => {
    const html = await renderAsync(
      <Markdown
        value="Hello **wor"
        options={{ autoClose: true }}
      />
    )
    expect(html).toContain('<strong>')
  })
})
