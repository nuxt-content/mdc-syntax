---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
*This is a simple paragraph*
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
        "em",
        {},
        "This is a simple paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<p><em>This is a simple paragraph</em></p>
```

## Markdown

```md
*This is a simple paragraph*
```
