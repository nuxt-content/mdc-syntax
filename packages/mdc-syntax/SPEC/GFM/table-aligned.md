---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
| Left-aligned | Center-aligned | Right-aligned |
| :---         |     :---:      |          ---: |
| git status   | git status     | git status    |
| git diff     | git diff       | git diff      |
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
            {
              "style": "text-align:left"
            },
            "Left-aligned"
          ],
          [
            "th",
            {
              "style": "text-align:center"
            },
            "Center-aligned"
          ],
          [
            "th",
            {
              "style": "text-align:right"
            },
            "Right-aligned"
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
            {
              "style": "text-align:left"
            },
            "git status"
          ],
          [
            "td",
            {
              "style": "text-align:center"
            },
            "git status"
          ],
          [
            "td",
            {
              "style": "text-align:right"
            },
            "git status"
          ]
        ],
        [
          "tr",
          {},
          [
            "td",
            {
              "style": "text-align:left"
            },
            "git diff"
          ],
          [
            "td",
            {
              "style": "text-align:center"
            },
            "git diff"
          ],
          [
            "td",
            {
              "style": "text-align:right"
            },
            "git diff"
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
      <th style="text-align:left">Left-aligned</th>
      <th style="text-align:center">Center-aligned</th>
      <th style="text-align:right">Right-aligned</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="text-align:left">git status</td>
      <td style="text-align:center">git status</td>
      <td style="text-align:right">git status</td>
    </tr>
    <tr>
      <td style="text-align:left">git diff</td>
      <td style="text-align:center">git diff</td>
      <td style="text-align:right">git diff</td>
    </tr>
  </tbody>
</table>
```

## Markdown

```md
| Left-aligned | Center-aligned | Right-aligned |
| :----------- | :------------: | ------------: |
| git status   | git status     | git status    |
| git diff     | git diff       | git diff      |
```
