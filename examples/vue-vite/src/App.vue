<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import Alert from './components/Alert.vue'

const markdown = `
# Hello *World*

::alert{type="info"}
This is an alert!
::
`
</script>

<template>
  <Suspense>
    <MDC
      :markdown="markdown"
      :components="{ Alert }"
    />
  </Suspense>
</template>
