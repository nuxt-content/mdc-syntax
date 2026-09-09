## Input

```md
<ai-thinking>

**bold** and more

- list
- **item**
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
        "p",
        {},
        [
          "strong",
          {},
          "bold"
        ],
        " and more"
      ],
      [
        "ul",
        {},
        [
          "li",
          {},
          "list"
        ],
        [
          "li",
          {},
          [
            "strong",
            {},
            "item"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<ai-thinking>
  <p><strong>bold</strong> and more</p>
  <ul>
    <li>list</li>
    <li><strong>item</strong></li>
  </ul>
</ai-thinking>
```

## Markdown

```md
<ai-thinking>
**bold** and more


- list
- **item**
</ai-thinking>
```
