---
timeout:
  parse: 300ms
  html: 5ms
  markdown: 5ms
options:
  highlight: 
    themes:
      light: 'min-light'
      dark: 'nord'
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
        "class": "shiki min-light",
        "tabindex": "0",
        "style": "background-color:#ffffff;--shiki-dark-bg:#2e3440ff;color:#24292eff;--shiki-dark:#d8dee9ff"
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
              "style": "color:#D32F2F;--shiki-dark:#81A1C1"
            },
            "const"
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#1976D2;--shiki-dark:#D8DEE9"
            },
            "greeting"
          ],
          [
            "span",
            {
              "style": "color:#D32F2F;--shiki-dark:#81A1C1"
            },
            ":"
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#1976D2;--shiki-dark:#8FBCBB"
            },
            "string"
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#D32F2F;--shiki-dark:#81A1C1"
            },
            "="
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            " "
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#ECEFF4"
            },
            "\""
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#A3BE8C"
            },
            "Hello, World!"
          ],
          [
            "span",
            {
              "style": "color:#22863A;--shiki-dark:#ECEFF4"
            },
            "\""
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
              "style": "color:#1976D2;--shiki-dark:#D8DEE9"
            },
            "console"
          ],
          [
            "span",
            {
              "style": "color:#6F42C1;--shiki-dark:#ECEFF4"
            },
            "."
          ],
          [
            "span",
            {
              "style": "color:#6F42C1;--shiki-dark:#88C0D0"
            },
            "log"
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            "("
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9"
            },
            "greeting"
          ],
          [
            "span",
            {
              "style": "color:#24292EFF;--shiki-dark:#D8DEE9FF"
            },
            ")"
          ]
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="typescript" class="shiki min-light" tabindex="0" style="background-color:#ffffff;--shiki-dark-bg:#2e3440ff;color:#24292eff;--shiki-dark:#d8dee9ff"><code class="language-typescript"><span class="line"><span style="color:#D32F2F;--shiki-dark:#81A1C1">const</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF"> </span><span style="color:#1976D2;--shiki-dark:#D8DEE9">greeting</span><span style="color:#D32F2F;--shiki-dark:#81A1C1">:</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF"> </span><span style="color:#1976D2;--shiki-dark:#8FBCBB">string</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF"> </span><span style="color:#D32F2F;--shiki-dark:#81A1C1">=</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF"> </span><span style="color:#22863A;--shiki-dark:#ECEFF4">"</span><span style="color:#22863A;--shiki-dark:#A3BE8C">Hello, World!</span><span style="color:#22863A;--shiki-dark:#ECEFF4">"</span></span>
<span class="line"><span style="color:#1976D2;--shiki-dark:#D8DEE9">console</span><span style="color:#6F42C1;--shiki-dark:#ECEFF4">.</span><span style="color:#6F42C1;--shiki-dark:#88C0D0">log</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF">(</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9">greeting</span><span style="color:#24292EFF;--shiki-dark:#D8DEE9FF">)</span></span></code></pre>
```

## Markdown

```md
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
```
```
