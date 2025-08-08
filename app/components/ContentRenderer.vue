<script setup lang="ts">
interface Props {
  content?: string
  /** Additional CSS classes to apply to the rendered content */
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  class: '',
})

const { processContent } = useContentRenderer()

// Process the content reactively
const processedContent = computed(() => processContent(props.content))
</script>

<template>
  <div
    :class="props.class"
    v-html="processedContent"
  />
</template>

<style>
/* Ensure KaTeX styles are properly applied */
.katex-display {
  margin: 1em 0;
  text-align: center;
}

.katex {
  font-size: 1em;
}

/* Basic styling for rendered HTML content */
.rendered-content {
  line-height: 1.6;
}

.rendered-content p {
  margin-bottom: 0.5em;
}

.rendered-content h1,
.rendered-content h2,
.rendered-content h3,
.rendered-content h4,
.rendered-content h5,
.rendered-content h6 {
  margin-top: 1em;
  margin-bottom: 0.5em;
  font-weight: 600;
}

.rendered-content ul,
.rendered-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.rendered-content li {
  margin-bottom: 0.25em;
}

.rendered-content strong,
.rendered-content b {
  font-weight: 600;
}

.rendered-content em,
.rendered-content i {
  font-style: italic;
}

.rendered-content code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.125em 0.25em;
  border-radius: 0.25em;
  font-family: monospace;
  font-size: 0.9em;
}

.rendered-content pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 0.75em;
  border-radius: 0.5em;
  overflow-x: auto;
  margin: 0.5em 0;
}

.rendered-content pre code {
  background-color: transparent;
  padding: 0;
}

.rendered-content blockquote {
  border-left: 4px solid rgba(0, 0, 0, 0.15);
  padding-left: 1em;
  margin: 0.5em 0;
  font-style: italic;
}

.rendered-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.rendered-content th,
.rendered-content td {
  border: 1px solid rgba(0, 0, 0, 0.15);
  padding: 0.5em;
  text-align: left;
}

.rendered-content th {
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}
</style>
