import { defineComponent, h } from 'vue'
import ShikiCodeBlock from '../ShikiCodeBlock.vue'

/**
 * Standard Typography Prose Components
 *
 * Designed for blog posts, articles, and long-form content.
 * Features:
 * - Comfortable, relaxed spacing
 * - Excellent readability
 * - Soft color palette
 * - Friendly appearance
 */
export const standardProseComponents = {
  // Headings
  h1: defineComponent({
    name: 'ProseH1Standard',
    setup(props, { slots }) {
      return () => h('h1', {
        class: 'prose-h1-standard text-5xl font-bold mt-0 mb-8 text-neutral-900 dark:text-white leading-tight',
        ...props,
      }, slots.default?.())
    },
  }),
  h2: defineComponent({
    name: 'ProseH2Standard',
    setup(props, { slots }) {
      return () => h('h2', {
        class: 'prose-h2-standard text-4xl font-bold mt-16 mb-6 text-neutral-800 dark:text-neutral-100',
        ...props,
      }, slots.default?.())
    },
  }),
  h3: defineComponent({
    name: 'ProseH3Standard',
    setup(props, { slots }) {
      return () => h('h3', {
        class: 'prose-h3-standard text-3xl font-semibold mt-12 mb-4 text-neutral-800 dark:text-neutral-100',
        ...props,
      }, slots.default?.())
    },
  }),
  h4: defineComponent({
    name: 'ProseH4Standard',
    setup(props, { slots }) {
      return () => h('h4', {
        class: 'prose-h4-standard text-2xl font-semibold mt-10 mb-3 text-neutral-700 dark:text-neutral-200',
        ...props,
      }, slots.default?.())
    },
  }),
  h5: defineComponent({
    name: 'ProseH5Standard',
    setup(props, { slots }) {
      return () => h('h5', {
        class: 'prose-h5-standard text-xl font-semibold mt-8 mb-3 text-neutral-700 dark:text-neutral-200',
        ...props,
      }, slots.default?.())
    },
  }),
  h6: defineComponent({
    name: 'ProseH6Standard',
    setup(props, { slots }) {
      return () => h('h6', {
        class: 'prose-h6-standard text-lg font-semibold mt-6 mb-2 text-neutral-600 dark:text-neutral-300',
        ...props,
      }, slots.default?.())
    },
  }),

  // Text elements
  p: defineComponent({
    name: 'ProsePStandard',
    setup(props, { slots }) {
      return () => h('p', {
        class: 'prose-p-standard my-6 text-neutral-700 dark:text-neutral-300 leading-relaxed text-lg',
        ...props,
      }, slots.default?.())
    },
  }),
  strong: defineComponent({
    name: 'ProseStrongStandard',
    setup(props, { slots }) {
      return () => h('strong', {
        class: 'prose-strong-standard font-bold text-neutral-900 dark:text-neutral-100',
        ...props,
      }, slots.default?.())
    },
  }),
  em: defineComponent({
    name: 'ProseEmStandard',
    setup(props, { slots }) {
      return () => h('em', {
        class: 'prose-em-standard italic text-neutral-600 dark:text-neutral-400',
        ...props,
      }, slots.default?.())
    },
  }),
  del: defineComponent({
    name: 'ProseDelStandard',
    setup(props, { slots }) {
      return () => h('del', {
        class: 'prose-del-standard line-through text-neutral-500 dark:text-neutral-500 opacity-75',
        ...props,
      }, slots.default?.())
    },
  }),

  // Links
  a: defineComponent({
    name: 'ProseAStandard',
    setup(props, { slots }) {
      return () => h('a', {
        class: 'prose-a-standard text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline decoration-2 underline-offset-2 transition-colors',
        ...props,
      }, slots.default?.())
    },
  }),

  // Code
  code: defineComponent({
    name: 'ProseCodeStandard',
    setup(props, { slots }) {
      return () => h('code', {
        class: 'prose-code-standard bg-neutral-100 dark:bg-neutral-800 text-pink-600 dark:text-pink-400 px-2 py-1 rounded text-base font-mono',
        ...props,
      }, slots.default?.())
    },
  }),
  pre: ShikiCodeBlock,

  // Lists
  ul: defineComponent({
    name: 'ProseUlStandard',
    setup(props, { slots }) {
      return () => h('ul', {
        class: 'prose-ul-standard list-disc list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg',
        ...props,
      }, slots.default?.())
    },
  }),
  ol: defineComponent({
    name: 'ProseOlStandard',
    setup(props, { slots }) {
      return () => h('ol', {
        class: 'prose-ol-standard list-decimal list-outside ml-6 my-6 text-neutral-700 dark:text-neutral-300 space-y-3 text-lg',
        ...props,
      }, slots.default?.())
    },
  }),
  li: defineComponent({
    name: 'ProseLiStandard',
    setup(props, { slots }) {
      return () => h('li', {
        class: 'prose-li-standard pl-2',
        ...props,
      }, slots.default?.())
    },
  }),

  // Blockquote
  blockquote: defineComponent({
    name: 'ProseBlockquoteStandard',
    setup(props, { slots }) {
      return () => h('blockquote', {
        class: 'prose-blockquote-standard border-l-4 border-blue-400 dark:border-blue-600 pl-6 my-8 text-neutral-600 dark:text-neutral-400 italic text-xl',
        ...props,
      }, slots.default?.())
    },
  }),

  // Table
  table: defineComponent({
    name: 'ProseTableStandard',
    setup(props, { slots }) {
      return () => h('table', {
        class: 'prose-table-standard w-full border-collapse my-8',
        ...props,
      }, slots.default?.())
    },
  }),
  thead: defineComponent({
    name: 'ProseTheadStandard',
    setup(props, { slots }) {
      return () => h('thead', {
        class: 'prose-thead-standard',
        ...props,
      }, slots.default?.())
    },
  }),
  tbody: defineComponent({
    name: 'ProseTbodyStandard',
    setup(props, { slots }) {
      return () => h('tbody', {
        class: 'prose-tbody-standard',
        ...props,
      }, slots.default?.())
    },
  }),
  tr: defineComponent({
    name: 'ProseTrStandard',
    setup(props, { slots }) {
      return () => h('tr', {
        class: 'prose-tr-standard border-b border-neutral-200 dark:border-neutral-800',
        ...props,
      }, slots.default?.())
    },
  }),
  th: defineComponent({
    name: 'ProseThStandard',
    setup(props, { slots }) {
      return () => h('th', {
        class: 'prose-th-standard bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-left font-semibold text-neutral-900 dark:text-white',
        ...props,
      }, slots.default?.())
    },
  }),
  td: defineComponent({
    name: 'ProseTdStandard',
    setup(props, { slots }) {
      return () => h('td', {
        class: 'prose-td-standard border border-neutral-200 dark:border-neutral-800 px-6 py-3 text-neutral-700 dark:text-neutral-300',
        ...props,
      }, slots.default?.())
    },
  }),

  // Other elements
  hr: defineComponent({
    name: 'ProseHrStandard',
    setup(props) {
      return () => h('hr', {
        class: 'prose-hr-standard my-12 border-t border-neutral-300 dark:border-neutral-700',
        ...props,
      })
    },
  }),
  img: defineComponent({
    name: 'ProseImgStandard',
    setup(props) {
      return () => h('img', {
        class: 'prose-img-standard my-8 rounded-xl shadow-lg max-w-full h-auto',
        ...props,
      })
    },
  }),

  // MDC Components
  alert: defineComponent({
    name: 'ProseAlertStandard',
    setup(props: any, { slots }) {
      const typeColors = {
        info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200',
        warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-200',
        error: 'border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200',
        success: 'border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200',
      }
      const colorClass = typeColors[props.type as keyof typeof typeColors] || typeColors.info
      return () => h('div', {
        class: `prose-alert-standard border-l-4 px-6 py-4 my-6 rounded-r-lg ${colorClass}`,
        ...props,
      }, slots.default?.())
    },
  }),
  card: defineComponent({
    name: 'ProseCardStandard',
    setup(props: any, { slots }) {
      return () => h('div', {
        class: 'prose-card-standard border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl p-6 my-8 shadow-md hover:shadow-lg transition-shadow',
        ...props,
      }, [
        props.title && h('h3', { class: 'text-2xl font-bold mb-4 text-neutral-900 dark:text-white' }, props.title),
        h('div', {}, slots.default?.()),
      ])
    },
  }),
}
