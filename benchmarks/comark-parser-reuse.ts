import { barplot, bench, group, run } from 'mitata'
import { createMarkdownParser, getMarkdownParser } from '../packages/comark/src/parse.ts'

// Shaped after a component documentation page: many short documents, each one a
// prop or slot description, rendered by its own component instance.
const DOCUMENTS = Array.from(
  { length: 176 },
  (_, i) => `Some **description** with \`code\` and a [link](https://example.dev) #${i}`
)

async function parseAll(parse: (markdown: string) => Promise<unknown>) {
  for (const document of DOCUMENTS) await parse(document)
}

barplot(() => {
  group('176 short documents', () => {
    bench('parser per document', async () => {
      for (const document of DOCUMENTS) await createMarkdownParser()(document)
    })

    bench('shared parser', async () => {
      await parseAll(getMarkdownParser())
    })

    bench('shared parser, cached', async () => {
      await parseAll(getMarkdownParser({ cache: true }))
    })
  })
})

await run()
