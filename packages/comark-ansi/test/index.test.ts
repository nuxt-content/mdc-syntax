import { afterEach, describe, it, expect, vi } from 'vitest'
import { parseMarkdown } from 'comark'
import shiki from 'comark/plugins/shiki'
import githubDark from 'shiki/dist/themes/github-dark.mjs'
import {
  createAnsiPrinter,
  createAnsiRenderer,
  createAnsiWriter,
  printAnsi,
  renderAnsi,
  renderAnsiFromDocument,
  writeAnsi,
} from '../src/index'

afterEach(() => {
  vi.unstubAllEnvs()
})

async function renderAnsiFromMarkdown(markdown: string, options?: Parameters<typeof renderAnsiFromDocument>[1]) {
  const tree = await parseMarkdown(markdown)
  return renderAnsiFromDocument(tree, options)
}

const plain = (markdown: string) => renderAnsiFromMarkdown(markdown, { colors: false })
const colored = (markdown: string) => renderAnsiFromMarkdown(markdown, { colors: true })

describe('renderAnsiFromDocument', () => {
  describe('headings', () => {
    it('renders h1 with # prefix', async () => {
      const out = await plain('# Hello World')
      expect(out).toContain('# Hello World')
    })

    it('renders h2 with ## prefix', async () => {
      const out = await plain('## Section')
      expect(out).toContain('## Section')
    })

    it('renders h3 with ### prefix', async () => {
      const out = await plain('### Subsection')
      expect(out).toContain('### Subsection')
    })

    it('wraps heading in ANSI styles when colors enabled', async () => {
      const out = await colored('# Title')
      expect(out).toContain('\x1B[')
      expect(out).toContain('# Title')
      expect(out).toContain('\x1B[0m')
    })

    it('no escape codes when colors disabled', async () => {
      const out = await plain('# Title')
      expect(out).not.toContain('\x1B[')
    })
  })

  describe('inline formatting', () => {
    it('renders bold text', async () => {
      const out = await plain('This is **bold** text')
      expect(out).toContain('bold')
    })

    it('wraps bold in ANSI bold when colors enabled', async () => {
      const out = await colored('**bold**')
      expect(out).toContain('\x1B[1m')
      expect(out).toContain('bold')
      expect(out).toContain('\x1B[0m')
    })

    it('renders italic text', async () => {
      const out = await plain('_italic_')
      expect(out).toContain('italic')
    })

    it('wraps italic in ANSI italic when colors enabled', async () => {
      const out = await colored('_italic_')
      expect(out).toContain('\x1B[3m')
      expect(out).toContain('italic')
    })

    it('renders strikethrough', async () => {
      const out = await plain('~~removed~~')
      expect(out).toContain('removed')
    })

    it('renders inline code', async () => {
      const out = await plain('Use `npm install`')
      expect(out).toContain('npm install')
    })

    it('renders links with url in parens', async () => {
      const out = await plain('[comark](https://comark.dev)')
      expect(out).toContain('comark')
      expect(out).toContain('https://comark.dev')
    })
  })

  describe('blockquotes', () => {
    it('renders blockquote with │ prefix', async () => {
      const out = await plain('> Some quoted text')
      expect(out).toContain('│')
      expect(out).toContain('Some quoted text')
    })

    it('renders NOTE alert with icon and label', async () => {
      const out = await plain('> [!NOTE]\n> Important info')
      expect(out).toContain('ℹ')
      expect(out).toContain('NOTE')
      expect(out).toContain('Important info')
    })

    it('renders TIP alert', async () => {
      const out = await plain('> [!TIP]\n> Helpful tip')
      expect(out).toContain('◆')
      expect(out).toContain('TIP')
      expect(out).toContain('Helpful tip')
    })

    it('renders WARNING alert', async () => {
      const out = await plain('> [!WARNING]\n> Watch out')
      expect(out).toContain('⚠')
      expect(out).toContain('WARNING')
      expect(out).toContain('Watch out')
    })

    it('renders CAUTION alert', async () => {
      const out = await plain('> [!CAUTION]\n> Danger')
      expect(out).toContain('✖')
      expect(out).toContain('CAUTION')
    })

    it('renders IMPORTANT alert', async () => {
      const out = await plain('> [!IMPORTANT]\n> Critical')
      expect(out).toContain('‼')
      expect(out).toContain('IMPORTANT')
    })

    it('colors NOTE alert in blue', async () => {
      const out = await colored('> [!NOTE]\n> Info')
      expect(out).toContain('\x1B[34m') // BLUE
    })

    it('colors WARNING alert in yellow', async () => {
      const out = await colored('> [!WARNING]\n> Careful')
      expect(out).toContain('\x1B[33m') // YELLOW
    })
  })

  describe('lists', () => {
    it('renders unordered list items', async () => {
      const out = await plain('- First\n- Second\n- Third')
      expect(out).toContain('First')
      expect(out).toContain('Second')
      expect(out).toContain('Third')
    })

    it('renders ordered list items', async () => {
      const out = await plain('1. One\n2. Two\n3. Three')
      expect(out).toContain('One')
      expect(out).toContain('Two')
      expect(out).toContain('Three')
    })
  })

  describe('tables', () => {
    const tableMd = [
      '| Argument | Type | Description |',
      '| -------- | ---- | ----------- |',
      '| `guard` | guard | Specifies the guard. |',
    ].join('\n')

    it('renders a plain table with aligned columns', async () => {
      const out = await plain(tableMd)
      expect(out).toContain('Argument')
      expect(out).toContain('guard')
      expect(out).toContain('┌')
      expect(out).toContain('│')
    })

    it('aligns columns when cells contain ANSI styling', async () => {
      const out = await colored(tableMd)
      // Strip ANSI so column borders line up by visible width.
      // eslint-disable-next-line no-control-regex
      const stripped = out.replace(/\u001B\[[\d;?]*[ -/]*[@-~]/g, '')
      const lines = stripped
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.includes('│') || l.includes('┌') || l.includes('├') || l.includes('└'))

      expect(lines.length).toBeGreaterThanOrEqual(4)
      const widths = lines.map((l) => l.length)
      expect(new Set(widths).size).toBe(1)

      // Inline code still carries color escapes in the raw output.
      expect(out).toContain('\x1B[36m')
      expect(out).toContain('guard')
    })

    it('aligns columns with bold/italic/link mixed in cells', async () => {
      const md = `
| Name | Note |
| ---- | ---- |
| **bold** | _italic_ and [link](https://example.com) |
| plain | short |
`.trim()
      const out = await colored(md)
      // eslint-disable-next-line no-control-regex
      const stripped = out.replace(/\u001B\[[\d;?]*[ -/]*[@-~]/g, '')
      const lines = stripped
        .split('\n')
        .map((l) => l.trimEnd())
        .filter((l) => l.includes('│') || l.includes('┌') || l.includes('├') || l.includes('└'))

      const widths = lines.map((l) => l.length)
      expect(new Set(widths).size).toBe(1)
    })
  })

  describe('code blocks', () => {
    it('renders code block content', async () => {
      const out = await plain('```js\nconsole.log("hi")\n```')
      expect(out).toContain('console.log')
    })

    it('renders code block with filename', async () => {
      const out = await plain('```ts [app.ts]\nconst x = 1\n```')
      expect(out).toContain('app.ts')
      expect(out).toContain('const x = 1')
    })
  })

  describe('code highlight', () => {
    const highlightPlugin = shiki({
      themes: { light: githubDark, dark: githubDark },
    })

    async function highlighted(markdown: string, colors = false) {
      const tree = await parseMarkdown(markdown, { plugins: [highlightPlugin] })
      return renderAnsiFromDocument(tree, { colors })
    }

    it('renders highlighted code with ANSI true-color sequences', async () => {
      const out = await highlighted('```js\nconst x = 1\n```', true)
      // Should contain true-color ANSI escape (38;2;r;g;b)
      // eslint-disable-next-line no-control-regex
      expect(out).toMatch(/\x1B\[38;2;\d+;\d+;\d+m/)
      expect(out).toContain('const')
      expect(out).toContain('x')
    })

    it('renders highlighted code without ANSI true-color when colors disabled', async () => {
      const out = await highlighted('```js\nconst x = 1\n```', false)
      // No true-color sequences in token output
      // eslint-disable-next-line no-control-regex
      expect(out).not.toMatch(/\x1B\[38;2;\d+;\d+;\d+m/)
      expect(out).toContain('const')
      expect(out).toContain('x')
    })

    it('renders multi-line highlighted code', async () => {
      const out = await highlighted('```js\nconst a = 1\nconst b = 2\n```', false)
      expect(out).toContain('const a = 1')
      expect(out).toContain('const b = 2')
    })

    it('renders highlighted code with language header', async () => {
      const out = await highlighted('```typescript\nlet x = 1\n```', false)
      expect(out).toContain('typescript')
      expect(out).toContain('let')
    })

    it('renders highlighted code with line highlights', async () => {
      const out = await highlighted('```js {1}\nconst a = 1\n\nconst b = 2\n```', false)
      expect(out).toContain('const a = 1')
      expect(out).toContain('const b = 2')
      expect(out).toBe('```\u001B[1m\u001B[36mjs\u001B[0m\nconst a = 1\n\nconst b = 2\n```\n')
    })

    it('each token gets its own color escape', async () => {
      const out = await highlighted('```js\nfunction hello() {}\n```', true)
      // Multiple color codes for different tokens (keyword, name, punctuation)
      // eslint-disable-next-line no-control-regex
      const colorMatches = out.match(/\x1B\[38;2;\d+;\d+;\d+m/g)
      expect(colorMatches).not.toBeNull()
      expect(colorMatches!.length).toBeGreaterThanOrEqual(2)
    })

    it('resets color after each token', async () => {
      const out = await highlighted('```js\nconst x = 1\n```', true)
      expect(out).toContain('\x1B[0m') // RESET
    })
  })

  describe('custom components', () => {
    it('renders custom component via components option', async () => {
      const tree = await parseMarkdown('::badge{type="success"}\nDone\n::')
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          badge: async ([, attrs, ...children], { render }) =>
            `[${String(attrs.type).toUpperCase()}] ${await render(children)}`,
        },
      })
      expect(out).toContain('[SUCCESS]')
      expect(out).toContain('Done')
    })

    it('passes data to component renderer', async () => {
      const tree = await parseMarkdown('::info\nContent\n::')
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        data: { version: '3.0' },
        components: {
          info: async ([, , ...children], { render, data }) => `v${data?.version}: ${await render(children)}`,
        },
      })
      expect(out).toContain('v3.0:')
      expect(out).toContain('Content')
    })

    it('renders children of custom components', async () => {
      const tree = await parseMarkdown('::wrapper\n**bold** inside\n::')
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          wrapper: async ([, , ...children], { render }) => `>> ${await render(children)}`,
        },
      })
      expect(out).toContain('>>')
      expect(out).toContain('bold')
    })
  })

  describe('async node handlers', () => {
    it('handler returning a Promise is awaited', async () => {
      const tree = await parseMarkdown('::status{code="ok"}\nAll good\n::')
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          status: async ([, attrs, ...children], { render }) => {
            const label = await Promise.resolve(String(attrs.code).toUpperCase())
            return `[${label}] ${await render(children)}`
          },
        },
      })
      expect(out).toContain('[OK]')
      expect(out).toContain('All good')
    })

    it('multiple async handlers run in the correct order', async () => {
      const tree = await parseMarkdown('::a\n::b\nB\n::\n::c\nC\n::\n::')
      const log: string[] = []
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          a: async ([, , ...children], { render }) => await render(children),
          b: async ([, , ...children], { render }) => {
            await Promise.resolve()
            log.push('b')
            return `B:${await render(children)}`
          },
          c: async ([, , ...children], { render }) => {
            await Promise.resolve()
            log.push('c')
            return `C:${await render(children)}`
          },
        },
      })
      expect(log).toEqual(['b', 'c'])
      expect(out.indexOf('B:')).toBeLessThan(out.indexOf('C:'))
    })

    it('async handler can resolve external data', async () => {
      const db: Record<string, string> = { metric: '99.9%' }
      const tree = await parseMarkdown('::stat{key="metric"}\n::')
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          stat: async ([, attrs]) => {
            const value = await Promise.resolve(db[String(attrs.key)] ?? 'N/A')
            return `Uptime: ${value}\n`
          },
        },
      })
      expect(out).toContain('Uptime: 99.9%')
    })
  })

  describe('data binding', () => {
    it('resolves :href on links from frontmatter', async () => {
      const tree = await parseMarkdown(`---
home: https://example.com
---

[Home](placeholder){:href="frontmatter.home"}
`)
      const out = await renderAnsiFromDocument(tree, { colors: false })
      expect(out).toContain('Home (https://example.com)')
    })

    it('resolves :alt on images from data', async () => {
      const tree = await parseMarkdown('![x](/x.png){:alt="data.caption"}')
      const out = await renderAnsiFromDocument(tree, { colors: false, data: { caption: 'Photo of Ada' } })
      expect(out).toContain('[image: Photo of Ada]')
    })

    it('exposes parent props for custom handlers via resolveAttribute', async () => {
      const { resolveAttribute } = await import('comark/render')
      const tree = await parseMarkdown(`---
user: Ada
---

::callout{:who="frontmatter.user"}
Hello
::
`)
      const out = await renderAnsiFromDocument(tree, {
        colors: false,
        components: {
          callout: async ([, attrs, ...children], state) => {
            const who = resolveAttribute(attrs, state.renderData, 'who')
            const content = await state.render(children as any)
            return `[${who}]: ${content.trim()}\n`
          },
        },
      })
      expect(out).toContain('[Ada]: Hello')
    })
  })
})

describe('renderAnsi', () => {
  it('parses and renders markdown', async () => {
    const output = await renderAnsi('# Hello\n\nThis is **bold**.', { colors: false })
    expect(output).toContain('# Hello')
    expect(output).toContain('bold')
  })

  it('passes parser and renderer options through', async () => {
    // `autoClose: false` matches the default for a non-streaming render, so force
    // healing on to prove the option reaches the parser.
    const output = await renderAnsi('**bold', { autoClose: true, colors: false })
    expect(output).not.toContain('\x1B[')
    expect(output).toContain('bold')
    expect(output).not.toContain('\\*\\*bold')
  })

  it('leaves incomplete markdown alone by default', async () => {
    const output = await renderAnsi('**bold', { colors: false })
    expect(output).toContain('\\*\\*bold')
  })

  it('disables colors when NO_COLOR is present', async () => {
    vi.stubEnv('NO_COLOR', '1')
    const output = await renderAnsi('**bold**')
    expect(output).not.toContain('\x1B[')
  })

  it('allows colors to override NO_COLOR', async () => {
    vi.stubEnv('NO_COLOR', '1')
    const output = await renderAnsi('**bold**', { colors: true })
    expect(output).toContain('\x1B[1m')
  })
})

describe('createAnsiRenderer', () => {
  it('returns a reusable renderer', async () => {
    const render = createAnsiRenderer({ colors: false })
    expect(await render('# Doc 1')).toContain('Doc 1')
    expect(await render('# Doc 2')).toContain('Doc 2')
  })

  it('keeps configured components and data across calls', async () => {
    const render = createAnsiRenderer({
      colors: false,
      data: { status: 'ready' },
      components: {
        badge: async ([, , ...children], { data, render }) => `[${data?.status}] ${await render(children)}`,
      },
    })

    expect(await render('::badge\nOne\n::')).toContain('[ready] One')
    expect(await render('::badge\nTwo\n::')).toContain('[ready] Two')
  })
})

describe('createAnsiPrinter', () => {
  it('returns a function', () => {
    const print = createAnsiPrinter()
    expect(typeof print).toBe('function')
  })

  it('calls writer with rendered output', async () => {
    const written: string[] = []
    const print = createAnsiPrinter({ writer: (string) => written.push(string) })
    await print('# Hello')
    expect(written).toHaveLength(1)
    expect(written[0]).toContain('Hello')
  })

  it('appends newline to output', async () => {
    const written: string[] = []
    const print = createAnsiPrinter({ writer: (string) => written.push(string) })
    await print('Hello')
    expect(written[0]).toMatch(/\n$/)
  })

  it('reuses parser across calls', async () => {
    const written: string[] = []
    const print = createAnsiPrinter({ writer: (string) => written.push(string) })
    await print('# Doc 1')
    await print('# Doc 2')
    expect(written[0]).toContain('Doc 1')
    expect(written[1]).toContain('Doc 2')
  })

  it('passes render options through', async () => {
    const written: string[] = []
    const print = createAnsiPrinter({
      colors: false,
      writer: (string) => written.push(string),
    })
    await print('**bold**')
    expect(written[0]).not.toContain('\x1B[')
    expect(written[0]).toContain('bold')
  })
})

describe('printAnsi', () => {
  it('calls writer with rendered output', async () => {
    const written: string[] = []
    await printAnsi('# Title', { writer: (string) => written.push(string) })
    expect(written).toHaveLength(1)
    expect(written[0]).toContain('Title')
  })

  it('calls writer once per invocation', async () => {
    const writer = vi.fn()
    await printAnsi('Hello', { writer })
    expect(writer).toHaveBeenCalledTimes(1)
  })

  it('keeps writeAnsi as a deprecated alias', () => {
    expect(writeAnsi).toBe(printAnsi)
  })

  it('keeps createAnsiWriter as a deprecated alias', () => {
    expect(createAnsiWriter).toBe(createAnsiPrinter)
  })
})
