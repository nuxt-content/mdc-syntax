---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```html [template.html]
<div class="container">
  <h1>Title & Subtitle</h1>
  <p>Text with "quotes" and 'apostrophes'</p>
  <script>alert('XSS < > test');</script>
</div>
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
        "language": "html",
        "filename": "template.html"
      },
      [
        "code",
        {
          "class": "language-html"
        },
        "<div class=\"container\">\n  <h1>Title & Subtitle</h1>\n  <p>Text with \"quotes\" and 'apostrophes'</p>\n  <script>alert('XSS < > test');</script>\n</div>"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="html" filename="template.html"><code class="language-html">&lt;div class="container"&gt;
  &lt;h1&gt;Title & Subtitle&lt;/h1&gt;
  &lt;p&gt;Text with "quotes" and 'apostrophes'&lt;/p&gt;
  &lt;script&gt;alert('XSS &lt; &gt; test');&lt;/script&gt;
&lt;/div&gt;</code></pre>
```

## Markdown

```md
```html [template.html]
<div class="container">
  <h1>Title & Subtitle</h1>
  <p>Text with "quotes" and 'apostrophes'</p>
  <script>alert('XSS < > test');</script>
</div>
```
```
