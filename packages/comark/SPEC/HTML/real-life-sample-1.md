
## Input

```md
<p valign="center">
  <a href="https://go.nuxt.com/discord"><img width="20" src="./.github/assets/discord.svg" alt="Discord"></a>&nbsp;&nbsp;<a href="https://go.nuxt.com/x"><img width="20" src="./.github/assets/twitter.svg" alt="Twitter"></a>&nbsp;&nbsp;<a href="https://go.nuxt.com/github"><img width="20" src="./.github/assets/github.svg" alt="GitHub"></a>&nbsp;&nbsp;<a href="https://go.nuxt.com/bluesky"><img width="20" src="./.github/assets/bluesky.svg" alt="Bluesky"></a>
</p>
```

## AST

```json
{
  "frontmatter": {},
  "meta": {},
  "nodes": [
    [
      "p",
      {
        "$": {
          "html": 1,
          "block": 1
        },
        "valign": "center"
      },
      [
        "a",
        {
          "$": {
            "html": 1,
            "block": 0
          },
          "href": "https://go.nuxt.com/discord"
        },
        [
          "img",
          {
            "$": {
              "html": 1,
              "block": 0
            },
            "width": "20",
            "src": "./.github/assets/discord.svg",
            "alt": "Discord"
          }
        ]
      ],
      "  ",
      [
        "a",
        {
          "$": {
            "html": 1,
            "block": 0
          },
          "href": "https://go.nuxt.com/x"
        },
        [
          "img",
          {
            "$": {
              "html": 1,
              "block": 0
            },
            "width": "20",
            "src": "./.github/assets/twitter.svg",
            "alt": "Twitter"
          }
        ]
      ],
      "  ",
      [
        "a",
        {
          "$": {
            "html": 1,
            "block": 0
          },
          "href": "https://go.nuxt.com/github"
        },
        [
          "img",
          {
            "$": {
              "html": 1,
              "block": 0
            },
            "width": "20",
            "src": "./.github/assets/github.svg",
            "alt": "GitHub"
          }
        ]
      ],
      "  ",
      [
        "a",
        {
          "$": {
            "html": 1,
            "block": 0
          },
          "href": "https://go.nuxt.com/bluesky"
        },
        [
          "img",
          {
            "$": {
              "html": 1,
              "block": 0
            },
            "width": "20",
            "src": "./.github/assets/bluesky.svg",
            "alt": "Bluesky"
          }
        ]
      ]
    ]
  ]
}
```

## HTML

```html
<p valign="center"><a href="https://go.nuxt.com/discord"><img width="20" src="./.github/assets/discord.svg" alt="Discord"></a>  <a href="https://go.nuxt.com/x"><img width="20" src="./.github/assets/twitter.svg" alt="Twitter"></a>  <a href="https://go.nuxt.com/github"><img width="20" src="./.github/assets/github.svg" alt="GitHub"></a>  <a href="https://go.nuxt.com/bluesky"><img width="20" src="./.github/assets/bluesky.svg" alt="Bluesky"></a></p>
```

## Markdown

```md
<p valign="center"><a href="https://go.nuxt.com/discord"><img width="20" src="./.github/assets/discord.svg" alt="Discord"></a>  <a href="https://go.nuxt.com/x"><img width="20" src="./.github/assets/twitter.svg" alt="Twitter"></a>  <a href="https://go.nuxt.com/github"><img width="20" src="./.github/assets/github.svg" alt="GitHub"></a>  <a href="https://go.nuxt.com/bluesky"><img width="20" src="./.github/assets/bluesky.svg" alt="Bluesky"></a></p>
```
