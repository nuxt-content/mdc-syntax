import { createMarkdownParser } from 'comark'
import type { ParserOptions } from 'comark'

// Serialize access to the parser's stream state without hiding plugin errors.
export function createComponentParser(options: ParserOptions) {
  const parse = createMarkdownParser(options)
  let pending: Promise<unknown> = Promise.resolve()
  return (...args: Parameters<typeof parse>) => {
    const run = () => parse(...args)
    const result = pending.then(run, run)
    pending = result
    return result
  }
}
