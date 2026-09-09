import { describe, expect, it } from 'vitest'
import { TREE_WALK_MAX_DEPTH, visit } from 'comark/utils'
import type { MarkdownDocument, Node } from 'comark'

describe('visit', () => {
  it('should visit all nodes in a simple tree', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Hello'],
        ['p', {}, 'World'],
      ],
      frontmatter: {},
      meta: {},
    }

    const visited: Node[] = []
    visit(
      tree,
      () => true, // visit all nodes
      (node) => {
        visited.push(node)
        return undefined
      }
    )

    expect(visited.length).toBe(4) // h1, 'Hello', p, 'World'
    expect(visited[0]).toEqual(['h1', {}, 'Hello'])
    expect(visited[1]).toBe('Hello')
    expect(visited[2]).toEqual(['p', {}, 'World'])
    expect(visited[3]).toBe('World')
  })

  it('should only visit nodes that match the checker', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Title'],
        ['p', {}, 'Paragraph'],
        ['div', {}, 'Div'],
      ],
      frontmatter: {},
      meta: {},
    }

    const visited: string[] = []
    visit(
      tree,
      (node) => Array.isArray(node) && node[0] === 'p', // only visit p elements
      (node) => {
        visited.push((node as [string, any, ...any[]])[0])
        return undefined
      }
    )

    expect(visited).toEqual(['p'])
  })

  it('should replace nodes when visitor returns a new node', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Hello'],
        ['p', {}, 'World'],
      ],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => Array.isArray(node) && node[0] === 'h1',
      () => {
        return ['h2', {}, 'Modified']
      }
    )

    expect(tree.nodes[0]).toEqual(['h2', {}, 'Modified'])
    expect(tree.nodes[1]).toEqual(['p', {}, 'World'])
  })

  it('should remove nodes when visitor returns false', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Title'],
        ['p', {}, 'Keep this'],
        ['div', {}, 'Remove this'],
        ['span', {}, 'Keep this too'],
      ],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => Array.isArray(node) && node[0] === 'div',
      () => false // remove div elements
    )

    expect(tree.nodes.length).toBe(3)
    expect(tree.nodes[0]).toEqual(['h1', {}, 'Title'])
    expect(tree.nodes[1]).toEqual(['p', {}, 'Keep this'])
    expect(tree.nodes[2]).toEqual(['span', {}, 'Keep this too'])
  })

  it('should visit all remaining nodes after removing a node', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Title'],
        ['p', {}, 'Paragraph 1'],
        ['div', {}, 'Remove me'],
        ['p', {}, 'Paragraph 2'],
        ['span', {}, 'Span'],
      ],
      frontmatter: {},
      meta: {},
    }

    const visited: string[] = []
    visit(
      tree,
      (node) => Array.isArray(node),
      (node) => {
        const tag = (node as [string, any, ...any[]])[0]
        visited.push(tag)
        if (tag === 'div') {
          return false // remove div
        }
        return undefined
      }
    )

    // Should visit all nodes including those after the removed one
    expect(visited).toEqual(['h1', 'p', 'div', 'p', 'span'])
    expect(tree.nodes.length).toBe(4)
    expect((tree.nodes[0] as [string, any, ...any[]])[0]).toBe('h1')
    expect((tree.nodes[1] as [string, any, ...any[]])[0]).toBe('p')
    expect((tree.nodes[2] as [string, any, ...any[]])[0]).toBe('p')
    expect((tree.nodes[3] as [string, any, ...any[]])[0]).toBe('span')
  })

  it('should handle nested node removal correctly', () => {
    const tree: MarkdownDocument = {
      nodes: [['div', {}, ['p', {}, 'Keep'], ['span', {}, 'Remove'], ['p', {}, 'Keep too']]],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => Array.isArray(node) && node[0] === 'span',
      () => false // remove span elements
    )

    const div = tree.nodes[0] as [string, any, ...any[]]
    expect(div.length).toBe(4) // tag, attrs, 'Keep', 'Keep too'
    expect(div[2]).toEqual(['p', {}, 'Keep'])
    expect(div[3]).toEqual(['p', {}, 'Keep too'])
  })

  it('should visit all remaining nested nodes after removal', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['div', {}, ['p', {}, 'Before'], ['span', {}, 'Remove'], ['p', {}, 'After'], ['strong', {}, 'Also after']],
      ],
      frontmatter: {},
      meta: {},
    }

    const visited: string[] = []
    visit(
      tree,
      (node) => Array.isArray(node),
      (node) => {
        const tag = (node as [string, any, ...any[]])[0]
        visited.push(tag)
        if (tag === 'span') {
          return false // remove span
        }
        return undefined
      }
    )

    // Should visit all nodes including those after the removed span
    expect(visited).toEqual(['div', 'p', 'span', 'p', 'strong'])

    const div = tree.nodes[0] as [string, any, ...any[]]
    expect(div.length).toBe(5) // tag, attrs, p, p, strong
    expect((div[2] as [string, any, ...any[]])[0]).toBe('p')
    expect((div[3] as [string, any, ...any[]])[0]).toBe('p')
    expect((div[4] as [string, any, ...any[]])[0]).toBe('strong')
  })

  it('should handle multiple removals in sequence', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Title'],
        ['div', {}, 'Remove 1'],
        ['p', {}, 'Keep'],
        ['div', {}, 'Remove 2'],
        ['span', {}, 'Keep'],
        ['div', {}, 'Remove 3'],
      ],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => Array.isArray(node) && node[0] === 'div',
      () => false // remove all div elements
    )

    expect(tree.nodes.length).toBe(3)
    expect((tree.nodes[0] as [string, any, ...any[]])[0]).toBe('h1')
    expect((tree.nodes[1] as [string, any, ...any[]])[0]).toBe('p')
    expect((tree.nodes[2] as [string, any, ...any[]])[0]).toBe('span')
  })

  it('should handle removing all nodes', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['p', {}, 'Remove'],
        ['span', {}, 'Remove'],
        ['div', {}, 'Remove'],
      ],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      () => true, // visit all nodes
      () => false // remove all nodes
    )

    expect(tree.nodes.length).toBe(0)
  })

  it('should handle empty tree', () => {
    const tree: MarkdownDocument = {
      nodes: [],
      frontmatter: {},
      meta: {},
    }

    const visited: Node[] = []
    visit(
      tree,
      () => true,
      (node) => {
        visited.push(node)
        return undefined
      }
    )

    expect(visited.length).toBe(0)
    expect(tree.nodes.length).toBe(0)
  })

  it('should handle text nodes', () => {
    const tree: MarkdownDocument = {
      nodes: [['p', {}, 'Text 1', 'Text 2']],
      frontmatter: {},
      meta: {},
    }

    const visited: (string | [string, any, ...any[]])[] = []
    visit(
      tree,
      () => true,
      (node) => {
        visited.push(node as string | [string, any, ...any[]])
        return undefined
      }
    )

    expect(visited.length).toBe(3) // p, 'Text 1', 'Text 2'
    expect(visited[0]).toEqual(['p', {}, 'Text 1', 'Text 2'])
    expect(visited[1]).toBe('Text 1')
    expect(visited[2]).toBe('Text 2')
  })

  it('should handle text nodes with removals', () => {
    const tree: MarkdownDocument = {
      nodes: [['p', {}, 'Text 1', 'Text 2', 'Text 3']],
      frontmatter: {},
      meta: {},
    }

    const visited: (string | [string, any, ...any[]])[] = []
    visit(
      tree,
      () => true,
      (node) => {
        visited.push(node as string | [string, any, ...any[]])
        if (node === 'Text 2') {
          return false
        }
        return undefined
      }
    )

    expect(visited.length).toBe(4) // p, 'Text 1', 'Text 2', 'Text 3'
    expect(visited[0]).toEqual(['p', {}, 'Text 1', 'Text 3']) // modified after 'Text 2' removal
    expect(visited[1]).toBe('Text 1')
    expect(visited[2]).toBe('Text 2') // visited before removal
    expect(visited[3]).toBe('Text 3')

    // Verify the tree was actually modified after the visit
    const p = tree.nodes[0] as [string, any, ...any[]]
    expect(p.length).toBe(4) // tag, attrs, 'Text 1', 'Text 3'
    expect(p[2]).toBe('Text 1')
    expect(p[3]).toBe('Text 3')
  })

  it('should handle replacing text nodes', () => {
    const tree: MarkdownDocument = {
      nodes: [['p', {}, 'Old text']],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => typeof node === 'string' && node === 'Old text',
      () => 'New text'
    )

    const p = tree.nodes[0] as [string, any, ...any[]]
    expect(p[2]).toBe('New text')
  })

  it('should handle removing text nodes', () => {
    const tree: MarkdownDocument = {
      nodes: [['p', {}, 'Keep', 'Remove', 'Keep too']],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => typeof node === 'string' && node === 'Remove',
      () => false // remove 'Remove' text
    )

    const p = tree.nodes[0] as [string, any, ...any[]]
    expect(p.length).toBe(4) // tag, attrs, 'Keep', 'Keep too'
    expect(p[2]).toBe('Keep')
    expect(p[3]).toBe('Keep too')
  })

  it('should handle deep nesting with removals', () => {
    const tree: MarkdownDocument = {
      nodes: [['div', {}, ['section', {}, ['p', {}, 'Before'], ['span', {}, 'Remove'], ['p', {}, 'After']]]],
      frontmatter: {},
      meta: {},
    }

    const visited: string[] = []
    visit(
      tree,
      (node) => Array.isArray(node),
      (node) => {
        const tag = (node as [string, any, ...any[]])[0]
        visited.push(tag)
        if (tag === 'span') {
          return false
        }
        return undefined
      }
    )

    expect(visited).toEqual(['div', 'section', 'p', 'span', 'p'])

    const div = tree.nodes[0] as [string, any, ...any[]]
    const section = div[2] as [string, any, ...any[]]
    expect(section.length).toBe(4) // tag, attrs, p, p
    expect((section[2] as [string, any, ...any[]])[0]).toBe('p')
    expect((section[3] as [string, any, ...any[]])[0]).toBe('p')
  })

  it('should handle complex scenario: remove and replace in same tree', () => {
    const tree: MarkdownDocument = {
      nodes: [
        ['h1', {}, 'Title'],
        ['p', {}, 'Remove'],
        ['div', {}, 'Replace'],
        ['span', {}, 'Keep'],
      ],
      frontmatter: {},
      meta: {},
    }

    visit(
      tree,
      (node) => Array.isArray(node),
      (node) => {
        const tag = (node as [string, any, ...any[]])[0]
        if (tag === 'p') {
          return false // remove
        }
        if (tag === 'div') {
          return ['section', {}, 'Replaced'] // replace
        }
        return undefined
      }
    )

    expect(tree.nodes.length).toBe(3)
    expect(tree.nodes[0]).toEqual(['h1', {}, 'Title'])
    expect(tree.nodes[1]).toEqual(['section', {}, 'Replaced'])
    expect(tree.nodes[2]).toEqual(['span', {}, 'Keep'])
  })

  it('should visit nodes within the depth cap', () => {
    // TREE_WALK_MAX_DEPTH - 1 wrappers + text — text is at depth N-1 and still visited.
    let node: Node = 'Deep'
    for (let i = TREE_WALK_MAX_DEPTH - 2; i >= 0; i--) {
      node = [`d${i}`, {}, node]
    }

    const tree: MarkdownDocument = { nodes: [node], frontmatter: {}, meta: {} }
    const visited: string[] = []
    visit(
      tree,
      () => true,
      (n) => {
        visited.push(typeof n === 'string' ? n : String(n[0]))
      }
    )

    const expected = Array.from({ length: TREE_WALK_MAX_DEPTH - 1 }, (_, i) => `d${i}`)
    expected.push('Deep')
    expect(visited).toEqual(expected)
  })

  it('should not walk past TREE_WALK_MAX_DEPTH element levels', () => {
    // TREE_WALK_MAX_DEPTH + 1 wrappers + text — last wrapper and its children are past the cap.
    let node: Node = 'Too deep'
    for (let i = TREE_WALK_MAX_DEPTH; i >= 0; i--) {
      node = [`d${i}`, {}, node]
    }

    const tree: MarkdownDocument = { nodes: [node], frontmatter: {}, meta: {} }
    const visited: string[] = []
    visit(
      tree,
      () => true,
      (n) => {
        visited.push(typeof n === 'string' ? n : String(n[0]))
      }
    )

    expect(visited).toEqual(Array.from({ length: TREE_WALK_MAX_DEPTH }, (_, i) => `d${i}`))

    let cursor = tree.nodes[0] as Node[]
    for (let i = 0; i <= TREE_WALK_MAX_DEPTH; i++) {
      expect(cursor[0]).toBe(`d${i}`)
      cursor = cursor[2] as Node[]
    }
    expect(cursor).toBe('Too deep')
  })
})
