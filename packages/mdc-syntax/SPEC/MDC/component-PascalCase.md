---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
::MyComponent
First Paragraph

Second Paragraph
::
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "my-component",
      {},
      [
        "p",
        {},
        "First Paragraph"
      ],
      [
        "p",
        {},
        "Second Paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<my-component>
  <p>First Paragraph</p>
  <p>Second Paragraph</p>
</my-component>
```

## Markdown

```md
::my-component
First Paragraph

Second Paragraph
::
```
