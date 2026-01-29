---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```javascript [hello.js]
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
        "filename": "hello.js"
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
<pre language="javascript" filename="hello.js"><code class="language-javascript">function hello() {
  console.log("Hello, World!");
}</code></pre>
```

## Markdown

```md
```javascript [hello.js]
function hello() {
  console.log("Hello, World!");
}
```
```
