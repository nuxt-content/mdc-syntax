/**
 * Components syntax plugin for Comark.
 *
 * Enables block (`::name`) and inline (`:name[content]`) component syntax,
 * plus span wrappers (`[text]` / `[text]{attrs}` when paired with attributes).
 * On by default via `registerDefaultPlugins`.
 *
 * @see https://comark.dev/syntax/components
 */

import type { PluginSimple, Token } from 'markdown-exit'
import type { MarkdownItPlugin } from '../types.ts'
import { defineComarkPlugin } from '../utils/helpers.ts'
import { findClosingBracket, parseBracketContent } from '../internal/parse/syntax/brackets.ts'
import { parseBlockParams } from '../internal/parse/syntax/block-params.ts'
import { parseYaml } from '../internal/yaml.ts'

/**
 * A component name must start with a letter or `$`, followed by word chars,
 * `$` or `-`. Mirrors the block name grammar (`RE_BLOCK_NAME = /^[a-z$]/i`).
 */
const RE_COMPONENT_NAME = /^[a-z$][\w$-]*/i

/**
 * Whether `name` begins with a syntactically valid component name.
 *
 * This prevents sequences such as `:8100` or `::30` from being treated as
 * components — a purely numeric name is not a valid component and would
 * otherwise produce invalid output like `createElement('8100')` (inline) or
 * throw `Invalid block params` (block).
 */
function isValidComponentName(name: string): boolean {
  return RE_COMPONENT_NAME.test(name)
}

const blockYamlLines: Record<string, string> = {
  '---': '---',
  '```yaml [props]': '```',
  '~~~yaml [props]': '~~~',
  '```yml [props]': '```',
  '~~~yml [props]': '~~~',
}

const markdownItComarkBlock: PluginSimple = (md) => {
  const min_markers = 2
  const marker_str = ':'
  const marker_char = marker_str.charCodeAt(0)

  md.block.ruler.before(
    'fence',
    'comark_block_shorthand',
    function comark_block_shorthand(state, startLine, _endLine, silent) {
      const line = state.src.slice(state.bMarks[startLine] + state.tShift[startLine], state.eMarks[startLine])

      if (line[0] !== ':' || !isValidComponentName(line.slice(1))) return false

      const { name, content, props, remaining } = parseBlockParams(line.slice(1))

      // If there's unparsed remaining content, treat it as inline component in a paragraph
      if (remaining) return false

      if (!silent) {
        if (content !== undefined) {
          const tokenOpen = state.push('mdc_block_shorthand_open', name, 1)
          props?.forEach(([key, value]) => {
            if (key === 'class') tokenOpen.attrJoin(key, value)
            else tokenOpen.attrSet(key, value)
          })
          tokenOpen.map = [startLine, startLine + 1]

          const inline = state.push('inline', '', 0)
          inline.content = content
          inline.children = []

          const tokenClose = state.push('mdc_block_shorthand_close', name, -1)
          tokenClose.map = [startLine, startLine + 1]
        } else {
          const token = state.push('mdc_block_shorthand', name, 0)
          token.map = [startLine, startLine + 1]
          props?.forEach(([key, value]) => {
            if (key === 'class') token.attrJoin(key, value)
            else token.attrSet(key, value)
          })
        }
      }

      state.line = startLine + 1
      return true
    }
  )

  md.block.ruler.before(
    'fence',
    'comark_block',
    function comark_block(state, startLine, endLine, silent) {
      let pos: number
      let nextLine: number
      let auto_closed = false
      let start = state.bMarks[startLine] + state.tShift[startLine]
      let max = state.eMarks[startLine]
      const indent = state.sCount[startLine]

      // Track code fences (``` or ~~~) so we don't match closing :: inside them
      let inCodeFence = false
      let codeFenceCharCode = 0
      let codeFenceCount = 0

      // Track nesting depth for blocks with the same marker count
      let nestingDepth = 0

      if (state.src[start] !== ':') return false

      for (pos = start + 1; pos <= max; pos++) {
        if (marker_str !== state.src[pos]) break
      }

      const marker_count = Math.floor(pos - start)
      if (marker_count < min_markers) return false

      const markup = state.src.slice(start, pos)

      // Bail out (plain text) on an invalid name instead of letting
      // parseBlockParams throw on e.g. `::8100`.
      const nameStart = state.skipSpaces(pos)
      if (nameStart < max && !isValidComponentName(state.src.slice(nameStart, max))) return false

      const params = parseBlockParams(state.src.slice(pos, max))

      if (!params.name) return false

      if (silent) return true

      nextLine = startLine

      for (;;) {
        nextLine++
        if (nextLine >= endLine) break

        start = state.bMarks[nextLine] + state.tShift[nextLine]
        max = state.eMarks[nextLine]

        if (start < max && state.sCount[nextLine] < state.blkIndent) break

        const lineCharCode = state.src.charCodeAt(start)

        // Detect closing code fence (``` or ~~~)
        if (inCodeFence) {
          if (lineCharCode === codeFenceCharCode) {
            let fencePos = start + 1
            while (fencePos < max && state.src.charCodeAt(fencePos) === codeFenceCharCode) fencePos++
            if (fencePos - start >= codeFenceCount) {
              const afterFence = state.skipSpaces(fencePos)
              if (afterFence >= max) inCodeFence = false
            }
          }
          continue
        }

        // Detect opening code fence (``` or ~~~)
        if (lineCharCode === 0x60 /* ` */ || lineCharCode === 0x7e /* ~ */) {
          let fencePos = start + 1
          while (fencePos < max && state.src.charCodeAt(fencePos) === lineCharCode) fencePos++
          if (fencePos - start >= 3) {
            inCodeFence = true
            codeFenceCharCode = lineCharCode
            codeFenceCount = fencePos - start
            continue
          }
        }

        if (marker_char !== lineCharCode) continue

        for (pos = start + 1; pos <= max; pos++) {
          if (marker_str !== state.src[pos]) break
        }

        // Closing fence must match the opening fence length
        if (pos - start !== marker_count) continue

        pos = state.skipSpaces(pos)

        if (pos < max) {
          // A new nested block opens with same marker count
          nestingDepth++
          continue
        }

        if (nestingDepth > 0) {
          nestingDepth--
          continue
        }

        auto_closed = true
        break
      }

      const old_parent = state.parentType
      const old_line_max = state.lineMax
      state.parentType = 'comark_block'

      // Prevent lazy continuations from going past our end marker
      state.lineMax = nextLine

      const tokenOpen = state.push('mdc_block_open', params.name, 1)
      tokenOpen.markup = markup
      tokenOpen.block = true
      tokenOpen.info = params.name
      tokenOpen.map = [startLine, nextLine]

      params.props?.forEach(([key, value]) => {
        if (key === 'class') tokenOpen.attrJoin(key, value)
        else tokenOpen.attrSet(key, value)
      })

      // Render bracket content as the first paragraph: `::block[Content]\n::`
      if (params.content !== undefined) {
        const pOpen = state.push('paragraph_open', 'p', 1)
        pOpen.map = [startLine, startLine + 1]
        const inline = state.push('inline', '', 0)
        inline.content = params.content
        inline.children = []
        state.push('paragraph_close', 'p', -1)
      }

      const blkIndent = state.blkIndent
      state.blkIndent = indent
      state.env.comarkBlockTokens ||= [] as Token[]
      state.env.comarkBlockTokens.unshift(tokenOpen)
      state.md.block.tokenize(state, startLine + 1, nextLine)
      state.blkIndent = blkIndent
      state.env.comarkBlockTokens.shift()

      const tokenClose = state.push('mdc_block_close', params.name, -1)
      tokenClose.map = [startLine, nextLine]
      tokenClose.markup = state.src.slice(start, pos)
      tokenClose.block = true

      // Hide the wrapper paragraph for single-paragraph blocks
      state.tokens
        .slice(state.tokens.indexOf(tokenOpen) + 1, state.tokens.indexOf(tokenClose))
        .filter((i) => i.level === tokenOpen.level + 1)
        .forEach((i, _, arr) => {
          if (arr.length <= 2 && i.tag === 'p') i.hidden = true
        })

      state.parentType = old_parent
      state.lineMax = old_line_max
      state.line = nextLine + (auto_closed ? 1 : 0)

      return true
    },
    {
      alt: ['paragraph', 'reference', 'blockquote', 'list'],
    }
  )

  md.block.ruler.after('code', 'comark_block_yaml', function comark_block_yaml(state, startLine, endLine, silent) {
    if (!state.env.comarkBlockTokens?.length) return false

    const start = state.bMarks[startLine] + state.tShift[startLine]
    const end = state.eMarks[startLine]

    const line = state.src.slice(start, end)
    const blockAttributesClosingFence = blockYamlLines[line] || ''

    if (!blockAttributesClosingFence) return false

    // The `---` fence is only valid on the line immediately after the component opener. Any other `---` is a thematic break.
    if (line === '---') {
      const parentOpenLine = state.env.comarkBlockTokens[0].map?.[0]
      if (parentOpenLine === undefined || startLine !== parentOpenLine + 1) return false
    }

    let lineEnd = startLine + 1
    let found = false
    while (lineEnd < endLine) {
      const inner = state.src.slice(state.bMarks[lineEnd] + state.tShift[startLine], state.eMarks[lineEnd])
      if (inner === blockAttributesClosingFence) {
        found = true
        break
      }
      lineEnd += 1
    }

    if (!found) return false

    if (!silent) {
      const yaml = state.src.slice(state.bMarks[startLine + 1], state.eMarks[lineEnd - 1])
      const data = parseYaml(yaml)
      const token = state.env.comarkBlockTokens[0]
      Object.entries(data || {}).forEach(([key, value]) => {
        if (key === 'class') {
          token.attrJoin(key, value as string)
          return
        }
        // Match @nuxtjs/mdc: non-string YAML values are stored as `:`-prefixed
        // bindings with a JSON-string payload. Framework renderers (and
        // resolveAttributes with parseJson) restore native types; quoted YAML
        // strings stay unprefixed and remain strings (#364).
        if (typeof value === 'string') {
          token.attrSet(key, value)
        } else {
          token.attrSet(`:${key}`, JSON.stringify(value))
        }
      })
    }

    state.line = lineEnd + 1
    return true
  })

  md.block.ruler.after('code', 'comark_block_slots', function comark_block_slots(state, startLine, endLine, silent) {
    if (!state.env.comarkBlockTokens?.length) return false

    const start = state.bMarks[startLine] + state.tShift[startLine]

    if (!(state.src[start] === '#' && state.src[start + 1] !== ' ' && state.src[start + 1] !== '#')) return false

    const line = state.src.slice(start, state.eMarks[startLine])

    const { name, props } = parseBlockParams(line.slice(1))

    let lineEnd = startLine + 1
    let inCodeFence = false
    let codeFenceChar = ''
    let codeFenceCount = 0
    while (lineEnd < endLine) {
      const inner = state.src.slice(state.bMarks[lineEnd] + state.tShift[startLine], state.eMarks[lineEnd])

      if (inCodeFence) {
        // Look for matching closing fence (same char, >= opening count, nothing but spaces after)
        if (inner[0] === codeFenceChar) {
          let fencePos = 1
          while (fencePos < inner.length && inner[fencePos] === codeFenceChar) fencePos++
          if (fencePos >= codeFenceCount && inner.slice(fencePos).trim() === '') {
            inCodeFence = false
          }
        }
        lineEnd += 1
        continue
      }

      // Detect opening code fence (``` or ~~~, length >= 3)
      if (inner[0] === '`' || inner[0] === '~') {
        const ch = inner[0]
        let fencePos = 1
        while (fencePos < inner.length && inner[fencePos] === ch) fencePos++
        if (fencePos >= 3) {
          inCodeFence = true
          codeFenceChar = ch
          codeFenceCount = fencePos
          lineEnd += 1
          continue
        }
      }

      if (/^#\w+/.test(inner) || inner.startsWith('::')) break
      lineEnd += 1
    }

    if (silent) {
      state.line = lineEnd
      return true
    }

    // Restore lineMax after tokenizing so it doesn't leak a narrower bound to
    // whatever comes after this slot (see `comark_block`'s save/restore above).
    const oldLineMax = state.lineMax
    const slot = state.push('mdc_block_slot_open', 'template', 1)
    slot.attrSet('name', `${name}`)
    props?.forEach(([key, value]) => {
      if (key === 'class') slot.attrJoin(key, value)
      else slot.attrSet(key, value)
    })

    state.line = startLine + 1
    state.lineMax = lineEnd

    state.md.block.tokenize(state, startLine + 1, lineEnd)

    state.push('mdc_block_slot_close', 'template', -1)

    state.line = lineEnd
    state.lineMax = oldLineMax

    return true
  })
}

const ALLOWED_PREV_CHARS = new Set([' ', '\t', '\n', '*', '_', '['])

const markdownItInlineComponent: PluginSimple = (md) => {
  md.inline.ruler.after('entity', 'comark_inline_component', (state, silent) => {
    const start = state.pos
    if (state.src[start] !== ':') return false

    const prevChar = state.src[start - 1]
    if (start > 0 && !ALLOWED_PREV_CHARS.has(prevChar)) return false

    let index = start + 1
    let nameEnd = -1
    let contentStart = -1
    let contentEnd = -1

    while (index < state.src.length) {
      const char = state.src[index]
      if (char === '[') {
        nameEnd = index
        const result = parseBracketContent(state.src, index)
        if (result) {
          contentStart = index + 1
          contentEnd = result.endIndex - 1
          index = result.endIndex
        }
        break
      }
      if (!/[\w$-]/.test(char)) break
      index += 1
    }

    if (nameEnd === -1) nameEnd = index

    // Empty name
    if (nameEnd <= start + 1) return false

    const name = state.src.slice(start + 1, nameEnd)
    if (!isValidComponentName(name)) return false

    state.pos = index

    if (silent) return true

    if (contentStart !== -1) {
      state.push('mdc_inline_component_open', name, 1)

      const oldPos = state.pos
      const oldPosMax = state.posMax
      state.pos = contentStart
      state.posMax = contentEnd
      state.md.inline.tokenize(state)
      state.pos = oldPos
      state.posMax = oldPosMax

      state.push('mdc_inline_component_close', name, -1)
    } else {
      state.push('mdc_inline_component', name, 0)
    }

    return true
  })
}

// #region Inline span (`[text]` / `[text]{attrs}`)

const markdownItInlineSpan: PluginSimple = (md) => {
  md.inline.ruler.before('link', 'comark_inline_span', (state, silent) => {
    const start = state.pos
    if (state.src[start] !== '[') return false

    // An unclosed span consumes to the end of input (streaming auto-close)
    const close = findClosingBracket(state.src, start)
    const index = close === -1 ? state.src.length : close

    // Don't match `[text](url)` or `[text][ref]` — let the link parser handle those
    const nextChar = state.src[index + 1]
    if (nextChar === '(' || nextChar === '[') return false

    // Inside a link label, bare `[text]` stays literal (plain-markdown behavior,
    // e.g. `[[1] Document](#)`); only an explicit `[text]{attrs}` span matches
    if (state.linkLevel > 0 && nextChar !== '{') return false

    // Returning `false` lets `parseLinkLabel`'s own depth tracking consume nested brackets and the outer link parse
    if (silent) return false

    state.push('mdc_inline_span_open', 'span', 1)

    const oldPos = state.pos
    const oldPosMax = state.posMax
    state.pos = start + 1
    state.posMax = index
    state.md.inline.tokenize(state)
    state.pos = oldPos
    state.posMax = oldPosMax

    state.push('mdc_inline_span_close', 'span', -1)

    state.pos = index + 1

    return true
  })
}

// #endregion

/** markdown-it / markdown-exit adapter for Comark component + span syntax. */
export const markdownItComponents: PluginSimple = (md) => {
  md.use(markdownItComarkBlock)
  md.use(markdownItInlineSpan)
  md.use(markdownItInlineComponent)
}

export default defineComarkPlugin(() => ({
  name: 'components',
  markdownItPlugins: [markdownItComponents as unknown as MarkdownItPlugin],
}))
