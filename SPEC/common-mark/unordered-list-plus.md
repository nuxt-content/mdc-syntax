---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
+ First item
+ Second item
+ Third item
+ Fourth item
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "ul",
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
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
  <li>Fourth item</li>
</ul>
```

## Markdown

```md
- First item
- Second item
- Third item
- Fourth item
```
