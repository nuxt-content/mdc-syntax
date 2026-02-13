import type { PropType, VNode } from 'vue'
import type { MinimarkElement, MinimarkNode, MinimarkTree } from 'minimark'
import { computed, defineAsyncComponent, defineComponent, getCurrentInstance, h, inject, onErrorCaptured, ref, toRaw } from 'vue'
import { standardProseComponents } from '.'
import { camelize, capitalize } from '@vue/shared'
import { findLastTextNodeAndAppendNode, getCaret } from '../../utils/caret'
import type { ComponentManifest, MDCProvider } from '../../types'

// Cache for dynamically resolved components
const asyncComponentCache = new Map<string, any>()

const pascalCase = (str: string) => capitalize(camelize(str))

/**
 * Helper to get tag from a MinimarkNode
 */
function getTag(node: MinimarkNode): string | null {
  if (Array.isArray(node) && node.length >= 1) {
    return node[0] as string
  }
  return null
}

/**
 * Helper to get props from a MinimarkNode
 */
function getProps(node: MinimarkNode): Record<string, any> {
  if (Array.isArray(node) && node.length >= 2) {
    return (node[1] as Record<string, any>) || {}
  }
  return {}
}

function parsePropValue(value: string): any {
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null') return null
  try {
    return JSON.parse(value)
  }
  catch {
    // noop
  }

  return value
}

/**
 * Helper to get children from a MinimarkNode
 */
function getChildren(node: MinimarkNode): MinimarkNode[] {
  if (Array.isArray(node) && node.length > 2) {
    return node.slice(2) as MinimarkNode[]
  }
  return []
}

/**
 * Render a single MDC node to Vue VNode
 */
function renderNode(
  node: MinimarkNode,
  components: Record<string, any> = {},
  key?: string | number,
  componentsManifest?: ComponentManifest,
  parent?: MinimarkNode,
): VNode | string | null {
  // Handle text nodes (strings)
  if (typeof node === 'string') {
    return node
  }

  // Handle element nodes (arrays)
  if (Array.isArray(node)) {
    const tag = getTag(node)
    if (!tag) return null

    const nodeProps = getProps(node)
    const children = getChildren(node)

    // Check if there's a custom component for this tag
    let customComponent = tag

    const appComponents = getCurrentInstance()?.appContext?.components
    if ((parent as MinimarkElement | undefined)?.[0] !== 'pre') {
      const pascalTag = pascalCase(tag)
      const proseTag = `Prose${pascalTag}`
      customComponent = appComponents?.[proseTag]
        || components[proseTag]
        || appComponents?.[pascalTag]
        || components[tag]
        || components[pascalTag]

      // If not in components map and manifest is provided, try dynamic resolution
      if (!customComponent && componentsManifest) {
        // Check cache first to avoid creating duplicate async components
        const cacheKey = tag
        if (!asyncComponentCache.has(cacheKey)) {
          const promise = componentsManifest(tag)
          if (promise) {
            asyncComponentCache.set(cacheKey, defineAsyncComponent(() => promise as Promise<any>))
          }
        }
        customComponent = asyncComponentCache.get(cacheKey)
      }
    }

    const component = customComponent || tag

    // Prepare props
    // Prepare props — use for...in instead of Object.entries() to avoid intermediate array allocation
    const props: Record<string, any> = {}
    for (const k in nodeProps) {
      if (k === 'className') {
        props.class = nodeProps[k]
      }
      else if (k.charCodeAt(0) === 58 /* ':' */) {
        props[k.substring(1)] = parsePropValue(nodeProps[k])
      }
      else {
        props[k] = nodeProps[k]
      }
    }

    // @ts-expect-error - component might be a Vue component
    if (component?.props?.__node || component?.__asyncResolved?.props?.__node) {
      props.__node = node
    }

    // Add key if provided
    if (key !== undefined) {
      props.key = key
    }

    if (node.length === 2) {
      return h(component, props)
    }

    // Separate template elements (slots) from regular children
    const slots: Record<string, () => (VNode | string)[]> = {}
    const regularChildren: (VNode | string)[] = []

    for (let i = 0; i < children.length; i++) {
      const child = children[i]
      if (child === undefined || child === null)
        continue

      // Check if this is a slot template (array with tag 'template')
      const childTag = getTag(child)
      const childProps = getProps(child)

      if (childTag === 'template' && childProps) {
        // Find the slot name from props
        // Support both { name: 'title' } and { '#title': '' } formats
        let slotName: string | undefined

        if (childProps.name) {
          slotName = childProps.name
        }
        else {
          // Use for...in instead of Object.keys().find() — avoids intermediate array
          for (const pk in childProps) {
            if (pk.startsWith('v-slot:')) {
              slotName = pk.substring(7)
              break
            }
          }
        }

        if (slotName) {
          const slotChildren = getChildren(child)
          slots[slotName] = () => slotChildren
            .map((slotChild: MinimarkNode, idx: number) => renderNode(slotChild, components, idx, componentsManifest, node))
            .filter((slotChild): slotChild is VNode | string => slotChild !== null)
          continue
        }
      }

      const rendered = renderNode(child, components, i, componentsManifest, node)
      if (rendered !== null) {
        regularChildren.push(rendered)
      }
    }

    // If using a custom component, pass slots
    if (customComponent) {
      // Always include default slot if there are regular children
      if (regularChildren.length > 0) {
        slots.default = () => regularChildren
      }

      return h(component, props, slots)
    }

    // For native HTML tags, pass children directly (ignore slot templates)
    return h(component, props, regularChildren)
  }

  console.log('!!!component', node)
  return null
}

/**
 * MDCRenderer component
 *
 * Renders a Minimark tree to Vue components/HTML.
 * Supports custom component mapping for element tags.
 *
 * @example
 * ```vue
 * <template>
 *   <MDCRenderer :body="mdcAst" :components="customComponents" />
 * </template>
 *
 * <script setup lang="ts">
 * import { MDCRenderer } from 'mdc-syntax/vue'
 * import CustomHeading from './CustomHeading.vue'
 *
 * const customComponents = {
 *   h1: CustomHeading,
 *   h2: CustomHeading,
 * }
 * </script>
 * ```
 */
export const MDCRenderer = defineComponent({
  name: 'MDCRenderer',

  props: {
    /**
     * The Minimark tree to render
     */
    body: {
      type: Object as PropType<MinimarkTree>,
      required: true,
    },

    /**
     * Custom component mappings for element tags
     * Key: tag name (e.g., 'h1', 'p', 'MyComponent')
     * Value: Vue component
     */
    components: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({}),
    },

    /**
     * Dynamic component resolver function
     * Used to resolve components that aren't in the components map
     */
    componentsManifest: {
      type: Function as PropType<ComponentManifest>,
      default: undefined,
    },

    /**
     * Enable streaming mode with stream-specific components
     */
    streaming: {
      type: Boolean as PropType<boolean>,
      default: false,
    },

    /**
     * If caret is true, a caret will be appended to the last text node in the tree
     * If caret is an object, it will be appended to the last text node in the tree with the given class
     */
    caret: {
      type: [Boolean, Object] as PropType<boolean | { class: string }>,
      default: false,
    },
  },

  async setup(props) {
    const componentErrors = ref(new Set<string>())

    // Capture errors from child components (e.g., during streaming when props are incomplete)
    onErrorCaptured((err, instance, info) => {
      // Get component name from instance
      const componentName = (instance?.$?.type as any)?.name || (instance as any)?.type?.name || 'unknown'

      // Log error in development
      if (import.meta.dev) {
        console.warn(`[MDCRenderer] Error in component "${componentName}":`, err)
        console.warn('Error info:', info)
      }

      // Track failed component to prevent re-rendering during streaming
      componentErrors.value.add(componentName)

      // Prevent error from propagating (don't crash the app during streaming)
      return false
    })

    const mdc = inject<MDCProvider>('mdc', { components: {}, componentManifest: () => null })

    const components = computed(() => ({
      ...standardProseComponents,
      ...mdc?.components,
      ...props.components,
    }))

    const componentManifest: ComponentManifest = (name: string) => {
      let resolved = props.componentsManifest?.(name)
      if (!resolved) {
        resolved = mdc?.componentManifest(name)
      }
      return resolved || null
    }

    const caret = computed<MinimarkElement | null>(() => getCaret(props.caret))

    return () => {
      // Render all nodes from the tree value
      const nodes = toRaw(props.body.value || []) || []

      if (props.streaming && caret.value && nodes.length > 0) {
        const hasstramCaret = findLastTextNodeAndAppendNode(nodes[nodes.length - 1] as MinimarkElement, caret.value)
        if (!hasstramCaret) {
          nodes.push(caret.value)
        }
      }

      const children = nodes
        .map((node, index) => renderNode(node, components.value, index, componentManifest))
        .filter((child): child is VNode | string => child !== null)

      // Wrap in a fragment
      return h('div', { class: 'mdc-content' }, children)
    }
  },
})
