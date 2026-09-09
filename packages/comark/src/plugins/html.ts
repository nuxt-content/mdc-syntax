/**
 * HTML parsing plugin for Comark.
 *
 * Enables embedded HTML block and inline tags to be tokenized and later
 * converted into AST nodes by the token processor.
 *
 * On by default via `registerDefaultPlugins`.
 * Pass `registerDefaultPlugins: false` (and omit this plugin) to treat HTML
 * tags as plain text.
 *
 * Options:
 * - `markdown` (default `true`): expand text leaves inside closed HTML
 *   fragments as inline markdown (`<h1>Hello **World**</h1>` → strong).
 *   When `false`, text inside HTML stays literal (CommonMark default for
 *   closed html_blocks). Blank-line bodies still nest as markdown tokens
 *   via bare open/close pairing.
 *
 * @example
 * ```ts
 * import { parseMarkdown } from 'comark'
 * import html from 'comark/plugins/html'
 *
 * // Explicit registration (also on by default via registerDefaultPlugins)
 * const result = await parseMarkdown('<strong class="bold">Hello</strong>', {
 *   plugins: [html()],
 * })
 * // → [ ['strong', { class: 'bold', $: { html: 1, block: 0 } }, 'Hello'] ]
 * ```
 */

import { type StateBlock, Token, type MarkdownExit } from 'markdown-exit'
import type { ComarkParseTokensState, MarkdownItPlugin } from '../types.ts'
import { defineComarkPlugin } from '../utils/helpers.ts'

export interface HtmlPluginOptions {
  /**
   * Expand text leaves inside closed HTML fragments as inline markdown.
   * @default true
   */
  markdown?: boolean
}

export default defineComarkPlugin((opts: HtmlPluginOptions = {}) => {
  const markdown = opts.markdown !== false

  function markdownItHtml(md: MarkdownExit) {
    md.set({ html: true })

    // Opt-out marker read by createMarkdownParser: when present, closed HTML
    // body text stays literal instead of being re-parsed as inline markdown.
    if (markdown) {
      // @ts-expect-error - internal utils
      const html_block = md.block.ruler.__rules__.find((r) => r.name === 'html_block')
      const fn = html_block.fn
      html_block.fn = (state: StateBlock, startLine: number, endLine: number, silent: boolean) => {
        let pos = state.bMarks[startLine] + state.tShift[startLine]

        const tag = state.src.substring(pos, pos + 7)
        if (tag === '<style' || tag === `<style>`) {
          return fn(state, startLine, endLine, silent)
        }
      }
    }
  }

  return {
    name: 'html',
    markdownItPlugins: [markdownItHtml as unknown as MarkdownItPlugin],
    markdownItPost: markdownItPost,
  }
})

function markdownItPost(state: ComarkParseTokensState) {
  let i = 0
  while (i < state.tokens.length) {
    const token = state.tokens[i]
    if (token.type !== 'html_block') {
      i += 1
      continue
    }

    // Expand raw CommonMark html_block into html_inline + text, wrapped as a
    // paragraph so the tree walk pairs open/close the same way as html_inline.
    // Body text stays literal (no markdown re-parse).
    const children = htmlToTokens(token.content || '')
    const open = new Token('paragraph_open', 'p', 1)
    const inline = new Token('inline', '', 0)
    const close = new Token('paragraph_close', 'p', -1)
    inline.children = children
    inline.content = token.content || ''
    if (token.map) {
      open.map = token.map
      inline.map = token.map
    }
    state.tokens.splice(i, 1, open, inline, close)
    i += 3
  }
}

// region - https://github.com/markdown-it/markdown-it/blob/master/src/common/html_re.ts#L21

const attr_name = '[a-zA-Z_:][a-zA-Z0-9:._-]*'

const unquoted = '[^"\'=<>`\\x00-\\x20]+'
const single_quoted = "'[^']*'"
const double_quoted = '"[^"]*"'

const attr_value = `(?:${unquoted}|${single_quoted}|${double_quoted})`

const attribute = `(?:\\s+${attr_name}(?:\\s*=\\s*${attr_value})?)`

const open_tag = `<[A-Za-z][A-Za-z0-9\\-]*${attribute}*\\s*\\/?>`

const close_tag = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>'
const comment = '<!---?>|<!--(?:[^-]|-[^-]|--[^>])*-->'
const processing = '<[?][\\s\\S]*?[?]>'
const declaration = '<![A-Za-z][^>]*>'
const cdata = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>'

const HTML_TAG_RE = new RegExp(`^(?:${open_tag}|${close_tag}|${comment}|${processing}|${declaration}|${cdata})`)

// end region

function isLetter(code: number): boolean {
  return (code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)
}

function pushText(tokens: Token[], content: string) {
  // Mirror htmlparser2's ontext trim: drop whitespace-only runs between tags and
  // strip structural indentation / surrounding newlines from body text.
  const trimmed = content.trim()
  if (!trimmed) return
  const text = new Token('text', '', 0)
  text.content = trimmed
  tokens.push(text)
}

/**
 * Split an HTML fragment into markdown-exit tokens.
 * Each recognized tag becomes `html_inline`; intervening runs become `text`.
 *
 * @example
 * htmlToTokens('<ai-thinking>\n**bold**')
 * // → [html_inline "<ai-thinking>", text "**bold**"]
 */
export function htmlToTokens(str: string): Token[] {
  const tokens: Token[] = []
  const len = str.length
  let pos = 0
  let textStart = 0

  while (pos < len) {
    // Candidate HTML tag starts with '<' followed by letter, '/', '!', or '?'
    if (str.charCodeAt(pos) === 0x3c /* < */ && pos + 1 < len) {
      const next = str.charCodeAt(pos + 1)
      if (next === 0x21 /* ! */ || next === 0x3f /* ? */ || next === 0x2f /* / */ || isLetter(next)) {
        const match = str.slice(pos).match(HTML_TAG_RE)
        if (match) {
          if (pos > textStart) pushText(tokens, str.slice(textStart, pos))
          const html = new Token('html_inline', '', 0)
          html.content = match[0]
          tokens.push(html)
          pos += match[0].length
          textStart = pos
          continue
        }
      }
    }
    pos++
  }

  if (textStart < len) pushText(tokens, str.slice(textStart))

  return tokens
}
