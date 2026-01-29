---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
> #### The quarterly results look great!
> 
> Paragraph
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "blockquote",
      {},
      [
        "h4",
        {
          "id": "the-quarterly-results-look-great"
        },
        "The quarterly results look great!"
      ],
      [
        "p",
        {},
        "Paragraph"
      ]
    ]
  ]
}
```

## HTML

```html
<blockquote>
  <h4 id="the-quarterly-results-look-great">The quarterly results look great!</h4>
  <p>Paragraph</p>
</blockquote>
```

## Markdown

```md
> #### The quarterly results look great!
> 
> Paragraph
```
