<script setup lang="ts">
defineProps<{ icon: string, label: string }>()
</script>

<template>
  <div class="flex items-center gap-1.5">
    <UIcon :name="icon" class="size-4 text-dimmed" />
    <h3 class="text-sm font-medium text-highlighted">
      {{ label }}
    </h3>
  </div>
</template>
