---
timeout:
  parse: 50ms
  html: 5ms
  markdown: 5ms
options:
  highlight: true
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
        "filename": "template.html",
        "class": "shiki github-dark",
        "tabindex": "0",
        "style": "background-color:#24292e;color:#e1e4e8"
      },
      [
        "code",
        {
          "class": "language-html"
        },
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "<"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "div"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "class"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "="
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "\"container\""
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "  <"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "h1"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">Title & Subtitle</"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "h1"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "  <"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "p"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">Text with \"quotes\" and 'apostrophes'</"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "p"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "  <"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "script"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "alert"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#9ECBFF"
            },
            "'XSS < > test'"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ");</"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "script"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ]
        ],
        "\n",
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "</"
          ],
          [
            "span",
            {
              "style": "color:#85E89D"
            },
            "div"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            ">"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="html" filename="template.html" class="shiki github-dark" tabindex="0" style="background-color:#24292e;color:#e1e4e8"><code class="language-html"><span class="line"><span style="color:#E1E4E8">&lt;</span><span style="color:#85E89D">div</span><span style="color:#E1E4E8"> </span><span style="color:#B392F0">class</span><span style="color:#E1E4E8">=</span><span style="color:#9ECBFF">"container"</span><span style="color:#E1E4E8">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8">  &lt;</span><span style="color:#85E89D">h1</span><span style="color:#E1E4E8">&gt;Title & Subtitle&lt;/</span><span style="color:#85E89D">h1</span><span style="color:#E1E4E8">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8">  &lt;</span><span style="color:#85E89D">p</span><span style="color:#E1E4E8">&gt;Text with "quotes" and 'apostrophes'&lt;/</span><span style="color:#85E89D">p</span><span style="color:#E1E4E8">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8">  &lt;</span><span style="color:#85E89D">script</span><span style="color:#E1E4E8">&gt;</span><span style="color:#B392F0">alert</span><span style="color:#E1E4E8">(</span><span style="color:#9ECBFF">'XSS &lt; &gt; test'</span><span style="color:#E1E4E8">);&lt;/</span><span style="color:#85E89D">script</span><span style="color:#E1E4E8">&gt;</span></span>
<span class="line"><span style="color:#E1E4E8">&lt;/</span><span style="color:#85E89D">div</span><span style="color:#E1E4E8">&gt;</span></span></code></pre>
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
