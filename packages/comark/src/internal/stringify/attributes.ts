import { stringifyYaml } from '../yaml.ts'
import { escapeHtml, get } from '../../utils/index.ts'
import { isUnsafeUrlValue } from '../props-validation.ts'
import { pickFence } from './fence.ts'
import type { NodeRenderData } from '../../types.ts'

export interface ResolveAttributesOptions {
  /**
   * When true, every `:prefixed` string value is JSON-parsed first and the
   * `:` prefix is always stripped. Non-JSON strings fall back to a dot-path
   * lookup in `renderData`; unresolved paths yield `undefined`.
   *
   * This matches the Vue/React/Svelte/Angular renderer semantics, which always
   * normalize bindings into real JS values suitable for typed component props.
   *
   * When false (default) only dot-path lookups are applied — literals and
   * unresolved paths are preserved verbatim so string-based serializers
   * (like HTML attribute emitters) can apply their own `:prefix` handling.
   */
  parseJson?: boolean
}

// DOM sinks that turn a string/object prop into raw markup (`innerHTML`,
// `dangerouslySetInnerHTML`) or overwrite an element's children
// (`textContent`). Framework renderers hand resolved attributes to
// `h()`/`createElement`/spreads verbatim, so these keys are never forwarded
// from document attributes — raw HTML has its own explicit path.
const HTML_SINK_PROPS = new Set(['innerhtml', 'dangerouslysetinnerhtml', 'textcontent'])

/**
 * Resolve `:prefixed` attributes against the render context.
 *
 * Default behavior: a `:prefixed` string value that matches a dot-path in
 * `{ frontmatter, meta, data, props }` is replaced with the resolved value
 * (and the `:` prefix is stripped). Anything that doesn't resolve — literals
 * like `"5"` / `"true"`, unknown paths, or already-parsed object values — is
 * left untouched and keeps its `:` prefix.
 *
 * With `parseJson: true`, every `:prefixed` string is JSON-parsed first and
 * the `:` prefix is always stripped, falling back to the dot-path lookup.
 * The `$` metadata key is never forwarded.
 */
export function resolveAttributes(
  attrs: Record<string, unknown>,
  renderData: NodeRenderData,
  options: ResolveAttributesOptions = {}
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const key in attrs) {
    if (key === '$') continue

    const value = attrs[key]
    const isBinding = key.charCodeAt(0) === 58 /* ':' */
    const outKey = isBinding ? key.slice(1) : key

    if (HTML_SINK_PROPS.has(outKey.toLowerCase())) continue

    let outValue: unknown
    let resultKey = key

    if (options.parseJson && isBinding) {
      // Framework mode: always strip `:` and hand components real JS values.
      if (typeof value === 'string') {
        try {
          outValue = JSON.parse(value)
        } catch {
          // not JSON — fall through to dot-path lookup
          outValue = get(renderData, value)
        }
      } else {
        // Non-string binding value (e.g. an object literal the parser already
        // decoded) — pass through with the prefix stripped.
        outValue = value
      }
      resultKey = outKey
    } else if (isBinding && typeof value === 'string') {
      const resolved = get(renderData, value)
      if (resolved !== undefined) {
        outValue = resolved
        resultKey = outKey
      } else {
        outValue = value
      }
    } else {
      outValue = value
    }

    // Hard floor: a binding must never resolve href/src to an unsafe scheme
    // (javascript:, data:text/html, …). Parse-time validation only sees the
    // literal path, so the resolved value is checked here — even when the
    // security plugin is not enabled.
    const lowerOutKey = outKey.toLowerCase()
    if (
      isBinding &&
      (lowerOutKey === 'href' || lowerOutKey === 'src' || lowerOutKey === 'xlink:href') &&
      typeof outValue === 'string' &&
      isUnsafeUrlValue(outValue)
    ) {
      continue
    }

    result[resultKey] = outValue
  }
  return result
}

/**
 * Read a named attribute, preferring its `:prefixed` binding (resolved against
 * `renderData`) over the literal `key`. Falls back to the raw value when the
 * binding doesn't resolve.
 */
export function resolveAttribute(attrs: Record<string, unknown>, renderData: NodeRenderData, key: string): unknown {
  const bindKey = `:${key}`
  if (bindKey in attrs) {
    const value = attrs[bindKey]
    if (typeof value === 'string') {
      const resolved = get(renderData, value)
      if (resolved !== undefined) return resolved
    }
    return value
  }
  return attrs[key]
}

// Implicit attributes the parser injects per tag — they're conveyed by the
// native markdown syntax (e.g. `as` becomes `> [!NOTE]`, `task-list-item`
// is implicit in `- [ ]`) so they should not echo back as user attrs.
const IMPLICIT_ATTRS: Record<string, { drop?: string[]; classBlocklist?: string[] }> = {
  blockquote: { drop: ['as'] },
  ol: { drop: ['start'] },
  ul: { classBlocklist: ['contains-task-list'] },
  li: { classBlocklist: ['task-list-item'] },
  // `language`/`filename`/`highlights`/`meta` ride on the fence info string.
  // `style` comes from render-time plugins (e.g. shiki / rangi) and has no
  // markdown form. `class` is handled specially in userBlockAttrs because
  // highlighters merge their injected classes with the user's class — we need
  // to strip just the highlighter portion.
  pre: { drop: ['language', 'filename', 'highlights', 'meta', 'style'] },
}

// Tags whose `class` may hold highlighter-injected classes merged with the
// user's class behind the ` . ` sentinel: `<pre>` for fenced blocks, `<code>`
// for inline code carrying `{lang=…}`.
const HIGHLIGHTER_CLASS_TAGS = new Set(['pre', 'code'])

/**
 * Whether a `class` value was injected by a highlighter rather than authored.
 *
 * Matched on whole tokens, not a prefix, so an authored `shiki-custom` or
 * `shj-custom` is left alone. Shiki emits `shiki <theme>…`; rangi emits
 * `<classPrefix> shiki shj-lang-<lang>`, where the prefix defaults to `shj` but
 * is configurable, so the third form catches a customized one.
 */
function isHighlighterClass(value: string): boolean {
  const tokens = value.trim().split(/\s+/)
  return (
    tokens[0] === 'shiki' ||
    tokens[0] === 'shj' ||
    (tokens[1] === 'shiki' && (tokens[2]?.startsWith('shj-lang-') ?? false))
  )
}

/**
 * Collapse the ` . ` separator highlighters use to mark where their injected
 * classes end and the user's begin. It exists only so `userBlockAttrs` can
 * recover the user portion on markdown stringify; it must never reach HTML.
 */
export function mergeHighlighterClass(value: unknown): unknown {
  if (typeof value !== 'string') return value
  if (!isHighlighterClass(value)) return value
  return value
    .split(/\s+/)
    .filter((token) => token !== '.')
    .join(' ')
}

/**
 * Filter implicit/auto-generated attrs that are encoded by the native
 * markdown syntax and shouldn't echo back as `{attr=...}`. Used by the
 * block stringifiers to decide whether a node has *user* attrs that must
 * be preserved via the `::tag{...}` wrapper form.
 */
export function userBlockAttrs(tag: string, attributes: Record<string, unknown>): Record<string, unknown> {
  const rule = IMPLICIT_ATTRS[tag]
  const stripsHighlighterClass = HIGHLIGHTER_CLASS_TAGS.has(tag)
  if (!rule && !stripsHighlighterClass) return { ...attributes }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(attributes)) {
    if (rule?.drop?.includes(key)) continue
    if (key === 'class' && rule?.classBlocklist && typeof value === 'string') {
      const remaining = value
        .split(/\s+/)
        .filter((c) => c && !rule!.classBlocklist!.includes(c))
        .join(' ')
      if (remaining) result[key] = remaining
      continue
    }
    if (key === 'class' && stripsHighlighterClass && typeof value === 'string' && isHighlighterClass(value)) {
      // Highlighters inject their own classes (`shiki …` / `shj shj-lang-…`)
      // and append any user class after a `.` separator. Recover the user
      // portion by dropping everything up to and including that separator.
      const tokens = value.split(/\s+/)
      const cutoff = tokens.findIndex((t) => t === '.')

      const userClass = cutoff >= 0 ? tokens.slice(cutoff + 1).join(' ') : ''
      if (userClass) result[key] = userClass
      continue
    }
    result[key] = value
  }
  return result
}

/**
 * Convert attributes to a string of Comark attributes
 *
 * @param attributes - The attributes to stringify
 * @returns The stringified attributes
 */
export function comarkAttributes(attributes: Record<string, unknown>) {
  const attrs = Object.entries(attributes)
    .map(([key, value]) => {
      if (key.startsWith(':') && value === 'true') {
        return key.slice(1)
      }
      if (key === 'id') {
        return `#${value}`
      }
      if (key === 'class') {
        // The parser JSON-decodes `[...]`/`{...}` attribute values, so class
        // can be an array/object here — normalize instead of crashing on
        // value.split.
        const classValue = Array.isArray(value) ? value.join(' ') : String(value)
        return classValue
          .split(' ')
          .filter(Boolean)
          .map((c) => `.${c}`)
          .join('')
      }

      if (typeof value === 'object') {
        return `${key}="${JSON.stringify(value).replace(/"/g, '\\"')}"`
      }

      const str = String(value)
      // A double quote inside a double-quoted value would terminate it early,
      // letting the remainder become new attributes on re-parse. Single
      // quotes round-trip cleanly when the value has no single quote;
      // otherwise backslash-escape (the parser skips \" without terminating —
      // safe, though it keeps the backslash in the value).
      if (str.includes('"') && !str.includes("'")) {
        return `${key}='${str}'`
      }
      return `${key}="${str.replace(/"/g, '\\"')}"`
    })
    .join(' ')

  return attrs.length > 0 ? `{${attrs}}` : ''
}

// HTML attribute names must start with a letter/underscore/colon and may only
// contain alphanumerics plus `_ : . -`. Anything else (quotes, spaces, …)
// could break out of the attribute list, so such keys are dropped entirely.
const SAFE_ATTR_NAME = /^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/

/**
 * Convert attributes to a string of HTML attributes
 *
 * @param attributes - The attributes to stringify
 * @returns The stringified attributes
 */
export function htmlAttributes(attributes: Record<string, unknown>) {
  const parts: string[] = []
  for (const [rawKey, value] of Object.entries(attributes)) {
    const key = rawKey.startsWith(':') ? rawKey.slice(1) : rawKey
    if (!SAFE_ATTR_NAME.test(key)) continue

    if (rawKey.startsWith(':')) {
      if (value === 'true') {
        parts.push(key)
        continue
      }
      if (typeof value === 'object' && value !== null) {
        parts.push(`${key}="${escapeHtml(JSON.stringify(value))}"`)
        continue
      }
      parts.push(`${key}="${escapeHtml(String(value))}"`)
      continue
    }

    if (value === true || value === 'true') {
      parts.push(key)
      continue
    }
    if (value === false || value === null || value === undefined) continue

    if (typeof value === 'object') {
      parts.push(`${key}="${escapeHtml(JSON.stringify(value))}"`)
      continue
    }

    parts.push(`${key}="${escapeHtml(String(value))}"`)
  }
  return parts.join(' ')
}

// Coerce string `'true'`/`'false'` (how inline `{attr}` parsing stores
// boolean-like attrs) to native booleans so js-yaml v5 emits them unquoted.
function normalizeValue(value: unknown): unknown {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}

/**
 * Convert attributes to a string of YAML attributes
 *
 * @param attributes - The attributes to stringify
 * @returns The stringified attributes
 */
export function comarkYamlAttributes(
  attributes: Record<string, unknown>,
  style: 'frontmatter' | 'codeblock' = 'codeblock'
) {
  // Normalize attribute values for YAML serialization:
  //  - `:`-prefixed JSON literals (`:count="42"`, `:config={…}`) restore to
  //    native values and drop the prefix — matching @nuxtjs/mdc stringify.
  //  - `:`-prefixed path bindings (`:to="$doc.link"`) stay prefixed so they
  //    round-trip as bindings, not plain strings.
  //  - Bare string literals `'true'`/`'false'` from inline attrs coerce to bools.
  const normalized = Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => {
      if (key.startsWith(':')) {
        if (typeof value === 'string') {
          try {
            // JSON number/boolean/null/object/array → typed YAML key without `:`
            return [key.slice(1), JSON.parse(value)]
          } catch {
            // Path binding / non-JSON string — keep the `:` key
            return [key, value]
          }
        }
        // Already-decoded object/array (processAttributes) or native value
        return [key.slice(1), value]
      }
      return [key, normalizeValue(value)]
    })
  )

  const yamlContent = stringifyYaml(normalized).trim()

  if (style === 'frontmatter') {
    return `---\n${yamlContent}\n---`
  }

  const fence = pickFence(yamlContent)
  return `${fence}yaml [props]\n${yamlContent}\n${fence}`
}
