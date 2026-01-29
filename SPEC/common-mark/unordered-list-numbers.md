---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
- 1968\. A great year!
- I think 1969 was second best.
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "ul",
      {},
      [
        "li",
        {},
        "1968. A great year!"
      ],
      [
        "li",
        {},
        "I think 1969 was second best."
      ]
    ]
  ]
}
```

## HTML

```html
<ul>
  <li>1968. A great year!</li>
  <li>I think 1969 was second best.</li>
</ul>
```

## Markdown

```md
- 1968\. A great year!
- I think 1969 was second best.
```
