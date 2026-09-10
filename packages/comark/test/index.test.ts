import { describe, it, expect, beforeAll } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseFrontmatter } from '../src/internal/frontmatter'
import { parseMarkdown } from 'comark'
import { renderMarkdown } from 'comark/render'
import shiki from 'comark/plugins/shiki'
import type { ShikiOptions } from '../src/plugins/shiki'
import emoji from '../src/plugins/emoji'
import binding, { Binding as MarkdownBinding } from '../src/plugins/binding'
import type { ComarkPlugin } from 'comark'
import githubDark from 'shiki/dist/themes/github-dark.mjs'
import minLight from 'shiki/dist/themes/min-light.mjs'
import nord from 'shiki/dist/themes/nord.mjs'
import rustLanguage from 'shiki/dist/langs/rust.mjs'
import goLanguage from 'shiki/dist/langs/go.mjs'
import type { ParserOptions } from '../src/types'
import type { ShikiTransformer } from 'shiki'
import { renderHtmlForTest } from './utils/render-html'
import { Binding as HTMLBiniding } from '../../comark-html/src/plugins/binding'

type PluginName = 'emoji' | 'binding'

const pluginRegistry: Record<PluginName, () => ComarkPlugin> = {
  emoji,
  binding,
}

type TransformerName = 'twoslash'

const transformerRegistry: Record<TransformerName, () => Promise<ShikiTransformer>> = {
  twoslash: async () => {
    const { transformerTwoslash } = await import('@shikijs/twoslash')
    return transformerTwoslash()
  },
}

const DEFAULT_TEST_TIMEOUT = 5000
const MIN_HIGHLIGHT_PARSE_HOOK_TIMEOUT = 500

interface TestCase {
  input: string
  ast: string
  html: string
  markdown: string
  timeouts?: {
    parse?: number
    html?: number
    markdown?: number
  }
  options?: {
    highlight?: ShikiOptions
    plugins?: PluginName[]
    autoUnwrap?: boolean
    /**
     * Fixtures never stream, so the `'streaming'` default leaves input untouched
     * and the corpus reads as a conformance suite. Set `true` for a fixture that
     * is specifically about healing.
     */
    autoClose?: boolean | 'streaming'
    maxInlineAttributes?: number
    blockAttributesStyle?: 'frontmatter' | 'codeblock'
  }
  skip?: boolean
}

function parseTimeout(timeoutStr: string): number {
  // Parse timeout string like "50ms" or "5s" to milliseconds
  const match = timeoutStr.match(/^(\d+)(ms|s)$/)
  if (!match) return DEFAULT_TEST_TIMEOUT

  const value = Number.parseInt(match[1], 10)
  const unit = match[2]
  const ms = unit === 's' ? value * 1000 : value
  return ms + 5 + (process.env.GITHUB_ACTIONS ? 40 : 0) /* add 40ms to avoid random Github Actions failures */
}

function parseHookTimeout(testCase: TestCase): number {
  const timeout = testCase.timeouts?.parse ?? DEFAULT_TEST_TIMEOUT

  if (testCase.options?.highlight) {
    return Math.max(timeout, MIN_HIGHLIGHT_PARSE_HOOK_TIMEOUT)
  }

  return timeout
}

function extractFrontmatter(content: string): {
  timeouts?: TestCase['timeouts']
  body: string
  options?: TestCase['options']
} {
  const { content: body, data } = parseFrontmatter(content)

  if (!data || Object.keys(data).length === 0) {
    return { body }
  }

  const timeouts: TestCase['timeouts'] = {}

  if (data.timeout) {
    if (data.timeout.parse) timeouts.parse = parseTimeout(String(data.timeout.parse))
    if (data.timeout.html) timeouts.html = parseTimeout(String(data.timeout.html))
    if (data.timeout.markdown) timeouts.markdown = parseTimeout(String(data.timeout.markdown))
  }

  return {
    ...data,
    timeouts: Object.keys(timeouts).length > 0 ? timeouts : undefined,
    options: data.options as TestCase['options'] | undefined,
    body,
  }
}

function extractTestCase(content: string): TestCase {
  const { timeouts, body, options, ...frontmatter } = extractFrontmatter(content)
  const sections: Record<string, string> = {}

  // Extract sections - find each section header and its content
  const sectionHeaders = [...body.matchAll(/^## (Input|AST|HTML|Markdown)\s*\n\n```(\w+)\n/gm)]

  for (let i = 0; i < sectionHeaders.length; i++) {
    const match = sectionHeaders[i]
    const sectionName = match[1]
    const startPos = match.index! + match[0].length

    // Find the end position - either the next section header or end of body
    const endPos = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1].index! : body.length

    // Extract content between start and end, then find the last ``` before the next section
    const sectionText = body.substring(startPos, endPos)

    // Find the last ``` that's followed by newline and either ## or end
    // Look for ```\n followed by \n## or end of string (with optional whitespace)
    const closingPattern = /```[^\S\n]*\n(?=\n## |[^\S\n]*$)/g
    closingPattern.lastIndex = startPos

    let lastMatch: RegExpExecArray | null = null
    let currentMatch: RegExpExecArray | null

    while ((currentMatch = closingPattern.exec(body)) !== null) {
      if (currentMatch.index < endPos) {
        lastMatch = currentMatch
      } else {
        break
      }
    }

    if (lastMatch) {
      content = body.substring(startPos, lastMatch.index)
    } else {
      // Fallback: try to find ``` and remove it
      const fallbackMatch = sectionText.match(/^([\s\S]*?)```\s*$/)
      if (fallbackMatch) {
        content = fallbackMatch[1].trim()
      } else {
        content = sectionText.trim()
      }
    }

    sections[sectionName.toLowerCase()] = content.trim()
  }

  return {
    ...frontmatter,
    input: (sections.input || '').trim(),
    ast: sections.ast || '',
    html: sections.html || '',
    markdown: sections.markdown || '',
    timeouts,
    options,
  }
}

function findMarkdownFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = fullPath.replace(baseDir + '/', '')

    if (entry.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath, baseDir))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath)
    }
  }

  return files
}

// Run a single spec: SPEC=SPEC/MDC/inline-component.md pnpm vitest run test/index.test.ts
const specDir = join(process.cwd(), 'SPEC')
const specArg = String(process.env.npm_lifecycle_script || '').split('-- -spec ')[1] || ''

function loadTestCases(): Array<{ file: string; testCase: TestCase }> {
  if (specArg) {
    const absPath = specArg.startsWith('/') ? specArg : join(process.cwd(), specArg)
    const relativePath = absPath.replace(specDir + '/', '')
    const content = readFileSync(absPath, 'utf-8')
    return [{ file: relativePath, testCase: extractTestCase(content) }]
  }

  return findMarkdownFiles(specDir).map((file) => {
    const content = readFileSync(join(specDir, file), 'utf-8')
    return { file, testCase: extractTestCase(content) }
  })
}

const testCases = loadTestCases()

describe('Comark Tests', () => {
  it('should load test cases from SPEC directory', () => {
    expect(testCases.length).toBeGreaterThan(0)
  })

  testCases.forEach(({ file, testCase }) => {
    if (testCase.skip) {
      return
    }
    describe(file, () => {
      let document: Awaited<ReturnType<typeof parseMarkdown>>

      beforeAll(async () => {
        const declaredPlugins = testCase.options?.plugins ?? []
        const plugins: ComarkPlugin[] = declaredPlugins.map((name) => pluginRegistry[name]())

        if (testCase.options?.highlight) {
          const themes = {
            'min-light': minLight,
            'github-dark': githubDark,
            nord: nord,
          } as Record<string, any>

          const transformerNames = testCase.options.highlight.transformers as unknown as TransformerName[] | undefined
          plugins.push(
            shiki({
              ...testCase.options.highlight,
              languages: [rustLanguage, goLanguage],
              themes: {
                light: themes[(testCase.options.highlight.themes?.light as string) || 'github-dark'],
                dark: themes[
                  (testCase.options.highlight.themes?.dark as string) ||
                    (testCase.options.highlight.themes?.light as string)
                ],
              },
              transformers: transformerNames
                ? await Promise.all(transformerNames.map((name) => transformerRegistry[name]()))
                : undefined,
            })
          )
        }

        const parseOptions: ParserOptions = {
          autoUnwrap: testCase.options?.autoUnwrap === false ? false : true,
        }

        if (testCase.options?.autoClose !== undefined) {
          parseOptions.autoClose = testCase.options.autoClose
        }

        if (plugins.length > 0) {
          parseOptions.plugins = plugins
        }

        document = await parseMarkdown(testCase.input, parseOptions)
      }, parseHookTimeout(testCase))

      it('should parse input to AST', () => {
        const expectedAST = JSON.parse(testCase.ast)
        expect(document).toEqual(expectedAST)
      })

      it('should render AST to HTML', { timeout: testCase.timeouts?.html ?? DEFAULT_TEST_TIMEOUT }, async () => {
        const result = await renderHtmlForTest(document, {
          components: {
            binding: HTMLBiniding,
          },
        })
        const expectedHTML = testCase.html.trim()
        expect(result).toBe(expectedHTML)
      })

      it(
        'should render AST to Markdown',
        { timeout: testCase.timeouts?.markdown ?? DEFAULT_TEST_TIMEOUT },
        async () => {
          const result = await renderMarkdown(document, {
            ...(testCase.options || {}),
            components: {
              binding: MarkdownBinding,
            },
          })
          const expectedMarkdown = testCase.markdown.trim()
          expect(result).toBe(expectedMarkdown)
        }
      )
    })
  })
})

describe('custom components', () => {
  it('renders with custom component handler in markdown', async () => {
    const document = await parseMarkdown('::alert{type="warning"}\nWatch out!\n::')
    const md = await renderMarkdown(document, {
      components: {
        alert: async ([, attrs, ...children], { render }) => {
          return `> [!${attrs.type}]\n> ${(await render(children)).trim()}\n`
        },
      },
    })
    expect(md).toContain('> [!warning]')
    expect(md).toContain('Watch out!')
  })

  it('renders with custom component handler in html', async () => {
    const tree = await parseMarkdown('::alert{type="info"}\nHello!\n::')
    const html = await renderHtmlForTest(tree, {
      components: {
        alert: async ([, attrs, ...children], { render }) => {
          return `<div class="alert alert-${attrs.type}">${await render(children)}</div>`
        },
      },
    })
    expect(html).toContain('<div class="alert alert-info">')
    expect(html).toContain('Hello!')
  })

  it('renders with conditional handler in markdown', async () => {
    const document = await parseMarkdown('::alert{type="info"}\nInfo\n::\n\n::alert{type="warning"}\nWarning\n::')
    const md = await renderMarkdown(document, {
      components: {
        infoAlert: {
          match: (node) => node[0] === 'alert' && node[1].type === 'info',
          handler: async ([, , ...children], { render }) => {
            return `> **Info:** ${(await render(children)).trim()}\n`
          },
        },
      },
    })
    expect(md).toContain('> **Info:** Info')
    // warning alert falls through to default
    expect(md).toContain('::alert{type="warning"}')
  })

  it('renders with conditional handler in html', async () => {
    const tree = await parseMarkdown('::alert{type="info"}\nInfo\n::\n\n::alert{type="warning"}\nWarning\n::')
    const html = await renderHtmlForTest(tree, {
      components: {
        infoAlert: {
          match: (node) => node[0] === 'alert' && node[1].type === 'info',
          handler: async ([, , ...children], { render }) => {
            return `<div class="info-box">${await render(children)}</div>`
          },
        },
      },
    })
    expect(html).toContain('<div class="info-box">')
    expect(html).toContain('Info')
    // warning alert falls through to default
    expect(html).not.toContain('<div class="info-box">Warning')
    expect(html).toContain('Warning')
  })
})
