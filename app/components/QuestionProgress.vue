<script setup lang="ts">
defineProps<{
  label: string
  progress: number
  max: number
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex justify-between items-center">
      <div class="text-sm text-default">
        {{ label }}
      </div>
      <div class="text-xs text-muted">
        {{ progress }} / {{ max }}
      </div>
    </div>

    <UProgress
      :model-value="progress"
      :max="max"
      size="lg"
      status
      :ui="{
        root: 'flex-row items-center',
        base: 'flex-1',
        status: 'w-fit!',
      }"
    />
  </div>
</template>
