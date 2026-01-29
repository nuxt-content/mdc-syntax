---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```
Plain text code block
No language specified
```
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "pre",
      {},
      [
        "code",
        {},
        "Plain text code block\nNo language specified"
      ]
    ]
  ]
}
```

## HTML

```html
<pre><code>Plain text code block
No language specified</code></pre>
```

## Markdown

```md
```
Plain text code block
No language specified
```
```
