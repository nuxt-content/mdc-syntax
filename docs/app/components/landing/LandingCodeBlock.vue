<script setup lang="ts">
const markdown = `
\`\`\`typescript
import React from "react";

type ButtonProps = {
  label: string;
  onClick: () => void;
};

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => (
  <button
    type="button"
    className="button"
    onClick={onClick}
    aria-label={label}
  >
    {label}
  </button>
);
\`\`\`
`
</script>

<template>
  <LandingCompareGrid
    title="Code Block"
    description="MDC supports code blocks out of the box, so you get things like syntax highlighting, line numbers, and more."
    :markdown="markdown"
  />
</template>
