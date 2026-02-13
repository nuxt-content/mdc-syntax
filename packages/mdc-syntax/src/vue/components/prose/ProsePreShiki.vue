<script setup lang="ts">
import { ShikiCachedRenderer } from 'shiki-stream/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { textContent } from 'minimark'
import { getHighlighter } from '../../../utils/shiki-highlighter'

const props = withDefaults(defineProps<{
  // @eslint-disable-next-line vue/prop-name-casing
  __node: any
  language?: string
  theme?: string
  filename?: string
  containerClass?: string
  fallbackClass?: string
  fallbackWithHeaderClass?: string
  shikiStyle?: Record<string, string>
}>(), {
  theme: 'material-theme-palenight',
  containerClass: 'my-4',
  fallbackClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 rounded-lg overflow-x-auto border border-neutral-300 dark:border-neutral-700',
  fallbackWithHeaderClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 pt-12 rounded-lg overflow-x-auto m-0 border border-neutral-300 dark:border-neutral-700',
  shikiStyle: () => ({
    '--shiki-margin': '0',
    '--shiki-padding': '1rem',
    '--shiki-padding-top': '3rem',
    '--shiki-border-radius': '0.5rem',
    '--shiki-border': '1px solid rgb(55, 65, 81)',
  }),
})

const highlighter = ref<any>(null)
const isLoading = ref(true)
const componentKey = ref(0)
const copied = ref(false)
const codeContent = ref('')

// Extract code content and language from node
const extractCodeFromNode = () => {
  const node = props.__node
  if (!node) {
    codeContent.value = ''
    return
  }

  codeContent.value = textContent(node)
}

// Initialize code extraction
extractCodeFromNode()

// Create a stable key for ShikiCachedRenderer remounting
const rendererKey = computed(() => {
  return `${componentKey.value}-${codeContent.value.slice(0, 20)}-${props.language}-${props.theme}`
})

// Watch for code changes and force remount
watch(() => props.__node, () => {
  extractCodeFromNode()
  componentKey.value++
})

// Copy to clipboard functionality
async function copyCode() {
  try {
    const nav = navigator as Navigator & { clipboard?: { writeText: (text: string) => Promise<void> } }
    if (nav.clipboard?.writeText) {
      await nav.clipboard.writeText(codeContent.value)
      copied.value = true
      setTimeout(() => {
        copied.value = false
      }, 2000)
    }
  }
  catch (error) {
    console.error('Failed to copy code:', error)
  }
}

// Load highlighter on mount
onMounted(() => {
  getHighlighter({
    themes: { light: 'material-theme-palenight', dark: 'material-theme-lighter' },
    languages: ['javascript', 'typescript', 'vue', 'html', 'css', 'json', 'markdown', 'bash', 'jsx', 'tsx', 'shell'],
  })
    .then((hl) => {
      highlighter.value = hl
      isLoading.value = false
    })
    .catch((error) => {
      console.error('Failed to create highlighter:', error)
      isLoading.value = false
    })
})
</script>

<template>
  <div
    :class="`relative ${containerClass} group`"
  >
    <!-- Header with language label and copy button -->
    <div class="absolute top-0 right-0 left-0 flex items-center justify-between px-4 py-2 z-10">
      <!-- Language label -->
      <span
        class="font-mono text-sm font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800/80 px-2.5 py-1 rounded backdrop-blur-sm"
      >
        {{ filename || language }}
      </span>

      <!-- Copy button -->
      <button
        type="button"
        class="ml-auto px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 bg-neutral-300/80 dark:bg-neutral-700/80 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        @click="copyCode"
      >
        <span
          v-if="copied"
          class="flex items-center gap-1.5"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
          Copied!
        </span>
        <span
          v-else
          class="flex items-center gap-1.5"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </span>
      </button>
    </div>

    <!-- Loading state -->
    <pre
      v-if="isLoading"
      class="bg-neutral-100 dark:bg-neutral-800 rounded-lg pt-12 p-4 border border-neutral-300 dark:border-neutral-700"
    ><code>{{ codeContent }}</code></pre>

    <!-- Shiki renderer -->
    <ShikiCachedRenderer
      v-else-if="highlighter"
      :key="rendererKey"
      :highlighter="highlighter"
      :code="codeContent"
      :lang="language || 'text'"
      :theme="theme || 'material-theme-palenight'"
      class="shiki-container bg-neutral-100 dark:bg-neutral-800 rounded-l overflow-x-auto pt-12 p-4 border border-neutral-300 dark:border-neutral-700"
      :style="shikiStyle"
    />

    <!-- Fallback with header padding -->
    <pre
      v-else
      :class="fallbackWithHeaderClass"
    >
    sas
      <code class="font-mono text-sm leading-tight block whitespace-pre">{{ codeContent }}</code>
    </pre>
  </div>
</template>

<style scoped>
html.dark .shiki-container:not(.shiki-stream) :deep(span) {
  color: var(--shiki-dark) !important;
  background-color: var(--shiki-dark-bg) !important;
  font-style: var(--shiki-dark-font-style) !important;
  font-weight: var(--shiki-dark-font-weight) !important;
  text-decoration: var(--shiki-dark-text-decoration) !important;
}
</style>
