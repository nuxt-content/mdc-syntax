<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import { ref } from 'vue'

const activeTab = ref('vue')

const tabs = [
  { id: 'vue', label: 'Vue', icon: 'i-logos-vue' },
  { id: 'react', label: 'React', icon: 'i-logos-react' },
]

const codeSnippets = {
  vue: `\`\`\`vue [src/App.vue]\n<script setup lang="ts">\nimport { MDC } from 'mdc-syntax/vue'\nimport Alert from './components/Alert.vue'\n\nconst md = \`\n# [Hello *World*]{.text-5xl}\n\n::alert{type="info"}\nThis is an alert!\n::\n<` + `/script>

<template>
  <Suspense>
    <MDC :markdown="md" :components="{ Alert }" />
  </Suspense>
</template>\n\`\`\``,
  react: `\`\`\`tsx [src/App.tsx]\nimport { MDC } from 'mdc-syntax/react'

export default function App() {
  const markdown = \`# Hello **World**\`

  return <MDC markdown={markdown} />
}\n\`\`\``,
}
</script>

<template>
  <div class="py-24">
    <UContainer>
      <!-- Section Header -->
      <div class="text-center mb-12">
        <UBadge
          variant="subtle"
          size="lg"
          class="mb-4"
        >
          <template #leading>
            <svg
              class="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </template>
          Get Started in Seconds
        </UBadge>
        <h2 class="text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
          Simple to use, powerful features
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Install with npm and start parsing markdown in seconds
        </p>
      </div>

      <!-- Code Examples -->
      <div class="mx-auto max-w-4xl">
        <!-- Tabs -->
        <div class="flex flex-wrap gap-2 mb-6 justify-center">
          <UButton
            v-for="tab in tabs"
            :key="tab.id"
            :variant="activeTab === tab.id ? 'solid' : 'soft'"
            color="neutral"
            :icon="tab.icon"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </UButton>
        </div>

        <!-- Code Content -->
        <MDC
          v-show="activeTab === 'vue'"
          :markdown="codeSnippets.vue"
          :options="{ highlight: true }"
        />
        <MDC
          v-show="activeTab === 'react'"
          :markdown="codeSnippets.react"
          :options="{ highlight: true }"
        />

        <!-- Feature Highlights -->
        <div class="mt-12 grid gap-6 sm:grid-cols-3">
          <UCard class="text-center">
            <div class="mb-3 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-500/10">
                <svg
                  class="h-6 w-6 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="mb-2 font-semibold text-neutral-900 dark:text-white">
              Zero Config
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Works out of the box with sensible defaults
            </p>
          </UCard>

          <UCard class="text-center">
            <div class="mb-3 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-500/10">
                <svg
                  class="h-6 w-6 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="mb-2 font-semibold text-neutral-900 dark:text-white">
              Type Safe
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Full TypeScript support with type definitions
            </p>
          </UCard>

          <UCard class="text-center">
            <div class="mb-3 flex justify-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                <svg
                  class="h-6 w-6 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                  />
                </svg>
              </div>
            </div>
            <h3 class="mb-2 font-semibold text-neutral-900 dark:text-white">
              Framework Agnostic
            </h3>
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Use with React, Vue, or vanilla JavaScript
            </p>
          </UCard>
        </div>
      </div>
    </UContainer>
  </div>
</template>
