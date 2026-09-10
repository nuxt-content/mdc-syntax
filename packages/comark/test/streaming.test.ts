import { describe, it, expect } from 'vitest'
import { createMarkdownParser } from 'comark'
import type { ElementNode } from 'comark'

describe('streaming mode', () => {
  it.each([false, true])('omits reference definitions with streaming: %s', async (streaming) => {
    const result = await createMarkdownParser()('# Heading\n\n[ref]: https://example.com\n\n[link][ref]', { streaming })
    expect(result.nodes).toMatchObject([
      ['h1', {}, 'Heading'],
      ['p', {}, ['a', { href: 'https://example.com' }, 'link']],
    ])
  })

  it.each([
    ['duplicate headings', '# Same\n\nIntro\n\n# Same', '\n\nTail'],
    ['nested headings', '## Parent\n\nIntro\n\n### Child', '\n\nTail'],
    ['setext headings', 'Same\n====\n\nIntro\n\nSame\n====', '\n\nTail'],
    ['CRLF setext headings', 'Same\r\n====\r\n\r\nIntro\r\n\r\nSame\r\n====', '\r\n\r\nTail'],
    ['headings in lists', '# Same\n\nIntro\n\n- # Same', '\n\nTail'],
    ['existing references', '[ref]: https://example.com\n\n# Heading\n\nIntro\n\n[link][ref]', ' grows'],
    ['new references', '[link][ref]\n\nIntro\n\nTail', '\n\n[ref]: https://example.com'],
  ])('matches a full parse after appending to %s', async (_, source, appended) => {
    const parse = createMarkdownParser()
    await parse(source, { streaming: true })

    const result = await parse(source + appended, { streaming: true })

    expect(result).toMatchObject(await createMarkdownParser()(source + appended))
  })

  describe('$.line metadata', () => {
    it('preserves position metadata on nodes in streaming mode', async () => {
      const parse = createMarkdownParser()
      const result = await parse('# Hello\n\nParagraph one.\n\nParagraph two.\n', { streaming: true })

      const nodes = result.nodes as ElementNode[]
      expect(nodes[0][1].$?.line).toBeDefined()
      expect(nodes[1][1].$?.line).toBeDefined()
      expect(nodes[2][1].$?.line).toBeDefined()
    })

    it('does NOT add $.line metadata without streaming', async () => {
      const parse = createMarkdownParser()
      const result = await parse('# Hello\n\nParagraph one.\n')

      const nodes = result.nodes as ElementNode[]
      expect(nodes[0][1].$).toBeUndefined()
    })

    it('line numbers are monotonically increasing', async () => {
      const parse = createMarkdownParser()
      const result = await parse('# Heading\n\nPara 1\n\nPara 2\n\nPara 3\n', { streaming: true })

      const nodes = result.nodes as ElementNode[]
      const lines = nodes.map((n) => n[1].$?.line ?? 0)
      for (let i = 1; i < lines.length; i++) {
        expect(lines[i]).toBeGreaterThan(lines[i - 1])
      }
    })
  })

  describe('first call (no previous state)', () => {
    it('parses content fully on first call', async () => {
      const parse = createMarkdownParser()
      const result = await parse('# Hello\n\nWorld\n', { streaming: true })

      expect(result.nodes).toHaveLength(2)
      expect((result.nodes[0] as ElementNode)[0]).toBe('h1')
      expect((result.nodes[1] as ElementNode)[0]).toBe('p')
    })

    it('returns same node types as non-streaming for complete content', async () => {
      const content = '# Hello\n\nParagraph text.\n'
      const parse = createMarkdownParser()

      const streamResult = await parse(content, { streaming: true })
      const regularResult = await parse(content)

      // Non-streaming call resets the cache, structure should match
      expect((streamResult.nodes[0] as ElementNode)[0]).toBe((regularResult.nodes[0] as ElementNode)[0])
      expect((streamResult.nodes[1] as ElementNode)[0]).toBe((regularResult.nodes[1] as ElementNode)[0])
    })
  })

  describe('continuation (new content starts with old content)', () => {
    it('reuses cached nodes when content grows', async () => {
      const parse = createMarkdownParser()

      // First call: heading + first paragraph + incomplete last paragraph
      const c1 = '# Heading\n\nFirst paragraph.\n\nInco'
      const c2 = '# Heading\n\nFirst paragraph.\n\nIncomplete becomes complete.\n'

      await parse(c1, { streaming: true })
      const result = await parse(c2, { streaming: true })

      expect(result.nodes).toHaveLength(3)
      expect((result.nodes[0] as ElementNode)[0]).toBe('h1')
      expect((result.nodes[1] as ElementNode)[0]).toBe('p')
      expect((result.nodes[2] as ElementNode)[0]).toBe('p')
    })

    it('cached nodes from previous call appear at the start', async () => {
      const parse = createMarkdownParser()

      const step1 = '# Title\n\nParagraph one.\n\nParagraph two.\n\nPartial'
      const step2 = '# Title\n\nParagraph one.\n\nParagraph two.\n\nPartial paragraph complete.\n'

      await parse(step1, { streaming: true })
      const result = await parse(step2, { streaming: true })

      const h1 = result.nodes[0] as ElementNode
      const p1 = result.nodes[1] as ElementNode
      expect(h1[0]).toBe('h1')
      expect(h1[2]).toBe('Title')
      expect(p1[2]).toBe('Paragraph one.')
    })

    it('handles a second continuation after an initial continuation', async () => {
      const parse = createMarkdownParser()

      // Step 1: h1 + partial paragraph
      await parse('# Title\n\nPartial', { streaming: true })
      // Step 2: h1 + completed first paragraph + partial second paragraph
      await parse('# Title\n\nPartial paragraph.\n\nSecond par', { streaming: true })
      // Step 3: completed — new content reaches beyond step 2's parsedLines
      const result = await parse('# Title\n\nPartial paragraph.\n\nSecond paragraph complete.\n', { streaming: true })

      // h1 is in the cache from step 1; paragraphs come from re-parsing
      expect((result.nodes[0] as ElementNode)[0]).toBe('h1')
      expect(result.nodes.length).toBeGreaterThanOrEqual(1)
    })

    it('parsing identical content twice produces equivalent node structure', async () => {
      const parse = createMarkdownParser()

      const c1 = '# Hello\n\nWorld.\n'
      const result1 = await parse(c1, { streaming: true })
      // Second call: streaming re-parses the last node (with updated startLine),
      // so line numbers may differ but content structure must be the same.
      const result2 = await parse(c1, { streaming: true })

      expect(result2.nodes).toHaveLength(result1.nodes.length)
      expect((result2.nodes[0] as ElementNode)[0]).toBe((result1.nodes[0] as ElementNode)[0])
      expect((result2.nodes[0] as ElementNode)[2]).toBe((result1.nodes[0] as ElementNode)[2])
      expect((result2.nodes[1] as ElementNode)[0]).toBe((result1.nodes[1] as ElementNode)[0])
      expect((result2.nodes[1] as ElementNode)[2]).toBe((result1.nodes[1] as ElementNode)[2])
    })
  })

  describe('non-continuation (different content)', () => {
    it('fully re-parses when new content does not start with old content', async () => {
      const parse = createMarkdownParser()

      await parse('# Old Heading\n\nOld content.\n', { streaming: true })
      const result = await parse('# New Heading\n\nNew content.\n', { streaming: true })

      const h1 = result.nodes[0] as ElementNode
      expect(h1[2]).toBe('New Heading')
      expect(result.nodes).toHaveLength(2)
    })

    it('re-parses correctly after a reset', async () => {
      const parse = createMarkdownParser()

      await parse('# Doc A\n\nContent A.\n', { streaming: true })
      const result = await parse('# Doc B\n', { streaming: true })

      expect(result.nodes).toHaveLength(1)
      expect((result.nodes[0] as ElementNode)[2]).toBe('Doc B')
    })

    it('non-streaming call resets the cache', async () => {
      const parse = createMarkdownParser()

      await parse('# Title\n\nFirst.\n', { streaming: true })
      // Non-streaming call clears lastOutput/lastInput
      await parse('# Other\n\nContent.\n')
      // Next streaming call should not see the pre-non-streaming state
      const result = await parse('# Title\n\nFirst.\n\nSecond.\n', { streaming: true })

      expect((result.nodes[0] as ElementNode)[2]).toBe('Title')
    })
  })

  describe('streaming with frontmatter', () => {
    it('preserves frontmatter on first parse', async () => {
      const parse = createMarkdownParser()

      const result = await parse('---\ntitle: Hello\n---\n\n# World\n', { streaming: true })
      expect(result.frontmatter).toEqual({ title: 'Hello' })
    })

    it('return full frontmatter when it was partial on previous call', async () => {
      const parse = createMarkdownParser()

      const c1 = '---\ntitle: Hello'
      const c2 = '---\ntitle: Hello\ncategory: Test\n---\n\n# World\n\nPartial paragraph done.\n'

      const result1 = await parse(c1, { streaming: true })
      const result2 = await parse(c2, { streaming: true })

      expect(result1.frontmatter).toEqual({ title: 'Hello' })
      expect(result2.frontmatter).toEqual({ title: 'Hello', category: 'Test' })
    })

    it('frontmatter is preserved across continuation calls', async () => {
      const parse = createMarkdownParser()

      const c1 = '---\ntitle: Hello\n---\n\n# World\n\nPartial'
      const c2 = '---\ntitle: Hello\n---\n\n# World\n\nPartial paragraph done.\n'

      const result1 = await parse(c1, { streaming: true })
      const result2 = await parse(c2, { streaming: true })

      expect(result1.frontmatter).toEqual({ title: 'Hello' })
      expect(result2.frontmatter).toEqual({ title: 'Hello' })
    })

    it.each([
      ['without frontmatter', '# Replacement', {}],
      ['with new frontmatter', '---\ntitle: New\n---\n\n# Replacement', { title: 'New' }],
    ])('replaces stream frontmatter when the source changes %s', async (_, replacement, frontmatter) => {
      const parse = createMarkdownParser()
      await parse('---\ntitle: Old\n---\n\n# Original', { streaming: true })

      const result = await parse(replacement, { streaming: true })

      expect(result.frontmatter).toEqual(frontmatter)
    })
  })

  describe('streaming with MDC components', () => {
    it('parses MDC block components in streaming mode', async () => {
      const parse = createMarkdownParser()

      const result = await parse('# Heading\n\n::alert\nContent\n::\n', { streaming: true })

      const h1 = result.nodes[0] as ElementNode
      const alert = result.nodes[1] as ElementNode
      expect(h1[0]).toBe('h1')
      expect(alert[0]).toBe('alert')
    })

    it('keeps auto-closed empty string attributes as strings', async () => {
      const parse = createMarkdownParser()
      const result = await parse('::callout{color="info" icon', { streaming: true })
      const callout = result.nodes[0] as ElementNode

      expect(callout[0]).toBe('callout')
      expect(callout[1]).toMatchObject({ color: 'info', ':icon': 'true' })
    })

    it('keeps auto-closed empty string attributes as strings', async () => {
      const parse = createMarkdownParser()
      const result = await parse('::callout{color="info" icon="', { streaming: true })
      const callout = result.nodes[0] as ElementNode

      expect(callout[0]).toBe('callout')
      expect(callout[1]).toMatchObject({ color: 'info', icon: '' })
      expect(callout[1]).not.toHaveProperty(':icon')
    })

    it('caches nodes before MDC components', async () => {
      const parse = createMarkdownParser()

      const c1 = '# Title\n\nParagraph.\n\n::note\nPartial'
      const c2 = '# Title\n\nParagraph.\n\n::note\nFull note content.\n::\n'

      await parse(c1, { streaming: true })
      const result = await parse(c2, { streaming: true })

      expect((result.nodes[0] as ElementNode)[0]).toBe('h1')
      expect((result.nodes[1] as ElementNode)[0]).toBe('p')
      expect((result.nodes[2] as ElementNode)[0]).toBe('note')
    })
  })

  describe('streaming with autoClose interaction', () => {
    it('autoClose applies to partially complete content', async () => {
      const parse = createMarkdownParser({ autoClose: true })

      // Incomplete bold - autoClose should close it
      const result = await parse('# Title\n\nSome **bold', { streaming: true })

      const p = result.nodes[1] as ElementNode
      expect(p[0]).toBe('p')
      // The bold should be auto-closed so it appears as strong
      const strong = p.slice(2).find((child) => Array.isArray(child) && (child as ElementNode)[0] === 'strong')
      expect(strong).toBeDefined()
    })

    it('works with autoClose disabled', async () => {
      const parse = createMarkdownParser({ autoClose: false })

      const result = await parse('# Hello\n\nWorld.\n', { streaming: true })
      expect(result.nodes).toHaveLength(2)
    })

    it('accepts a custom autoClose function', async () => {
      const inputs: string[] = []
      const parse = createMarkdownParser({
        autoClose: (markdown) => {
          inputs.push(markdown)
          return markdown.replace('**bold', '**bold**')
        },
      })

      const result = await parse('Some **bold', { streaming: true })

      expect(inputs).toEqual(['Some **bold'])
      const paragraph = result.nodes[0] as ElementNode
      expect(paragraph.slice(2).some((child) => Array.isArray(child) && child[0] === 'strong')).toBe(true)
    })

    it('passes only the unstable tail to a custom autoClose function on subsequent parses', async () => {
      const inputs: string[] = []
      const parse = createMarkdownParser({
        autoClose: (markdown) => {
          inputs.push(markdown)
          return markdown
        },
      })

      await parse('# Title\n\nStable paragraph.\n\nPart', { streaming: true })
      inputs.length = 0
      await parse('# Title\n\nStable paragraph.\n\nPartial tail', { streaming: true })

      expect(inputs).toHaveLength(1)
      expect(inputs[0]).not.toContain('Stable paragraph')
      expect(inputs[0].trim()).toBe('Partial tail')
    })
  })

  describe('streaming with autoUnwrap interaction', () => {
    it('autoUnwrap applies in streaming mode by default', async () => {
      const parse = createMarkdownParser()

      const result = await parse('::alert\nSimple text\n::\n', { streaming: true })
      const alert = result.nodes[0] as ElementNode

      // With autoUnwrap, single paragraph inside component is unwrapped
      const children = alert.slice(2)
      const hasDirectText = children.some((c) => typeof c === 'string')
      const hasNoP = !children.some((c) => Array.isArray(c) && (c as ElementNode)[0] === 'p')
      expect(hasDirectText || hasNoP).toBe(true)
    })

    it('autoUnwrap: false is respected in streaming mode', async () => {
      const parse = createMarkdownParser({ autoUnwrap: false })

      const result = await parse('::alert\nSimple text\n::\n', { streaming: true })
      const alert = result.nodes[0] as ElementNode

      // Without autoUnwrap, the p element should be present
      const p = alert.slice(2).find((c) => Array.isArray(c) && (c as ElementNode)[0] === 'p')
      expect(p).toBeDefined()
    })
  })

  describe('independent parser instances', () => {
    it('each createMarkdownParser instance has independent state', async () => {
      const parse1 = createMarkdownParser()
      const parse2 = createMarkdownParser()

      await parse1('# Parser 1\n\nContent A.\n', { streaming: true })
      await parse2('# Parser 2\n\nContent B.\n', { streaming: true })

      // Continuation on parse1 should not be affected by parse2
      const result1 = await parse1('# Parser 1\n\nContent A.\n\nMore A.\n', { streaming: true })
      expect((result1.nodes[0] as ElementNode)[2]).toBe('Parser 1')

      const result2 = await parse2('# Parser 2\n\nContent B.\n\nMore B.\n', { streaming: true })
      expect((result2.nodes[0] as ElementNode)[2]).toBe('Parser 2')
    })
  })
})

describe('createMarkdownParser', () => {
  it('should create a parse function', async () => {
    const parse = createMarkdownParser()
    const result = await parse('# Hello\n\nParagraph one.\n\nParagraph two.\n', { streaming: true })
    const result2 = await parse('# Hello\n\nParagraph one.\n\nParagraph two.\n', { streaming: true })
    expect(result.nodes).toEqual(result2.nodes)
  })

  it('should parse a markdown file', async () => {
    const parse = createMarkdownParser()
    const result = await parse('\n## Key Features\n\n#', { streaming: true })
    expect(result.nodes).toHaveLength(1)
  })

  it('should parse a markdown file with streaming', async () => {
    const md = `::landing-hero
#title
Markdown but with Components

#description
Fasjkj

::

:landing-get-started

::u-page-section
#title
Everything you need for modern content parsing
::
`

    const parse = createMarkdownParser()
    for (let i = 10; i < md.length; i += 10) {
      const result = await parse(md.slice(0, i), { streaming: true })
      if (result.nodes.length >= 1) {
        expect(result.nodes[0][0]).not.toBe('p')
        expect('landing-hero').includes(result.nodes[0][0])
      }
      if (result.nodes.length >= 2) {
        expect(result.nodes[1][0]).not.toBe('p')
        expect('landing-get-started').includes(result.nodes[1][0])
      }
      if (result.nodes.length >= 3) {
        expect(result.nodes[2][0]).not.toBe('p')
        expect('u-page-section').includes(result.nodes[2][0])
      }
    }
  })

  it('Should parse content chunk by chunk into a valid Comark tree', async () => {
    const steps = [
      {
        input: '# title\nM',
        output: {
          frontmatter: {},
          meta: {},
          nodes: [
            ['h1', { id: 'title', $: { line: 1 } }, 'title'],
            ['p', { $: { line: 2 } }, 'M'],
          ],
        },
      },
      {
        input: `# title\nMarkdown bu`,
        output: {
          frontmatter: {},
          meta: {},
          nodes: [
            ['h1', { id: 'title', $: { line: 1 } }, 'title'],
            ['p', { $: { line: 2 } }, 'Markdown bu'],
          ],
        },
      },
      {
        input: `# title\nMarkdown but with Com`,
        output: {
          frontmatter: {},
          meta: {},
          nodes: [
            ['h1', { id: 'title', $: { line: 1 } }, 'title'],
            ['p', { $: { line: 2 } }, 'Markdown but with Com'],
          ],
        },
      },
      {
        input: `# title\nMarkdown but with Components\n\n#`,
        output: {
          frontmatter: {},
          meta: {},
          nodes: [
            ['h1', { id: 'title', $: { line: 1 } }, 'title'],
            ['p', { $: { line: 2 } }, 'Markdown but with Components'],
          ],
        },
      },
    ]

    const parse = createMarkdownParser()
    for (const step of steps) {
      const result = await parse(step.input, { streaming: true })
      expect(result).toEqual(step.output)
    }
  })
})
