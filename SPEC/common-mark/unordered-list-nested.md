---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
- First item
- Second item
- Third item
  - Indented item
  - Indented item
- Fourth item
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
        "Third item",
        [
          "ul",
          {},
          [
            "li",
            {},
            "Indented item"
          ],
          [
            "li",
            {},
            "Indented item"
          ]
        ]
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
  <li>
    Third item
    <ul>
      <li>Indented item</li>
      <li>Indented item</li>
    </ul>
  </li>
  <li>Fourth item</li>
</ul>
```

## Markdown

```md
- First item
- Second item
- Third item
  - Indented item
  - Indented item
- Fourth item
```
