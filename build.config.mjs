import { defineBuildConfig } from 'obuild/config'

export default defineBuildConfig({
  entries: [
    {
      type: 'bundle',
      input: ['./src/index.ts'],
    },
    {
      type: 'bundle',
      input: ['./src/stream.ts'],
    },
    {
      type: 'transform',
      input: './src/vue',
      outDir: './dist/vue',
    },
  ],
})
