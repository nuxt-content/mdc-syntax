import { pascalCase } from 'scule'

// Define component imports for the docs app
const components = {
  // Landing components
  LandingHero: () => import('@/components/landing/LandingHero.vue'),
  LandingGetStarted: () => import('@/components/landing/LandingGetStarted.vue'),
  LandingTypography: () => import('@/components/landing/LandingTypography.vue'),
  LandingCodeBlock: () => import('@/components/landing/LandingCodeBlock.vue'),
  LandingCjk: () => import('@/components/landing/LandingCjk.vue'),
  LandingGfm: () => import('@/components/landing/LandingGfm.vue'),
  LandingCompareGrid: () => import('@/components/LandingCompareGrid.vue'),

  // Streaming components
  MDCStream: () => import('@/components/MDCStream.vue'),
  MarkdownItStream: () => import('@/components/MarkdownItStream.vue'),
}

export default async function resolveComponent(name: string) {
  // Try the name as-is first
  let componentKey = name as keyof typeof components

  // If not found, try converting kebab-case to PascalCase
  if (!components[componentKey]) {
    componentKey = pascalCase(name) as keyof typeof components
  }

  const loader = components[componentKey]
  if (!loader) {
    // Return a fallback component instead of throwing
    console.warn(`Component "${name}" not found in manifest, using fallback`)
    // @ts-expect-error - TODO: fix this
    return await import('#content/components').then(m => m[pascalCase(name)]())
  }

  return loader()
}
