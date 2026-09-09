import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/parse'
import { render } from '../src/render'
import footnotes from '../src/plugins/footnotes'
import type { Node } from '../src/types'

const renderHtml = async (md: string, options?: Parameters<typeof parseMarkdown>[1]) =>
  render(await parseMarkdown(md, options), { format: 'text/html', blockSeparator: '\n' })

const renderNodes = async (nodes: Node[]) =>
  render({ nodes, frontmatter: {}, meta: {} }, { format: 'text/html', blockSeparator: '\n' })

describe('HTML attribute escaping', () => {
  it('escapes double quotes in raw-HTML attribute values', async () => {
    const html = await renderHtml(`<span title='a" onmouseover=alert(1)'>hi</span>`)
    expect(html).toContain('title="a&quot; onmouseover=alert(1)"')
    expect(html).not.toContain('title="a" onmouseover=alert(1)"')
  })

  it('decodes &quot; inside quoted HTML attribute values', async () => {
    const tree = await parseMarkdown('<span title="A &quot;quote&quot;">hi</span>')
    const p = tree.nodes[0] as [string, Record<string, unknown>, ...Node[]]
    const span = (Array.isArray(p[2]) ? p[2] : p) as [string, Record<string, unknown>, ...Node[]]
    expect(span[0]).toBe('span')
    expect(span[1].title).toBe('A "quote"')

    const html = await renderHtml('<span title="A &quot;quote&quot;">hi</span>')
    expect(html).toContain('title="A &quot;quote&quot;"')
    expect(html).not.toContain('title="A "quote""')
  })

  it('escapes quotes in component attribute props', async () => {
    const html = await renderHtml(`:span[hi]{title='a" onmouseover=alert(1) x="b'}`)
    expect(html).toContain('title="a&quot; onmouseover=alert(1) x=&quot;b"')
    expect(html).not.toContain('onmouseover=alert(1) x="b">')
  })

  it('escapes quotes in unquoted attribute values', async () => {
    const html = await renderHtml(`:span[hi]{id=x"onmouseover="alert(1)}`)
    expect(html).toContain('id="x&quot;onmouseover=&quot;alert(1)"')
  })

  it('escapes quotes in code fence info string meta', async () => {
    const html = await renderHtml('```js " onmouseover="alert(1)\ncode\n```')
    expect(html).not.toContain('" onmouseover="alert(1)">')
    expect(html).toContain('&quot;')
  })

  it('escapes quotes in code fence filename', async () => {
    const html = await renderHtml('```js [a" onmouseover="alert(1)]\ncode\n```')
    expect(html).toContain('filename="a&quot; onmouseover=&quot;alert(1)"')
  })

  it('escapes quotes in image alt text', async () => {
    const html = await renderHtml('![a" onerror="alert(1)](x.png)')
    expect(html).not.toContain('alt="a" onerror="alert(1)"')
  })

  it('escapes ampersands and angle brackets in attribute values', async () => {
    const html = await renderHtml(`<span title="a&b<c>d">hi</span>`)
    expect(html).toContain('title="a&amp;b&lt;c&gt;d"')
  })

  it('escapes bare ampersands in URL attribute values', async () => {
    // Query-string `&` must become `&amp;` in HTML attrs (HTML5).
    // Re-parse still yields bare `&` because htmlparser2 decodes entities.
    const html = await renderHtml(`<img src="https://x.com/?a=1&b=2" alt="x">`)
    expect(html).toContain('src="https://x.com/?a=1&amp;b=2"')
    const tree = await parseMarkdown(html)
    const img = tree.nodes[0] as [string, Record<string, unknown>]
    expect(img[1].src).toBe('https://x.com/?a=1&b=2')
  })

  it('escapes object attribute values as JSON with entities', async () => {
    const html = await renderNodes([['div', { ':data': { x: '"><img src=x onerror=alert(1)>' } }, 'hi']])
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('&quot;')
  })

  it('drops attribute names with unsafe characters', async () => {
    const html = await renderNodes([['span', { '"onmouseover': 'alert(1)' }, 'hi']])
    expect(html).not.toContain('onmouseover')
  })
})

describe('prototype-safe handler lookup', () => {
  it('does not invoke Object.prototype.constructor as a node handler', async () => {
    const html = await renderNodes([
      ['p', {}, 'before'],
      ['constructor', {}, '<img src=x onerror=alert(1)>'],
    ])
    // The unknown element falls through to the generic html handler, which
    // escapes text children — no raw markup may reach the output.
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).toContain('<p>before</p>')
  })

  it('does not throw on __proto__ node names', async () => {
    const html = await renderNodes([['__proto__', {}, 'x']])
    expect(html).toContain('x')
  })

  it('does not throw on other Object.prototype member names', async () => {
    for (const name of ['valueOf', 'hasOwnProperty', 'toString', 'isPrototypeOf']) {
      const html = await renderNodes([[name, {}, 'x']])
      expect(html).toContain('x')
    }
  })
})

describe('footnote label sanitization', () => {
  it('strips unsafe characters from footnote href/id values', async () => {
    const md = `Hi[^a"onmouseover=alert(1)]\n\n[^a"onmouseover=alert(1)]: note`
    const html = await renderHtml(md, { plugins: [footnotes()] })
    // `"` -> -22-, `=` -> -3d-, `(` -> -28-, `)` -> -29-
    expect(html).toContain('href="#fn-a-22-onmouseover-3d-alert-28-1-29-"')
    expect(html).not.toContain('#fn-a"onmouseover')
  })
})

describe('code fence language', () => {
  it('stops the language at quotes and angle brackets', async () => {
    const doc = await parseMarkdown('```js"><script>\ncode\n```')
    const pre = doc.nodes[0] as [string, Record<string, unknown>, ...Node[]]
    expect(pre[1].language).toBe('js')
  })
})
