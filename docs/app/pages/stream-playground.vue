<script setup lang="ts">
import { parseStreamIncremental } from 'mdc-syntax/stream'
import { computed, ref } from 'vue'

// Define page meta
definePageMeta({
  title: 'Stream Playground',
  description: 'Interactive demo of MDC streaming parser',
})

// Preset content
const presets = [
  {
    label: 'Simple Markdown',
    value: 'simple',
    content: `# Hello World

This is a **simple** example with *italic* text.

## Features

- Bullet points
- Multiple items
- Nested lists`,
  },
  {
    label: 'MDC Components',
    value: 'components',
    content: `# MDC Components Demo

::alert{type="info"}
This is an **info** alert with markdown inside!
::

::alert{type="warning"}
⚠️ Warning: This is a warning message.
::

## Code Block

\`\`\`typescript
import { parse } from 'mdc-syntax'
const result = parse('# Hello')
\`\`\`

Regular paragraph text here.`,
  },
  {
    label: 'Complex Content',
    value: 'complex',
    content: `---
title: Complex Content Example
author: MDC Syntax
---

# Complex Content Example

This demonstrates **streaming** with *various* features.

## Table Example

| Feature | Status | Notes |
|---------|--------|-------|
| Streaming | ✅ | Real-time parsing |
| Auto-close | ✅ | Handles incomplete syntax |
| Vue Support | ✅ | Full integration |

## Code with Syntax

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`)
}
greet('World')
\`\`\`

And some more content to make it interesting!`,
  },
  {
    label: 'AI Chat Simulation',
    value: 'chat',
    content: `# AI Assistant Response

Let me help you understand **MDC Syntax**:

## What is MDC?

MDC (Markdown Components) combines:
- Standard markdown syntax
- Vue-like component syntax
- Real-time streaming support

## Example Usage

::alert{type="success"}
✨ You can embed components directly in markdown!
::

Here's a code example:

\`\`\`typescript
import { parseStreamIncremental } from 'mdc-syntax/stream'

for await (const result of parseStreamIncremental(stream)) {
  console.log('Chunk received:', result.body)
}
\`\`\`

This makes it perfect for AI-generated content that arrives progressively.`,
  },
]

// State
const selectedPresetValue = ref('simple')
const markdownContent = ref(presets[0].content)
const chunkSize = ref(20)
const streamDelay = ref(100)
const showAst = ref(false)
const isStreaming = ref(false)

// Stream state
const streamState = ref({
  body: { type: 'root', children: [] },
  isComplete: false,
})

// Statistics
const stats = ref({
  chunks: 0,
  bytes: 0,
  elements: 0,
  duration: 0,
})

const startTime = ref(0)

// Progress
const progress = computed(() => {
  if (!markdownContent.value)
    return 0
  return Math.min((stats.value.bytes / markdownContent.value.length) * 100, 100)
})

function countElements(node: any): number {
  if (!node || !node.children)
    return 0
  return node.children.reduce((count: number, child: any) => {
    return count + 1 + countElements(child)
  }, 0)
}

// Streaming functions
async function startStreaming() {
  if (!markdownContent.value)
    return

  resetStream()
  isStreaming.value = true
  startTime.value = Date.now()

  // Create a readable stream that simulates chunked data
  const encoder = new TextEncoder()
  const content = markdownContent.value
  let position = 0

  const stream = new ReadableStream({
    async pull(controller) {
      if (position >= content.length) {
        controller.close()
        return
      }

      // Get next chunk
      const chunk = content.slice(position, position + chunkSize.value)
      position += chunkSize.value

      // Encode and enqueue
      controller.enqueue(encoder.encode(chunk))

      // Simulate network delay
      if (streamDelay.value > 0) {
        await new Promise(resolve => setTimeout(resolve, streamDelay.value))
      }
    },
  })

  try {
    for await (const result of parseStreamIncremental(stream)) {
      streamState.value = {
        body: result.body,
        isComplete: result.isComplete,
      }

      if (!result.isComplete) {
        stats.value.chunks++
        stats.value.bytes += result.chunk.length
      }
      else {
        stats.value.duration = Date.now() - startTime.value
      }

      stats.value.elements = countElements(result.body)
    }
  }
  catch (error) {
    console.error('Streaming error:', error)
  }
  finally {
    isStreaming.value = false
  }
}

function resetStream() {
  streamState.value = {
    body: { type: 'root', children: [] },
    isComplete: false,
  }
  stats.value = {
    chunks: 0,
    bytes: 0,
    elements: 0,
    duration: 0,
  }
  isStreaming.value = false
}

function loadSelectedPreset() {
  const preset = presets.find(p => p.value === selectedPresetValue.value)
  if (preset) {
    markdownContent.value = preset.content
    resetStream()
  }
}

async function copyMarkdown() {
  try {
    await navigator.clipboard.writeText(markdownContent.value)
  }
  catch (error) {
    console.error('Failed to copy to clipboard', error)
  }
}
</script>

<template>
  <UContainer>
    <UPage>
      <UPageBody class="space-y-3 pt-6">
        <!-- Compact Controls and Stats in One Row -->
        <div class="border rounded-lg p-3 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div class="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4">
            <!-- Left: Controls -->
            <div class="space-y-2">
              <div class="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                <label class="text-xs font-medium">Preset:</label>
                <select
                  v-model="selectedPresetValue"
                  class="px-2 py-1 text-xs border rounded bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600"
                  @change="loadSelectedPreset"
                >
                  <option
                    v-for="preset in presets"
                    :key="preset.value"
                    :value="preset.value"
                  >
                    {{ preset.label }}
                  </option>
                </select>
                <div class="flex gap-1">
                  <button
                    class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    :disabled="isStreaming || !markdownContent"
                    @click="startStreaming"
                  >
                    ▶ Start
                  </button>
                  <button
                    class="px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded hover:bg-neutral-50 dark:hover:bg-neutral-800 disabled:opacity-50 transition bg-white dark:bg-neutral-900"
                    :disabled="!isStreaming && !streamState.isComplete"
                    title="Reset"
                    @click="resetStream"
                  >
                    ↻
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-xs">Chunk:</label>
                  <input
                    v-model.number="chunkSize"
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    class="flex-1 h-1"
                    :disabled="isStreaming"
                  >
                  <span class="text-xs text-neutral-600 dark:text-neutral-400 w-10 text-right">{{ chunkSize }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs">Delay:</label>
                  <input
                    v-model.number="streamDelay"
                    type="range"
                    min="0"
                    max="500"
                    step="50"
                    class="flex-1 h-1"
                    :disabled="isStreaming"
                  >
                  <span class="text-xs text-neutral-600 dark:text-neutral-400 w-10 text-right">{{ streamDelay }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Stats -->
            <div class="flex items-center gap-3 lg:border-l lg:pl-4 dark:border-neutral-700">
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {{ stats.chunks }}
                </div>
                <div class="text-[9px] text-neutral-600 dark:text-neutral-400">
                  Chunks
                </div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {{ stats.bytes }}
                </div>
                <div class="text-[9px] text-neutral-600 dark:text-neutral-400">
                  Bytes
                </div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {{ stats.elements }}
                </div>
                <div class="text-[9px] text-neutral-600 dark:text-neutral-400">
                  Elements
                </div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {{ stats.duration }}
                </div>
                <div class="text-[9px] text-neutral-600 dark:text-neutral-400">
                  ms
                </div>
              </div>
              <span
                v-if="isStreaming"
                class="px-2 py-0.5 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full whitespace-nowrap"
              >
                Streaming
              </span>
              <span
                v-else-if="streamState.isComplete"
                class="px-2 py-0.5 text-[10px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full whitespace-nowrap"
              >
                Complete
              </span>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-1 overflow-hidden mt-2">
            <div
              class="bg-blue-600 h-full transition-all duration-300"
              :style="{ width: `${progress}%` }"
            />
          </div>
        </div>

        <!-- Two Column Layout - Compact Heights -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <!-- Source Markdown -->
          <div class="border rounded-lg dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div class="flex items-center justify-between px-3 py-2 border-b dark:border-neutral-700">
              <h3 class="text-sm font-semibold">
                Source Markdown
              </h3>
              <button
                class="px-2 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                title="Copy markdown"
                @click="copyMarkdown"
              >
                📋
              </button>
            </div>

            <div class="p-2">
              <textarea
                v-model="markdownContent"
                class="w-full h-[calc(100vh-380px)] min-h-[300px] p-3 font-mono text-xs border rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 resize-none"
                placeholder="Enter your markdown here..."
                :disabled="isStreaming"
              />
            </div>
          </div>

          <!-- Rendered Output -->
          <div class="border rounded-lg dark:border-neutral-700 bg-white dark:bg-neutral-900">
            <div class="flex items-center justify-between px-3 py-2 border-b dark:border-neutral-700">
              <h3 class="text-sm font-semibold">
                Rendered Output
              </h3>
              <button
                class="px-2 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition"
                :title="showAst ? 'Show rendered' : 'Show AST'"
                @click="showAst = !showAst"
              >
                {{ showAst ? '👁' : '&lt;/&gt;' }}
              </button>
            </div>

            <div class="h-[calc(100vh-380px)] min-h-[300px] overflow-auto p-3">
              <!-- AST View -->
              <div
                v-if="showAst"
                class="font-mono text-[10px]"
              >
                <pre class="whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">{{ JSON.stringify(streamState.body, null, 2) }}</pre>
              </div>

              <!-- Rendered View -->
              <div
                v-else
                class="text-sm"
              >
                <ContentRenderer
                  v-if="streamState.body && streamState.body.value && streamState.body.value.length > 0"
                  :value="{ body: streamState.body }"
                  class="prose prose-sm dark:prose-invert max-w-none"
                />
                <div
                  v-else
                  class="text-neutral-400 text-center py-12 text-xs"
                >
                  No content yet. Click "Start" to begin streaming.
                </div>

                <!-- Streaming Cursor -->
                <span
                  v-if="isStreaming"
                  class="inline-block w-1.5 h-3.5 bg-blue-600 ml-0.5"
                  style="animation: blink 1s infinite"
                />
              </div>
            </div>
          </div>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>

<style scoped>
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

/* Compact scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.5);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background: rgba(75, 85, 99, 0.5);
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: rgba(75, 85, 99, 0.7);
}
</style>
