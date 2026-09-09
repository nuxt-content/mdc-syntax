import { describe, expect, it, vi } from 'vitest'
import type { ComarkPlugin } from '../../src/types'
import { parseMarkdown } from '../../src/parse'
import attributes from '../../src/plugins/attributes'
import components from '../../src/plugins/components'
import frontmatter from '../../src/plugins/frontmatter'
import html from '../../src/plugins/html'

describe('default plugin options', () => {
  describe('registerDefaultPlugins', () => {
    it('parses component syntax by default', async () => {
      const tree = await parseMarkdown('::alert\nContent\n::')
      expect(tree.nodes).toEqual([['alert', {}, 'Content']])
    })

    it('renders task-list checkboxes by default', async () => {
      const tree = await parseMarkdown('- [ ] todo')
      expect(JSON.stringify(tree.nodes)).toContain('task-list-item-checkbox')
    })

    it('transforms alert blockquotes by default', async () => {
      const tree = await parseMarkdown('> [!NOTE]\n> hi')
      expect(tree.nodes).toEqual([['blockquote', { as: 'note' }, 'hi']])
    })

    it('parses HTML by default', async () => {
      const tree = await parseMarkdown('<strong class="bold">Hello</strong>')
      expect(tree.nodes).toEqual([['strong', { class: 'bold', $: { html: 1, block: 0 } }, 'Hello']])
    })

    it('parses frontmatter by default', async () => {
      const tree = await parseMarkdown('---\ntitle: Hello\n---\n\n# Hi')
      expect(tree.frontmatter).toEqual({ title: 'Hello' })
      expect(tree.nodes).toEqual([['h1', { id: 'hi' }, 'Hi']])
    })

    it('parses attributes by default', async () => {
      const tree = await parseMarkdown('Hello {.cls}')
      expect(tree.nodes).toEqual([['p', { class: 'cls' }, 'Hello']])
    })

    it('treats frontmatter as content when registerDefaultPlugins is false', async () => {
      const tree = await parseMarkdown('---\ntitle: Hello\n---\n\n# Hi', { registerDefaultPlugins: false })
      expect(tree.frontmatter).toEqual({})
      expect(tree.nodes[0]).toEqual(['hr', {}])
    })

    it('parses frontmatter via an explicit plugin when registerDefaultPlugins is false', async () => {
      const tree = await parseMarkdown('---\ntitle: Hello\n---\n\n# Hi', {
        registerDefaultPlugins: false,
        plugins: [frontmatter()],
      })
      expect(tree.frontmatter).toEqual({ title: 'Hello' })
      expect(tree.nodes).toEqual([['h1', { id: 'hi' }, 'Hi']])
    })

    it('treats HTML as plain text when registerDefaultPlugins is false', async () => {
      const tree = await parseMarkdown('<em>hi</em>', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, '<em>hi</em>']])
    })

    it('parses HTML via an explicit html plugin when registerDefaultPlugins is false', async () => {
      const tree = await parseMarkdown('<em>hi</em>', {
        registerDefaultPlugins: false,
        plugins: [html()],
      })
      expect(tree.nodes).toEqual([['em', { $: { html: 1, block: 0 } }, 'hi']])
    })

    it('treats attribute braces as plain text when registerDefaultPlugins is false', async () => {
      const tree = await parseMarkdown('Hello {.cls}', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, 'Hello {.cls}']])
    })

    it('leaves component syntax literal when disabled', async () => {
      const tree = await parseMarkdown('::alert\nContent\n::', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, '::alert\nContent\n::']])
    })

    it('keeps the [ ] marker literal when disabled', async () => {
      const tree = await parseMarkdown('- [ ] todo', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['ul', {}, ['li', {}, '[ ] todo']]])
    })

    it('keeps the [!NOTE] marker literal when disabled', async () => {
      const tree = await parseMarkdown('> [!NOTE]\n> hi', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['blockquote', {}, '[!NOTE]\nhi']])
    })

    it('does not append component closers when disabled', async () => {
      const tree = await parseMarkdown('::alert\nContent', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, '::alert\nContent']])
    })

    it('keeps a literal trailing :: line when disabled', async () => {
      const tree = await parseMarkdown('para\n\n::', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([
        ['p', {}, 'para'],
        ['p', {}, '::'],
      ])
    })

    it('still auto-closes markdown markers when disabled', async () => {
      const tree = await parseMarkdown('**bold', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, ['strong', {}, 'bold']]])
    })
  })

  describe('deprecated html option', () => {
    it('still disables HTML with html: false and warns', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tree = await parseMarkdown('<strong>Hello</strong>', { html: false })
      expect(tree.nodes).toEqual([['p', {}, '<strong>Hello</strong>']])
      expect(warn).toHaveBeenCalled()
      expect(String(warn.mock.calls[0]?.[0])).toContain('ParserOptions.html')
      warn.mockRestore()
    })

    it('does not add html when registerDefaultPlugins is false even if html is unset', async () => {
      const tree = await parseMarkdown('<em>hi</em>', { registerDefaultPlugins: false })
      expect(tree.nodes).toEqual([['p', {}, '<em>hi</em>']])
    })
  })

  describe('post hook ordering', () => {
    it('runs default normalizer post hooks before user post hooks', async () => {
      let seen: unknown
      const probe: ComarkPlugin = {
        name: 'probe',
        post(state) {
          seen = structuredClone(state.tree.nodes)
        },
      }
      await parseMarkdown('> [!NOTE]\n> hi', { plugins: [probe] })
      // `alert` has already rewritten the blockquote when the user post hook runs.
      expect(seen).toEqual([['blockquote', { as: 'note' }, 'hi']])
    })

    it('runs a user override in explicit plugin order after the remaining defaults', async () => {
      const order: string[] = []
      const probe: ComarkPlugin = { name: 'probe', post: () => void order.push('probe') }
      const alertOverride: ComarkPlugin = { name: 'alert', post: () => void order.push('alert-override') }
      await parseMarkdown('> [!NOTE]\n> hi', { plugins: [probe, alertOverride] })
      expect(order).toEqual(['probe', 'alert-override'])
    })

    it('extracts frontmatter before user pre hooks run', async () => {
      let seenMarkdown = ''
      let seenFrontmatter: unknown
      const probe: ComarkPlugin = {
        name: 'probe',
        pre(state) {
          seenMarkdown = state.markdown
          seenFrontmatter = { ...state.frontmatter }
        },
      }
      const tree = await parseMarkdown('---\ntitle: Hello\n---\n\n# Hi', { plugins: [probe] })
      // User pre hooks see the stripped body and the parsed frontmatter.
      expect(seenMarkdown).not.toContain('title: Hello')
      expect(seenMarkdown).toContain('# Hi')
      expect(seenFrontmatter).toEqual({ title: 'Hello' })
      expect(tree.frontmatter).toEqual({ title: 'Hello' })
    })

    it('preserves explicit registration order when registerDefaultPlugins is false', async () => {
      const order: string[] = []
      const probe: ComarkPlugin = { name: 'probe', post: () => void order.push('probe') }
      const userAlert: ComarkPlugin = { name: 'alert', post: () => void order.push('alert') }
      await parseMarkdown('> [!NOTE]\n> hi', {
        registerDefaultPlugins: false,
        plugins: [probe, userAlert],
      })
      // No defaults registered, so nothing is hoisted — the user's order rules.
      expect(order).toEqual(['probe', 'alert'])
    })
  })

  describe('user plugin override', () => {
    it('keeps an explicit components plugin active with registerDefaultPlugins: false', async () => {
      const tree = await parseMarkdown('::alert\nContent', {
        registerDefaultPlugins: false,
        plugins: [components()],
      })
      expect(tree.nodes).toEqual([['alert', {}, 'Content']])
    })

    it('renders attributes when only attributes enabled', async () => {
      const tree = await parseMarkdown('this is a [link with an attribute](https://example.com){target="_blank"}', {
        registerDefaultPlugins: false,
        plugins: [attributes()],
      })
      expect(tree.nodes).toEqual([
        [
          'p',
          {},
          'this is a ',
          [
            'a',
            {
              href: 'https://example.com',
              target: '_blank',
            },
            'link with an attribute',
          ],
        ],
      ])
    })
  })
})
