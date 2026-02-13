<template>
  <UButton
    v-if="$route.path === '/'"
    label="Get Started"
    to="/getting-started/introduction"
    size="sm"
    color="neutral"
    variant="solid"
    trailing-icon="i-lucide-arrow-right"
  />
</template>
