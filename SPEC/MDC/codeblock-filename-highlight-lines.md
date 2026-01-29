---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```javascript {1-3} [@[...slug\\].ts] meta=meta-value
function hello() {
  console.log("Hello, World!");
}
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
        "language": "javascript",
        "filename": "@[...slug].ts",
        "highlights": [
          1,
          2,
          3
        ],
        "meta": "meta=meta-value"
      },
      [
        "code",
        {
          "class": "language-javascript"
        },
        "function hello() {\n  console.log(\"Hello, World!\");\n}"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="javascript" filename="@[...slug].ts" highlights="[1,2,3]" meta="meta=meta-value"><code class="language-javascript">function hello() {
  console.log("Hello, World!");
}</code></pre>
```

## Markdown

```md
```javascript [@[...slug\\].ts] {1-3} meta=meta-value
function hello() {
  console.log("Hello, World!");
}
```
```
