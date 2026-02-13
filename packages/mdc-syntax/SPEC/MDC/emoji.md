---
timeout:
  parse: 5ms
  html: 5ms
  markdown: 5ms
---

## Input

```md
Emoji :rocket: :satellite: :smile: :fire: :sparkles: :tada: :thinking: :apple: :coffee: :thumbsup: :+1: :100:
```

## AST

```json
{
  "type": "minimark",
  "value": [
    [
      "p",
      {},
      "Emoji 🚀 📡 😄 🔥 ✨ 🎉 🤔 🍎 ☕ 👍 👍 💯"
    ]
  ]
}
```

## HTML

```html
<p>Emoji 🚀 📡 😄 🔥 ✨ 🎉 🤔 🍎 ☕ 👍 👍 💯</p>
```

## Markdown

```md
Emoji 🚀 📡 😄 🔥 ✨ 🎉 🤔 🍎 ☕ 👍 👍 💯
```
