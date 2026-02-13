import React, { useState, useMemo, useEffect } from 'react'
import { textContent } from 'minimark'

// Inject dark mode styles for Shiki (once)
const SHIKI_DARK_STYLE_ID = 'mdc-shiki-dark-styles'
function ensureShikiDarkStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(SHIKI_DARK_STYLE_ID)) return
  const style = document.createElement('style')
  style.id = SHIKI_DARK_STYLE_ID
  style.textContent = `
html.dark .shiki-container:not(.shiki-stream) span {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
`
  document.head.appendChild(style)
}

export interface ProsePreProps {
  __node?: any
  language?: string
  filename?: string
  containerClass?: string
  children?: React.ReactNode
}

export const ProsePre: React.FC<ProsePreProps> = ({
  __node,
  language: propLanguage,
  filename,
  containerClass = 'my-4',
  children,
}) => {
  const [copied, setCopied] = useState(false)

  // Inject dark mode styles once
  useEffect(() => {
    ensureShikiDarkStyles()
  }, [])

  // Extract code content and language from node
  const { codeContent, language } = useMemo(() => {
    if (!__node) {
      return { codeContent: '', language: propLanguage || '' }
    }

    const content = textContent(__node)
    const lang = propLanguage || __node[1]?.language || 'text'

    return { codeContent: content, language: lang }
  }, [__node, propLanguage])

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

  return (
    <div className={`relative ${containerClass} group rounded-lg`}>
      {/* Header with language label and copy button */}
      <div className="rounded-t-lg border border-b-0 border-neutral-300 dark:border-neutral-700 top-[-1.5rem] right-0 left-0 flex items-center justify-between px-4 py-2 z-10">
        {/* Language label */}
        <span className="font-mono text-sm font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800/80 px-2.5 py-1 rounded backdrop-blur-sm">
          {filename || language}
        </span>

        {/* Copy button */}
        <button
          type="button"
          className="ml-auto px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 bg-neutral-300/80 dark:bg-neutral-700/80 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Code content */}
      <pre className="shiki-container bg-neutral-100 dark:bg-neutral-800 rounded-b-lg p-4 border border-neutral-300 dark:border-neutral-700">
        {children}
      </pre>
    </div>
  )
}

export default ProsePre
