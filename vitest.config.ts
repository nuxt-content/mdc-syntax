import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import type { PluginOption } from 'vite'

export default defineConfig({
  plugins: [
    vue() as PluginOption,
  ],
  test: {
    environment: 'node',
    globals: false,
  },
})
