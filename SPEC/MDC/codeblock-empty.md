---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```javascript
```
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "pre",
      {
        "language": "javascript"
      },
      [
        "code",
        {
          "class": "language-javascript"
        },
        ""
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="javascript"><code class="language-javascript"></code></pre>
```

## Markdown

```md
```javascript

```
```
