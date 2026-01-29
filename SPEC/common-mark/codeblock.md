---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```
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
      {},
      [
        "code",
        {},
        "function hello() {\n  console.log(\"Hello, World!\");\n}"
      ]
    ]
  ]
}
```

## HTML

```html
<pre><code>function hello() {
  console.log("Hello, World!");
}</code></pre>
```

## Markdown

```md
```
function hello() {
  console.log("Hello, World!");
}
```
```
