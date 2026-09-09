## Input

```md
<details>
<summary>Hello</summary>

Explain
</details>
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "details",
      {
        "$": {
          "html": 1,
          "block": 1
        }
      },
      [
        "summary",
        {
          "$": {
            "html": 1,
            "block": 0
          }
        },
        "Hello"
      ],
      [
        "p",
        {},
        "Explain"
      ]
    ]
  ]
}
```

## HTML

```html
<details>
  <summary>Hello</summary>
  <p>Explain</p>
</details>
```

## Markdown

```md
<details>
<summary>Hello</summary>
Explain
</details>
```
