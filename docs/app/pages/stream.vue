<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { MDCRenderer } from 'mdc-syntax/vue'
import { useMDCStream } from '../composables/useMDCStream'
import { stringToStream } from '../composables/stringToStream'
import resolveComponent from '../utils/components-manifest'

definePageMeta({
  footer: false,
})

const { state, startStream, isStreaming, reset: resetStream } = useMDCStream({
  onChunk: (_chunk: string) => {
    scrollToBottom()
  },
  onComplete: (_result: any) => {
    scrollToBottom()
  },
})

const sampleMarkdown = `::landing-hero
#title
Markdown but with Components

#description
Fast, streaming-ready markdown parser with full MDC (Markdown Component) syntax support.

Built for modern applications with TypeScript, Vue 3, React, and real-time streaming capabilities.

#links
  :::u-button
  ---
  color: neutral
  size: xl
  to: /getting-started/introduction
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: simple-icons-github
  size: xl
  to: https://github.com/nuxt-content/mdc-syntax
  variant: outline
  ---
  Star on GitHub
  :::
::

:landing-get-started

::u-page-section
#title
Everything you need for modern content parsing

#features
  :::u-page-feature
  ---
  icon: i-lucide-zap
  to: /api/parse
  ---
  #title
  [Fast]{.text-primary} markdown-it parser

  #description
  Built on markdown-it for blazing fast parsing with full GFM support, tables, and MDC component syntax. Optimized bundle size at just 47 kB.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-activity
  to: /api/parse#stream-parsing
  ---
  #title
  [Real-time streaming]{.text-primary} support

  #description
  Parse content as it arrives with incremental streaming. Perfect for AI-generated content, large files, or progressive loading. Updates your UI in real-time.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-puzzle
  to: /rendering/vue
  ---
  #title
  [Vue component]{.text-primary} integration

  #description
  Embed Vue components directly in markdown with MDC syntax. Use slots, props, and custom components seamlessly. Full TypeScript support included.
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-react
  to: /rendering/react
  ---
  #title
  [React support]{.text-primary} built-in

  #description
  First-class React integration with MDCRenderer component. Dynamic component loading, streaming mode, and full TypeScript support.
  :::

  :::u-page-feature
  ---
  icon: i-lucide-shield-check
  to: /api/auto-close
  ---
  #title
  [Auto-close]{.text-primary} incomplete syntax

  #description
  Automatically handles unclosed markdown and component syntax during streaming. No more broken renders while content is still loading.
  :::

  :::u-page-feature
  ---
  icon: i-simple-icons-typescript
  to: /api/reference
  ---
  #title
  [Full TypeScript]{.text-primary} support

  #description
  Complete type definitions for all APIs, AST nodes, and components. Get autocomplete and type safety throughout your project.
  :::
::

:landing-typography

:landing-gfm

:landing-code-block

:landing-cjk

`

const bytesLength = computed(() => state.value.content.length)
const elementsCount = computed(() => {
  const body = state.value.body as any
  return body?.value?.length ?? 0
})
const outputColumn = ref<HTMLElement | null>(null)
const astColumn = ref<HTMLElement | null>(null)
const selectedParser = ref<'remark' | 'markdown-it'>('markdown-it')

// Stream controller
let streamController: ReturnType<typeof stringToStream> | null = null
const isPaused = ref(false)

function scrollToBottom() {
  nextTick(() => {
    if (outputColumn.value) {
      outputColumn.value.scrollTop = outputColumn.value.scrollHeight
    }
    if (astColumn.value) {
      astColumn.value.scrollTop = astColumn.value.scrollHeight
    }
  })
}

async function simulateStream() {
  resetStream()
  isPaused.value = false

  // Create stream controller with stringToStream
  streamController = stringToStream(sampleMarkdown, 10, 100)

  // Start the stream
  streamController.start()

  await startStream(streamController.stream, selectedParser.value === 'markdown-it')
  scrollToBottom()
}

function togglePause() {
  if (!streamController) return

  if (streamController.isPaused) {
    streamController.resume()
    isPaused.value = false
  }
  else {
    streamController.pause()
    isPaused.value = true
  }
}

function reset() {
  if (streamController) {
    streamController.reset()
    streamController = null
  }

  isPaused.value = false
  resetStream()
}
</script>

<template>
  <div class="h-[calc(100vh-64px)] flex flex-col  overflow-hidden">
    <!-- Compact Header -->
    <div class="flex-shrink-0 bg-gradient-to-r from-primary to-purple-600 p-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-white text-2xl font-bold mb-1">
            MDC Syntax Streaming Demo
          </h1>
          <p class="text-white/90 text-sm">
            Real-time markdown rendering with Vue 3
          </p>
        </div>
        <div class="flex gap-2 items-center">
          <div
            v-if="isStreaming || elementsCount > 0"
            class="text-right mr-4"
          >
            <div class="text-white text-xs opacity-90">
              {{ bytesLength }} bytes · {{ elementsCount }} nodes
            </div>
            <div class="w-48 h-1 bg-white/20 rounded-full overflow-hidden mt-2">
              <div
                class="h-full bg-white transition-all duration-300"
                :style="{ width: state.isComplete ? '100%' : '75%' }"
              />
            </div>
          </div>
          <!-- <USelectMenu
            v-model="selectedParser"
            :items="[
              { value: 'remark', label: 'Remark' },
              { value: 'markdown-it', label: 'Markdown-it' },
            ]"
            value-key="value"
            option-key="label"
            :disabled="isStreaming"
            size="sm"
            class="w-32"
          /> -->
          <UButton
            :disabled="isStreaming"
            size="sm"
            :loading="isStreaming"
            @click="simulateStream"
          >
            {{ isStreaming ? 'Streaming...' : 'Start' }}
          </UButton>
          <UButton
            v-if="isStreaming"
            :color="isPaused ? 'primary' : 'neutral'"
            variant="solid"
            size="sm"
            @click="togglePause"
          >
            {{ isPaused ? 'Resume' : 'Pause' }}
          </UButton>
          <UButton
            :disabled="isStreaming && !isPaused"
            color="neutral"
            variant="solid"
            size="sm"
            @click="reset"
          >
            Reset
          </UButton>
        </div>
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="flex-1 grid grid-cols-3 overflow-hidden">
      <!-- Rendered Output Column -->
      <div class="flex flex-col overflow-hidden bg-white dark:bg-neutral-950 col-span-2">
        <div class="flex justify-between items-center px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <div class="flex items-center gap-2">
            <h3 class="text-neutral-800 dark:text-neutral-200 font-semibold">
              Rendered Output
            </h3>
            <UBadge
              color="neutral"
              variant="soft"
              size="xs"
            >
              {{ selectedParser }}
            </UBadge>
          </div>
          <UBadge
            v-if="isStreaming && isPaused"
            color="yellow"
            variant="soft"
          >
            Paused
          </UBadge>
          <UBadge
            v-else-if="isStreaming"
            color="primary"
            variant="soft"
          >
            Live
          </UBadge>
        </div>
        <div
          ref="outputColumn"
          class="flex-1 overflow-y-auto relative scroll-smooth"
        >
          <MDCRenderer
            v-if="elementsCount > 0"
            :body="state.body as any"
            :components-manifest="resolveComponent"
          />
          <div
            v-else
            class="text-center text-neutral-500 dark:text-neutral-600 py-12"
          >
            Click "Start" to see the renderer in action
          </div>
        </div>
      </div>

      <!-- Markdown Column -->
      <div class="flex flex-col overflow-hidden bg-white dark:bg-neutral-950 border-l border-neutral-200 dark:border-neutral-800">
        <div class="flex justify-between items-center px-4 py-3 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
          <h3 class="text-neutral-800 dark:text-neutral-200 font-semibold">
            Markdown
          </h3>
          <UBadge
            color="neutral"
            variant="soft"
          >
            {{ state.content.length }} bytes
          </UBadge>
        </div>
        <div
          ref="astColumn"
          class="flex-1 overflow-y-auto p-4 scroll-smooth"
        >
          <pre
            v-if="elementsCount > 0"
            class="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed"
          >{{ state.content }}</pre>
          <div
            v-else
            class="text-center text-neutral-500 dark:text-neutral-600 py-12"
          >
            Markdown will appear here
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar styles */
:deep(.overflow-y-auto::-webkit-scrollbar) {
  width: 8px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-track) {
  background: rgb(229 231 235);
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: rgb(156 163 175);
  border-radius: 4px;
}

:deep(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  background: rgb(107 114 128);
}

.dark :deep(.overflow-y-auto::-webkit-scrollbar-track) {
  background: rgb(30 41 59);
}

.dark :deep(.overflow-y-auto::-webkit-scrollbar-thumb) {
  background: rgb(71 85 105);
}

.dark :deep(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
  background: rgb(100 116 139);
}
</style>
