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
  "frontmatter": {},
  "meta": {},
  "nodes": [
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
<pre language="javascript" highlights="[1,2,3]" filename="@[...slug].ts" meta="meta=meta-value"><code class="language-javascript">function hello() {
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
