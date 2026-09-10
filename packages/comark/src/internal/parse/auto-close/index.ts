/**
 * Auto-closes unclosed markdown and Comark component syntax.
 *
 * O(n) character scanning. Two layers:
 *   - Block: full-document scan (fences, components, frontmatter, tables, `$$`)
 *   - Inline: last content line only (emphasis, links, math, HTML, tildes)
 * Behavioral contract: `packages/comark/SPEC/auto-close.md`.
 */

import { closeTables } from './table.ts'

export const INCOMPLETE_LINK_PLACEHOLDER = 'comark:incomplete-link'
export const INCOMPLETE_IMAGE_PLACEHOLDER = 'comark:incomplete-image'

export type LinkMode = 'protocol' | 'text-only'

export interface AutoCloseOptions {
  frontmatter?: boolean
  /** Component fences (`::`). Default true. */
  syntax?: boolean
  /** Attached `{...}` attribute scopes. Defaults to `syntax`. */
  attributes?: boolean
  linkMode?: LinkMode
  incompleteLinkPlaceholder?: string
  incompleteImagePlaceholder?: string
  /**
   * Auto-close math: inline `$…$` and block `$$…$$`.
   * Default false. Enabled automatically when use math plugin in `parseMarkdown`
   */
  math?: boolean
  /**
   * Drop a trailing opener (`* _ $ : [ { !`) after whitespace at EOF so a
   * half-typed marker does not flash (`hello *` → `hello`). Default false.
   * Enabled automatically when `parseMarkdown(..., { streaming: true })`.
   */
  dropTrailingOpeners?: boolean
}

export function autoCloseMarkdown(markdown: string, options: AutoCloseOptions = {}): string {
  if (!markdown) return markdown

  const syntaxEnabled = options.syntax !== false
  const attributesEnabled = options.attributes ?? syntaxEnabled
  const linkMode: LinkMode = options.linkMode ?? 'protocol'
  const linkPh = options.incompleteLinkPlaceholder ?? INCOMPLETE_LINK_PLACEHOLDER
  const imagePh = options.incompleteImagePlaceholder ?? INCOMPLETE_IMAGE_PLACEHOLDER
  const math = options.math === true

  if (options.dropTrailingOpeners === true) markdown = dropTrailingOpeners(markdown)

  // --- Block pass: full document (fences, components, frontmatter, tables, block math) ---
  const lines = markdown.split('\n')
  const n = lines.length

  let inFrontmatter = false
  let frontmatterHasContent = false
  let tableStart = -1
  let inRawTextElement: 'style' | 'script' | 'pre' | 'textarea' | null = null
  let fenceOpen = false
  let inBlockMath = false

  const componentStack: Array<{ depth: number; name: string; indent: string; hasYamlProps: boolean }> = []
  const RAW_TEXT_OPEN_RE = /^<(script|pre|style|textarea)(\s|>|$)/i

  for (let idx = 0; idx < n; idx++) {
    const line = lines[idx]
    const trimmed = line.trim()

    if (inRawTextElement) {
      if (new RegExp(`</${inRawTextElement}\\s*>`, 'i').test(line)) inRawTextElement = null
      continue
    }
    const rawMatch = trimmed.match(RAW_TEXT_OPEN_RE)
    if (rawMatch) {
      const tag = rawMatch[1].toLowerCase() as 'style' | 'script' | 'pre' | 'textarea'
      if (!new RegExp(`</${tag}\\s*>`, 'i').test(line)) inRawTextElement = tag
      continue
    }

    if (isFenceLine(line)) {
      // Single-line incomplete fence ```...`` is NOT a multi-line fence open
      // (SPEC closes the third backtick instead of treating the rest as code).
      const t = line.trim()
      if (t.startsWith('```') && t.endsWith('``') && !t.endsWith('```') && !t.slice(3).includes('```')) {
        // leave fenceOpen alone; heal pass will complete the trailing `
        continue
      }
      fenceOpen = !fenceOpen
      continue
    }
    if (fenceOpen) continue

    // Standalone $$ toggles a block-math region (closed after the pass when math is on)
    if (math && trimmed === '$$') {
      inBlockMath = !inBlockMath
      continue
    }

    if (idx === 0 && options.frontmatter && trimmed === '---') {
      inFrontmatter = true
      continue
    }
    if (inFrontmatter) {
      if (trimmed === '---') inFrontmatter = false
      else if (trimmed) frontmatterHasContent = true
      continue
    }

    if (trimmed === '---' && componentStack.length > 0) {
      const top = componentStack[componentStack.length - 1]
      top.hasYamlProps = !top.hasYamlProps
      continue
    }

    if (trimmed.startsWith('|')) tableStart = tableStart === -1 ? idx : tableStart
    else if (tableStart !== -1) tableStart = -1

    if (idx === n - 1 && syntaxEnabled && trimmed[0] === ':' && componentStack.length === 0) {
      let c = 0
      while (c < trimmed.length && trimmed[c] === ':') c++
      if (trimmed.slice(c).trim() === '') lines[idx] = ''
    }

    if (syntaxEnabled && trimmed[0] === ':') {
      let colonCount = 0
      while (colonCount < trimmed.length && trimmed[colonCount] === ':') colonCount++
      if (colonCount >= 2) {
        let ie = 0
        while (ie < line.length && (line[ie] === ' ' || line[ie] === '\t')) ie++
        const indent = line.slice(0, ie)
        const ch = trimmed[colonCount] ?? ''
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '$') {
          let ne = colonCount
          while (ne < trimmed.length) {
            const c = trimmed[ne]
            if (
              !(
                (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (c >= '0' && c <= '9') ||
                c === '$' ||
                c === '.' ||
                c === '-' ||
                c === '_'
              )
            )
              break
            ne++
          }
          componentStack.push({ depth: colonCount, name: trimmed.slice(colonCount, ne), indent, hasYamlProps: false })
        } else if (colonCount === trimmed.length && componentStack.length > 0) {
          if (componentStack[componentStack.length - 1].depth === colonCount) componentStack.pop()
        }
      }
    }
  }

  // --- Inline heal: last content line only. Earlier lines are assumed complete. ---
  if (!fenceOpen && !inFrontmatter && !inBlockMath) {
    let healIdx = n - 1
    while (healIdx > 0 && lines[healIdx] === '') healIdx--
    const healLine = healIdx >= 0 ? lines[healIdx] : ''
    const trimmedHeal = healLine.trim()
    // Skip standalone block delimiters (`$$`). An incomplete inline fence like
    // ```python print("Hello")`` still needs last-line heal.
    const incompleteInlineFence =
      trimmedHeal.startsWith('```') && trimmedHeal.endsWith('``') && !trimmedHeal.endsWith('```')
    if (healLine !== '' && trimmedHeal !== '$$' && (!isFenceLine(healLine) || incompleteInlineFence)) {
      lines[healIdx] = healInline(healLine, {
        attributesEnabled,
        linkMode,
        linkPh,
        imagePh,
        math,
      })
    }
  }

  let result = lines.join('\n')
  result = applySetextGuard(result)

  if (tableStart !== -1) result = closeTables(result)

  if (math && inBlockMath) {
    result += result.endsWith('\n') ? '$$' : '\n$$'
  }

  if (inFrontmatter && frontmatterHasContent) {
    const last = result.includes('\n') ? result.slice(result.lastIndexOf('\n') + 1) : result
    const t = last.trim().replace(/\u200B/g, '')
    if (t === '-' || t === '--') result = result.replace(/\u200B+$/, '') + '-'.repeat(3 - t.length)
    else result += result.endsWith('\n') ? '---' : '\n---'
  }

  if (syntaxEnabled && markdown.includes('::')) {
    const ls = result.lastIndexOf('\n') + 1
    const fl = result.slice(ls)
    let brace = -1
    for (let i = fl.length - 1; i >= 0; i--) {
      if (fl[i] === '}') break
      if (fl[i] === '{') {
        brace = i
        break
      }
    }
    if (brace >= 0) {
      const body = fl.slice(brace + 1)
      let dq = 0,
        sq = 0
      for (let i = 0; i < body.length; i++) {
        if (body[i] === '"') dq++
        if (body[i] === "'") sq++
      }
      result += (dq % 2 === 1 ? '"' : '') + (sq % 2 === 1 ? "'" : '') + '}'
    }
    if (componentStack.length > 0) {
      const top = componentStack[componentStack.length - 1]
      const nt = result
        .slice(result.lastIndexOf('\n') + 1)
        .trim()
        .replace(/\u200B/g, '')
      if (top.hasYamlProps && (nt === '-' || nt === '--')) {
        result = result.replace(/\u200B+$/, '') + '-'.repeat(3 - nt.length)
        top.hasYamlProps = false
      }
      const closers: string[] = []
      while (componentStack.length) {
        const c = componentStack.pop()!
        if (c.hasYamlProps) closers.push(c.indent + '---')
        closers.push(c.indent + ':'.repeat(c.depth))
      }
      result += '\n' + closers.join('\n')
    }
  }

  return result
}

/** True for a CommonMark fence opener/closer line (``` or ~~~, length ≥ 3). */
function isFenceLine(line: string): boolean {
  let i = 0
  while (i < line.length && (line[i] === ' ' || line[i] === '\t')) i++
  const ch = line[i]
  if (ch !== '`' && ch !== '~') return false
  let n = 0
  while (i + n < line.length && line[i + n] === ch) n++
  return n >= 3
}

function isWord(ch: string): boolean {
  if (!ch) return false
  const c = ch.charCodeAt(0)
  return (c >= 48 && c <= 57) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c === 95
}

function isSpace(ch: string): boolean {
  return ch === '' || ch === ' ' || ch === '\t' || ch === '\n'
}

/** Trailing chars dropped when `dropTrailingOpeners` is on so incomplete openers do not flash. */
const TRAILING_OPENERS = '*_$:[{!'

/**
 * Drop a trailing opener run (`* _ $ : [ { !`) at EOF when it is preceded by
 * whitespace (`hello *` → `hello`). Attached markers (`**bold`, `$x`) stay so
 * the later heal can still close them.
 */
function dropTrailingOpeners(text: string): string {
  let ws = text.length
  while (ws > 0) {
    const c = text[ws - 1]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') ws--
    else break
  }
  if (ws === 0) return text

  // Drop only the last opener run (`*`, `**`, `$`, …). An earlier space-separated
  // `*` in `hello * *` is already followed by space, so it cannot become syntax.
  let i = ws
  while (i > 0 && TRAILING_OPENERS.includes(text[i - 1])) {
    if (i >= 2 && text[i - 2] === '\\') break
    i--
  }
  if (i === ws) return text

  // Only drop when that run is space-flanked (preceded by whitespace or BOS)
  const before = i > 0 ? text[i - 1] : ''
  if (before !== '' && before !== ' ' && before !== '\t' && before !== '\n' && before !== '\r') {
    return text
  }

  let keep = i
  if (keep > 0 && (text[keep - 1] === ' ' || text[keep - 1] === '\t')) keep--
  return text.slice(0, keep) + text.slice(ws)
}

// ---------------------------------------------------------------------------
// One O(n) document heal
// ---------------------------------------------------------------------------

interface HealOpts {
  attributesEnabled: boolean
  linkMode: LinkMode
  linkPh: string
  imagePh: string
  math: boolean
}

type Marker = '***' | '**' | '*' | '__' | '_' | '~~' | '`' | '$$' | '$'

/** Inline heal for a single line. Previous lines are assumed already legitimate. */
function healInline(text: string, opts: HealOpts): string {
  // 1) Trailing single space
  if (text.endsWith(' ') && !text.endsWith('  ')) {
    const nl = text.lastIndexOf('\n')
    const last = nl === -1 ? text : text.slice(nl + 1)
    if (!/^[ \t]*[A-Za-z_][\w.-]*: $/.test(last)) text = text.slice(0, -1)
  }

  // 2) Build mutated string for escapes while collecting open markers
  const len = text.length
  const out: string[] = []
  let stack: Marker[] = []

  let fence = false
  let inCode = false
  // Backtick count of the open code span, and the index in `out` where its
  // opening run starts. A code span cannot nest, so one pair of scalars is
  // enough; `out` is append-only, so the index stays valid in the joined result.
  let codeRun = 0
  let codeOpenOut = -1
  let inMath = false
  let inBlockMath = false
  let inLatexI = false
  let inLatexB = false
  let inAttr = 0
  let lineStartSrc = 0

  // Incomplete link state
  let bracketDepth = 0
  let linkUrlOpen = false // saw ](

  let lastLtOut = -1

  // Asterisk/underscore pair tracking for "balanced overlapping" check
  let asteriskTotal = 0
  let doubleAsteriskCount = 0
  let tripleCount = 0

  /** Open only when the run is not followed by space; close only when not preceded by space. */
  const toggleFlanking = (m: Marker, prevCh: string, afterCh: string) => {
    const canClose = !isSpace(prevCh) && stack[stack.length - 1] === m
    const canOpen = !isSpace(afterCh)
    if (canClose) stack.pop()
    else if (canOpen) stack.push(m)
  }

  const toggle = (m: Marker) => {
    if (stack[stack.length - 1] === m) stack.pop()
    else stack.push(m)
  }

  for (let i = 0; i < len; i++) {
    const ch = text[i]
    const prev = i > 0 ? text[i - 1] : ''
    const next = i + 1 < len ? text[i + 1] : ''

    // Newline
    if (ch === '\n') {
      out.push(ch)
      lineStartSrc = i + 1
      continue
    }

    // Fence at line start (``` or ~~~) OR incomplete inline ```...``
    if (i === lineStartSrc || (i > 0 && text[i - 1] === '\n')) {
      let j = i
      while (j < len && (text[j] === ' ' || text[j] === '\t')) j++
      const fenceCh = text[j]
      if (fenceCh === '`' || fenceCh === '~') {
        let n = 0
        while (j + n < len && text[j + n] === fenceCh) n++
        if (n >= 3) {
          let lineEnd = j
          while (lineEnd < len && text[lineEnd] !== '\n') lineEnd++
          const lineBody = text.slice(j, lineEnd)
          // Incomplete inline backtick fence: ```python print("Hello")``
          if (
            fenceCh === '`' &&
            lineBody.startsWith('```') &&
            lineBody.endsWith('``') &&
            !lineBody.endsWith('```') &&
            !lineBody.slice(3).includes('```')
          ) {
            while (i < lineEnd) {
              out.push(text[i])
              i++
            }
            out.push('`')
            i--
            continue
          }
          fence = !fence
          while (i < len && text[i] !== '\n') {
            out.push(text[i])
            i++
          }
          if (i < len) {
            out.push('\n')
            lineStartSrc = i + 1
          } else i--
          continue
        }
      }
    }

    if (fence) {
      out.push(ch)
      continue
    }

    // Escape
    if (ch === '\\') {
      out.push(ch)
      if (i + 1 < len) {
        out.push(text[++i])
      }
      continue
    }

    // List comparison operator
    if (ch === '>') {
      let ls = i
      while (ls > 0 && text[ls - 1] !== '\n') ls--
      const prefix = text.slice(ls, i)
      if (/^(\s*(?:[-*+]|\d+[.)]) +)$/.test(prefix) && /^=?\s*\$?\d/.test(text.slice(i + 1))) {
        out.push('\\', '>')
        continue
      }
    }

    // Single ~ between word chars: escape mid-word tildes that would be read as
    // strikethrough (`20~25` → `20\~25`). Leave paired open/close subscript-style
    // tildes alone (`H~2~o` stays `H~2~o`).
    if (
      ch === '~' &&
      next !== '~' &&
      prev !== '~' &&
      isWord(prev) &&
      isWord(next) &&
      !inCode &&
      !inMath &&
      !inBlockMath &&
      !isPairedSingleTilde(text, i)
    ) {
      out.push('\\', '~')
      continue
    }

    // HTML incomplete tracking
    if (ch === '<' && ((next >= 'a' && next <= 'z') || (next >= 'A' && next <= 'Z') || next === '/')) {
      lastLtOut = out.length
    }
    if (ch === '>') lastLtOut = -1

    // Regions that protect markers
    if (inCode) {
      if (ch === '`') {
        // A code span closes on a backtick run of the same length as its opener.
        // A shorter or longer run is literal content (CommonMark), which is what
        // keeps ``Use `code` in your file.`` intact.
        let end = i
        while (end + 1 < len && text[end + 1] === '`') end++
        const run = end - i + 1
        for (let k = i; k <= end; k++) out.push('`')
        if (run === codeRun) {
          inCode = false
          codeRun = 0
          codeOpenOut = -1
          if (stack[stack.length - 1] === '`') stack.pop()
        }
        i = end
        continue
      }
      out.push(ch)
      continue
    }
    if (inBlockMath) {
      out.push(ch)
      if (ch === '$' && next === '$') {
        out.push('$')
        i++
        inBlockMath = false
        if (stack[stack.length - 1] === '$$') stack.pop()
      }
      continue
    }
    if (inMath) {
      out.push(ch)
      if (ch === '$' && next !== '$') {
        inMath = false
        if (stack[stack.length - 1] === '$') stack.pop()
      }
      continue
    }
    if (inLatexI) {
      out.push(ch)
      if (ch === '\\' && next === ')') {
        out.push(')')
        i++
        inLatexI = false
      }
      continue
    }
    if (inLatexB) {
      out.push(ch)
      if (ch === '\\' && next === ']') {
        out.push(']')
        i++
        inLatexB = false
      }
      continue
    }

    // Attributes
    if (opts.attributesEnabled && ch === '{' && prev && prev !== ' ' && prev !== '\t' && prev !== '\n') {
      inAttr++
      out.push(ch)
      continue
    }
    if (opts.attributesEnabled && ch === '}') {
      if (inAttr > 0) inAttr--
      out.push(ch)
      continue
    }
    if (inAttr > 0) {
      out.push(ch)
      continue
    }

    // Links / brackets — track but copy through; rewrite at end
    if (ch === '[') {
      bracketDepth++
      out.push(ch)
      continue
    }
    if (ch === ']') {
      if (bracketDepth > 0) bracketDepth--
      out.push(ch)
      if (next === '(') {
        linkUrlOpen = true
      }
      continue
    }
    if (linkUrlOpen) {
      out.push(ch)
      if (ch === ')' && bracketDepth === 0) {
        // crude: closed
        linkUrlOpen = false
      }
      continue
    }

    // Skip emphasis counts while inside unclosed link text
    if (bracketDepth > 0) {
      out.push(ch)
      continue
    }

    // Code
    if (ch === '`') {
      let end = i
      while (end + 1 < len && text[end + 1] === '`') end++
      const run = end - i + 1
      if (run >= 3) {
        // A run of three or more mid-line is fence-shaped, not an inline span.
        // Copy it verbatim and leave it to the fence handling above.
        for (let k = i; k <= end; k++) out.push('`')
        i = end
        continue
      }
      codeOpenOut = out.length
      for (let k = i; k <= end; k++) out.push('`')
      inCode = true
      codeRun = run
      stack.push('`')
      i = end
      continue
    }

    // Math
    if (ch === '$') {
      out.push(ch)
      if (next === '$') {
        out.push('$')
        i++
        if (opts.math) {
          inBlockMath = !inBlockMath
          toggle('$$')
        }
      } else if (opts.math && looksLikeInlineMathOpen(text, i)) {
        // Skip currency (`$100`) and component names (`::$special`)
        inMath = true
        stack.push('$')
      }
      continue
    }

    // LaTeX \( \[  — backslash already handled for escapes; detect when we see them as two chars without entering escape?
    // Paths with `\(` start with `\`, caught above. For `$` math we protect. Skip.

    // Emphasis *
    if (ch === '*') {
      let end = i
      while (end + 1 < len && text[end + 1] === '*') end++
      const run = end - i + 1
      const after = end + 1 < len ? text[end + 1] : ''
      // Space after an opener (`** something`) is not emphasis — CommonMark flanking.
      const leftSpace = isSpace(prev)
      const rightSpace = isSpace(after)
      const surroundedSingle = run === 1 && leftSpace && rightSpace

      // emit chars
      for (let k = i; k <= end; k++) out.push('*')

      if (!surroundedSingle) {
        // cold word-internal *
        if (run === 1 && isWord(prev) && isWord(after) && asteriskTotal % 2 === 0) {
          i = end
          continue
        }
        asteriskTotal += run
        if (run === 1) toggleFlanking('*', prev, after)
        else if (run === 2) {
          doubleAsteriskCount++
          toggleFlanking('**', prev, after)
        } else if (run >= 3) {
          // Horizontal rule: a whole line of ≥3 * (with only spaces) is not emphasis
          let ls = i
          while (ls > 0 && text[ls - 1] !== '\n') ls--
          let le = end + 1
          while (le < len && text[le] !== '\n') le++
          const lineContent = text.slice(ls, le)
          let onlyStars = true
          for (let li = 0; li < lineContent.length; li++) {
            const c = lineContent[li]
            if (c !== '*' && c !== ' ' && c !== '\t') {
              onlyStars = false
              break
            }
          }
          if (onlyStars) {
            // leave stack alone — thematic break
            i = end
            continue
          }

          if (run === 3) {
            // *** as bold-italic opener/closer, OR overlapping close for open * + **
            const hasStar = stack.includes('*')
            const hasBold = stack.includes('**')
            if (hasStar && hasBold && !leftSpace) {
              for (let si = stack.length - 1; si >= 0; si--) {
                if (stack[si] === '*' || stack[si] === '**') stack.splice(si, 1)
              }
              doubleAsteriskCount++
            } else {
              tripleCount++
              toggleFlanking('***', prev, after)
            }
          } else {
            // ****+
            const pairs = Math.floor(run / 2)
            for (let p = 0; p < pairs; p++) {
              doubleAsteriskCount++
              toggleFlanking('**', prev, after)
            }
            if (run % 2 === 1) toggleFlanking('*', prev, after)
          }
          i = end
          continue
        }
      }
      i = end
      continue
    }

    if (ch === '_') {
      let end = i
      while (end + 1 < len && text[end + 1] === '_') end++
      const run = end - i + 1
      const after = end + 1 < len ? text[end + 1] : ''
      const surrounded = isSpace(prev) && isSpace(after)
      for (let k = i; k <= end; k++) out.push('_')

      // Horizontal rule: line of only _ (3+)
      if (run >= 3) {
        let ls = i
        while (ls > 0 && text[ls - 1] !== '\n') ls--
        let le = end + 1
        while (le < len && text[le] !== '\n') le++
        const lineContent = text.slice(ls, le)
        let only = true
        for (let li = 0; li < lineContent.length; li++) {
          const c = lineContent[li]
          if (c !== '_' && c !== ' ' && c !== '\t') {
            only = false
            break
          }
        }
        if (only) {
          i = end
          continue
        }
      }

      if (!(isWord(prev) && isWord(after)) && !surrounded) {
        if (run === 1) toggleFlanking('_', prev, after)
        else if (run >= 2) {
          const pairs = Math.floor(run / 2)
          for (let p = 0; p < pairs; p++) {
            toggleFlanking('__', prev, after)
          }
          if (run % 2 === 1) toggleFlanking('_', prev, after)
        }
      }
      i = end
      continue
    }

    if (ch === '~') {
      let end = i
      while (end + 1 < len && text[end + 1] === '~') end++
      const run = end - i + 1
      const after = end + 1 < len ? text[end + 1] : ''
      const surrounded = isSpace(prev) && isSpace(after)
      for (let k = i; k <= end; k++) out.push('~')
      if (!surrounded && run >= 2) {
        const pairs = Math.floor(run / 2)
        for (let p = 0; p < pairs; p++) toggleFlanking('~~', prev, after)
      }
      // single ~ not stacked (SPEC escapes or leaves alone)
      i = end
      continue
    }

    out.push(ch)
  }

  let result = out.join('')

  // Incomplete HTML strip
  if (lastLtOut >= 0) {
    // map: lastLtOut is index into out at time of `<` — still valid after join length if only escaped longer...
    // We pushed at lastLtOut; result may be longer only if we added escapes before.
    // Safer rescan end:
    result = stripIncompleteHtmlEnd(result)
  }

  // Incomplete links
  const linked = healLinks(result, opts)
  if (linked !== result) {
    // If protocol incomplete link, SPEC early-returns before other emphasis (links win)
    if (
      opts.linkMode === 'protocol' &&
      (linked.endsWith(`](${opts.linkPh})`) || linked.endsWith(`](${opts.imagePh})`))
    ) {
      return linked
    }
    result = linked
    // text-only: continue to close other markers on the result? rarely needed
  }

  // If still in fence path we shouldn't be here

  // Close open markers (stack) — skip empty / HR / bare
  if (stack.length === 0) {
    return result
  }

  // Bare / HR: don't close
  if (isBareOrHr(result)) return result

  // Still inside open inline code at EOF — close nested openers inside, then `
  // SPEC: `**bold with `code` → `**bold with `code**``
  // Markers that opened *before* the code span must close inside it.
  if (inCode) {
    const afterBq = codeOpenOut >= 0 ? result.slice(codeOpenOut + codeRun) : ''
    if (afterBq.length > 0) {
      // Markers still on stack before the open ` need closing inside the span.
      // Open order is outer→inner left-to-right; close reverse order after content.
      let codeIdx = -1
      for (let si = 0; si < stack.length; si++) if (stack[si] === '`') codeIdx = si
      let inner = ''
      if (codeIdx > 0) {
        // close markers that opened before code, reverse order
        for (let si = codeIdx - 1; si >= 0; si--) {
          const m = stack[si]
          if (m === '**' || m === '*' || m === '__' || m === '_' || m === '~~' || m === '***') inner += m
        }
      }
      // also close markers opened inside code after the `
      for (let si = stack.length - 1; si > codeIdx; si--) {
        const m = stack[si]
        if (m === '**' || m === '*' || m === '__' || m === '_' || m === '~~' || m === '***') inner += m
      }
      return result + inner + '`'.repeat(codeRun)
    }
    return result
  }

  // Build suffix inside-out with half-close handling
  result = closeOpenStack(result, stack, {
    asteriskTotal,
    doubleAsteriskCount,
    tripleCount,
  })

  return result
}

function stripIncompleteHtmlEnd(text: string): string {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] === '>') return text
    if (text[i] === '\n') return text
    if (text[i] === '<') {
      const n = text[i + 1] ?? ''
      if ((n >= 'a' && n <= 'z') || (n >= 'A' && n <= 'Z') || n === '/') {
        return text.slice(0, i).replace(/[ \t]+$/, '')
      }
      return text
    }
  }
  return text
}

function isBareOrHr(text: string): boolean {
  // Only check last line
  const nl = text.lastIndexOf('\n')
  const last = (nl === -1 ? text : text.slice(nl + 1)).trim()
  if (!last) return false
  if (
    last === '*' ||
    last === '**' ||
    last === '***' ||
    last === '****' ||
    last === '_' ||
    last === '__' ||
    last === '___' ||
    last === '~' ||
    last === '~~' ||
    last === '`'
  )
    return true
  if (/^\*{3,}$/.test(last) || /^_{3,}$/.test(last) || /^-{3,}$/.test(last)) return true
  return false
}

function closeOpenStack(
  text: string,
  stack: Marker[],
  counts: { asteriskTotal: number; doubleAsteriskCount: number; tripleCount: number }
): string {
  // Half-closes first
  if (/\*\*\*[^*]+\*{1,2}$/.test(text) && !/\*{3}$/.test(text)) {
    const trail = text.match(/\*+$/)?.[0].length ?? 0
    if (trail >= 1 && trail <= 2 && (stack.includes('***') || counts.tripleCount % 2 === 1)) {
      return text + '*'.repeat(3 - trail)
    }
  }
  if (/\*\*[^*]+\*$/.test(text) && stack.includes('**') && !stack.includes('***')) return text + '*'
  if (/__[^_]+_$/.test(text) && stack.includes('__')) return text + '_'
  if (/~~[^~]+~$/.test(text) && stack.includes('~~')) return text + '~'

  // Balanced overlapping: Combined **bold and *italic*** text
  // ** opens, * opens, *** closes both → stack may still show *** from the run
  const balancedOverlap =
    counts.doubleAsteriskCount >= 2 && counts.doubleAsteriskCount % 2 === 0 && counts.asteriskTotal % 2 === 0

  let workStack = stack.slice()
  if (balancedOverlap) {
    workStack = workStack.filter((m) => m !== '***' && m !== '**' && m !== '*')
  }

  // SPEC nested formatting: when multiple markers are open, close from the inside
  // but **only** markers that must nest (different families: ** and _, ~~ and **).
  // Same-family * inside ** → close only the innermost *:
  //   `**bold and *italic` → `**bold and *italic*`  (not ***).
  // Cross-family still nests:
  //   `_italic and **bold` → `_italic and **bold**_`
  //   `~~strike with **bold` → `~~strike with **bold**~~`

  const closable: Marker[] = []
  // Scan stack from top (innermost)
  for (let i = workStack.length - 1; i >= 0; i--) {
    const m = workStack[i]
    if (m === '$$') {
      closable.push('$$')
      continue
    }
    if (m === '$') {
      closable.push('$')
      continue
    }
    if (m === '`') continue

    const token = m
    const pos = text.lastIndexOf(token)
    if (pos < 0) continue
    const after = text.slice(pos + token.length)
    if (!hasClosableContentAfter(after)) continue
    closable.push(m)
  }

  if (closable.length === 0) return text

  // Collapse same-family asterisk closers: if both *** / ** / * appear, keep only innermost needed.
  // Prefer: if top (first in closable which is reverse stack) is * and ** is also closable, only *.
  const hasStarFamily = closable.includes('*') || closable.includes('**') || closable.includes('***')
  if (hasStarFamily) {
    // Innermost open asterisk marker is first in closable (stack was reversed)
    let firstStar: Marker | null = null
    for (const m of closable) {
      if (m === '*' || m === '**' || m === '***') {
        firstStar = m
        break
      }
    }
    // If only * and ** are open (nested * inside **), close with * only
    // If only ** open, close **
    // If *** open, close ***
    // Exception cross nests are separate tokens
    if (firstStar === '*' && closable.includes('**') && !closable.includes('***')) {
      // **bold and *italic → only *
      // BUT *italic with **bold → stack [*, **] top is ** → firstStar ** → close ***?
      // For * outer + ** inner: firstStar is ** (top), emit ** then * = *** which matches SPEC
      // So only strip ** when * is TOP (innermost)
      // closable[0] is top of stack
      if (closable[0] === '*') {
        // remove ** and *** from closable
        for (let ci = closable.length - 1; ci >= 0; ci--) {
          if (closable[ci] === '**' || closable[ci] === '***') closable.splice(ci, 1)
        }
      }
    }
  }

  // Two same-token closers emitted back to back merge into a different marker:
  // `a _b and _c` produced `__`, which reads as strong and nested an em inside
  // an em. Collapse each run to one closer. Non-adjacent repeats are left alone,
  // since `_a **b _c` legitimately closes `_`, `**`, `_`.
  for (let ci = closable.length - 1; ci > 0; ci--) {
    if (closable[ci] === closable[ci - 1]) closable.splice(ci, 1)
  }

  let suffix = ''
  for (const m of closable) {
    if (m === '$$') {
      if (text.endsWith('$') && !text.endsWith('$$')) suffix += '$'
      else {
        const first = text.indexOf('$$')
        const multi = first !== -1 && text.indexOf('\n', first) !== -1
        suffix += multi && !text.endsWith('\n') ? '\n$$' : '$$'
      }
    } else {
      suffix += m
    }
  }

  if (text.endsWith(' ') && !text.endsWith('  ')) return text.slice(0, -1) + suffix

  // Insert closers before trailing newlines (SPEC: `_italic\n` → `_italic_\n`)
  let end = text.length
  while (end > 0 && text[end - 1] === '\n') end--
  if (end < text.length) return text.slice(0, end) + suffix + text.slice(end)

  return text + suffix
}

function healLinks(text: string, opts: HealOpts): string {
  // Don't touch inside fences — simple: if unfinished fence to EOF, caller skipped heal
  const lastParen = text.lastIndexOf('](')
  if (lastParen !== -1) {
    const after = text.slice(lastParen + 2)
    if (!after.includes(')') && !isPosInFence(text, lastParen)) {
      let depth = 1
      let open = -1
      for (let i = lastParen - 1; i >= 0; i--) {
        if (text[i] === ']') depth++
        else if (text[i] === '[') {
          depth--
          if (depth === 0) {
            open = i
            break
          }
        }
      }
      if (open >= 0 && !isPosInFence(text, open)) {
        const isImage = open > 0 && text[open - 1] === '!'
        const start = isImage ? open - 1 : open
        const before = text.slice(0, start)
        const alt = text.slice(open + 1, lastParen)
        if (isImage) return `${before}![${alt}](${opts.imagePh})`
        if (opts.linkMode === 'text-only') return before + alt
        return `${before}[${alt}](${opts.linkPh})`
      }
    }
  }

  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== '[' || isPosInFence(text, i)) continue
    const isImage = i > 0 && text[i - 1] === '!'
    let depth = 1
    let close = -1
    for (let j = i + 1; j < text.length; j++) {
      if (text[j] === '[') depth++
      else if (text[j] === ']') {
        depth--
        if (depth === 0) {
          close = j
          break
        }
      }
    }
    if (close === -1) {
      const start = isImage ? i - 1 : i
      const before = text.slice(0, start)
      if (isImage) return `${before}![${text.slice(i + 1)}](${opts.imagePh})`
      if (opts.linkMode === 'text-only') return text.slice(0, i) + text.slice(i + 1)
      return `${text}](${opts.linkPh})`
    }
    if (isImage && (close === text.length - 1 || text[close + 1] !== '(')) {
      if (text.slice(close + 1).trim() === '') {
        return `${text.slice(0, i - 1)}![${text.slice(i + 1, close)}](${opts.imagePh})`
      }
    }
  }
  return text
}

/** O(n) fence check for a position */
function isPosInFence(text: string, pos: number): boolean {
  let fence = false
  let i = 0
  while (i < pos) {
    if (i === 0 || text[i - 1] === '\n') {
      let j = i
      while (j < text.length && (text[j] === ' ' || text[j] === '\t')) j++
      const ch = text[j]
      if (ch === '`' || ch === '~') {
        let n = 0
        while (j + n < text.length && text[j + n] === ch) n++
        if (n >= 3) {
          fence = !fence
          while (i < text.length && text[i] !== '\n') i++
          if (i < text.length) i++
          continue
        }
      }
    }
    i++
  }
  return fence
}

function applySetextGuard(text: string): string {
  const lastNl = text.lastIndexOf('\n')
  if (lastNl === -1) return text
  const last = text.slice(lastNl + 1)
  const t = last.trim()
  if (!/^(-{1,2}|={1,2})$/.test(t)) return text
  if (/\s$/.test(last) && last !== t) return text
  const prevBlock = text.slice(0, lastNl)
  const pNl = prevBlock.lastIndexOf('\n')
  const prev = (pNl === -1 ? prevBlock : prevBlock.slice(pNl + 1)).trim()
  if (!prev) return text
  if (prev === '---' || /^[A-Za-z_][\w.-]*\s*:/.test(prev)) return text
  return text + '\u200B'
}

/**
 * True when a single `~` at `i` is one half of a paired open/close span like `H~2~o`
 * (word~content~word). Those are intentional subscript-style markers, not mid-word
 * tildes that need escaping.
 */
/**
 * True when `~` at `i` is part of a tight open/close pair like `H~2~o`:
 *   word ~ content ~ word
 * with no spaces/newlines/`~~` between the two single tildes.
 * Mid-word orphans like `20~25` or `a~b c~d` are not pairs.
 */
function isPairedSingleTilde(text: string, i: number): boolean {
  const isSingleTildeAt = (j: number): boolean => {
    if (text[j] !== '~') return false
    const p = j > 0 ? text[j - 1] : ''
    const n = j + 1 < text.length ? text[j + 1] : ''
    return p !== '~' && n !== '~'
  }

  const tightBetween = (from: number, to: number): boolean => {
    if (to - from < 1) return false
    for (let k = from; k < to; k++) {
      const c = text[k]
      if (c === '~' || c === ' ' || c === '\t' || c === '\n' || c === '\r') return false
    }
    return true
  }

  // Match closer looking back to opener
  for (let j = i - 1; j >= 0; j--) {
    if (text[j] === '\n') break
    if (text[j] === '~') {
      if (!isSingleTildeAt(j)) return false
      // opener left-flanked by a word char (H~…)
      const openPrev = j > 0 ? text[j - 1] : ''
      if (!isWord(openPrev)) return false
      // closer right-flanked by a word char (…~o)
      const closeNext = i + 1 < text.length ? text[i + 1] : ''
      if (!isWord(closeNext)) return false
      return tightBetween(j + 1, i)
    }
  }

  // Match opener looking forward to closer
  for (let j = i + 1; j < text.length; j++) {
    if (text[j] === '\n') break
    if (text[j] === '~') {
      if (!isSingleTildeAt(j)) return false
      const openPrev = i > 0 ? text[i - 1] : ''
      if (!isWord(openPrev)) return false
      const closeNext = j + 1 < text.length ? text[j + 1] : ''
      if (!isWord(closeNext)) return false
      return tightBetween(i + 1, j)
    }
  }

  return false
}

/**
 * Whether `$` at `i` should open inline math.
 * Rejects currency (`$100`, `($5)`) and component name markers (`::$name`, `:$name`).
 */
function looksLikeInlineMathOpen(text: string, i: number): boolean {
  const next = i + 1 < text.length ? text[i + 1] : ''
  if (!next || next === ' ' || next === '\t' || next === '\n') return false
  // Currency: $ followed immediately by a digit
  if (next >= '0' && next <= '9') return false
  // Component name: :$name or ::$name — `$` after one or more colons at a fence/name boundary
  const prev = i > 0 ? text[i - 1] : ''
  if (prev === ':') return false
  return true
}

/** True when a delimiter run has closable content after it (letters/digits/punct). */
function hasClosableContentAfter(after: string): boolean {
  for (let i = 0; i < after.length; i++) {
    const c = after[i]
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') continue
    if (c === '*' || c === '_' || c === '~' || c === '`') continue
    return true
  }
  return false
}
