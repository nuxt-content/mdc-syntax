---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
:inline-component

Paragraph with :inline-component

Paragraph with :inline-component in middle

## a :inline inside heading
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      [
        "inline-component",
        {}
      ]
    ],
    [
      "p",
      {},
      "Paragraph with ",
      [
        "inline-component",
        {}
      ]
    ],
    [
      "p",
      {},
      "Paragraph with ",
      [
        "inline-component",
        {}
      ],
      " in middle"
    ],
    [
      "h2",
      {
        "id": "a-inline-inside-heading"
      },
      "a ",
      [
        "inline",
        {}
      ],
      " inside heading"
    ]
  ]
}
```

## HTML

```html
<p>
  <inline-component></inline-component>
</p>
<p>
  Paragraph with <inline-component></inline-component>
</p>
<p>
  Paragraph with <inline-component></inline-component> in middle
</p>
<h2 id="a-inline-inside-heading">
  a <inline></inline> inside heading
</h2>
```

## Markdown

```md
:inline-component

Paragraph with :inline-component

Paragraph with :inline-component in middle

## a :inline inside heading
```
