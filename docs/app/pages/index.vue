<script setup lang="ts">
import LandingGetStarted from '~/components/landing/LandingGetStarted.vue'
import LandingTypography from '~/components/landing/LandingTypography.vue'
import LandingGfm from '~/components/landing/LandingGfm.vue'
import LandingCjk from '~/components/landing/LandingCjk.vue'
import LandingCodeBlock from '~/components/landing/LandingCodeBlock.vue'

useHead({
  title: 'MDC Syntax - Streaming Markdown Parser',
  meta: [
    {
      name: 'description',
      content: 'High-performance streaming markdown parser with auto-close support, perfect for AI chat applications and real-time content rendering.',
    },
  ],
})

async function copyToClipboard(text: string) {
  if (typeof window !== 'undefined' && window.navigator?.clipboard) {
    await window.navigator.clipboard.writeText(text)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
    <!-- Hero Section -->
    <div class="relative overflow-hidden">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />

      <div class="relative">
        <!-- Header -->
        <UHeader class="border-b border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur">
          <template #left>
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-purple-600">
                <svg
                  class="h-6 w-6 text-white"
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
              <div>
                <h1 class="text-xl font-bold text-neutral-900 dark:text-white">
                  MDC Syntax
                </h1>
              </div>
            </div>
          </template>

          <template #right>
            <UButton
              to="/stream"
              variant="ghost"
              label="Playground"
              class="hidden lg:flex"
            />
            <UButton
              to="https://github.com/nuxt-content/mdc-syntax"
              target="_blank"
              icon="i-simple-icons-github"
              variant="soft"
              color="neutral"
            >
              GitHub
            </UButton>
          </template>
        </UHeader>

        <!-- Hero Content -->
        <UContainer class="py-24 sm:py-32">
          <div class="text-center">
            <UBadge
              variant="subtle"
              class="mb-6"
            >
              <template #leading>
                <svg
                  class="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                    clip-rule="evenodd"
                  />
                </svg>
              </template>
              5.5x faster than regex-based parsers
            </UBadge>

            <h1 class="mb-6 text-5xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-7xl">
              <span class="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                MDC Syntax
              </span>
            </h1>

            <p class="mx-auto mb-10 max-w-2xl text-lg leading-8 text-neutral-600 dark:text-neutral-400">
              Markdown Rendering for AI era. Perfect for AI chat applications, real-time content rendering, advances markdown based CMSs.
            </p>

            <div class="flex flex-wrap items-center justify-center gap-4">
              <UButton
                to="/stream"
                size="xl"
                icon="i-heroicons-play"
              >
                Try Live Demo
              </UButton>
              <UButton
                to="https://github.com/nuxt-content/mdc-syntax"
                target="_blank"
                variant="soft"
                color="neutral"
                size="xl"
                icon="i-simple-icons-github"
              >
                View on GitHub
              </UButton>
            </div>

            <!-- Stats -->
            <div class="mt-16 grid grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <div class="text-4xl font-bold text-neutral-900 dark:text-white">
                  O(n)
                </div>
                <div class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Linear Time
                </div>
              </div>
              <div>
                <div class="text-4xl font-bold text-neutral-900 dark:text-white">
                  5.5x
                </div>
                <div class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Faster
                </div>
              </div>
              <div>
                <div class="text-4xl font-bold text-neutral-900 dark:text-white">
                  426
                </div>
                <div class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Tests Pass
                </div>
              </div>
              <div>
                <div class="text-4xl font-bold text-neutral-900 dark:text-white">
                  0
                </div>
                <div class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                  Dependencies
                </div>
              </div>
            </div>
          </div>
        </UContainer>
      </div>
    </div>

    <!-- Get Started Section -->
    <div class="relative bg-white dark:bg-neutral-900">
      <LandingGetStarted />
    </div>

    <!-- Features Section -->
    <div class="relative bg-neutral-50 dark:bg-neutral-950">
      <UContainer>
        <!-- Section Header -->
        <div class="py-16 text-center">
          <h2 class="mb-4 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
            Why MDC Syntax?
          </h2>
          <p class="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            See the difference in action. Watch how MDC handles streaming markdown correctly
            while traditional parsers struggle.
          </p>
        </div>

        <!-- Feature Comparisons -->
        <LandingTypography />
        <LandingGfm />
        <LandingCjk />
        <LandingCodeBlock />
      </UContainer>
    </div>

    <!-- Performance Section -->
    <div class="relative bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900">
      <UContainer class="py-24">
        <div class="text-center">
          <h2 class="mb-4 text-3xl font-bold text-neutral-900 dark:text-white sm:text-4xl">
            Built for Performance
          </h2>
          <p class="mx-auto mb-12 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Our O(n) linear-time algorithm outperforms traditional regex-based parsers by 5.5x
          </p>

          <div class="mx-auto max-w-4xl">
            <UCard class="bg-neutral-900 dark:bg-neutral-950">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead>
                    <tr class="border-b border-neutral-800">
                      <th class="py-3 font-medium text-neutral-400">
                        Test Case
                      </th>
                      <th class="py-3 font-medium text-neutral-400">
                        Regex Version
                      </th>
                      <th class="py-3 font-medium text-neutral-400">
                        Linear Version
                      </th>
                      <th class="py-3 font-medium text-neutral-400">
                        Improvement
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-800">
                    <tr>
                      <td class="py-3 text-neutral-300">
                        Simple bold
                      </td>
                      <td class="py-3 font-mono text-neutral-400">
                        1.27M ops/sec
                      </td>
                      <td class="py-3 font-mono text-green-400">
                        3.08M ops/sec
                      </td>
                      <td class="py-3 font-semibold text-green-400">
                        2.4x faster
                      </td>
                    </tr>
                    <tr>
                      <td class="py-3 text-neutral-300">
                        Mixed syntax
                      </td>
                      <td class="py-3 font-mono text-neutral-400">
                        850K ops/sec
                      </td>
                      <td class="py-3 font-mono text-green-400">
                        2.31M ops/sec
                      </td>
                      <td class="py-3 font-semibold text-green-400">
                        2.7x faster
                      </td>
                    </tr>
                    <tr>
                      <td class="py-3 text-neutral-300">
                        Worst case (50 bold pairs)
                      </td>
                      <td class="py-3 font-mono text-neutral-400">
                        100K ops/sec
                      </td>
                      <td class="py-3 font-mono text-green-400">
                        554K ops/sec
                      </td>
                      <td class="py-3 font-semibold text-green-400">
                        5.5x faster
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </UCard>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- CTA Section -->
    <div class="relative">
      <UContainer class="py-24">
        <UCard class="relative overflow-hidden bg-gradient-to-r from-primary-600 to-purple-600 shadow-2xl">
          <div class="relative z-10 text-center px-8 py-16 sm:px-16">
            <h2 class="mb-4 text-3xl font-bold text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p class="mx-auto mb-8 max-w-2xl text-lg text-primary-100">
              Try the live playground or install via npm to start using MDC Syntax in your project
            </p>
            <div class="flex flex-wrap items-center justify-center gap-4">
              <UButton
                to="/stream"
                size="xl"
                color="neutral"
                variant="solid"
                icon="i-heroicons-play"
                class="bg-white text-primary-600 hover:bg-neutral-100"
              >
                Try Playground
              </UButton>
              <UCard class="flex items-center gap-2 bg-white/10 backdrop-blur">
                <code class="text-sm text-white">npm install mdc-syntax</code>
                <UButton
                  variant="ghost"
                  color="neutral"
                  icon="i-heroicons-clipboard-document"
                  size="xs"
                  class="text-white hover:text-primary-200"
                  @click="() => copyToClipboard('npm install mdc-syntax')"
                />
              </UCard>
            </div>
          </div>

          <!-- Background decoration -->
          <div class="absolute inset-0 bg-gradient-to-r from-primary-600/50 to-purple-600/50 opacity-50" />
          <div class="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div class="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </UCard>
      </UContainer>
    </div>

    <!-- Footer -->
    <footer class="border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <UContainer class="py-12">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div class="text-center sm:text-left">
            <p class="text-sm text-neutral-600 dark:text-neutral-400">
              Built with ❤️ by the <ULink
                to="https://nuxt.com"
                target="_blank"
                class="text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >Nuxt</ULink> team
            </p>
          </div>
          <div class="flex gap-4">
            <UButton
              to="https://github.com/nuxt-content/mdc-syntax"
              target="_blank"
              variant="ghost"
              color="neutral"
              icon="i-simple-icons-github"
              aria-label="GitHub"
            />
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<style scoped>
.bg-grid-slate-100 {
  background-image: linear-gradient(to right, rgb(241 245 249 / 0.2) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(241 245 249 / 0.2) 1px, transparent 1px);
  background-size: 4rem 4rem;
}

.dark .bg-grid-slate-700\/25 {
  background-image: linear-gradient(to right, rgb(51 65 85 / 0.25) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(51 65 85 / 0.25) 1px, transparent 1px);
  background-size: 4rem 4rem;
}
</style>
