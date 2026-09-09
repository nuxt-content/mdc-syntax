## Input

```md
an :inline-component

Paragraph with :inline-component

Paragraph with :inline-component in middle

## a :inline inside heading
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "p",
      {},
      "an ",
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
        "id": "a-inside-heading"
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
  an <inline-component></inline-component>
</p>
<p>
  Paragraph with <inline-component></inline-component>
</p>
<p>
  Paragraph with <inline-component></inline-component> in middle
</p>
<h2 id="a-inside-heading">
  a <inline></inline> inside heading
</h2>
```

## Markdown

```md
an :inline-component

Paragraph with :inline-component

Paragraph with :inline-component in middle

## a :inline inside heading
```
