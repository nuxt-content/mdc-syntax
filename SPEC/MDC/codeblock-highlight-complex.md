---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
```go {1,3,5-7,10}
package main

import "fmt"

func main() {
    fmt.Println("Line 6")
    fmt.Println("Line 7")
    fmt.Println("Line 8")
    fmt.Println("Line 9")
    fmt.Println("Line 10")
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
        "language": "go",
        "highlights": [
          1,
          3,
          5,
          6,
          7,
          10
        ]
      },
      [
        "code",
        {
          "class": "language-go"
        },
        "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Line 6\")\n    fmt.Println(\"Line 7\")\n    fmt.Println(\"Line 8\")\n    fmt.Println(\"Line 9\")\n    fmt.Println(\"Line 10\")\n}"
      ]
    ]
  ]
}
```

## HTML

```html
<pre language="go" highlights="[1,3,5,6,7,10]"><code class="language-go">package main

import "fmt"

func main() {
    fmt.Println("Line 6")
    fmt.Println("Line 7")
    fmt.Println("Line 8")
    fmt.Println("Line 9")
    fmt.Println("Line 10")
}</code></pre>
```

## Markdown

```md
```go {1,3,5-7,10}
package main

import "fmt"

func main() {
    fmt.Println("Line 6")
    fmt.Println("Line 7")
    fmt.Println("Line 8")
    fmt.Println("Line 9")
    fmt.Println("Line 10")
}
```
```
