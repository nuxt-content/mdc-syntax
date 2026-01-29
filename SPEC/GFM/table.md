---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "table",
      {},
      [
        "thead",
        {},
        [
          "tr",
          {},
          [
            "th",
            {},
            "Header 1"
          ],
          [
            "th",
            {},
            "Header 2"
          ]
        ]
      ],
      [
        "tbody",
        {},
        [
          "tr",
          {},
          [
            "td",
            {},
            "Cell 1"
          ],
          [
            "td",
            {},
            "Cell 2"
          ]
        ],
        [
          "tr",
          {},
          [
            "td",
            {},
            "Cell 3"
          ],
          [
            "td",
            {},
            "Cell 4"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<table>
  <thead>
    <tr>
      <th>Header 1</th>
      <th>Header 2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cell 1</td>
      <td>Cell 2</td>
    </tr>
    <tr>
      <td>Cell 3</td>
      <td>Cell 4</td>
    </tr>
  </tbody>
</table>
```

## Markdown

```md
| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
```
