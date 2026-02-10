---
timeout:
  parse: 10ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
`This is a simple paragraph`
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      [
        "code",
        {},
        "This is a simple paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<p><code>This is a simple paragraph</code></p>
```

## Markdown

```md
`This is a simple paragraph`
```
