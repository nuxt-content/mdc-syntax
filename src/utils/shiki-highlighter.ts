import type { Highlighter, BundledLanguage, BundledTheme } from 'shiki'
import { createHighlighter } from 'shiki'
import type { MinimarkNode, MinimarkTree } from 'minimark'

export interface ShikiOptions {
  /**
   * Theme to use for syntax highlighting
   * @default 'github-dark'
   */
  theme?: BundledTheme | string

  /**
   * Languages to preload. If not specified, languages will be loaded on demand.
   * @default undefined (load on demand)
   */
  languages?: BundledLanguage[]

  /**
   * Additional themes to preload
   * @default []
   */
  themes?: (BundledTheme | string)[]
}

let highlighter: Highlighter | null = null
let highlighterPromise: Promise<Highlighter> | null = null
let loadedThemes: Set<string> = new Set()

/**
 * Get or create the Shiki highlighter instance
 * Uses a singleton pattern to avoid creating multiple highlighters
 */
export async function getHighlighter(options: ShikiOptions = {}): Promise<Highlighter> {
  const { theme = 'github-dark', themes = [], languages } = options
  const allThemes = [theme, ...themes].filter(Boolean) as (BundledTheme | string)[]

  // If highlighter exists, load any new themes that aren't loaded yet
  if (highlighter) {
    const themesToLoad = allThemes.filter(t => !loadedThemes.has(t))
    if (themesToLoad.length > 0) {
      await Promise.all(themesToLoad.map(async (t) => {
        try {
          await highlighter!.loadTheme(t as BundledTheme)
          loadedThemes.add(t)
        }
        catch (error) {
          console.warn(`Failed to load theme ${t}:`, error)
        }
      }))
    }
    return highlighter
  }

  if (highlighterPromise) {
    return highlighterPromise
  }

  highlighterPromise = createHighlighter({
    themes: allThemes,
    langs: languages || [],
  })

  highlighter = await highlighterPromise
  highlighterPromise = null

  // Track loaded themes
  allThemes.forEach(t => loadedThemes.add(t))

  return highlighter
}

/**
 * Convert color to inline style
 */
function colorToStyle(color: string | undefined): string | undefined {
  if (!color) return undefined
  return `color:${color}`
}

/**
 * Highlight code using Shiki with codeToTokens
 * Returns minimark nodes built from tokens
 */
export async function highlightCode(
  code: string,
  language: string,
  options: ShikiOptions = {},
): Promise<{ nodes: MinimarkNode[], language: string, bgColor?: string, fgColor?: string }> {
  try {
    const hl = await getHighlighter(options)
    const { theme = 'github-dark' } = options

    // Load the language if not already loaded
    const loadedLanguages = hl.getLoadedLanguages()
    if (!loadedLanguages.includes(language as BundledLanguage)) {
      try {
        await hl.loadLanguage(language as BundledLanguage)
      }
      catch {
        // Language not supported, return plain code
        return {
          nodes: [code],
          language,
        }
      }
    }

    // Use codeToTokens to get raw tokens
    const result = hl.codeToTokens(code, {
      lang: language,
      theme: theme as BundledTheme | string,
    })

    console.log(result.tokens)
    // Build minimark nodes from tokens (flatten all lines)
    const allTokens: MinimarkNode[] = []
    
    for (let i = 0; i < result.tokens.length; i++) {
      const lineTokens = result.tokens[i]

      const lineTokensNodes: MinimarkNode[] = []
      for (const token of lineTokens) {
        const style = colorToStyle(token.color)
        
        // Create a span with style for colored tokens
        // Note: we always wrap in spans if there's a style, even for whitespace
        // because the whitespace may be part of the styled token
        if (style) {
          lineTokensNodes.push(['span', { style }, token.content] as MinimarkNode)
        } else {
          // Plain text token (no style)
          lineTokensNodes.push(token.content)
        }
      }

      
      allTokens.push(['span', { class: 'line' }, ...lineTokensNodes])

      // Add newline between lines (except for last line)
      if (i < result.tokens.length - 1) {
        allTokens.push('\n')
      }

    }

    return { 
      nodes: allTokens, 
      language,
      bgColor: result.bg,
      fgColor: result.fg,
    }
  }
  catch (error) {
    // If highlighting fails, return the original code
    console.error('Shiki highlighting error:', error)
    return {
      nodes: [code],
      language,
    }
  }
}

/**
 * Apply syntax highlighting to all code blocks in a Minimark tree
 * Uses codeToTokens API
 */
export async function highlightCodeBlocks(
  tree: MinimarkTree,
  options: ShikiOptions = {},
): Promise<MinimarkTree> {
  const processNode = async (node: MinimarkNode): Promise<MinimarkNode> => {
    // Skip text nodes
    if (typeof node === 'string') {
      return node
    }

    // Check if this is a pre > code structure
    if (Array.isArray(node) && node[0] === 'pre') {
      const [tag, attrs, ...children] = node

      // Look for code element as child
      if (children.length > 0 && Array.isArray(children[0]) && children[0][0] === 'code') {
        const codeNode = children[0]
        const [, codeAttrs, content] = codeNode

        // Extract language from attributes
        const language = (attrs as any)?.language ||
                        ((codeAttrs as any)?.class as string)?.replace('language-', '') ||
                        'text'

        if (typeof content === 'string') {
          try {
            const { nodes, bgColor, fgColor } = await highlightCode(content, language, options)

            // Build pre attributes with Shiki styling
            const newPreAttrs: any = { 
              ...attrs,
              class: `shiki ${options.theme || 'github-dark'}`,
              tabindex: '0',
            }
            
            if (bgColor || fgColor) {
              const styles: string[] = []
              if (bgColor) styles.push(`background-color:${bgColor}`)
              if (fgColor) styles.push(`color:${fgColor}`)
              newPreAttrs.style = styles.join(';')
            }

            // Return the updated pre > code structure with token-based children
            return ['pre', newPreAttrs, ['code', codeAttrs || {}, ...nodes]] as MinimarkNode
          }
          catch (error) {
            console.error('Failed to highlight code block:', error)
            // Keep original node if highlighting fails
          }
        }
      }
    }

    // Recursively process children
    if (Array.isArray(node)) {
      const [tag, attrs, ...children] = node
      const processedChildren = await Promise.all(
        children.map(child => processNode(child)),
      )
      return [tag, attrs, ...processedChildren] as MinimarkNode
    }

    return node
  }

  const processedValue = await Promise.all(
    tree.value.map(node => processNode(node)),
  )

  return {
    ...tree,
    value: processedValue,
  }
}

/**
 * Reset the highlighter instance
 * Useful for testing or when you want to reconfigure
 */
export function resetHighlighter(): void {
  highlighter = null
  highlighterPromise = null
  loadedThemes.clear()
}
