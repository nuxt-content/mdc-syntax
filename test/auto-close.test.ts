import { describe, expect, it } from 'vitest'
import { autoCloseMarkdown } from '../src/utils/auto-close'

describe('autoCloseMarkdown - Inline Syntax', () => {
  it('should auto-close unclosed bold syntax', () => {
    const input = '**bold text'
    const expected = '**bold text**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should auto-close unclosed italic syntax', () => {
    const input = '*italic text'
    const expected = '*italic text*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should auto-close unclosed inline code', () => {
    const input = '`code text'
    const expected = '`code text`'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should auto-close unclosed strikethrough', () => {
    const input = '~~strikethrough text'
    const expected = '~~strikethrough text~~'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not modify properly closed syntax', () => {
    const input = '**bold** and *italic* and `code`'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle multiple unclosed inline syntax', () => {
    const input = 'Some text with **bold'
    const expected = 'Some text with **bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not close syntax in the middle of content', () => {
    const input = 'First line **bold\nSecond line'
    // Should only close at the end of the content
    const result = autoCloseMarkdown(input)
    // The bold from first line won't be closed since it's not at the end
    expect(result).toBe(input)
  })

  it('should handle bold at the end of last line', () => {
    const input = 'First line\nSecond line **bold'
    const expected = 'First line\nSecond line **bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle bold at the end of last line', () => {
    const input = '**djddsds** *dsd'
    const expected = '**djddsds** *dsd*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle bold at the end of last line', () => {
    const input = '**djddsds** *dsd*'
    const expected = '**djddsds** *dsd*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('autoCloseMarkdown - MDC Components', () => {
  it('should auto-close unclosed simple component', () => {
    const input = '::component\ncontent'
    const expected = '::component\ncontent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should auto-close component with attributes', () => {
    const input = '::alert{type="info"}\nAlert content'
    const expected = '::alert{type="info"}\nAlert content\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not modify properly closed component', () => {
    const input = '::component\ncontent\n::'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle nested components', () => {
    const input = ':::parent\n::child\ncontent'
    const expected = ':::parent\n::child\ncontent\n::\n:::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle nested components with partial closing', () => {
    const input = ':::parent\n::child\ncontent\n::'
    const expected = ':::parent\n::child\ncontent\n::\n:::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle deeply nested components', () => {
    const input = '::::level4\n:::level3\n::level2\ncontent'
    const expected = '::::level4\n:::level3\n::level2\ncontent\n::\n:::\n::::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle component with proper nesting', () => {
    const input = ':::parent\n::child1\n::\n::child2\ncontent'
    const expected = ':::parent\n::child1\n::\n::child2\ncontent\n::\n:::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should preserve indentation when closing components', () => {
    const input = '  ::alert\n  content'
    const expected = '  ::alert\n  content\n  ::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should preserve tab indentation when closing components', () => {
    const input = '\t::alert\n\tcontent'
    const expected = '\t::alert\n\tcontent\n\t::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should preserve mixed indentation for nested components', () => {
    const input = '  :::parent\n    ::child\n    content'
    const expected = '  :::parent\n    ::child\n    content\n    ::\n  :::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle deeply indented components', () => {
    const input = '      ::deeply-indented\n      content here'
    const expected = '      ::deeply-indented\n      content here\n      ::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not add closing markers to empty content', () => {
    const input = ''
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle single colon (not a component)', () => {
    const input = ':not-a-component'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should ignore space', () => {
    const input = '* not an italic'
    const expected = '* not an italic'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('valid italic syntax', () => {
    const input = '*italic'
    const expected = '*italic*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle strong in italic', () => {
    const input = '***strong italic'
    const expected = '***strong italic***'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore trailing space in italic', () => {
    const input = '*italic '
    const expected = '*italic*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore trailing space in bold', () => {
    const input = '**bold '
    const expected = '**bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore trailing space in strikethrough', () => {
    const input = '~~strikethrough '
    const expected = '~~strikethrough~~'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore trailing space in code', () => {
    const input = '`code '
    const expected = '`code `'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('***italic and bold', () => {
    const input = '***italic and bold'
    const expected = '***italic and bold***'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('***italic and bold partial', () => {
    const input = '***italic and bold*'
    const expected = '***italic and bold***'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('***italic and bold partial 2', () => {
    const input = '***italic and bold**'
    const expected = '***italic and bold***'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('**bold partial', () => {
    const input = '**bold*'
    const expected = '**bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('autoCloseMarkdown - Combined Scenarios', () => {
  it('should auto-close both inline and component syntax', () => {
    const input = '::component\nThis is **bold text'
    const expected = '::component\nThis is **bold text**\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle real-world streaming scenario', () => {
    const input = '# Title\n\n::alert{type="info"}\nThis is **important'
    const expected = '# Title\n\n::alert{type="info"}\nThis is **important**\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle component with code block and unclosed inline', () => {
    const input = '::card\n```js\nconst x = 1\n```\nText with `code'
    const expected = '::card\n```js\nconst x = 1\n```\nText with `code`\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('edge Cases', () => {
  it('should handle empty string', () => {
    expect(autoCloseMarkdown('')).toBe('')
  })

  it('should handle whitespace-only string', () => {
    const input = '   \n  \n'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle content without markdown', () => {
    const input = 'Plain text content'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle component names with special characters', () => {
    const input = '::my-component\ncontent'
    const expected = '::my-component\ncontent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle component names with dots', () => {
    const input = '::ui.card\ncontent'
    const expected = '::ui.card\ncontent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle component names starting with $', () => {
    const input = '::$special\ncontent'
    const expected = '::$special\ncontent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not close inline syntax that appears closed in same line', () => {
    const input = 'This is **bold** text'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle multiple paragraphs with unclosed component', () => {
    const input = '::card\n\nParagraph 1\n\nParagraph 2'
    const expected = '::card\n\nParagraph 1\n\nParagraph 2\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  const cases = [

    {
      input: `::u-page-section`,
      expected: `::u-page-section\n::`,
    },
    {
      input: `::u-page-section
  :::u-page-feature`,
      expected: `::u-page-section
  :::u-page-feature
  :::
::`,
    },
  ]

  cases.forEach(({ input, expected }) => {
    it(`should handle ${input}`, () => {
      expect(autoCloseMarkdown(input)).toBe(expected)
    })
  })
})

describe('component Yaml props', () => {
  it('should handle component yaml props', () => {
    const input = '::alert\n---\ntype:'
    const expected = '::alert\n---\ntype:\n---\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle component yaml props', () => {
    const input = '::alert\n---\ntype: x\n-'
    const expected = '::alert\n---\ntype: x\n---\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle component yaml props', () => {
    const input = '::alert\n---\ntype: x\n--'
    const expected = '::alert\n---\ntype: x\n---\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle component yaml props', () => {
    const input = '::alert\n---\ntype: x\n---'
    const expected = '::alert\n---\ntype: x\n---\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle component yaml props with content', () => {
    const input = '::alert\n---\ntype:\ncontent'
    const expected = '::alert\n---\ntype:\ncontent\n---\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle component yaml props in nested component', () => {
    const input = `::u-page-section
#title
Everything you need for modern content parsing

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  to: /api/parse`
    const expected = `::u-page-section
#title
Everything you need for modern content parsing

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  to: /api/parse
  ---
  :::
::`
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('frontmatter', () => {
  it('should handle frontmatter', () => {
    const input = '---\ntitle: Test\n---'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle frontmatter partial', () => {
    const input = '---\ntitle: Test'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle frontmatter partial', () => {
    const input = '---\ntitle: Test\n-'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle frontmatter partial', () => {
    const input = '---\ntitle: Test\n--'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle frontmatter partial 2', () => {
    const input = '---\ntitle: '
    const expected = '---\ntitle: \n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should handle frontmatter partial 3', () => {
    const input = '---\ntitle: Test\n'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle frontmatter with content after', () => {
    const input = '---\ntitle: Test\n---\n\n# Hello'
    const expected = '---\ntitle: Test\n---\n\n# Hello'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle closed frontmatter with unclosed component', () => {
    const input = '---\ntitle: Test\n---\n\n::alert\nContent'
    const expected = '---\ntitle: Test\n---\n\n::alert\nContent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle closed frontmatter with unclosed inline', () => {
    const input = '---\ntitle: Test\n---\n\n**bold text'
    const expected = '---\ntitle: Test\n---\n\n**bold text**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should handle just opening ---', () => {
    const input = '---'
    const expected = '---\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not treat --- in middle of content as frontmatter', () => {
    const input = 'Some content\n---\nMore content'
    const expected = 'Some content\n---\nMore content'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})
