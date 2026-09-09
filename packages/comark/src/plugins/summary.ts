import type { Node } from 'comark'
import { defineComarkPlugin } from '../utils/helpers.ts'

export default defineComarkPlugin<{ delimiter?: string }, { summary: Node[] }>((options = {}) => {
  const { delimiter = '<!-- more -->' } = options
  return {
    name: 'summary',
    post(state) {
      let summary: Node[] | undefined

      const delimiterIndex = state.tree.nodes.findIndex((node) => node[0] === null && delimiter === `<!--${node[2]}-->`)

      if (delimiterIndex !== -1) {
        summary = state.tree.nodes.slice(0, delimiterIndex)

        if (summary) {
          state.tree.meta.summary = summary
        }
      }
    },
  }
})
