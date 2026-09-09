import { describe, expect, it } from 'vitest'
import { parseMarkdown } from '../src/index'
import html from '../src/plugins/html'

const sponsorsUrl = 'https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'

describe('html({ markdown })', () => {
  it('parses markdown inside incomplete HTML by default', async () => {
    const result = await parseMarkdown('<ai-thinking>\n**bold**')

    expect(result.nodes).toEqual([['ai-thinking', { $: { html: 1, block: 1 } }, ['strong', {}, 'bold']]])
  })

  it('parses markdown inside closed HTML without a blank line by default', async () => {
    const result = await parseMarkdown('<div>\nHello **World**\n</div>')

    expect(result.nodes).toEqual([['div', { $: { html: 1, block: 1 } }, 'Hello ', ['strong', {}, 'World']]])
  })

  it('keeps markdown literal inside incomplete HTML when markdown: false', async () => {
    const result = await parseMarkdown('<ai-thinking>\n**bold**', {
      // Replace the default html plugin so only this config is active.
      plugins: [html({ markdown: false })],
    })

    // Body is a single text leaf → block: 0 (inline-like incomplete opener).
    expect(result.nodes).toEqual([['ai-thinking', { $: { html: 1, block: 1 } }, '**bold**']])
  })

  it('still parses markdown after a blank line when markdown: false', async () => {
    const result = await parseMarkdown('<ai-thinking>\n\n**bold**\n\n', {
      plugins: [html({ markdown: false })],
    })

    expect(result.nodes).toEqual([['ai-thinking', { $: { html: 1, block: 1 } }, ['strong', {}, 'bold']]])
  })

  it('still keeps closed HTML body literal without a blank line when markdown: false', async () => {
    const result = await parseMarkdown('<div>\nHello **World**\n</div>', {
      plugins: [html({ markdown: false })],
    })

    expect(result.nodes).toEqual([['div', { $: { html: 1, block: 1 } }, 'Hello **World**']])
  })

  it('parses markdown inside closed HTML after a blank line when markdown: false', async () => {
    const result = await parseMarkdown('<div>\n\nHello **World**\n\n</div>', {
      plugins: [html({ markdown: false })],
    })

    expect(result.nodes).toEqual([['div', { $: { html: 1, block: 1 } }, 'Hello ', ['strong', {}, 'World']]])
  })

  it('nests following markdown under an incomplete bare HTML opener (EOF)', async () => {
    const result = await parseMarkdown('<ai-thinking>\n\n**bold** and more\n\n- list\n- **item**')

    expect(result.nodes).toEqual([
      [
        'ai-thinking',
        { $: { html: 1, block: 1 } },
        ['p', {}, ['strong', {}, 'bold'], ' and more'],
        ['ul', {}, ['li', {}, 'list'], ['li', {}, ['strong', {}, 'item']]],
      ],
    ])
  })
})

describe('block-level raw HTML', () => {
  it('preserves inline children inside a self-contained block-level <p>', async () => {
    const result = await parseMarkdown('<p><img src="/foo.png" alt="x"></p>')

    expect(result.nodes).toEqual([
      ['p', { $: { html: 1, block: 1 } }, ['img', { $: { html: 1, block: 0 }, src: '/foo.png', alt: 'x' }]],
    ])
  })

  it('preserves mixed text and inline children inside a single-line block-level <p>', async () => {
    const result = await parseMarkdown('<p>hello <img src="/foo.png" alt="x"> world</p>')

    expect(result.nodes).toEqual([
      [
        'p',
        { $: { html: 1, block: 1 } },
        'hello ',
        ['img', { $: { html: 1, block: 0 }, src: '/foo.png', alt: 'x' }],
        ' world',
      ],
    ])
  })

  it('does not merge the following markdown paragraph into the preceding block-level <p>', async () => {
    const md = `# Hello

<p><img src="/foo.png" alt="x"></p>

That is some text here.`

    const result = await parseMarkdown(md)

    expect(result.nodes).toEqual([
      ['h1', { id: 'hello' }, 'Hello'],
      ['p', { $: { html: 1, block: 1 } }, ['img', { $: { html: 1, block: 0 }, src: '/foo.png', alt: 'x' }]],
      ['p', {}, 'That is some text here.'],
    ])
  })

  it('preserves text inside a single-line block-level <div>', async () => {
    const result = await parseMarkdown('<div>foo</div>')

    expect(result.nodes).toEqual([['div', { $: { html: 1, block: 1 } }, 'foo']])
  })

  it('parses markdown inside a tight multiline HTML <p> by default', async () => {
    const result = await parseMarkdown(`<p>
  this is **markdown**
</p>`)

    expect(result.nodes).toEqual([['p', { $: { html: 1, block: 1 } }, 'this is ', ['strong', {}, 'markdown']]])
  })

  it('nests blank-line markdown body under a matching HTML open/close pair', async () => {
    const result = await parseMarkdown(`<main>

this is **markdown**

</main>`)

    expect(result.nodes).toEqual([['main', { $: { html: 1, block: 1 } }, 'this is ', ['strong', {}, 'markdown']]])
  })

  it.skip('pairs HTML open/close split across paragraphs (inline opener + blank line)', async () => {
    // CommonMark leaves `<p>` / `</p>` in different paragraphs when a blank line
    // sits between them. html_balance lifts both to html_block so the body nests.
    const result = await parseMarkdown('dsd <p>Real paragraph\n\nwith `code <b>x</b>` inside.</p>')

    expect(result.nodes).toEqual([
      ['p', {}, 'dsd '],
      [
        'p',
        { $: { html: 1, block: 1 } },
        ['p', {}, 'Real paragraph'],
        ['p', {}, 'with ', ['code', {}, 'code <b>x</b>'], ' inside.'],
      ],
    ])
  })

  it.skip('keeps trailing text after a cross-boundary HTML closer outside the element', async () => {
    const result = await parseMarkdown('before <div>\n\n**bold**\n\n</div> after')

    expect(result.nodes).toEqual([
      ['p', {}, 'before '],
      ['div', { $: { html: 1, block: 1 } }, ['strong', {}, 'bold']],
      ['p', {}, 'after'],
    ])
  })

  it('parses markdown among mixed HTML children inside a closed multiline HTML block', async () => {
    const result = await parseMarkdown(`<div>
  before **strong**
  <img src="/x.png" alt="x"/>
  after \`code\`
</div>`)

    // Closed tight body stays one html_block; text leaves expand as inline markdown.
    expect(result.nodes).toEqual([
      [
        'div',
        { $: { html: 1, block: 1 } },
        'before ',
        ['strong', {}, 'strong'],
        ['img', { $: { html: 1, block: 0 }, src: '/x.png', alt: 'x' }],
        'after ',
        ['code', {}, 'code'],
      ],
    ])
  })

  it('nests blank-line markdown and HTML under a matching open/close pair', async () => {
    const result = await parseMarkdown(`<div>

before **strong**

<img src="/x.png" alt="x"/>

after \`code\`

</div>`)

    expect(result.nodes).toEqual([
      [
        'div',
        { $: { html: 1, block: 1 } },
        ['p', {}, 'before ', ['strong', {}, 'strong']],
        ['img', { $: { html: 1, block: 0 }, src: '/x.png', alt: 'x' }],
        ['p', {}, 'after ', ['code', {}, 'code']],
      ],
    ])
  })

  it('keeps indented non-HTML content inside a closed multiline HTML block as raw text', async () => {
    // No blank line before closer → CommonMark span; text leaves stay literal
    // (no block-level code fence from 4-space indent).
    const result = await parseMarkdown(`<div>
    const value = 1
</div>`)

    expect(result.nodes).toEqual([['div', { $: { html: 1, block: 1 } }, 'const value = 1']])
  })

  it('preserves HTML comments inside a multiline raw HTML block', async () => {
    const result = await parseMarkdown(`<div>
  <!-- note -->
  <img src="/x.png"/>
</div>`)

    expect(result.nodes).toEqual([
      ['div', { $: { html: 1, block: 1 } }, [null, {}, ' note '], ['img', { $: { html: 1, block: 0 }, src: '/x.png' }]],
    ])
  })

  it('multi <p>', async () => {
    const result = await parseMarkdown(`<p class="warning">This is a warning message.</p>
  <p class="success">Your changes have been saved.</p>
  <p class="info">More information is available here.</p>`)

    expect(result.nodes).toEqual([
      ['p', { $: { html: 1, block: 0 }, class: 'warning' }, 'This is a warning message.'],
      ['p', { $: { html: 1, block: 0 }, class: 'success' }, 'Your changes have been saved.'],
      ['p', { $: { html: 1, block: 0 }, class: 'info' }, 'More information is available here.'],
    ])
  })

  it.skip('preserves nested indented raw HTML children inside a multiline <a>', async () => {
    const result = await parseMarkdown(`<a href="${sponsorsUrl}">
  <img src="${sponsorsUrl}" alt="Sponsors"/>
</a>`)

    expect(result.nodes).toEqual([
      [
        'a',
        { $: { html: 1, block: 1 }, href: sponsorsUrl },
        ['img', { $: { html: 1, block: 0 }, src: sponsorsUrl, alt: 'Sponsors' }],
      ],
    ])
  })

  it.skip('preserves nested indented raw HTML children inside a wrapped multiline <p>', async () => {
    const result = await parseMarkdown(`<p align="center">
  <a href="${sponsorsUrl}">
    <img src="${sponsorsUrl}" alt="Sponsors"/>
  </a>
</p>`)

    // Nested <a> spans multiple lines → block: 1; void <img> is single-line → block: 0
    expect(result.nodes).toEqual([
      [
        'p',
        { $: { html: 1, block: 1 }, align: 'center' },
        [
          'a',
          { $: { html: 1, block: 1 }, href: sponsorsUrl },
          ['img', { $: { html: 1, block: 0 }, src: sponsorsUrl, alt: 'Sponsors' }],
        ],
      ],
    ])
  })

  it('does not emit a stray empty component for multiline raw HTML closes', async () => {
    const result = await parseMarkdown(`<p align="center">
  <a href="${sponsorsUrl}">
    <img src="${sponsorsUrl}" alt="Sponsors"/>
  </a>
</p>`)

    expect(result.nodes).not.toContainEqual(['component', {}])
  })

  it('keeps real indented markdown code blocks outside raw HTML blocks', async () => {
    const result = await parseMarkdown('    <img src="/foo.png" alt="x"/>')

    expect(result.nodes).toEqual([['pre', {}, ['code', {}, '<img src="/foo.png" alt="x"/>']]])
  })

  it('keeps indented HTML comments outside raw HTML blocks as markdown code', async () => {
    const result = await parseMarkdown('    <!-- note -->')

    expect(result.nodes).toEqual([['pre', {}, ['code', {}, '<!-- note -->']]])
  })

  it('styles', async () => {
    const result = await parseMarkdown(`<style>
  .warning {
    color: red;
  }
  .success {
    color: green;
  }

  .info {
    color: blue;
  }
  </style>

  <p class="warning">This is a warning message.</p>
  <p class="success">Your changes have been saved.</p>
  <p class="info">More information is available here.</p>`)

    expect(result.nodes).toEqual([
      [
        'style',
        {
          $: {
            block: 1,
            html: 1,
          },
        },
        `.warning {
    color: red;
  }
  .success {
    color: green;
  }

  .info {
    color: blue;
  }`,
      ],
      ['p', { $: { html: 1, block: 0 }, class: 'warning' }, 'This is a warning message.'],
      ['p', { $: { html: 1, block: 0 }, class: 'success' }, 'Your changes have been saved.'],
      ['p', { $: { html: 1, block: 0 }, class: 'info' }, 'More information is available here.'],
    ])
  })
})
