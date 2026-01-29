import { describe, it, expect } from 'vitest'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseFrontMatter } from 'remark-mdc'
import { parseAsync, renderHTML, renderMarkdown } from '../src/index'

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
    highlight?: boolean
  }
}

function parseTimeout(timeoutStr: string): number {
  // Parse timeout string like "50ms" or "5s" to milliseconds
  const match = timeoutStr.match(/^(\d+)(ms|s)$/)
  if (!match) return 5000 // default 5 seconds

  const value = Number.parseInt(match[1], 10)
  const unit = match[2]
  return unit === 's' ? value * 1000 : value
}

function extractFrontmatter(content: string): { timeouts?: TestCase['timeouts'], body: string, options?: TestCase['options'] } {
  const { content: body, data } = parseFrontMatter(content)

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
    timeouts: Object.keys(timeouts).length > 0 ? timeouts : undefined,
    options: data.options as TestCase['options'] | undefined,
    body
  }
}

function extractTestCase(content: string): TestCase {
  const { timeouts, body, options } = extractFrontmatter(content)
  const sections: Record<string, string> = {}

  // Extract sections - find each section header and its content
  const sectionHeaders = [...body.matchAll(/^## (Input|AST|HTML|Markdown)\s*\n\n```(\w+)\n/gm)]

  for (let i = 0; i < sectionHeaders.length; i++) {
    const match = sectionHeaders[i]
    const sectionName = match[1]
    const startPos = match.index! + match[0].length

    // Find the end position - either the next section header or end of body
    const endPos = i < sectionHeaders.length - 1
      ? sectionHeaders[i + 1].index!
      : body.length

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
      }
      else {
        break
      }
    }

    if (lastMatch) {
      content = body.substring(startPos, lastMatch.index)
    }
    else {
      // Fallback: try to find ``` and remove it
      const fallbackMatch = sectionText.match(/^([\s\S]*?)```\s*$/)
      if (fallbackMatch) {
        content = fallbackMatch[1].trim()
      }
      else {
        content = sectionText.trim()
      }
    }

    sections[sectionName.toLowerCase()] = content.trim()
  }

  return {
    input: (sections.input || '').trim(),
    ast: (sections.ast || ''),
    html: sections.html || '',
    markdown: sections.markdown || '',
    timeouts,
    options,
  }
}

async function findMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const files: string[] = []
  const entries = await readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    const relativePath = fullPath.replace(baseDir + '/', '')

    if (entry.isDirectory()) {
      const subFiles = await findMarkdownFiles(fullPath, baseDir)
      files.push(...subFiles)
    }
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(relativePath)
    }
  }

  return files
}

// Load test cases at module level
const specDir = join(process.cwd(), 'SPEC')
const specFiles = await findMarkdownFiles(specDir)

const testCases: Array<{ file: string, testCase: TestCase }> = []

for (const file of specFiles) {
  const filePath = join(specDir, file)
  const content = await readFile(filePath, 'utf-8')
  const testCase = extractTestCase(content)
  testCases.push({ file, testCase })
}

describe('MDC Syntax Tests', () => {
  it('should load test cases from SPEC directory', () => {
    expect(testCases.length).toBeGreaterThan(0)
  })

  testCases.forEach(({ file, testCase }) => {
    describe(file, () => {
      it('should parse input to AST', { timeout: testCase.timeouts?.parse ?? 5000 }, async () => {
        // if (!file.includes('shiki-codeblock-highlight-complex')) return
        const result = await parseAsync(testCase.input, { autoUnwrap: false, ...testCase.options })
        const expectedAST = JSON.parse(testCase.ast)

        expect(result.body).toEqual(expectedAST)
      })

      it('should render AST to HTML', { timeout: testCase.timeouts?.html ?? 5000 }, () => {
        const ast = JSON.parse(testCase.ast)
        const result = renderHTML(ast)
        const expectedHTML = testCase.html.trim()

        // Tests will fail until implementation is complete
        expect(result).toBe(expectedHTML)
      })

      it('should render AST to Markdown', { timeout: testCase.timeouts?.markdown ?? 5000 }, () => {
        const ast = JSON.parse(testCase.ast)
        const result = renderMarkdown(ast)
        const expectedMarkdown = testCase.markdown.trim()

        // Tests will fail until implementation is complete
        expect(result).toBe(expectedMarkdown)
      })
    })
  })
})
