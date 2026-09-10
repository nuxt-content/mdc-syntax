import type { State } from 'comark/render'
import type { ElementNode } from 'comark'
import { comarkAttributes, userBlockAttrs } from '../attributes.ts'
import { textContent } from '../../../utils/index.ts'

export function code(node: ElementNode, _state: State) {
  const [_, attributes] = node
  // The shiki and rangi plugins merge their injected classes onto highlighted
  // inline code behind a ` . ` sentinel. Strip them so the node round-trips as
  // `` `text`{lang=…} `` instead of leaking `.shiki.shiki-themes…`.
  const attrs = userBlockAttrs('code', attributes as Record<string, unknown>)
  const attrsString = Object.keys(attrs).length > 0 ? comarkAttributes(attrs) : ''
  const content = textContent(node)
  const fence = content.includes('`') ? '``' : '`'

  return `${fence}${content}${fence}${attrsString}`
}
