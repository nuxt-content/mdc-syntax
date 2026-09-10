'use client'

import { use, useDeferredValue, useMemo, Suspense } from 'react'
import { parseMarkdown } from 'comark'
import type { MarkdownDocument as MarkdownDocumentType } from 'comark'
import { isMarkdownDocument } from 'comark/utils'
import { MarkdownLive } from './MarkdownLive.tsx'
import type { MarkdownProps } from './Markdown'

interface MarkdownContentProps extends Omit<MarkdownProps, 'value' | 'children' | 'options' | 'plugins'> {
  parsePromise: Promise<MarkdownDocumentType>
}

function MarkdownContent({
  parsePromise,
  components: customComponents = {},
  componentsManifest,
  streaming = false,
  caret = false,
  data,
  className,
}: MarkdownContentProps) {
  const parsed = use(parsePromise)

  return (
    <MarkdownLive
      value={parsed}
      components={customComponents}
      componentsManifest={componentsManifest}
      streaming={streaming}
      className={className}
      caret={caret}
      data={data}
    />
  )
}

export function MarkdownClient({
  children,
  value,
  options = {},
  plugins = [],
  streaming = false,
  ...rest
}: MarkdownProps) {
  const content = isMarkdownDocument(value)
    ? value
    : children
      ? String(children)
      : ((value as string | undefined) ?? '')

  // Re-creates the promise only when content changes.
  // Note: options/plugins should be stable references (defined outside render or memoized).
  // Pre-parsed documents resolve immediately without calling parseMarkdown().
  const parsePromise = useMemo(
    () =>
      isMarkdownDocument(content)
        ? Promise.resolve(content)
        : // `streaming` must reach the parser, not just the renderer: it drives
          // auto-close healing and incremental node reuse.
          parseMarkdown(content, { ...options, plugins }, { streaming }),
    [content, streaming]
  )

  // Keep showing the previous parsed result while a new parse is pending —
  // prevents blank flashes during rapid streaming updates.
  const deferredPromise = useDeferredValue(parsePromise)

  return (
    <Suspense fallback={null}>
      <MarkdownContent
        parsePromise={deferredPromise}
        streaming={streaming}
        {...rest}
      />
    </Suspense>
  )
}
