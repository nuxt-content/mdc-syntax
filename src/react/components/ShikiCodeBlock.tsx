import React, { useState, useEffect, useMemo } from 'react'
import { createHighlighter, type HighlighterCore } from 'shiki'
import { ShikiStreamRenderer } from 'shiki-stream/react'
import { CodeToTokenTransformStream } from 'shiki-stream'
import { textContent } from 'minimark'

// Singleton highlighter instance shared across all code blocks
let highlighterInstance: HighlighterCore | null = null
let highlighterPromise: Promise<HighlighterCore> | null = null

async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighterInstance) {
    return highlighterInstance
  }

  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: ['javascript', 'typescript', 'vue', 'html', 'css', 'json', 'markdown', 'bash', 'shell', 'text', 'tsx', 'jsx'],
    }).then((hl) => {
      highlighterInstance = hl
      return hl
    })
  }

  return highlighterPromise
}

export interface ShikiCodeBlockProps {
  __node?: any
  language?: string
  theme?: string
  containerClass?: string
  fallbackClass?: string
  fallbackWithHeaderClass?: string
  children?: React.ReactNode
}

export const ShikiCodeBlock: React.FC<ShikiCodeBlockProps> = ({
  __node,
  language: propLanguage,
  theme = 'github-dark',
  containerClass = 'my-4',
  fallbackClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 rounded-lg overflow-x-auto border border-neutral-300 dark:border-neutral-700',
  fallbackWithHeaderClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 pt-12 rounded-lg overflow-x-auto m-0 border border-neutral-300 dark:border-neutral-700',
  children,
}) => {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)
  const [stream, setStream] = useState<ReadableStream | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Extract code content and language from node
  const { codeContent, language } = useMemo(() => {
    if (!__node) {
      return { codeContent: '', language: '' }
    }

    const content = textContent(__node)
    const lang = propLanguage || __node[1]?.language || 'text'

    return { codeContent: content, language: lang }
  }, [__node, propLanguage])

  // Load highlighter on mount
  useEffect(() => {
    let isMounted = true

    getHighlighter()
      .then((hl) => {
        if (isMounted) {
          setHighlighter(hl)
          setIsLoading(false)
        }
      })
      .catch((error) => {
        console.error('Failed to create highlighter:', error)
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Create stream when code or language changes
  useEffect(() => {
    if (!highlighter || !codeContent || !language) {
      setStream(null)
      return
    }

    try {
      // Create a text stream that emits the raw code
      const textStream = new ReadableStream({
        start(controller) {
          // Enqueue the entire code content at once
          controller.enqueue(codeContent)
          controller.close()
        },
      })

      // Pipe through CodeToTokenTransformStream to convert text to tokens
      const tokenStream = textStream.pipeThrough(
        new CodeToTokenTransformStream({
          highlighter,
          lang: language || 'text',
          theme: theme || 'github-dark',
          allowRecalls: true,
        }),
      )

      setStream(tokenStream)
    }
    catch (error) {
      console.error('Failed to create code stream:', error)
      setStream(null)
    }
  }, [highlighter, codeContent, language, theme])

  // Copy to clipboard functionality
  const copyCode = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeContent)
        setCopied(true)
        setTimeout(() => {
          setCopied(false)
        }, 2000)
      }
    }
    catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  // Fallback for nodes without proper structure
  if (!__node) {
    return (
      <pre className={fallbackClass}>
        {children}
      </pre>
    )
  }

  return (
    <div className={`relative ${containerClass} group`}>
      {/* Header with language label and copy button */}
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between px-4 py-2 z-10">
        {/* Language label */}
        {language
          ? (
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800/80 px-2.5 py-1 rounded backdrop-blur-sm">
                {language}
              </span>
            )
          : (
              <span className="flex-1" />
            )}

        {/* Copy button */}
        <button
          type="button"
          className="ml-auto px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 bg-neutral-300/80 dark:bg-neutral-700/80 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={copyCode}
        >
          {copied
            ? (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </span>
              )
            : (
                <span className="flex items-center gap-1.5">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy
                </span>
              )}
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg p-4 border border-neutral-300 dark:border-neutral-700">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-4 bg-neutral-300 dark:bg-neutral-700 rounded mb-2 ${i === 3 ? 'w-3/5 mb-0' : ''} animate-pulse`}
            />
          ))}
        </div>
      )}

      {/* Shiki stream renderer */}
      {!isLoading && stream && (
        <div
          className="shiki-container"
          style={{
            '--shiki-margin': '0',
            '--shiki-padding': '1rem',
            '--shiki-padding-top': '3rem',
            '--shiki-border-radius': '0.5rem',
            '--shiki-border': '1px solid rgb(55, 65, 81)',
          } as React.CSSProperties}
        >
          <ShikiStreamRenderer stream={stream} />
        </div>
      )}

      {/* Fallback with header padding */}
      {!isLoading && !stream && (
        <pre className={fallbackWithHeaderClass}>
          <code className="font-mono text-sm leading-relaxed block whitespace-pre">
            {codeContent}
          </code>
        </pre>
      )}
    </div>
  )
}

export default ShikiCodeBlock
