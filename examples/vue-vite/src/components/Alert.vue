<script setup lang="ts">
const props = withDefaults(defineProps<{
  type?: 'info' | 'warning' | 'success' | 'danger'
}>(), {
  type: 'info',
})

const config = {
  info: 'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-950/50 dark:border-blue-500/50 dark:text-blue-200',
  warning: 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-950/50 dark:border-amber-500/50 dark:text-amber-200',
  success: 'bg-emerald-50 border-emerald-400 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500/50 dark:text-emerald-200',
  danger: 'bg-red-50 border-red-400 text-red-900 dark:bg-red-950/50 dark:border-red-500/50 dark:text-red-200',
}
</script>

<template>
  <div
    :class="config[props.type]"
    class="my-4 rounded-lg border-l-4 px-4 py-3 text-sm leading-relaxed"
    role="alert"
  >
    <slot />
  </div>
</template>
