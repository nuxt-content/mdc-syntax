---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
```
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "pre",
      {
        "language": "typescript"
      },
      [
        "code",
        {
          "class": "language-typescript"
        },
        "const greeting: string = \"Hello, World!\"\nconsole.log(greeting)"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="typescript"><code class="language-typescript">const greeting: string = "Hello, World!"
console.log(greeting)</code></pre>
```

## Markdown

```md
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
```
```
