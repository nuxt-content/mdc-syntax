---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```bash
pnpm add mdc-syntax
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
        "language": "bash"
      },
      [
        "code",
        {
          "class": "language-bash"
        },
        "pnpm add mdc-syntax"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="bash"><code class="language-bash">pnpm add mdc-syntax</code></pre>
```

## Markdown

```md
```bash
pnpm add mdc-syntax
```
```
