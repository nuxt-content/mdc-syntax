import { describe, expect, it } from 'vitest'
import { autoCloseMarkdown } from '../src/internal/parse/auto-close'

const inlines = `
_test → _test_
__text → __text__
__text_ → __text__
*text → *text*
*italic text → *italic text*
**text → **text**
**text* → **text**
***text → ***text***
**bold text → **bold text**
**djddsds** *dsd → **djddsds** *dsd*
**djddsds** *dsd* → **djddsds** *dsd*
Some text with **bold → Some text with **bold**
~~text → ~~text~~
~~text~ → ~~text~~
\`code → \`code\`
\`code text → \`code text\`
~~strikethrough text → ~~strikethrough text~~
**bold** and *italic* and \`code\` → **bold** and *italic* and \`code\`
[text](url → [text](comark:incomplete-link)
$$formula → $$formula
~Hello → ~Hello
~~Hello → ~~Hello~~
~Hello~ → ~Hello~
~~Hello~~ → ~~Hello~~
* not valid → * not valid
** not valid → ** not valid
*** not valid → *** not valid
_ not valid → _ not valid
__ not valid → __ not valid
~ not valid → ~ not valid
~~ not valid → ~~ not valid
The cost is $ → The cost is $
~Hello → ~Hello
~~Hello~~ → ~~Hello~~
~~ Hello → ~~ Hello`

const multilines = `
| Month    | Savings
→
| Month    | Savings |
| --- | --- |
###
| Month    | Savings |
| :
→
| Month    | Savings |
| :- | --- |
###
| Month    | Savings |
| -: |
→
| Month    | Savings |
| -: | --- |
###
| Month    | Savings |
| :-
→
| Month    | Savings |
| :- | --- |
###
| Month    | Savings |
| :-:
→
| Month    | Savings |
| :-: | --- |
###
| Month    | Savings |
| --- | --- |
→
| Month    | Savings |
| --- | --- |
###
| Month    | Savings \\| Money
→
| Month    | Savings \\| Money |
| --- | --- |
###
| Month    | Savings |
| ------
→
| Month    | Savings |
| ------ | --- |
###
| Month    | Savings |
| --- | ----- |
| January  | 250    |
| February | 80
→
| Month    | Savings |
| --- | ----- |
| January  | 250    |
| February | 80     |
###
| Prop       | Default       |
| -: | --- |
| Table's | are most important |
→
| Prop       | Default       |
| -: | --- |
| Table's | are most important |
`

describe('auto close inlines', () => {
  inlines
    .trim()
    .split('\n')
    .forEach((inline) => {
      it(`should auto-close ${inline}`, () => {
        const [input, expected] = inline.split(' → ')
        expect(autoCloseMarkdown(input)).toBe(expected)
      })
    })
})

describe('auto close multilines', () => {
  multilines
    .trim()
    .split('###')
    .forEach((multiline) => {
      it(`should auto-close ${multiline}`, () => {
        const [input, expected] = multiline.trim().split('\n→\n')
        expect(autoCloseMarkdown(input)).toBe(expected)
      })
    })
})

describe('autoCloseMarkdown - Inline Syntax', () => {
  it('does not close incomplete emphasis on earlier lines (inline heal is last-line only)', () => {
    const input = 'First line **bold\nSecond line'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should handle bold at the end of last line', () => {
    const input = 'First line\nSecond line **bold'
    const expected = 'First line\nSecond line **bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('autoCloseMarkdown - Comark Components', () => {
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

  it('should not close a bullet-list asterisk with nested bold', () => {
    const input = '*   **Preheat:** Set  '
    expect(autoCloseMarkdown(input)).toBe(input)
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
    // single trailing space is dropped before closing
    const input = '`code '
    const expected = '`code`'
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

describe('math syntax', () => {
  const withMath = { math: true as const }

  it('should leave unclosed inline math alone by default', () => {
    const input = 'The formula is $x = 5'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should auto-close unclosed inline math with math: true', () => {
    const input = 'The formula is $x = 5'
    const expected = 'The formula is $x = 5$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should not modify properly closed inline math', () => {
    const input = 'The formula is $x = 5$ and done'
    expect(autoCloseMarkdown(input, withMath)).toBe(input)
  })

  it('should leave unclosed block math alone by default', () => {
    const input = '$$\nx = 5'
    expect(autoCloseMarkdown(input)).toBe(input)
  })

  it('should auto-close block math with math: true', () => {
    const input = '$$\nx = 5'
    const expected = '$$\nx = 5\n$$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should not modify properly closed block math', () => {
    const input = '$$\nx = 5\n$$'
    expect(autoCloseMarkdown(input, withMath)).toBe(input)
  })

  it('should handle multiple inline math expressions with math: true', () => {
    const input = 'First $a = 1$ and second $b = 2'
    const expected = 'First $a = 1$ and second $b = 2$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle inline math at start of line with math: true', () => {
    const input = '$E = mc^2'
    const expected = '$E = mc^2$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle block math with multiple lines with math: true', () => {
    const input = '$$\nf(x) = x^2\n+ 2x + 1'
    const expected = '$$\nf(x) = x^2\n+ 2x + 1\n$$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle block math in middle of content', () => {
    const input = 'Some text\n$$\nx = 5\n$$\nMore text'
    expect(autoCloseMarkdown(input, withMath)).toBe(input)
  })

  it('should handle unclosed block math with text before with math: true', () => {
    const input = 'Introduction\n$$\nx = 5'
    const expected = 'Introduction\n$$\nx = 5\n$$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle inline math with complex expressions with math: true', () => {
    const input = 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'
    const expected = 'The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle block math with LaTeX with math: true', () => {
    const input = '$$\n\\int_{0}^{\\infty} e^{-x} dx'
    const expected = '$$\n\\int_{0}^{\\infty} e^{-x} dx\n$$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle inline math with Comark components with math: true', () => {
    const input = '::alert\nThe formula is $x = 5'
    const expected = '::alert\nThe formula is $x = 5$\n::'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should handle block math with Comark components with math: true', () => {
    const input = '::card\n$$\nx = 5'
    const expected = '::card\n$$\nx = 5\n$$\n::'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })
})

describe('frontmatter', () => {
  it('should handle frontmatter', () => {
    const input = '---\ntitle: Test\n---'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  // Partial frontmatter is only completed when `frontmatter: true` — for a
  // complete document a leading `---` with no closing delimiter is a thematic
  // break, so completing it would swallow the body (see the default cases below).
  it('should complete partial frontmatter when frontmatter option is enabled', () => {
    const input = '---\ntitle: Test'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input, { frontmatter: true })).toBe(expected)
  })
  it('should complete a partial closing delimiter (-) when frontmatter option is enabled', () => {
    const input = '---\ntitle: Test\n-'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input, { frontmatter: true })).toBe(expected)
  })
  it('should complete a partial closing delimiter (--) when frontmatter option is enabled', () => {
    const input = '---\ntitle: Test\n--'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input, { frontmatter: true })).toBe(expected)
  })
  it('should complete partial frontmatter with an empty value when frontmatter option is enabled', () => {
    const input = '---\ntitle: '
    const expected = '---\ntitle: \n---'
    expect(autoCloseMarkdown(input, { frontmatter: true })).toBe(expected)
  })
  it('should complete partial frontmatter with a trailing newline when frontmatter option is enabled', () => {
    const input = '---\ntitle: Test\n'
    const expected = '---\ntitle: Test\n---'
    expect(autoCloseMarkdown(input, { frontmatter: true })).toBe(expected)
  })

  it('should not complete unclosed frontmatter by default', () => {
    // Default (`frontmatter: false`): a leading `---` with content but no close
    // is a thematic break followed by body — completing it would swallow the body.
    const input = '---\ntitle: Test'
    expect(autoCloseMarkdown(input)).toBe(input)
    expect(autoCloseMarkdown('---\n# Heading')).toBe('---\n# Heading')
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

  it('should not complete a lone --- (thematic break, not frontmatter)', () => {
    // A lone `---` has no frontmatter content; completing it to `---\n---`
    // would parse as two thematic breaks (#268).
    const input = '---'
    const expected = '---'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not complete an empty --- opener', () => {
    const input = '---\n'
    const expected = '---\n'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not treat --- in middle of content as frontmatter', () => {
    const input = 'Some content\n---\nMore content'
    const expected = 'Some content\n---\nMore content'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('link', () => {
  it('should not add underscore when doc ends with link', () => {
    const input = 'https://errors.pydantic.dev/2.13/v/value_error'
    const expected = 'https://errors.pydantic.dev/2.13/v/value_error'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should heal incomplete links with a placeholder URL', () => {
    const input = '[`foo'
    const expected = '[`foo](comark:incomplete-link)'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})
describe('attributes scope', () => {
  it('should ignore $ in inline attributes', () => {
    const input = ':component[content]{$client}'
    const expected = ':component[content]{$client}'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore $ in block component attributes', () => {
    const input = '::component{$client}\nContent\n::'
    const expected = '::component{$client}\nContent\n::'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore * in attributes', () => {
    const input = ':component{*bold}'
    const expected = ':component{*bold}'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore _ in attributes', () => {
    const input = ':component{_italic}'
    const expected = ':component{_italic}'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should ignore backtick in attributes', () => {
    const input = ':component{`code}'
    const expected = ':component{`code}'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not treat multi-line braces as attributes', () => {
    const input = '{\n$client'
    // bare autoClose leaves `$` alone (math default false)
    expect(autoCloseMarkdown(input)).toBe(input)
    expect(autoCloseMarkdown(input, { math: true })).toBe('{\n$client$')
  })
  it('should work fine in link', () => {
    const input = '[$link](https://example.com)'
    const expected = '[$link](https://example.com)'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
  it('should work fine in image', () => {
    const input = '![$link](https://example.com/icons.png)'
    const expected = '![$link](https://example.com/icons.png)'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('inline code spans as literal regions', () => {
  it('should not count asterisks inside a closed code span', () => {
    const input = 'text `a*b` and **bold'
    const expected = 'text `a*b` and **bold**'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not count underscores inside a closed code span', () => {
    const input = 'see `a_b_c` then __bold'
    const expected = 'see `a_b_c` then __bold__'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should close an open code span without leaking an asterisk', () => {
    const input = '`x * y'
    const expected = '`x * y`'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should nest closers when bold wraps an open code span', () => {
    const input = '**bold `code'
    const expected = '**bold `code**`'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should treat an underscore inside an open code span as literal', () => {
    const input = '`snake_case'
    const expected = '`snake_case`'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })
})

describe('inline math as literal regions', () => {
  const withMath = { math: true as const }

  it('should not count asterisks inside closed inline math', () => {
    const input = '$a * b$ and *italic'
    const expected = '$a * b$ and *italic*'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should not count an underscore inside an open math region', () => {
    const input = 'value $x_0'
    const expected = 'value $x_0$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })

  it('should close inline math without leaking an asterisk', () => {
    const input = '$a * b'
    const expected = '$a * b$'
    expect(autoCloseMarkdown(input, withMath)).toBe(expected)
  })
})

describe('escaped markers', () => {
  it('should not count an escaped asterisk as a delimiter', () => {
    const input = 'a \\* b *it'
    const expected = 'a \\* b *it*'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not count an escaped underscore as a delimiter', () => {
    const input = 'a \\_ b _it'
    const expected = 'a \\_ b _it_'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should not count an escaped backtick as a code span', () => {
    const input = 'literal \\` then `code'
    const expected = 'literal \\` then `code`'
    expect(autoCloseMarkdown(input)).toBe(expected)
  })

  it('should leave a fully escaped marker untouched', () => {
    const input = 'just a \\* star'
    expect(autoCloseMarkdown(input)).toBe(input)
  })
})

describe('nested emphasis', () => {
  it('should close nested bold + underscore-italic', () => {
    expect(autoCloseMarkdown('**_text')).toBe('**_text_**')
  })

  it('should close nested italic + bold', () => {
    expect(autoCloseMarkdown('*a **b')).toBe('*a **b***')
  })
})

describe('autoCloseMarkdown - syntax option', () => {
  it('appends component closers by default', () => {
    expect(autoCloseMarkdown('::alert\nContent')).toBe('::alert\nContent\n::')
  })

  it('does not append component closers with syntax: false', () => {
    expect(autoCloseMarkdown('::alert\nContent', { syntax: false })).toBe('::alert\nContent')
  })

  it('clears a trailing bare fence line by default', () => {
    expect(autoCloseMarkdown('para\n\n::')).toBe('para\n\n')
  })

  it('keeps a trailing bare fence line with syntax: false', () => {
    expect(autoCloseMarkdown('para\n\n::', { syntax: false })).toBe('para\n\n::')
  })

  it('closes an open props brace by default', () => {
    expect(autoCloseMarkdown('::alert{type="info')).toBe('::alert{type="info"}\n::')
  })

  it('does not close an open props brace with syntax: false', () => {
    expect(autoCloseMarkdown('::alert{type="info', { syntax: false })).toBe('::alert{type="info')
  })

  it('still closes inline markers with syntax: false', () => {
    expect(autoCloseMarkdown('**bold', { syntax: false })).toBe('**bold**')
  })

  it('skips markers inside an attached attribute brace by default', () => {
    expect(autoCloseMarkdown('text{.cls **bold')).toBe('text{.cls **bold')
  })

  it('treats an attached brace as literal text with syntax: false', () => {
    expect(autoCloseMarkdown('text{.cls **bold', { syntax: false })).toBe('text{.cls **bold**')
  })

  it('skips _ inside attribute values when attributes are enabled without component syntax', () => {
    expect(
      autoCloseMarkdown('this is a [link with an attribute](https://example.com){target="_blank"}', {
        syntax: false,
        attributes: true,
      })
    ).toBe('this is a [link with an attribute](https://example.com){target="_blank"}')
  })

  it('does not treat unclosed :: as a component when only attributes are enabled', () => {
    expect(autoCloseMarkdown('::alert\nContent', { syntax: false, attributes: true })).toBe('::alert\nContent')
  })

  it('still completes frontmatter with syntax: false', () => {
    expect(autoCloseMarkdown('---\ntitle: Hello', { frontmatter: true, syntax: false })).toBe('---\ntitle: Hello\n---')
  })
})

describe('autoCloseMarkdown - dropTrailingOpeners', () => {
  it('drops a trailing space-flanked opener', () => {
    expect(autoCloseMarkdown('hello *', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello **', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello _', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello __', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello $', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello $$', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello :', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello [', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello [[', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello {', { dropTrailingOpeners: true })).toBe('hello')
    expect(autoCloseMarkdown('hello !', { dropTrailingOpeners: true })).toBe('hello')
  })

  it('drops only the last space-flanked opener (earlier * is already followed by space)', () => {
    expect(autoCloseMarkdown('hello * *', { dropTrailingOpeners: true })).toBe('hello *')
  })

  it('still auto-closes attached incomplete markers', () => {
    expect(autoCloseMarkdown('hello **bold', { dropTrailingOpeners: true })).toBe('hello **bold**')
    expect(autoCloseMarkdown('hello *italic', { dropTrailingOpeners: true })).toBe('hello *italic*')
  })

  it('does not drop escaped trailing openers', () => {
    expect(autoCloseMarkdown('hello \\*', { dropTrailingOpeners: true })).toBe('hello \\*')
  })

  it('is off by default', () => {
    expect(autoCloseMarkdown('hello *')).toBe('hello *')
  })
})
