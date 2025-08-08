<script setup lang="ts">
const props = withDefaults(defineProps<{
  content?: string
  /** Additional CSS classes to apply to the rendered content */
  class?: string
}>(), {
  content: '',
  class: '',
})

const { processContent } = useContentRenderer()

// Process the content reactively
const processedContent = computed(() => processContent(props.content))
</script>

<template>
  <div
    :class="[
      props.class,
      // Base typography
      'leading-relaxed',
      // Prose-like styling for rendered content
      '[&_p]:mb-2',
      '[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-4 [&_h1]:mb-2',
      '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2',
      '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2',
      '[&_h4]:text-base [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2',
      '[&_h5]:text-sm [&_h5]:font-semibold [&_h5]:mt-4 [&_h5]:mb-2',
      '[&_h6]:text-xs [&_h6]:font-semibold [&_h6]:mt-4 [&_h6]:mb-2',
      '[&_ul]:my-2 [&_ul]:pl-6 [&_ul]:list-disc',
      '[&_ol]:my-2 [&_ol]:pl-6 [&_ol]:list-decimal',
      '[&_li]:mb-1',
      '[&_strong]:font-semibold',
      '[&_b]:font-semibold',
      '[&_em]:italic',
      '[&_i]:italic',
      '[&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:font-mono [&_code]:text-sm',
      '[&_pre]:bg-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2',
      '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
      '[&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:my-2 [&_blockquote]:italic',
      '[&_table]:border-collapse [&_table]:w-full [&_table]:my-2',
      '[&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:text-left [&_th]:bg-gray-100 [&_th]:font-semibold',
      '[&_td]:border [&_td]:border-gray-300 [&_td]:p-2 [&_td]:text-left'
    ]"
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
