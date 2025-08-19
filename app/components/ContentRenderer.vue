<script setup lang="ts">
const props = withDefaults(defineProps<{
  content?: string
}>(), {
  content: '',
})

const { processContent } = useContentRenderer()

// Process the content reactively
const processedContent = computed(() => processContent(props.content))
</script>

<template>
  <div
    class="whitespace-pre-line prose prose-neutral max-w-none"
    v-html="processedContent"
  />
</template>

<style>
/* Essential KaTeX styles that can't be replaced with Tailwind */
.katex-display {
  margin: 1em 0;
  text-align: center;
}

.katex {
  font-size: 1em;
}
</style>
