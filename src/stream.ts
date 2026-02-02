import type { Readable } from 'node:stream'
import type { ParseOptions } from './types'
import { parseFrontmatter } from './utils/front-matter'
import { autoCloseMarkdown } from './utils/auto-close'
import type { ParseResult } from './index'
import { parse } from './index'

export interface IncrementalParseResult extends ParseResult {
  chunk: string // The chunk that was just processed
  content: string // The accumulated content
  isComplete: boolean // Whether the stream is complete
}

/**
 * Helper function to convert a stream to string
 */
async function streamToString(stream: Readable | ReadableStream<Uint8Array>): Promise<string> {
  // Check if it's a Node.js Readable stream by checking for the Symbol.asyncIterator
  if (Symbol.asyncIterator in stream) {
    // Node.js stream
    const chunks: Uint8Array[] = []
    const nodeStream = stream as Readable

    for await (const chunk of nodeStream) {
      // Handle both Buffer and Uint8Array chunks
      if (chunk instanceof Uint8Array) {
        chunks.push(chunk)
      }
      else if (typeof chunk === 'string') {
        chunks.push(new TextEncoder().encode(chunk))
      }
      else {
        // Assume it's array-like
        chunks.push(new Uint8Array(chunk))
      }
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return new TextDecoder('utf-8').decode(result)
  }
  else {
    // Web stream
    const webStream = stream as ReadableStream<Uint8Array>
    const reader = webStream.getReader()
    const chunks: Uint8Array[] = []

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done)
          break
        chunks.push(value)
      }
    }
    finally {
      reader.releaseLock()
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return new TextDecoder('utf-8').decode(result)
  }
}

/**
 * Parse MDC content from a Node.js Readable stream or Web ReadableStream
 *
 * @param stream - A Node.js Readable stream or Web ReadableStream containing MDC content
 * @param options - Parser options
 * @returns Promise resolving to the parsed MDC structure
 *
 * @example
 * ```typescript
 * import { createReadStream } from 'fs'
 * import { parseStream } from 'mdc-syntax/stream'
 *
 * const stream = createReadStream('content.md')
 * const result = await parseStream(stream)
 * console.log(result.body)
 *
 * // Disable auto-unwrap
 * const result2 = await parseStream(stream, { autoUnwrap: false })
 * ```
 */
export async function parseStream(stream: Readable | ReadableStream<Uint8Array>, options?: ParseOptions): Promise<ParseResult> {
  const content = await streamToString(stream)
  return parse(content, options)
}

/**
 * Parse MDC content incrementally from a stream,
 * yielding results as each chunk is received
 *
 * @param stream - A Node.js Readable stream or Web ReadableStream containing MDC content
 * @param options - Parser options
 * @yields IncrementalParseResult for each chunk received
 *
 * @example
 * ```typescript
 * import { createReadStream } from 'fs'
 * import { parseStreamIncremental } from 'mdc-syntax/stream'
 *
 * const stream = createReadStream('content.md')
 * for await (const result of parseStreamIncremental(stream)) {
 *   console.log('Chunk:', result.chunk)
 *   console.log('Current body:', result.body)
 *   console.log('Complete:', result.isComplete)
 * }
 *
 * // Disable auto-unwrap
 * for await (const result of parseStreamIncremental(stream, { autoUnwrap: false })) {
 *   // ...
 * }
 * ```
 */
export async function* parseStreamIncremental(
  stream: Readable | ReadableStream<Uint8Array>,
  options?: ParseOptions,
): AsyncGenerator<IncrementalParseResult, void, unknown> {
  let accumulatedContent = ''
  let frontmatterParsed = false
  let frontmatterData: any = {}

  if (Symbol.asyncIterator in stream) {
    // Node.js stream
    const nodeStream = stream as Readable

    for await (const rawChunk of nodeStream) {
      // Convert chunk to string
      let chunkStr: string
      if (rawChunk instanceof Uint8Array) {
        chunkStr = new TextDecoder('utf-8').decode(rawChunk)
      }
      else if (typeof rawChunk === 'string') {
        chunkStr = rawChunk
      }
      else {
        chunkStr = new TextDecoder('utf-8').decode(new Uint8Array(rawChunk))
      }

      accumulatedContent += chunkStr

      try {
        // Parse frontmatter if not already done
        if (!frontmatterParsed) {
          const { data } = parseFrontmatter(accumulatedContent)
          frontmatterData = data
          frontmatterParsed = true
        }

        // Auto-close unclosed syntax before parsing intermediate results
        const closedContent = autoCloseMarkdown(accumulatedContent)

        // Parse the auto-closed content
        const result = parse(closedContent, options)

        yield {
          chunk: chunkStr,
          body: result.body,
          data: frontmatterData,
          isComplete: false,
          excerpt: result.excerpt,
          content: accumulatedContent,
        }
      }
      catch {
        // noop: errors in streaming are expected due to invalid yaml syntax
      }
    }

    // Final parse with complete content (no auto-close needed, content is complete)
    const finalResult = parse(accumulatedContent, options)
    yield {
      chunk: '',
      body: finalResult.body,
      data: finalResult.data,
      isComplete: true,
      excerpt: finalResult.excerpt,
      toc: finalResult.toc,
      content: accumulatedContent,
    }
  }
  else {
    // Web stream
    const webStream = stream as ReadableStream<Uint8Array>
    const reader = webStream.getReader()

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Final parse with complete content
          const finalResult = parse(accumulatedContent, options)
          yield {
            chunk: '',
            body: finalResult.body,
            data: finalResult.data,
            isComplete: true,
            excerpt: finalResult.excerpt,
            toc: finalResult.toc,
            content: accumulatedContent,
          }
          break
        }

        const chunkStr = new TextDecoder('utf-8').decode(value)
        accumulatedContent += chunkStr

        // Parse frontmatter if not already done
        if (!frontmatterParsed) {
          const { data } = parseFrontmatter(accumulatedContent)
          frontmatterData = data
          frontmatterParsed = true
        }

        // Auto-close unclosed syntax before parsing intermediate results
        const closedContent = autoCloseMarkdown(accumulatedContent)

        // Parse the auto-closed content
        const result = parse(closedContent, options)

        yield {
          chunk: chunkStr,
          body: result.body,
          data: frontmatterData,
          isComplete: false,
          excerpt: result.excerpt,
          content: accumulatedContent,
        }
      }
    }
    finally {
      reader.releaseLock()
    }
  }
}

/**
 * Alias for parseStream() - kept for backward compatibility
 * @internal
 */
export const parseStreamWithMarkdownIt = parseStream

/**
 * Alias for parseStreamIncremental() - kept for backward compatibility
 * @internal
 */
export const parseStreamIncrementalWithMarkdownIt = parseStreamIncremental
