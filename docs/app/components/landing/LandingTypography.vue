<script setup lang="ts">
const markdown = `# AI Models Overview

Modern AI models have revolutionized how we interact with technology. From **language models** to _computer vision_, these systems demonstrate remarkable capabilities.

## Key Features

### Benefits
- Natural language understanding
  - Generating text
  - Summarizing documents
    - Generating summaries
- Multi-modal processing
- Real-time inference

### Requirements
1. GPU acceleration
2. Model weights
3. API access

## Architecture

![Model Architecture](https://placehold.co/600x400)

## Insights

> "The development of full artificial intelligence could spell the end of the human race." — Stephen Hawking

Learn more about [AI safety](https://example.com) and \`transformer\` architectures.
`
</script>

<template>
  <LandingCompareGrid
    title="Typography"
    description="MDC supports typography out of the box, so you get things like headings, paragraphs, and more."
    :markdown="markdown"
  />
</template>
