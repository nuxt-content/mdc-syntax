import { useState, useRef } from 'react'
import { MDC } from 'mdc-syntax/react'

// Custom Alert component for MDC
interface AlertProps {
  type?: 'info' | 'warning' | 'error' | 'success'
  children?: React.ReactNode
}

const CustomAlert: React.FC<AlertProps> = ({ type = 'info', children }) => {
  const typeStyles = {
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-100',
    error: 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-900 dark:text-red-100',
    success: 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-900 dark:text-green-100',
  }

  return (
    <div className={`border-l-4 p-4 my-4 rounded-r ${typeStyles[type]}`}>
      {children}
    </div>
  )
}

// Custom Heading component
const CustomHeading: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ children, ...props }) => (
  <h1 className="text-purple-500 border-b-2 border-purple-500 pb-2" {...props}>
    ✨
    {' '}
    {children}
  </h1>
)

// Streaming Preview Component
interface StreamingPreviewProps {
  markdown: string
  chunkSize?: number
  delayMs?: number
  components?: Record<string, React.ComponentType<any>>
}

const StreamingPreview: React.FC<StreamingPreviewProps> = ({
  markdown,
  chunkSize = 10,
  delayMs = 30,
  components = {},
}) => {
  const [accumulated, setAccumulated] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const startStream = async () => {
    if (isStreaming) return

    setAccumulated('')
    setProgress(0)
    setIsStreaming(true)
    abortControllerRef.current = new AbortController()

    for (let i = 0; i < markdown.length; i += chunkSize) {
      if (abortControllerRef.current.signal.aborted) break

      const newAccumulated = markdown.slice(0, i + chunkSize)
      setAccumulated(newAccumulated)
      setProgress(Math.min(100, ((i + chunkSize) / markdown.length) * 100))

      if (i + chunkSize < markdown.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    setIsStreaming(false)
    setProgress(100)
  }

  const reset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsStreaming(false)
    setAccumulated('')
    setProgress(0)
    abortControllerRef.current = null
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex-shrink-0 flex items-center gap-4">
        <button
          onClick={startStream}
          disabled={isStreaming}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isStreaming ? 'Streaming...' : 'Start Stream'}
        </button>
        <button
          onClick={reset}
          disabled={!isStreaming && progress === 0}
          className="px-4 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>
        {progress > 0 && (
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {progress.toFixed(0)}
            %
          </span>
        )}
      </div>

      {progress > 0 && (
        <div className="flex-shrink-0 w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex-1 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800 overflow-y-auto min-h-0">
        {accumulated
          ? (
              <div className="leading-relaxed">
                <MDC markdown={accumulated} components={components} stream={true} />
              </div>
            )
          : (
              <div className="text-neutral-400 dark:text-neutral-500 italic">
                Click "Start Stream" to see streaming in action...
              </div>
            )}
      </div>
    </div>
  )
}

const sampleMarkdown = `# MDC Syntax for React

Welcome to **MDC Syntax** - a powerful markdown parser built for the *AI era*.

## Features

- 🚀 **5.5x faster** than regex-based parsers
- ⚡ O(n) linear-time algorithm
- 🔄 Streaming support for real-time rendering
- 🎨 Custom component support
- 📦 Zero dependencies

## Code Example

Here's a simple TypeScript example:

\`\`\`typescript
import { MDC } from 'mdc-syntax/react'

export default function App() {
  const markdown = \`# Hello **World**\`
  return <MDC value={markdown} />
}
\`\`\`

## Custom Components

MDC supports custom Vue-like components:

::alert{type="success"}
This is a **success** alert with custom styling!
::

::alert{type="warning"}
⚠️ This parser handles streaming markdown correctly, even with incomplete syntax.
::

## Lists

### Ordered List
1. First item
2. Second item
3. Third item

### Unordered List
- React support
- Vue support
- TypeScript support
- Zero dependencies

## Links & Formatting

Visit [MDC Syntax on GitHub](https://github.com/nuxt-content/mdc-syntax) for more information.

You can use *italic*, **bold**, and even ~~strikethrough~~ text.

## Blockquotes

> "The development of full artificial intelligence could spell the end of the human race."
> — Stephen Hawking

## Tables

| Feature | MDC Syntax | Traditional Parsers |
|---------|-----------|---------------------|
| Speed | 5.5x faster | Baseline |
| Streaming | ✅ Auto-close | ❌ Broken |
| Algorithm | O(n) | O(n²) or worse |

---

## Try It Yourself

Edit the markdown below to see it update in real-time!
`

function App() {
  const [markdown, setMarkdown] = useState(sampleMarkdown)
  const [useCustom, setUseCustom] = useState(true)
  const [mode, setMode] = useState<'editor' | 'streaming'>('editor')

  const customComponents: Record<string, React.ComponentType<any>> = useCustom
    ? {
        alert: CustomAlert,
        h1: CustomHeading,
      }
    : {}

  return (
    <div className="h-screen flex flex-col overflow-hidden max-w-[1400px] mx-auto">
      <header className="flex-shrink-0 text-center py-6 px-8 border-b-2 border-neutral-200 dark:border-neutral-700">
        <h1 className="text-4xl bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
          MDC Syntax - React Example
        </h1>
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
          Interactive markdown editor with live preview & streaming support
        </p>
      </header>

      <div className="flex-shrink-0 px-8 py-4 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => setMode('editor')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'editor'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
            }`}
          >
            Editor Mode
          </button>
          <button
            onClick={() => setMode('streaming')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              mode === 'streaming'
                ? 'bg-blue-500 text-white'
                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 dark:hover:bg-neutral-600'
            }`}
          >
            Streaming Demo
          </button>
          <label className="flex items-center gap-2 cursor-pointer text-[0.95rem]">
            <input
              type="checkbox"
              checked={useCustom}
              onChange={e => setUseCustom(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            Use custom components
          </label>
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-8 py-6">
        {mode === 'editor'
          ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                <div className="flex flex-col min-h-0">
                  <h2 className="mb-3 text-xl text-neutral-800 dark:text-neutral-100">Markdown Input</h2>
                  <textarea
                    value={markdown}
                    onChange={e => setMarkdown(e.target.value)}
                    placeholder="Enter markdown here..."
                    className="flex-1 w-full p-4 font-mono text-sm leading-relaxed border-2 border-neutral-200 dark:border-neutral-700 rounded-lg resize-none bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 overflow-y-auto"
                  />
                </div>

                <div className="flex flex-col min-h-0">
                  <h2 className="mb-3 text-xl text-neutral-800 dark:text-neutral-100">Live Preview</h2>
                  <div className="flex-1 border-2 border-neutral-200 dark:border-neutral-700 rounded-lg p-6 bg-white dark:bg-neutral-800 overflow-y-auto">
                    <div className="leading-relaxed">
                      <MDC markdown={markdown} components={customComponents} options={{ highlight: true }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          : (
              <div className="h-full flex flex-col space-y-4 overflow-y-auto">
                <div className="flex-shrink-0 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r">
                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    🔄 Streaming Demo
                  </h3>
                  <p className="text-blue-800 dark:text-blue-200 text-sm">
                    Watch as markdown content streams in character-by-character, with automatic handling of incomplete syntax.
                    This demonstrates MDC Syntax's unique ability to render partial markdown correctly.
                  </p>
                </div>

                <div className="flex-1 min-h-0">
                  <StreamingPreview
                    markdown={markdown}
                    chunkSize={10}
                    delayMs={30}
                    components={customComponents}
                  />
                </div>
              </div>
            )}
      </div>
    </div>
  )
}

export default App
