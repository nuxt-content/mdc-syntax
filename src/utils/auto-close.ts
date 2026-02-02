/**
 * Auto-closes unclosed markdown and MDC component syntax
 * Useful for streaming/incremental parsing where content may be partial
 */

/**
 * Linear-time auto-close implementation without regex
 * Processes markdown in O(n) time by scanning character-by-character
 *
 * @param markdown - The markdown content to auto-close
 * @returns The markdown with unclosed syntax closed
 */
export function autoCloseMarkdown(markdown: string): string {
  if (!markdown || markdown.trim() === '') {
    return markdown
  }

  // Step 0: Close unclosed front matter
  let result = closeFrontmatter(markdown)

  // Find the last line (where inline markers need closing)
  const lastLineStart = result.lastIndexOf('\n') + 1
  const lastLine = result.slice(lastLineStart)

  // Step 1: Close inline markers on last line
  const inlineResult = closeInlineMarkersLinear(lastLine)
  result = lastLineStart === 0
    ? inlineResult
    : result.slice(0, lastLineStart) + inlineResult

  // Step 2: Close MDC components if any
  if (result.includes('::')) {
    result = closeMDCComponentsLinear(result)
  }

  return result
}

/**
 * Closes unclosed front matter (YAML between --- delimiters)
 */
function closeFrontmatter(markdown: string): string {
  // Check if content starts with ---
  if (!markdown.startsWith('---')) {
    return markdown
  }

  // Find the first newline after opening ---
  const firstNewline = markdown.indexOf('\n')
  if (firstNewline === -1) {
    // Just "---" with no newline, add closing
    return markdown + '\n---'
  }

  // Look for closing --- on its own line
  const content = markdown.slice(firstNewline + 1)
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim()
    // Found closing delimiter
    if (trimmed === '---') {
      return markdown
    }
  }

  // Check if last line is a partial fence (- or --)
  const lastLine = lines[lines.length - 1]
  const lastLineTrimmed = lastLine.trim()

  if (lastLineTrimmed === '-' || lastLineTrimmed === '--') {
    // Complete the partial fence
    const needed = 3 - lastLineTrimmed.length
    return markdown + '-'.repeat(needed)
  }

  // No closing --- found, add it
  // Make sure there's a newline before the closing ---
  if (markdown.endsWith('\n')) {
    return markdown + '---'
  }
  return markdown + '\n---'
}

/**
 * Closes inline markers (*, **, ***, ~~, `, [, () on the last line
 * without using regex - pure character scanning in O(n) time
 */
function closeInlineMarkersLinear(line: string): string {
  const len = line.length
  if (len === 0) return line

  // Count markers by scanning
  let asteriskCount = 0
  let tildePairCount = 0 // Count ~~ pairs, not individual tildes
  let backtickCount = 0
  let bracketBalance = 0 // [ minus ]
  let parenBalance = 0 // ( minus ) after last ]
  let lastBracketPos = -1

  // Track trailing whitespace
  let contentEnd = len
  while (contentEnd > 0 && (line[contentEnd - 1] === ' ' || line[contentEnd - 1] === '\t')) {
    contentEnd--
  }
  const hasTrailingSpace = contentEnd < len

  // Track ** positions for O(n) complete pair detection (avoids O(n^3) nested loops)
  const doubleAsteriskPositions: number[] = []

  // Single-pass scan through the line - O(n)
  for (let i = 0; i < len; i++) {
    const ch = line[i]

    if (ch === '*') {
      asteriskCount++
      // Track ** positions (not part of ***)
      if (i + 1 < len && line[i + 1] === '*') {
        const isPartOfTriple = (i > 0 && line[i - 1] === '*') || (i + 2 < len && line[i + 2] === '*')
        if (!isPartOfTriple) {
          doubleAsteriskPositions.push(i)
        }
      }
    }
    else if (ch === '~' && i + 1 < len && line[i + 1] === '~') {
      // Count ~~ pairs (strikethrough uses pairs, not individual tildes)
      tildePairCount++
      i++ // Skip next tilde since we counted the pair
    }
    else if (ch === '`') {
      backtickCount++
    }
    else if (ch === '[') {
      bracketBalance++
      lastBracketPos = i
    }
    else if (ch === ']') {
      bracketBalance--
      lastBracketPos = i
    }
    else if (ch === '(') {
      if (lastBracketPos >= 0 && i > lastBracketPos) {
        parenBalance++
      }
    }
    else if (ch === ')') {
      if (lastBracketPos >= 0 && i > lastBracketPos) {
        parenBalance--
      }
    }
  }

  // Check for complete ** pairs in O(1) - pairs are matched left to right
  const hasCompleteBoldPair = doubleAsteriskPositions.length >= 2

  let closingSuffix = ''
  let shouldTrim = false

  // Check for unclosed markers in priority order

  // Check *** (bold+italic)
  // Only treat as *** if line actually starts with *** (not just has 3 asterisks total)
  if (asteriskCount >= 3 && line[0] === '*' && line[1] === '*' && line[2] === '*') {
    const remainder = asteriskCount % 6
    if (remainder === 3) {
      // Check if line starts with more than 3 asterisks (e.g., ****)
      if (!(line[3] === '*')) {
        // Check if marker at end with no content
        if (!(contentEnd >= 3 && line[contentEnd - 1] === '*' && line[contentEnd - 2] === '*'
          && line[contentEnd - 3] === '*' && (contentEnd === 3 || line[contentEnd - 4] === ' '))) {
          closingSuffix = '***'
        }
      }
    }
    else if (remainder > 3 && remainder < 6) {
      const needed = 6 - remainder
      closingSuffix = '*'.repeat(needed)
    }
  }

  // Check ** (bold) if not already closing
  if (!closingSuffix && asteriskCount >= 2) {
    const remainder = asteriskCount % 4
    if (remainder === 2) {
      // Only check for ** if there are actually ** markers in the line
      // This prevents "*italic*" (2 asterisks) from being treated as unclosed **
      if (doubleAsteriskPositions.length > 0) {
        // Check if line starts with more asterisks than ** (e.g., *** or more)
        // This prevents "***text***" or "***text** *more" from being seen as unclosed **
        const startsWithMoreAsterisks = line[0] === '*' && line[1] === '*' && line[2] === '*'

        if (!startsWithMoreAsterisks) {
          // Check if marker at end with no content
          const endsWithMarker = contentEnd >= 2 && line[contentEnd - 1] === '*' && line[contentEnd - 2] === '*'
          const markerAtEnd = endsWithMarker && (contentEnd === 2 || line[contentEnd - 3] === ' ')

          if (!markerAtEnd) {
            // Check if all asterisks are paired (bold + italic complete)
            // If we have complete ** pairs, check remaining asterisks for italic
            const boldAsterisksUsed = Math.floor(doubleAsteriskPositions.length / 2) * 4
            const remainingSingle = asteriskCount - boldAsterisksUsed
            const allPaired = hasCompleteBoldPair && remainingSingle % 2 === 0

            if (!allPaired) {
              // Check if line ends with word (not just a closing marker)
              const lastChar = line[contentEnd - 1]
              const endsWithWord = (lastChar >= 'a' && lastChar <= 'z')
                || (lastChar >= 'A' && lastChar <= 'Z')
                || (lastChar >= '0' && lastChar <= '9')

              if (!hasCompleteBoldPair || endsWithWord) {
                closingSuffix = '**'
                if (hasTrailingSpace && !endsWithMarker) {
                  shouldTrim = true
                }
              }
            }
          }
        }
      }
    }
    else if (remainder > 2 && remainder < 4) {
      const needed = 4 - remainder
      closingSuffix = '*'.repeat(needed)
    }
  }

  // Check * (italic) if not already closing
  if (!closingSuffix && asteriskCount % 2 === 1) {
    // Check if line starts with more asterisks (e.g., ** or ***)
    // But allow italic closing if bold pairs are complete
    const startsWithMoreAsterisks = line[0] === '*' && line[1] === '*'

    if (!startsWithMoreAsterisks || hasCompleteBoldPair) {
      // Check if * followed by space (invalid italic)
      let validItalic = false
      for (let i = 0; i < len; i++) {
        if (line[i] === '*') {
          const nextCh = i + 1 < len ? line[i + 1] : ''
          const prevCh = i > 0 ? line[i - 1] : ''
          // Valid if not followed by space, or if it's preceded by space (closing)
          if (nextCh !== ' ' || prevCh === ' ') {
            validItalic = true
            break
          }
        }
      }

      if (validItalic) {
        // Check marker at end with no content
        // Only skip if it's truly isolated (e.g., "input *")
        // Don't skip if there are complete pairs before it (e.g., "input **bold** *")
        const markerAtEnd = contentEnd >= 1 && line[contentEnd - 1] === '*'
          && (contentEnd === 1 || line[contentEnd - 2] === ' ')

        if (!markerAtEnd || asteriskCount > 1) {
          closingSuffix = '*'
          const endsWithMarker = line[contentEnd - 1] === '*'
          if (hasTrailingSpace && !endsWithMarker) {
            shouldTrim = true
          }
        }
      }
    }
  }

  // Check ~~ (strikethrough)
  if (!closingSuffix && tildePairCount % 2 === 1) {
    closingSuffix = '~~'
    if (hasTrailingSpace) shouldTrim = true
  }

  // Check ` (code)
  if (!closingSuffix && backtickCount % 2 === 1) {
    closingSuffix = '`'
  }

  // Check [ ] (brackets)
  if (!closingSuffix && bracketBalance > 0) {
    closingSuffix = ']'
  }

  // Check ( ) (parens)
  if (!closingSuffix && parenBalance > 0) {
    closingSuffix = ')'
  }

  // Apply closing
  if (shouldTrim && closingSuffix) {
    let trimmedLen = len
    while (trimmedLen > 0 && (line[trimmedLen - 1] === ' ' || line[trimmedLen - 1] === '\t')) {
      trimmedLen--
    }
    return line.slice(0, trimmedLen) + closingSuffix
  }

  return line + closingSuffix
}

/**
 * Closes unclosed MDC components by scanning all lines in O(n) time
 */
function closeMDCComponentsLinear(markdown: string): string {
  const lines: string[] = []
  let lineStart = 0

  // Split into lines manually
  for (let i = 0; i <= markdown.length; i++) {
    if (i === markdown.length || markdown[i] === '\n') {
      lines.push(markdown.slice(lineStart, i))
      lineStart = i + 1
    }
  }

  const lastLine = lines[lines.length - 1]
  let result = markdown

  // Check for unclosed braces in props
  if (lastLine) {
    let lastOpenBrace = -1
    for (let i = lastLine.length - 1; i >= 0; i--) {
      if (lastLine[i] === '}') break
      if (lastLine[i] === '{') {
        lastOpenBrace = i
        break
      }
    }

    if (lastOpenBrace >= 0) {
      const propsContent = lastLine.slice(lastOpenBrace + 1)
      let doubleQuotes = 0
      let singleQuotes = 0

      for (let i = 0; i < propsContent.length; i++) {
        if (propsContent[i] === '"') doubleQuotes++
        if (propsContent[i] === '\'') singleQuotes++
      }

      let closing = ''
      if (doubleQuotes % 2 === 1) closing += '"'
      if (singleQuotes % 2 === 1) closing += '\''
      closing += '}'

      result += closing
    }
  }

  // Track unclosed components with their indentation and YAML props state
  const componentStack: Array<{ depth: number, name: string, indent: string, hasYamlProps: boolean }> = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Extract leading indentation (spaces and tabs before content)
    let indentEnd = 0
    while (indentEnd < line.length && (line[indentEnd] === ' ' || line[indentEnd] === '\t')) {
      indentEnd++
    }
    const indent = line.slice(0, indentEnd)

    // Check for YAML props delimiter (---) inside a component
    if (trimmed === '---' && componentStack.length > 0) {
      const last = componentStack[componentStack.length - 1]
      // Toggle YAML props state
      last.hasYamlProps = !last.hasYamlProps
      continue
    }

    // Check for component opening/closing
    let i = 0
    if (trimmed[0] === ':') {
      // Count colons
      let colonCount = 0
      while (i < trimmed.length && trimmed[i] === ':') {
        colonCount++
        i++
      }

      if (colonCount >= 2) {
        // Check if it's a component name or just closing
        const ch = i < trimmed.length ? trimmed[i] : ''
        const isComponent = (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '$'

        if (isComponent) {
          // Extract component name
          let nameEnd = i
          while (nameEnd < trimmed.length) {
            const c = trimmed[nameEnd]
            if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')
              || (c >= '0' && c <= '9') || c === '$' || c === '.' || c === '-' || c === '_')) {
              break
            }
            nameEnd++
          }
          const name = trimmed.slice(i, nameEnd)
          componentStack.push({ depth: colonCount, name, indent, hasYamlProps: false })
        }
        else if (colonCount === trimmed.length) {
          // Pure closing marker
          if (componentStack.length > 0) {
            const last = componentStack[componentStack.length - 1]
            if (last.depth === colonCount) {
              componentStack.pop()
            }
          }
        }
      }
    }
  }

  // Check if last line is a partial fence (- or --) inside a component's YAML props
  const finalLine = lines[lines.length - 1]
  const finalLineTrimmed = finalLine ? finalLine.trim() : ''
  let partialFenceCompletion = ''

  if (componentStack.length > 0) {
    const lastComp = componentStack[componentStack.length - 1]
    if (lastComp.hasYamlProps && (finalLineTrimmed === '-' || finalLineTrimmed === '--')) {
      // Complete the partial fence
      const needed = 3 - finalLineTrimmed.length
      partialFenceCompletion = '-'.repeat(needed)
      // Mark YAML props as closed since we're completing the fence
      lastComp.hasYamlProps = false
    }
  }

  // Add closing markers with matching indentation
  const closers: string[] = []
  while (componentStack.length > 0) {
    const comp = componentStack.pop()!

    // If component has unclosed YAML props, close them first (with same indentation)
    if (comp.hasYamlProps) {
      closers.push(comp.indent + '---')
    }

    // Close the component
    let closer = comp.indent
    for (let i = 0; i < comp.depth; i++) {
      closer += ':'
    }
    closers.push(closer)
  }

  // Apply partial fence completion first, then closers
  if (partialFenceCompletion) {
    result += partialFenceCompletion
  }

  if (closers.length > 0) {
    result += '\n' + closers.join('\n')
  }

  return result
}
