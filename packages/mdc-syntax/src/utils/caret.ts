import type { MinimarkElement } from 'minimark'

interface CaretOptions {
  class?: string
}

const CARET_TEXT = ' ' // thin space is used to avoid wide spaces between text and caret
export function getCaret(options: boolean | CaretOptions): MinimarkElement | null {
  if (options === true) {
    return ['span', { key: 'stream-caret', class: 'bg-current inline-block mx-1 animate-[pulse_0.75s_cubic-bezier(0.4,0,0.6,1)_infinite]' }, CARET_TEXT]
  }
  if (typeof options === 'object') {
    return ['span', {
      key: 'stream-caret',
      class: 'bg-current inline-block mx-1 animate-[pulse_0.75s_cubic-bezier(0.4,0,0.6,1)_infinite] ' + (options?.class || ''),
    }, CARET_TEXT]
  }

  return null
}

export function findLastTextNodeAndAppendNode(parent: MinimarkElement, nodeToAppend: MinimarkElement): boolean {
  // Traverse nodes backwards to find the last text node
  for (let i = parent.length - 1; i >= 2; i--) {
    const node = parent[i]

    if (typeof node === 'string' && parent[1]?.key !== 'stream-caret') {
      // Found a text node - insert stream indicator after it
      parent.push(nodeToAppend)

      return true
    }

    if (Array.isArray(node)) {
      // This is an element node - recursively check its children
      if (findLastTextNodeAndAppendNode(node, nodeToAppend)) {
        return true
      }
    }
  }

  return false
}
