# Vue Rendering Guide

Complete guide for rendering MDC/Minimark AST in Vue 3 applications.

## Table of Contents

- [Basic Usage](#basic-usage)
- [Custom Components](#custom-components)
- [Dynamic Component Resolution](#dynamic-component-resolution)
- [Slots Support](#slots-support)
- [Streaming Mode](#streaming-mode)
- [High-Level MDC Component](#high-level-mdc-component)
- [Prose Components](#prose-components)
- [Error Handling](#error-handling)
- [Props Access](#props-access)

---

## Basic Usage

Use the `MDCRenderer` component to render Minimark AST:

```vue
<template>
  <MDCRenderer :body="mdcAst" />
</template>

<script setup lang="ts">
import { parse } from 'mdc-syntax'
import { MDCRenderer } from 'mdc-syntax/vue'

const content = `
# Hello World

This is **markdown** content.

::alert{type="info"}
Important message
::
`

const result = parse(content)
const mdcAst = result.body
</script>
```

---

## Custom Components

Map custom Vue components to MDC elements:

```vue
<template>
  <MDCRenderer :body="mdcAst" :components="customComponents" />
</template>

<script setup lang="ts">
import { MDCRenderer } from 'mdc-syntax/vue'
import CustomHeading from './CustomHeading.vue'
import CustomAlert from './CustomAlert.vue'
import CustomCard from './CustomCard.vue'

const customComponents = {
  h1: CustomHeading,
  h2: CustomHeading,
  alert: CustomAlert,
  card: CustomCard,
}
</script>
```

### Custom Component Example

```vue
<!-- CustomHeading.vue -->
<template>
  <component :is="tag" :id="id" class="custom-heading">
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  __node: any  // Minimark node
}>()

const tag = computed(() => props.__node[0])
const id = computed(() => props.__node[1]?.id)
</script>

<style scoped>
.custom-heading {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  margin-bottom: 1rem;
}
</style>
```

### Alert Component Example

```vue
<!-- CustomAlert.vue -->
<template>
  <div :class="`alert alert-${type}`" role="alert">
    <div class="alert-icon">
      <Icon :name="iconName" />
    </div>
    <div class="alert-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'info' | 'warning' | 'error' | 'success'
  __node?: any
}>()

const iconName = computed(() => {
  switch (props.type) {
    case 'info': return 'info-circle'
    case 'warning': return 'exclamation-triangle'
    case 'error': return 'times-circle'
    case 'success': return 'check-circle'
    default: return 'info-circle'
  }
})
</script>

<style scoped>
.alert {
  display: flex;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.alert-info {
  background-color: #e3f2fd;
  color: #1976d2;
}

.alert-warning {
  background-color: #fff3e0;
  color: #f57c00;
}
</style>
```

---

## Dynamic Component Resolution

Load components dynamically using `componentsManifest`:

```vue
<template>
  <MDCRenderer
    :body="mdcAst"
    :components-manifest="loadComponent"
  />
</template>

<script setup lang="ts">
import { MDCRenderer } from 'mdc-syntax/vue'

async function loadComponent(name: string) {
  // Dynamic import based on component name
  return import(`./components/${name}.vue`)
}

// Or with a custom resolver
const componentMap = {
  'alert': () => import('./Alert.vue'),
  'card': () => import('./Card.vue'),
  'button': () => import('./Button.vue'),
}

async function loadComponent(name: string) {
  if (componentMap[name]) {
    return componentMap[name]()
  }
  throw new Error(`Component ${name} not found`)
}
</script>
```

### With TypeScript

```vue
<script setup lang="ts">
import type { Component } from 'vue'

interface ComponentModule {
  default: Component
}

async function loadComponent(name: string): Promise<ComponentModule> {
  try {
    // Try loading from components directory
    return await import(`./components/${name}.vue`)
  } catch {
    // Fallback to default component
    return { default: defineComponent({ template: `<div>${name}</div>` }) }
  }
}
</script>
```

---

## Slots Support

MDC components with slots work seamlessly in Vue:

### Markdown with Slots

```markdown
::card
#header
## Card Title

#content
Main content here with **markdown** support

#footer
Footer text
::
```

### Custom Component with Slots

```vue
<!-- Card.vue -->
<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-content">
      <slot name="content" />
      <!-- Default slot as fallback -->
      <slot />
    </div>
    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.card-header {
  background-color: #f9fafb;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.card-content {
  padding: 1rem;
}

.card-footer {
  background-color: #f9fafb;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
```

### Nested Slots

```markdown
::tabs
#tab1
### First Tab
Content for tab 1

#tab2
### Second Tab
Content for tab 2
::
```

```vue
<!-- Tabs.vue -->
<template>
  <div class="tabs">
    <div class="tab-headers">
      <button
        v-for="(slot, name) in $slots"
        :key="name"
        :class="{ active: activeTab === name }"
        @click="activeTab = name"
      >
        {{ name }}
      </button>
    </div>
    <div class="tab-content">
      <component :is="() => $slots[activeTab]?.()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('tab1')
</script>
```

---

## Streaming Mode

Enable streaming-specific components for real-time content:

```vue
<template>
  <MDCRenderer :body="mdcAst" :stream="true" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { parseStreamIncremental } from 'mdc-syntax/stream'
import { MDCRenderer } from 'mdc-syntax/vue'

const mdcAst = ref({ type: 'minimark', value: [] })
const isLoading = ref(true)

async function loadContent() {
  const response = await fetch('/api/content.md')

  for await (const result of parseStreamIncremental(response.body!)) {
    mdcAst.value = result.body

    if (result.isComplete) {
      isLoading.value = false
    }
  }
}

loadContent()
</script>
```

### With Progress Indicator

```vue
<template>
  <div>
    <div v-if="isLoading" class="progress-bar">
      Loading... {{ progress }}%
    </div>
    <MDCRenderer :body="mdcAst" :stream="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { parseStreamIncremental } from 'mdc-syntax/stream'
import { MDCRenderer } from 'mdc-syntax/vue'

const mdcAst = ref({ type: 'minimark', value: [] })
const isLoading = ref(true)
const bytesReceived = ref(0)
const totalBytes = ref(0)

const progress = computed(() => {
  if (totalBytes.value === 0) return 0
  return Math.round((bytesReceived.value / totalBytes.value) * 100)
})

async function loadContent() {
  const response = await fetch('/api/content.md')
  totalBytes.value = parseInt(response.headers.get('content-length') || '0')

  for await (const result of parseStreamIncremental(response.body!)) {
    bytesReceived.value += result.chunk.length
    mdcAst.value = result.body

    if (result.isComplete) {
      isLoading.value = false
    }
  }
}

loadContent()
</script>
```

---

## High-Level MDC Component

Parse markdown directly in template:

```vue
<template>
  <MDC :content="markdownContent" />
</template>

<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'

const markdownContent = `
# Hello World

This is **markdown** with components.

::alert{type="info"}
Message here
::
`
</script>
```

### With Custom Components

```vue
<template>
  <MDC :content="markdownContent" :components="customComponents" />
</template>

<script setup lang="ts">
import { MDC } from 'mdc-syntax/vue'
import CustomAlert from './CustomAlert.vue'

const customComponents = {
  alert: CustomAlert,
}

const markdownContent = `
::alert{type="warning"}
Custom alert component
::
`
</script>
```

### Reactive Content

```vue
<template>
  <div>
    <textarea v-model="markdownContent" />
    <MDC :content="markdownContent" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MDC } from 'mdc-syntax/vue'

const markdownContent = ref('# Edit me!\n\nType **markdown** here.')
</script>
```

---

## Prose Components

Use pre-built styled components:

```vue
<template>
  <MDCRenderer :body="mdcAst" :components="proseComponents" />
</template>

<script setup lang="ts">
import { MDCRenderer } from 'mdc-syntax/vue'
import { standardProseComponents } from 'mdc-syntax/vue/prose/standard'

// Includes styled: h1-h6, p, a, strong, em, code, pre, ul, ol, li, etc.
</script>
```

### Stream Prose Components

```vue
<template>
  <MDCRenderer :body="mdcAst" :stream="true" />
</template>

<script setup lang="ts">
import { MDCRenderer } from 'mdc-syntax/vue'
// Stream components are automatically loaded when stream={true}
</script>
```

### Combining with Custom Components

```vue
<script setup lang="ts">
import { standardProseComponents } from 'mdc-syntax/vue/prose/standard'
import CustomAlert from './CustomAlert.vue'

const components = {
  ...standardProseComponents,
  alert: CustomAlert,  // Override or add custom components
}
</script>
```

---

## Error Handling

MDC Renderer captures component errors (useful during streaming):

```vue
<template>
  <MDCRenderer :body="mdcAst" :stream="true" />
</template>

<script setup lang="ts">
// Error handling is built-in
// - Failed components are tracked and prevented from crashing the app
// - Errors logged in development mode
// - Component errors don't propagate to parent
</script>
```

### Custom Error Handling

```vue
<template>
  <ErrorBoundary @error="handleError">
    <MDCRenderer :body="mdcAst" />
  </ErrorBoundary>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const errors = ref<Error[]>([])

function handleError(error: Error) {
  console.error('Component error:', error)
  errors.value.push(error)
  // Send to error tracking service
}
</script>
```

---

## Props Access

Custom components receive the original Minimark node and parsed props:

```vue
<!-- CustomAlert.vue -->
<template>
  <div :class="alertClasses" role="alert">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: string        // From {type="info"}
  bool?: boolean       // From {bool} → :bool="true"
  count?: number       // From {:count="5"}
  data?: object        // From {:data='{"key":"val"}'}
  __node?: any         // Original Minimark node
}>()

const alertClasses = computed(() => [
  'alert',
  `alert-${props.type || 'info'}`,
  { 'alert-important': props.bool }
])
</script>
```

### Property Parsing Rules

- Props starting with `:` are parsed as booleans/JSON
- Standard HTML attributes work normally
- `__node` provides access to the raw AST node

### Accessing Node Structure

```vue
<script setup lang="ts">
const props = defineProps<{ __node?: any }>()

// Node structure: [tag, props, ...children]
const tag = computed(() => props.__node?.[0])
const nodeProps = computed(() => props.__node?.[1] || {})
const children = computed(() => props.__node?.slice(2) || [])
</script>
```

### Working with Complex Props

```vue
<!-- DataTable.vue -->
<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="col">{{ col }}</th>
      </tr>
    </thead>
    <tbody>
      <slot />
    </tbody>
  </table>
</template>

<script setup lang="ts">
const props = defineProps<{
  columns?: string[]  // From {:columns='["Name","Age"]'}
  sortable?: boolean  // From {sortable}
  __node?: any
}>()
</script>
```

**Usage in Markdown:**

```markdown
::data-table{:columns='["Name", "Age", "Email"]' sortable}
Table content here
::
```

---

[← Back to Main Skills Guide](../../SKILLS.md)
