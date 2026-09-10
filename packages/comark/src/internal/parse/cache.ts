import type { ComarkDocumentCache, ComarkParseFn, MarkdownDocument, ParserOptions } from '../../types.ts'

/**
 * Insertion-ordered LRU over a `Map`: a hit is re-inserted so it becomes the
 * newest entry, and the coldest entry is evicted once the bound is exceeded.
 *
 * A flat "clear everything when full" would throw away a whole warm cache and
 * trigger a re-parse of every document on the next request.
 */
export function createDocumentCache(max: number): ComarkDocumentCache {
  const store = new Map<string, Promise<MarkdownDocument<any, any>>>()
  return {
    get(source) {
      const hit = store.get(source)
      if (hit === undefined) return undefined
      store.delete(source)
      store.set(source, hit)
      return hit
    },
    set(source, document) {
      store.delete(source)
      store.set(source, document)
      if (store.size > max) store.delete(store.keys().next().value!)
    },
    delete(source) {
      store.delete(source)
    },
  }
}

/** Resolve the `cache` option to a store, or `null` when caching is off. */
export function resolveCache(cache: ParserOptions['cache']): ComarkDocumentCache | null {
  if (!cache) return null
  if (cache === true) return createDocumentCache(200)
  if (typeof cache === 'number') return cache > 0 ? createDocumentCache(cache) : null
  return cache
}

/**
 * Memoize parse results by source string.
 *
 * The key is the source alone, which is correct because the options are fixed
 * when the parser is built and the only per-call variance, `streaming`, is
 * excluded outright. The value is the Promise, so callers that ask for the same
 * source in one tick share a single parse rather than racing.
 */
export function withDocumentCache(parse: ComarkParseFn, cache: ComarkDocumentCache): ComarkParseFn {
  return (markdown, opts) => {
    // A streaming parse depends on the parser's incremental state and on `opts`,
    // not on the source alone. Never served from the cache, never written to it.
    if (opts?.streaming) return parse(markdown, opts)

    const hit = cache.get(markdown)
    if (hit) return hit

    const pending = parse(markdown, opts)
    cache.set(markdown, pending)
    // Never cache a failure. The derived promise is handled here so a stored
    // rejection cannot surface as an unhandled rejection.
    pending.catch(() => cache.delete(markdown))
    return pending
  }
}
