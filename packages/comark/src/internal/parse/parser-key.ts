const refIds = new WeakMap<object, number>()
let nextRefId = 0

function refId(value: object): number {
  let id = refIds.get(value)
  if (id === undefined) {
    id = ++nextRefId
    refIds.set(value, id)
  }
  return id
}

function encode(value: unknown): string {
  if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
    return `#${refId(value as object)}`
  }
  return `${typeof value}:${String(value)}`
}

/**
 * Structural key for a set of parser options.
 *
 * Primitives, and arrays of them such as `unwrap: ['p']`, are serialised by
 * value. Objects and functions (`plugins`, `autoClose`, `tracer`, `cache`) are
 * serialised by interned identity, so callers should create plugin instances
 * once rather than inline on every render.
 *
 * Keys are walked in sorted order so `{ a, b }` and `{ b, a }` collapse to the
 * same parser, and `undefined` values are skipped so `{ autoUnwrap: undefined }`
 * matches `{}`. The field list comes from the object itself rather than a
 * hand-maintained one, so a new `ParserOptions` field can never be silently
 * left out of the key.
 */
export function parserKey(options: Record<string, unknown>): string {
  let key = ''
  for (const name of Object.keys(options).sort()) {
    const value = options[name]
    if (value === undefined) continue
    key += ` ${name}:`
    if (Array.isArray(value)) {
      for (const item of value) key += `${encode(item)},`
    } else {
      key += encode(value)
    }
  }
  return key
}
