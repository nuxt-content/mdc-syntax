---
title: React
description: A minimal example showing how to use MDC Syntax with React and Vite.
icon: i-logos-react
---

::code-tree{defaultValue="src/App.tsx" expandAll}

```tsx [src/main.tsx]
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(<App />)
```

```tsx [src/App.tsx]
import { MDC } from 'mdc-syntax/react'
import Alert from './components/Alert'

const markdown = `
# Hello *World*]

::alert{type="info"}
This is an alert!
::
`

export default function App() {
  return (
    <MDC
      markdown={markdown}
      components={{ Alert }}
    />
  )
}
```

```ts [vite.config.ts]
...
```

```json [package.json]
...
```

```html [index.html]
...
```

```json [tsconfig.json]
...
```

::

This example demonstrates the simplest way to use MDC Syntax with React - use the `MDC` component and pass it markdown content. The component handles parsing and rendering automatically.
