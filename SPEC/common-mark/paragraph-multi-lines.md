---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
This is a simple paragraph
And continues in next line
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      "This is a simple paragraph\nAnd continues in next line"
    ]
  ]
}
```

## HTML

```html
<p>This is a simple paragraph
And continues in next line</p>
```

## Markdown

```md
This is a simple paragraph
And continues in next line
```
