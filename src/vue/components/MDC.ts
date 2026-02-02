import type { PropType } from 'vue'
import { computed, defineComponent, h, shallowRef, watch } from 'vue'
import type { ParseResult } from '../../index'
import { parse, parseAsync } from '../../index'
import type { ParseOptions } from '../../types'
import { MDCRenderer } from './MDCRenderer'
import { standardProseComponents } from './prose/standard'
import { proseStreamComponents } from './prose/stream'

/**
 * MDC component
 *
 * High-level component that accepts markdown as a string prop,
 * parses it, and renders it using MDCRenderer.
 *
 * @example
 * ```vue
 * <template>
 *   <MDC :markdown="content" :components="customComponents" />
 * </template>
 *
 * <script setup lang="ts">
 * import { MDC } from 'mdc-syntax/vue'
 * import CustomHeading from './CustomHeading.vue'
 *
 * const content = `
 * # Hello World
 *
 * This is a **markdown** document with *MDC* components.
 *
 * ::alert{type="info"}
 * This is an alert component
 * ::
 * `
 *
 * const customComponents = {
 *   h1: CustomHeading,
 *   alert: AlertComponent,
 * }
 * </script>
 * ```
 */
export const MDC = defineComponent({
  name: 'MDC',

  props: {
    /**
     * The markdown content to parse and render
     */
    markdown: {
      type: String as PropType<string>,
      required: true,
    },

    /**
     * Parser options
     */
    options: {
      type: Object as PropType<ParseOptions>,
      default: () => ({}),
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
      type: Function as PropType<(name: string) => Promise<any>>,
      default: undefined,
    },

    /**
     * Enable streaming mode with stream-specific components
     */
    stream: {
      type: Boolean as PropType<boolean>,
      default: false,
    },

    /**
     * If document has a <!-- more --> comment, only render the content before the comment
     */
    excerpt: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },

  async setup(props) {
    const markdown = computed(() => {
      if (props.excerpt) {
        return props.markdown.split('<!-- more -->')[0]
      }
      return props.markdown
    })

    const parsed = shallowRef<ParseResult | null>(null)

    async function parseMarkdown() {
      if (!props.stream) {
        parsed.value = await parseAsync(markdown.value, {
          highlight: !props.stream,
          ...props.options,
        })
        parsed.value?.body?.value?.push([
          'style',
          {},
          `html.dark .shiki:not(.shiki-stream), html.dark .shiki:not(.shiki-stream) span {
      color: var(--shiki-dark) !important;
      background-color: var(--shiki-dark-bg) !important;
      /* Optional, if you also want font styles */
      font-style: var(--shiki-dark-font-style) !important;
      font-weight: var(--shiki-dark-font-weight) !important;
      text-decoration: var(--shiki-dark-text-decoration) !important;
    }`,
        ])
      }
      else {
        parsed.value = parse(markdown.value, {
          ...props.options,
          highlight: false,
        })
      }
    }

    if (props.stream) {
      watch(markdown, parseMarkdown)
    }

    await parseMarkdown()

    const components = computed(() => ({
      ...standardProseComponents,
      ...proseStreamComponents,
      ...props.components,
    }))

    return () => {
      // Render using MDCRenderer
      return h(MDCRenderer, {
        body: parsed.value?.body || { type: 'minimark', value: [] },
        components,
        stream: props.stream,
        componentsManifest: props.componentsManifest,
        class: `mdc-content ${props.stream ? 'mdc-stream' : ''}`,
      })
    }
  },
})
