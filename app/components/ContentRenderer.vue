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
    class="content-body max-w-none whitespace-pre-line [&_pre]:max-w-full"
    v-html="processedContent"
  />
</template>
