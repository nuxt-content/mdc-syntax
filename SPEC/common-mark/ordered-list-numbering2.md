---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
1. First item
8. Second item
3. Third item
5. Fourth item
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "ol",
      {},
      [
        "li",
        {},
        "First item"
      ],
      [
        "li",
        {},
        "Second item"
      ],
      [
        "li",
        {},
        "Third item"
      ],
      [
        "li",
        {},
        "Fourth item"
      ]
    ]
  ]
}
```

## HTML

```html
<ol>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
  <li>Fourth item</li>
</ol>
```

## Markdown

```md
1. First item
2. Second item
3. Third item
4. Fourth item
```
