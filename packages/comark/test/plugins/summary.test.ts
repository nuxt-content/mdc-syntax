import { describe, expect, expectTypeOf, it } from 'vitest'
import { parseMarkdown } from '../../src/parse'
import summary from '../../src/plugins/summary'
import type { Node } from '../../src/types'

const CONTENT = `Intro paragraph.

<!-- more -->

After the fold.
`

describe('summary plugin', () => {
  it('writes the nodes before the delimiter to tree.meta.summary', async () => {
    const tree = await parseMarkdown(CONTENT, { plugins: [summary()] })
    expect(tree.meta.summary).toEqual([['p', {}, 'Intro paragraph.']])
  })

  it('leaves tree.meta.summary undefined when no delimiter is present', async () => {
    const tree = await parseMarkdown('No fold here.', { plugins: [summary()] })

    expect(tree.meta.summary).toBeUndefined()
  })

  it('narrows tree.meta.summary to Node[] at the type level', async () => {
    const tree = await parseMarkdown(CONTENT, { plugins: [summary()] })

    expectTypeOf(tree.meta.summary).toEqualTypeOf<Node[]>()
  })
})
