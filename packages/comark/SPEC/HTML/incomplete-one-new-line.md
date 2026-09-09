## Input

```md
<ai-thinking>
**bold**
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "ai-thinking",
      {
        "$": {
          "html": 1,
          "block": 1
        }
      },
      [
        "strong",
        {},
        "bold"
      ]
    ]
  ]
}
```

## HTML

```html
<ai-thinking>
  <strong>bold</strong>
</ai-thinking>
```

## Markdown

```md
<ai-thinking>
**bold**
</ai-thinking>
```
