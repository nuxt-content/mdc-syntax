<template>
  <div
    ref="sectionRef"
    class="py-16 border-b border-neutral-200 dark:border-neutral-800 last:border-b-0"
  >
    <!-- Section Header -->
    <div class="text-center mb-12">
      <UBadge
        variant="subtle"
        size="lg"
        class="mb-4"
      >
        {{ title }}
      </UBadge>
      <p class="text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
        {{ description }}
      </p>
    </div>

    <!-- Comparison Grid -->
    <div class="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
      <!-- Markdown-it (Left) -->
      <div class="relative group">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Markdown-it</span>
            <svg
              class="h-4 w-4 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>
        <UCard class="bg-neutral-900 dark:bg-neutral-950 border border-neutral-700 dark:border-neutral-800 h-[400px] overflow-auto transition-all duration-300 hover:border-neutral-600 dark:hover:border-neutral-700 hover:shadow-lg">
          <MarkdownItStream
            ref="markdownItRef"
            :markdown="markdown"
          />
        </UCard>
        <!-- Decorative element -->
        <div class="absolute -inset-0.5 bg-red-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300 -z-10" />
      </div>

      <!-- MDC Syntax (Right) -->
      <div class="relative group">
        <div class="mb-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">MDC Syntax</span>
            <svg
              class="h-4 w-4 text-primary-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
        </div>
        <UCard class="bg-neutral-900 dark:bg-neutral-950 border border-primary-500/30 dark:border-primary-500/30 h-[400px] overflow-auto transition-all duration-300 hover:border-primary-500/50 dark:hover:border-primary-500/50 hover:shadow-xl hover:shadow-primary-500/10">
          <MDCStream
            ref="mdcRef"
            :markdown="markdown"
          />
        </UCard>
        <!-- Decorative element -->
        <div class="absolute -inset-0.5 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300 -z-10" />
      </div>
    </div>

    <!-- Reset Button -->
    <div class="text-center mt-8 relative z-10">
      <UButton
        variant="soft"
        color="neutral"
        size="md"
        icon="i-heroicons-arrow-path"
        class="shadow-lg"
        :disabled="!hasPlayed"
        @click="handleReset"
      >
        Replay Animation
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import MarkdownItStream from './MarkdownItStream.vue'
import MDCStream from './MDCStream.vue'

defineProps<{
  title: string
  description: string
  markdown: string
}>()

const markdownItRef = ref<InstanceType<typeof MarkdownItStream> | null>(null)
const mdcRef = ref<InstanceType<typeof MarkdownItStream> | null>(null)
const sectionRef = ref<HTMLDivElement | null>(null)
const hasPlayed = ref(false)

let observer: IntersectionObserver | null = null

function startStreams() {
  markdownItRef.value?.startStream()
  mdcRef.value?.startStream()
}

function handleReset() {
  markdownItRef.value?.reset()
  mdcRef.value?.reset()
  // Restart the streams after a short delay
  setTimeout(startStreams, 100)
}

// Setup intersection observer to auto-play when section comes into view
onMounted(() => {
  if (!sectionRef.value)
    return

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // Start streaming when section is 30% visible and hasn't played yet
        if (entry.isIntersecting && entry.intersectionRatio > 0.3 && !hasPlayed.value) {
          hasPlayed.value = true
          startStreams()
        }
      })
    },
    {
      threshold: [0.3], // Trigger when 30% of the section is visible
      rootMargin: '0px',
    },
  )

  observer.observe(sectionRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>
