<script setup lang="ts">
defineProps<{
  label?: string
}>()
</script>

<template>
  <div>
    <button class="border border-neutral-300 dark:border-neutral-700 p-24 flex flex-col gap-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors duration-200">
      <div class="text-2xl">
        <slot name="icon" />
      </div>
      <div v-if="label" class="text-xl font-semibold">
        {{ label }}
      </div>
    </button>
  </div>
</template>
