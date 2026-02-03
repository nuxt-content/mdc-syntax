<script setup lang="ts">
import { ref, watch } from 'vue'
import { textContent } from 'minimark'

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
  theme: 'github-dark',
  containerClass: 'my-4',
  fallbackClass: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 p-4 rounded-lg overflow-x-auto border border-neutral-300 dark:border-neutral-700',
})

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
</script>

<template>
  <div :class="`relative ${containerClass} group rounded-lg`">
    <!-- Header with language label and copy button -->
    <div class="rounded-t-lg border border-b-0 border-neutral-300 dark:border-neutral-700 top-[-1.5rem] right-0 left-0 flex items-center justify-between px-4 py-2 z-10">
      <!-- Language label -->
      <span
        class="font-mono font-semibold tracking-wider text-neutral-600 dark:text-neutral-400 bg-neutral-200/80 dark:bg-neutral-800/80 px-2.5 py-1 rounded backdrop-blur-sm"
      >
        {{ filename || language }}
      </span>

      <!-- Copy button -->
      <button
        type="button"
        class="ml-auto px-3 py-1.5 text-xs font-medium rounded transition-all duration-200 bg-neutral-300/80 dark:bg-neutral-700/80 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

    <!-- Shiki renderer -->
    <pre class="shiki-container bg-neutral-100 dark:bg-neutral-800 rounded-b-lg pt-16 p-4 border border-neutral-300 dark:border-neutral-700"><slot /></pre>
  </div>
</template>
