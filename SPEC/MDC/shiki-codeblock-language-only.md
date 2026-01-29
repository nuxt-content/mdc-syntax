---
timeout:
  parse: 100ms
  html: 5ms
  markdown: 5ms
options:
  highlight: true
---

## Input

```md
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
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
        "language": "typescript",
        "class": "shiki github-dark",
        "tabindex": "0",
        "style": "background-color:#24292e;color:#e1e4e8"
      },
      [
        "code",
        {
          "class": "language-typescript"
        },
        [
          "span",
          {
            "class": "line"
          },
          [
            "span",
            {
              "style": "color:#F97583"
            },
            "const"
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
              "style": "color:#79B8FF"
            },
            "greeting"
          ],
          [
            "span",
            {
              "style": "color:#F97583"
            },
            ":"
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
              "style": "color:#79B8FF"
            },
            "string"
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
              "style": "color:#F97583"
            },
            "="
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
              "style": "color:#9ECBFF"
            },
            "\"Hello, World!\""
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
            "console."
          ],
          [
            "span",
            {
              "style": "color:#B392F0"
            },
            "log"
          ],
          [
            "span",
            {
              "style": "color:#E1E4E8"
            },
            "(greeting)"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="typescript" class="shiki github-dark" tabindex="0" style="background-color:#24292e;color:#e1e4e8"><code class="language-typescript"><span class="line"><span style="color:#F97583">const</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">greeting</span><span style="color:#F97583">:</span><span style="color:#E1E4E8"> </span><span style="color:#79B8FF">string</span><span style="color:#E1E4E8"> </span><span style="color:#F97583">=</span><span style="color:#E1E4E8"> </span><span style="color:#9ECBFF">"Hello, World!"</span></span>
<span class="line"><span style="color:#E1E4E8">console.</span><span style="color:#B392F0">log</span><span style="color:#E1E4E8">(greeting)</span></span></code></pre>
```

## Markdown

```md
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
```
```
