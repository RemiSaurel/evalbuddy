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
    class="whitespace-pre-line prose prose-neutral max-w-none [&_pre]:overflow-x-auto [&_pre]:max-w-full"
    v-html="processedContent"
  />
</template>
