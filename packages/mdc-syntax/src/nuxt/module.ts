import { defineNuxtModule, createResolver, addComponent, hasNuxtModule } from '@nuxt/kit'
import type { Nuxt } from 'nuxt/schema'
import fs from 'node:fs/promises'

// Module options TypeScript interface definition
export interface MDCModuleOptions {}

export default defineNuxtModule<MDCModuleOptions>({
  meta: {
    name: 'mdc-syntax',
    configKey: 'mdc',
  },
  // Default configuration options of the Nuxt module
  defaults: {},
  async setup(_options, nuxt) {
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

    // Register user global components
    const _layers = [...nuxt.options._layers].reverse()
    for (const layer of _layers) {
      const srcDir = layer.config.srcDir
      const globalComponents = resolver.resolve(srcDir, 'components/mdc')
      const dirStat = await fs.stat(globalComponents).catch(() => null)
      if (dirStat && dirStat.isDirectory()) {
        nuxt.hook('components:dirs', (dirs: any[]) => {
          dirs.unshift({
            path: globalComponents,
            global: true,
            pathPrefix: false,
            prefix: '',
          })
        })
      }
    }
  },
})

function setupNuxtUI(nuxt: Nuxt) {
  // @ts-expect-error - Nuxt UI options are not typed
  nuxt.options.ui = nuxt.options.ui || {}
  // @ts-expect-error - Nuxt UI options are not typed
  nuxt.options.ui.content = true
}
