<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  markdown: string
  chunkSize?: number
  delayMs?: number
}>()

const html = ref('')
const isStreaming = ref(false)
const controller = ref<AbortController | null>(null)

async function startStream() {
  if (isStreaming.value) return

  isStreaming.value = true
  html.value = ''
  controller.value = new AbortController()

  const markdownIt = new MarkdownIt()
  let accumulated = ''

  const chunkSize = props.chunkSize ?? 10
  const delayMs = props.delayMs ?? 50

  for (let i = 0; i < props.markdown.length; i += chunkSize) {
    if (controller.value.signal.aborted) break

    const chunk = props.markdown.slice(i, i + chunkSize)
    accumulated += chunk

    html.value = markdownIt.render(accumulated)

    if (i + chunkSize < props.markdown.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  isStreaming.value = false
}

function reset() {
  if (controller.value) {
    controller.value.abort()
  }
  html.value = ''
  isStreaming.value = false
  controller.value = null
}

// Expose methods to parent
defineExpose({
  startStream,
  reset,
  isStreaming,
})
</script>

<template>
  <div>
    <div
      class="prose prose-invert max-w-none"
      v-html="html"
    />
  </div>
</template>
