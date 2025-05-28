<script setup lang="ts">
defineProps<{
  label: string
  progress: number
  max: number
}>()
</script>

<template>
  <div class="flex flex-col flex-1 gap-1">
    <div class="flex justify-between items-center">
      <div class="text-sm text-neutral-600">
        {{ label }}
      </div>
      <div class="text-xs text-neutral-500">
        {{ progress }} / {{ max }}
      </div>
    </div>
    <UProgress
      :model-value="progress"
      :max="max"
      size="xl"
      status
    />
  </div>
</template>
