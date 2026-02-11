import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: ['./src/index.ts', './src/stream.ts'],
    },
    {
      type: 'transform',
      input: './src/vue',
      outDir: './dist/vue',
    },
    {
      type: 'transform',
      input: './src/utils',
      outDir: './dist/utils',
    },
    {
      type: 'bundle',
      input: [
        './src/react/index.ts',
        './src/react/components/MDC.tsx',
        './src/react/components/MDCRenderer.tsx',
        './src/react/components/index.tsx',
        './src/react/components/stream.tsx',
        './src/react/components/prose/ProsePre.tsx',
        './src/react/components/prose/ProsePreShiki.tsx',
      ],
      outDir: './dist',
    },
  ],
})
