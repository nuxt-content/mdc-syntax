import { describe, it, expect } from 'vitest'
import { parseMarkdown } from 'comark'
import { createHtmlRenderer, renderHtml, renderHtmlFromDocument } from '../src/index'

describe('renderHtml', () => {
  it('converts markdown to html', async () => {
    const html = await renderHtml('# Hello\n\nThis is **bold**.')
    expect(html).toContain('<h1')
    expect(html).toContain('Hello')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('handles inline formatting', async () => {
    const html = await renderHtml('_italic_ and `code`')
    expect(html).toContain('<em>italic</em>')
    expect(html).toContain('<code>code</code>')
  })

  it('handles lists', async () => {
    const html = await renderHtml('- Item 1\n- Item 2\n- Item 3')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>Item 1</li>')
    expect(html).toContain('<li>Item 2</li>')
  })

  it('handles blockquotes', async () => {
    const html = await renderHtml('> This is a quote')
    expect(html).toContain('<blockquote>')
    expect(html).toContain('This is a quote')
  })

  it('handles links', async () => {
    const html = await renderHtml('[comark](https://comark.dev)')
    expect(html).toContain('<a href="https://comark.dev">')
    expect(html).toContain('comark')
  })

  it('handles code blocks', async () => {
    const html = await renderHtml('```js\nconsole.log("hi")\n```')
    expect(html).toContain('<pre')
    expect(html).toContain('<code')
    expect(html).toContain('console.log')
  })

  it('handles tables', async () => {
    const html = await renderHtml('| A | B |\n|---|---|\n| 1 | 2 |')
    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
    expect(html).toContain('<td>')
  })

  it('accepts render options with custom components', async () => {
    const html = await renderHtml('::note\nHello!\n::', {
      components: {
        note: async ([, , ...children], { render }) => `<aside>${await render(children)}</aside>`,
      },
    })
    expect(html).toContain('<aside>')
    expect(html).toContain('Hello!')
    expect(html).not.toContain('<note')
  })

  it('strips frontmatter from output', async () => {
    const html = await renderHtml('---\ntitle: Test\n---\n\n# Content')
    expect(html).not.toContain('title:')
    expect(html).not.toContain('---')
    expect(html).toContain('<h1')
  })

  it('passes parser options through', async () => {
    // `autoClose: false` matches the default for a non-streaming render, so force
    // healing on to prove the option reaches the parser.
    const html = await renderHtml('**bold', { autoClose: true })
    expect(html).toContain('<strong>')
  })

  it('leaves incomplete markdown alone by default', async () => {
    const html = await renderHtml('**bold')
    expect(html).toContain('**bold')
    expect(html).not.toContain('<strong>')
  })
})

describe('createHtmlRenderer', () => {
  it('returns a reusable render function', async () => {
    const renderFn = createHtmlRenderer()
    const html1 = await renderFn('# Doc 1')
    const html2 = await renderFn('# Doc 2')
    expect(html1).toContain('Doc 1')
    expect(html2).toContain('Doc 2')
  })

  it('reuses parser options across calls', async () => {
    const renderFn = createHtmlRenderer({
      components: {
        badge: ([, attrs]) => `<span class="badge badge-${attrs.type}">${attrs.label}</span>`,
      },
    })

    const html1 = await renderFn('::badge{type="info" label="New"}\n::')
    const html2 = await renderFn('::badge{type="warning" label="Deprecated"}\n::')

    expect(html1).toContain('<span class="badge badge-info">New</span>')
    expect(html2).toContain('<span class="badge badge-warning">Deprecated</span>')
  })

  it('passes data to component renderers', async () => {
    const renderFn = createHtmlRenderer({
      components: {
        version: async ([, , ...children], { render, data }) =>
          `<span data-v="${data?.version}">${await render(children)}</span>`,
      },
      data: { version: '2.0' },
    })

    const html = await renderFn('::version\ncurrent\n::')
    expect(html).toContain('data-v="2.0"')
    expect(html).toContain('current')
  })

  it('accepts parse options', async () => {
    const renderFn = createHtmlRenderer({
      autoUnwrap: true,
    })
    const html = await renderFn('Just text')
    // autoUnwrap removes <p> wrapper from single-inline content in components
    expect(html).toBeTruthy()
  })
})

describe('renderHtmlFromDocument', () => {
  it('renders a pre-parsed document', async () => {
    const doc = await parseMarkdown('# Title\n\n**Bold** text.')
    const html = await renderHtmlFromDocument(doc)
    expect(html).toContain('<h1')
    expect(html).toContain('Title')
    expect(html).toContain('<strong>Bold</strong>')
  })

  it('renders without options', async () => {
    const doc = await parseMarkdown('Hello _world_')
    const html = await renderHtmlFromDocument(doc)
    expect(html).toContain('<em>world</em>')
  })

  it('renders custom components', async () => {
    const doc = await parseMarkdown('::alert{type="warning"}\nWatch out!\n::')
    const html = await renderHtmlFromDocument(doc, {
      components: {
        alert: async ([, attrs, ...children], { render }) =>
          `<div role="alert" class="alert-${attrs.type}">${await render(children)}</div>`,
      },
    })
    expect(html).toContain('role="alert"')
    expect(html).toContain('class="alert-warning"')
    expect(html).toContain('Watch out!')
    expect(html).not.toContain('<alert')
  })

  it('passes data to component renderers', async () => {
    const doc = await parseMarkdown('::header\nWelcome\n::')
    const html = await renderHtmlFromDocument(doc, {
      data: { siteName: 'My Blog' },
      components: {
        header: async ([, , ...children], { render, data }) =>
          `<header><h1>${data?.siteName}</h1>${await render(children)}</header>`,
      },
    })
    expect(html).toContain('<h1>My Blog</h1>')
    expect(html).toContain('Welcome')
  })

  it('renders nested components', async () => {
    const doc = await parseMarkdown('::outer\n:::inner\nDeep\n:::\n::')
    const html = await renderHtmlFromDocument(doc, {
      components: {
        outer: async ([, , ...children], { render }) => `<div class="outer">${await render(children)}</div>`,
        inner: async ([, , ...children], { render }) => `<div class="inner">${await render(children)}</div>`,
      },
    })
    expect(html).toContain('<div class="outer">')
    expect(html).toContain('<div class="inner">')
    expect(html).toContain('Deep')
  })

  it('leaves unknown components as-is when no renderer provided', async () => {
    const doc = await parseMarkdown('::custom\nContent\n::')
    const html = await renderHtmlFromDocument(doc)
    expect(html).toContain('Content')
  })

  it('handles inline HTML elements', async () => {
    const doc = await parseMarkdown('Text with <strong class="highlight">HTML</strong>')
    const html = await renderHtmlFromDocument(doc)
    expect(html).toContain('<strong class="highlight">HTML</strong>')
  })
})

describe('async node handlers', () => {
  it('handler returning a Promise is awaited', async () => {
    const doc = await parseMarkdown('::card{title="Hello"}\nBody\n::')
    const html = await renderHtmlFromDocument(doc, {
      components: {
        card: async ([, attrs, ...children], { render }) => {
          const title = await Promise.resolve(String(attrs.title).toUpperCase())
          return `<div class="card"><h2>${title}</h2>${await render(children)}</div>`
        },
      },
    })
    expect(html).toContain('<h2>HELLO</h2>')
    expect(html).toContain('Body')
  })

  it('multiple async handlers run in the correct order', async () => {
    const doc = await parseMarkdown('::a\n::b\nB content\n::\n::c\nC content\n::\n::')
    const log: string[] = []
    const html = await renderHtmlFromDocument(doc, {
      components: {
        a: async ([, , ...children], { render }) => {
          const content = await render(children)
          return `<div class="a">${content}</div>`
        },
        b: async ([, , ...children], { render }) => {
          await Promise.resolve()
          log.push('b')
          return `<b>${await render(children)}</b>`
        },
        c: async ([, , ...children], { render }) => {
          await Promise.resolve()
          log.push('c')
          return `<c>${await render(children)}</c>`
        },
      },
    })
    expect(log).toEqual(['b', 'c'])
    expect(html.indexOf('<b>')).toBeLessThan(html.indexOf('<c>'))
  })

  it('async handler can fetch external data', async () => {
    const db: Record<string, string> = { 42: 'Fetched Content' }
    const doc = await parseMarkdown('::widget{id="42"}\n::')
    const html = await renderHtmlFromDocument(doc, {
      components: {
        widget: async ([, attrs]) => {
          const content = await Promise.resolve(db[String(attrs.id)] ?? 'Not found')
          return `<div class="widget">${content}</div>`
        },
      },
    })
    expect(html).toContain('<div class="widget">Fetched Content</div>')
  })

  it('nested async handlers resolve correctly', async () => {
    const doc = await parseMarkdown('::outer\n:::inner\nDeep\n:::\n::')
    const html = await renderHtmlFromDocument(doc, {
      components: {
        outer: async ([, , ...children], { render }) => {
          const content = await Promise.resolve(await render(children))
          return `<outer>${content}</outer>`
        },
        inner: async ([, , ...children], { render }) => {
          const content = await Promise.resolve(await render(children))
          return `<inner>${content}</inner>`
        },
      },
    })
    expect(html).toContain('<outer><inner>')
    expect(html).toContain('Deep')
  })
})
