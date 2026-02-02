<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import { ref } from 'vue'

const props = defineProps<{
  markdown: string
  chunkSize?: number
  delayMs?: number
}>()

const accumulated = ref('')
const isStreaming = ref(false)
const controller = ref<AbortController | null>(null)

async function startStream() {
  if (isStreaming.value) return

  accumulated.value = ''
  isStreaming.value = true
  controller.value = new AbortController()

  const chunkSize = props.chunkSize ?? 10
  const delayMs = props.delayMs ?? 50

  for (let i = 0; i < props.markdown.length; i += chunkSize) {
    if (controller.value.signal.aborted) break

    const chunk = props.markdown.slice(i, i + chunkSize)
    accumulated.value += chunk

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
    <MDC
      v-if="markdown"
      class="prose prose-invert max-w-none"
      :markdown="accumulated"
      :options="{
        highlight: {
          themes: {
            light: 'github-light',
            dark: 'github-dark',
          },
        },
      }"
      stream
    />
  </div>
</template>
