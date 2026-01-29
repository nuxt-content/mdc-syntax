---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
| Command | Description |
| --- | --- |
| `git status` | List all *new or modified* files |
| `git diff` | Show file differences that **haven't been** staged |
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
            "Command"
          ],
          [
            "th",
            {},
            "Description"
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
            [
              "code",
              {},
              "git status"
            ]
          ],
          [
            "td",
            {},
            "List all ",
            [
              "em",
              {},
              "new or modified"
            ],
            " files"
          ]
        ],
        [
          "tr",
          {},
          [
            "td",
            {},
            [
              "code",
              {},
              "git diff"
            ]
          ],
          [
            "td",
            {},
            "Show file differences that ",
            [
              "strong",
              {},
              "haven't been"
            ],
            " staged"
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
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>git status</code></td>
      <td>List all <em>new or modified</em> files</td>
    </tr>
    <tr>
      <td><code>git diff</code></td>
      <td>Show file differences that <strong>haven't been</strong> staged</td>
    </tr>
  </tbody>
</table>
```

## Markdown

```md
| Command      | Description                                        |
| ------------ | -------------------------------------------------- |
| `git status` | List all *new or modified* files                   |
| `git diff`   | Show file differences that **haven't been** staged |
```
