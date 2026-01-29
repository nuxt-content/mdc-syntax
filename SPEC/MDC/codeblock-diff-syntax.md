---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```diff
- const oldValue = 42;
+ const newValue = 100;
  const unchanged = "same";
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
        "language": "diff"
      },
      [
        "code",
        {
          "class": "language-diff"
        },
        "- const oldValue = 42;\n+ const newValue = 100;\n  const unchanged = \"same\";"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="diff"><code class="language-diff">- const oldValue = 42;
+ const newValue = 100;
  const unchanged = "same";</code></pre>
```

## Markdown

```md
```diff
- const oldValue = 42;
+ const newValue = 100;
  const unchanged = "same";
```
```
