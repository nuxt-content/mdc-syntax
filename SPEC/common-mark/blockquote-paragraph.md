---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
> This is a simple blockquote
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "blockquote",
      {},
      [
        "p",
        {},
        "This is a simple blockquote"
      ]
    ]
  ]
}
```

## HTML

```html
<blockquote>
  <p>This is a simple blockquote</p>
</blockquote>
```

## Markdown

```md
> This is a simple blockquote
```

