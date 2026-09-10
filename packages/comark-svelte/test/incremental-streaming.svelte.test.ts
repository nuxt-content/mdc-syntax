import type { ComarkPlugin } from 'comark'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Markdown from '../src/components/Markdown.svelte'
import MarkdownAsync from '../src/async/MarkdownAsync.svelte'
import MarkdownBoundary from './test-components/MarkdownBoundary.svelte'

for (const [name, component] of [
  ['Markdown', Markdown],
  ['MarkdownAsync', MarkdownAsync],
] as const) {
  describe(`${name} incremental parsing`, () => {
    it('parses only the open tail and reparses the full value when streaming ends', async () => {
      const inputs: string[] = []
      const plugin: ComarkPlugin = {
        name: 'inputs',
        pre: (state) => {
          inputs.push(state.markdown)
        },
      }
      const initial = 'First\n\nSecond\n\nThird'
      const screen = await render(MarkdownBoundary, {
        component,
        value: initial,
        plugins: [plugin],
        streaming: true,
      })
      await expect.element(screen.getByText('Third')).toBeInTheDocument()

      const value = `${initial} grows`
      await screen.rerender({ value })
      await expect.element(screen.getByText('Third grows')).toBeInTheDocument()
      expect(inputs).toHaveLength(2)
      expect(inputs[1]).not.toContain('First')
      expect(inputs[1]!.length).toBeLessThan(value.length)
      await expect.element(screen.getByText('First')).toBeInTheDocument()

      await screen.rerender({ streaming: false })
      await expect.poll(() => inputs.length).toBe(3)
      expect(inputs[2]).toBe(value)

      await screen.rerender({ value: 'Replacement' })
      await expect.element(screen.getByText('Replacement')).toBeInTheDocument()
      expect(screen.container.textContent).not.toContain('First')
    })

    it('recreates the parser when options, plugins, or unwrap change', async () => {
      const value = 'https://example.com\n\nTail'
      const screen = await render(MarkdownBoundary, {
        component,
        value,
        streaming: true,
        options: { linkify: false },
      })
      await expect.element(screen.getByText('Tail')).toBeInTheDocument()
      expect(screen.container.querySelector('a')).toBeNull()

      await screen.rerender({ options: { linkify: true } })
      await expect.element(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com')

      const plugin: ComarkPlugin = {
        name: 'replace',
        pre: (state) => {
          state.markdown = state.markdown.replace('Tail', 'Changed')
        },
      }
      await screen.rerender({ plugins: [plugin] })
      await expect.element(screen.getByText('Changed')).toBeInTheDocument()

      await screen.rerender({ unwrap: true })
      await expect.poll(() => screen.container.querySelector('p')).toBeNull()
      expect(screen.container.textContent).toContain('Changed')
    })

    it('ignores old plugin results after a configuration change', async () => {
      const { promise: gate, resolve: release } = Promise.withResolvers<void>()
      let finished = false
      const screen = await render(MarkdownBoundary, {
        component,
        value: 'Old',
        streaming: true,
        plugins: [
          {
            name: 'slow',
            async pre() {
              await gate
              finished = true
            },
          },
        ],
      })
      await screen.rerender({ value: 'New', plugins: [] })
      await expect.element(screen.getByText('New')).toBeInTheDocument()
      release()
      await expect.poll(() => finished).toBe(true)
      await expect.element(screen.getByText('New')).toBeInTheDocument()
      expect(screen.container.textContent).not.toContain('Old')
    })

    it('serializes overlapping plugin work and applies the newest update', async () => {
      const { promise: gate, resolve: release } = Promise.withResolvers<void>()
      let active = 0
      let maxActive = 0
      const inputs: string[] = []
      const plugin: ComarkPlugin = {
        name: 'deferred',
        async pre(state) {
          active++
          maxActive = Math.max(maxActive, active)
          inputs.push(state.markdown)
          if (state.markdown.includes('Slow')) await gate
          active--
        },
      }
      const screen = await render(MarkdownBoundary, { component, value: 'Ready', streaming: true, plugins: [plugin] })
      await expect.element(screen.getByText('Ready')).toBeInTheDocument()
      await screen.rerender({ value: 'Slow' })
      await expect.poll(() => inputs).toContain('Slow')
      await screen.rerender({ value: 'Latest' })
      release()
      await expect.element(screen.getByText('Latest')).toBeInTheDocument()
      expect(maxActive).toBe(1)
      expect(screen.container.textContent).not.toContain('Slow')
    })
  })
}

it('passes asynchronous plugin errors to the Svelte boundary', async () => {
  const screen = await render(MarkdownBoundary, {
    component: MarkdownAsync,
    value: 'Failure',
    streaming: true,
    plugins: [
      {
        name: 'fail',
        async pre() {
          throw new Error('Plugin failed')
        },
      },
    ],
  })
  await expect.element(screen.getByRole('alert')).toHaveTextContent('Plugin failed')
})

it('shows completed updates while the next update is still parsing', async () => {
  const { promise: first, resolve: releaseFirst } = Promise.withResolvers<void>()
  const { promise: last, resolve: releaseLast } = Promise.withResolvers<void>()
  const started: string[] = []
  const screen = await render(MarkdownBoundary, {
    component: Markdown,
    value: 'Ready',
    streaming: true,
    plugins: [
      {
        name: 'slow',
        async pre(state) {
          started.push(state.markdown)
          if (state.markdown === 'First') await first
          if (state.markdown === 'Last') await last
        },
      } satisfies ComarkPlugin,
    ],
  })
  await expect.element(screen.getByText('Ready')).toBeInTheDocument()
  await screen.rerender({ value: 'First' })
  await expect.poll(() => started).toContain('First')
  await screen.rerender({ value: 'Last' })
  releaseFirst()
  await expect.poll(() => started).toContain('Last')
  await expect.element(screen.getByText('First')).toBeInTheDocument()
  releaseLast()
  await expect.element(screen.getByText('Last')).toBeInTheDocument()
})
