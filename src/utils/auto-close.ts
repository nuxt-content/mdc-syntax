/**
 * Auto-closes unclosed markdown and MDC component syntax
 * Useful for streaming/incremental parsing where content may be partial
 */

/**
 * Detects and auto-closes unclosed markdown inline syntax and MDC components
 *
 * @param markdown - The markdown content (potentially partial)
 * @returns The markdown with auto-closed syntax
 *
 * @example
 * ```typescript
 * autoCloseMarkdown('**bold text') // Returns: '**bold text**'
 * autoCloseMarkdown('::component\ncontent') // Returns: '::component\ncontent\n::'
 * autoCloseMarkdown(':::parent\n::child') // Returns: ':::parent\n::child\n::\n:::'
 * ```
 */
export function autoCloseMarkdown(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return markdown
  }

  let result = markdown

  // Step 1: Auto-close inline markdown syntax
  result = autoCloseInlineSyntax(result)

  // Step 2: Auto-close MDC block components
  result = autoCloseMDCComponents(result)

  return result
}

/**
 * Auto-closes unclosed inline markdown syntax (bold, italic, code, strikethrough)
 * Only closes markers that appear to be incomplete at the end of content
 */
function autoCloseInlineSyntax(markdown: string): string {
  // Track what needs closing by scanning from the end
  // This prevents closing markers that are intentionally left open in the middle

  const lines = markdown.split('\n')
  const lastLine = lines[lines.length - 1]

  // Define markers in order (bold+italic, then bold, then italic to avoid conflicts)
  const markers = [
    { marker: '***', pattern: /\*\*\*(?:[^*]|\*(?!\*\*)|\*\*(?!\*))*$/ }, // bold+italic (strong emphasis)
    { marker: '**', pattern: /\*\*(?:[^*]|\*(?!\*))*$/ }, // bold - matches ** followed by content not ending with **
    { marker: '~~', pattern: /~~(?:[^~]|~(?!~))*$/ }, // strikethrough
    { marker: '`', pattern: /`[^`]*$/ }, // inline code
    { marker: '*', pattern: /\*(?!\s)[^*]*$/ }, // italic - must be after bold, not followed by space
  ]

  let closingSuffix = ''
  let trimTrailing = false

  // Check each marker
  for (const { marker, pattern } of markers) {
    if (pattern.test(lastLine)) {
      // Count occurrences in the last line
      const escapedMarker = escapeRegex(marker)
      const markerRegex = new RegExp(escapedMarker, 'g')
      const count = (lastLine.match(markerRegex) || []).length

      // If odd number of markers, we have an unclosed one
      if (count % 2 === 1) {
        // Check if content ends with whitespace before we close
        // But preserve whitespace for inline code (spaces are significant in code)
        if (marker !== '`' && /\s+$/.test(lastLine)) {
          trimTrailing = true
        }
        closingSuffix += marker
        break // Only close the first unclosed marker
      }
    }
  }

  // If we need to close and there's trailing whitespace, trim it first
  if (closingSuffix && trimTrailing) {
    return markdown.trimEnd() + closingSuffix
  }

  return markdown + closingSuffix
}

/**
 * Auto-closes unclosed MDC block components
 * Handles nested components by tracking the marker depth (::, :::, ::::, etc.)
 * Also closes incomplete props {...}
 */
function autoCloseMDCComponents(markdown: string): string {
  let result = markdown
  const lines = result.split('\n')

  // Check for incomplete props on the last line
  const lastLine = lines[lines.length - 1]
  if (lastLine) {
    // Check if there's an unclosed brace
    const openBraceMatch = lastLine.match(/\{[^}]*$/)
    if (openBraceMatch) {
      const propsContent = openBraceMatch[0].substring(1) // Remove the opening {

      // Check if there's an unclosed quote within the props
      const doubleQuotes = (propsContent.match(/"/g) || []).length
      const singleQuotes = (propsContent.match(/'/g) || []).length

      let closing = ''

      // Close unclosed quotes
      if (doubleQuotes % 2 === 1) {
        closing += '"'
      }
      if (singleQuotes % 2 === 1) {
        closing += '\''
      }

      // Always close the brace
      closing += '}'

      result += closing
      lines[lines.length - 1] = lastLine + closing
    }
  }

  // Stack to track unclosed components with their marker count
  const unclosedStack: Array<{ markerCount: number, name: string }> = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Match opening component: ::component, :::component, etc.
    const openMatch = trimmed.match(/^(:+)([a-z$][$\w.-]*)/i)
    if (openMatch) {
      const markerCount = openMatch[1].length
      const componentName = openMatch[2]

      // Check if this line is ONLY the closing marker
      const isClosing = trimmed === openMatch[1] && markerCount >= 2

      if (isClosing) {
        // This is a closing marker - pop from stack if it matches
        if (unclosedStack.length > 0) {
          const last = unclosedStack[unclosedStack.length - 1]
          if (last.markerCount === markerCount) {
            unclosedStack.pop()
          }
        }
      }
      else if (componentName && markerCount >= 2) {
        // This is an opening component
        unclosedStack.push({ markerCount, name: componentName })
      }
    }

    // Match closing marker: ::, :::, etc. (standalone)
    const closeMatch = trimmed.match(/^(:+)$/)
    if (closeMatch && closeMatch[1].length >= 2) {
      const markerCount = closeMatch[1].length

      // Pop matching component from stack
      if (unclosedStack.length > 0) {
        const last = unclosedStack[unclosedStack.length - 1]
        if (last.markerCount === markerCount) {
          unclosedStack.pop()
        }
      }
    }
  }

  // Add closing markers for any unclosed components (in reverse order)
  let closingSuffix = ''
  while (unclosedStack.length > 0) {
    const component = unclosedStack.pop()!
    const closer = ':'.repeat(component.markerCount)
    closingSuffix += `\n${closer}`
  }

  return result + closingSuffix
}

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Checks if markdown content has unclosed syntax without modifying it
 * Useful for validation or showing warnings
 *
 * @param markdown - The markdown content to check
 * @returns Object with information about unclosed syntax
 */
export function detectUnclosedSyntax(markdown: string): {
  hasUnclosed: boolean
  unclosedInline: string[]
  unclosedComponents: Array<{ markerCount: number, name: string }>
} {
  const original = markdown
  const closed = autoCloseMarkdown(markdown)

  const hasUnclosed = original !== closed
  const unclosedInline: string[] = []
  const unclosedComponents: Array<{ markerCount: number, name: string }> = []

  if (!hasUnclosed) {
    return { hasUnclosed: false, unclosedInline, unclosedComponents }
  }

  // Analyze what was closed
  const lines = markdown.split('\n')
  const lastLine = lines[lines.length - 1]

  // Check inline syntax
  if (/\*\*[^*\n]+$/.test(lastLine))
    unclosedInline.push('**bold**')
  if (/\*[^*\n]+$/.test(lastLine) && !unclosedInline.includes('**bold**'))
    unclosedInline.push('*italic*')
  if (/`[^`\n]+$/.test(lastLine))
    unclosedInline.push('`code`')
  if (/~~[^~\n]+$/.test(lastLine))
    unclosedInline.push('~~strikethrough~~')

  // Check components
  const unclosedStack: Array<{ markerCount: number, name: string }> = []
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    const openMatch = trimmed.match(/^(:+)([a-z$][$\w.-]*)/i)
    if (openMatch) {
      const markerCount = openMatch[1].length
      const componentName = openMatch[2]
      const isClosing = trimmed === openMatch[1] && markerCount >= 2

      if (!isClosing && componentName && markerCount >= 2) {
        unclosedStack.push({ markerCount, name: componentName })
      }
    }

    const closeMatch = trimmed.match(/^(:+)$/)
    if (closeMatch && closeMatch[1].length >= 2) {
      const markerCount = closeMatch[1].length
      if (unclosedStack.length > 0) {
        const last = unclosedStack[unclosedStack.length - 1]
        if (last.markerCount === markerCount) {
          unclosedStack.pop()
        }
      }
    }
  }

  return {
    hasUnclosed: true,
    unclosedInline,
    unclosedComponents: unclosedStack,
  }
}
