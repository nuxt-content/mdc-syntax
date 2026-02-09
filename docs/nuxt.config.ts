import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  extends: ['docus'],
  css: ['~/assets/styles/main.css'],
  // @ts-expect-error - Nuxt Content types are not loaded
  content: {
    experimental: {
      sqliteConnector: 'native',
    },
  },
})
