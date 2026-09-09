## Input

```md
<details>
<summary>Top</summary>

<details>
<summary>Nested</summary>

Nested content

Nested content2

</details>

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
        "Top"
      ],
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
          "Nested"
        ],
        [
          "p",
          {},
          "Nested content"
        ],
        [
          "p",
          {},
          "Nested content2"
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<details>
  <summary>Top</summary>
  <details>
    <summary>Nested</summary>
    <p>Nested content</p>
    <p>Nested content2</p>
  </details>
</details>
```

## Markdown

```md
<details>
<summary>Top</summary>
<details>
<summary>Nested</summary>
Nested content


Nested content2
</details>
</details>
```
