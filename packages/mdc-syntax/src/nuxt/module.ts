import { defineNuxtModule, addPlugin, createResolver, addComponent, addTemplate, hasNuxtModule } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'

// Module options TypeScript interface definition
export interface MDCModuleOptions {}

export default defineNuxtModule<MDCModuleOptions>({
  meta: {
    name: 'mdc-syntax',
    configKey: 'mdc',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    addComponent({
      name: 'MDC',
      export: 'MDC',
      filePath: resolver.resolve('../vue/components/MDC'),
      priority: 1,
    })
    addComponent({
      name: 'MDCRenderer',
      export: 'MDCRenderer',
      filePath: resolver.resolve('../vue/components/MDCRenderer'),
      priority: 1,
    })

    if (hasNuxtModule('@nuxt/ui')) {
      setupNuxtUI(nuxt)
    }
  },
})

function setupNuxtUI(nuxt: Nuxt) {
  // @ts-expect-error - Nuxt UI options are not typed
  nuxt.options.ui = nuxt.options.ui || {}
  // @ts-expect-error - Nuxt UI options are not typed
  nuxt.options.ui.content = true

  const globals = {
    p: '@nuxt/ui/components/prose/P.vue',
    h2: '@nuxt/ui/components/prose/H2.vue',
    strong: '@nuxt/ui/components/prose/Strong.vue',
    a: '@nuxt/ui/components/prose/A.vue',
  }
  const lazy = {
    h3: '@nuxt/ui/components/prose/H3.vue',
    h4: '@nuxt/ui/components/prose/H4.vue',
    em: '@nuxt/ui/components/prose/Em.vue',
    code: '@nuxt/ui/components/prose/Code.vue',
    // pre: '@nuxt/ui/components/prose/Pre.vue',
    ul: '@nuxt/ui/components/prose/Ul.vue',
    ol: '@nuxt/ui/components/prose/Ol.vue',
    li: '@nuxt/ui/components/prose/Li.vue',
    blockquote: '@nuxt/ui/components/prose/Blockquote.vue',
    table: '@nuxt/ui/components/prose/Table.vue',
    thead: '@nuxt/ui/components/prose/Thead.vue',
    tbody: '@nuxt/ui/components/prose/Tbody.vue',
    tr: '@nuxt/ui/components/prose/Tr.vue',
    th: '@nuxt/ui/components/prose/Th.vue',
    td: '@nuxt/ui/components/prose/Td.vue',
    hr: '@nuxt/ui/components/prose/Hr.vue',
    img: '@nuxt/ui/components/prose/Img.vue',
  }
  const templatePath = addTemplate({
    filename: 'mdc-syntax-nuxt-plugin.mjs',
    getContents: () => nuxtUIPluginTemplate({ globals, lazy }),
    write: true,
  }).dst
  addPlugin(templatePath)
}

function nuxtUIPluginTemplate({ globals, lazy }: { globals: Record<string, string>, lazy: Record<string, string> }) {
  return `
import { defineNuxtPlugin } from 'nuxt/app'
${Object.entries(globals).map(([key, value]) => `import ${key} from '${value}'`).join('\n')}

const components = {
  ${Object.entries(lazy).map(([key, value]) => `${key}: () => import('${value}').then(m => m.default)`).join(',\n')}
}

export default defineNuxtPlugin((nuxtApp) => {

  nuxtApp.vueApp.provide('mdc', {
    components: {
      // disable all lazy components by default
      ...Object.fromEntries(Object.entries(components).map(([key, value]) => [key, undefined])),
      ${Object.keys(globals).join(',')}
    },
    componentManifest: (name) => {
      if (components[name]) {
        return components[name]()
      }
      return null
    }
  })
})
  `
}
