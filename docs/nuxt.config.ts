import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  // @ts-expect-error - Nuxt Content types are not loaded
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
})
