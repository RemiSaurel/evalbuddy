<script setup lang="ts">
defineProps<{
  buttonSize: 'xs' | 'sm'
  itemIndex: string
  subItemIndex?: string
  isCurrentItem: boolean
  isItemEvaluated: boolean
}>()
</script>

<template>
  <button
    class="rounded-full text-xs font-medium transition-all duration-200 flex
    flex-col items-center justify-center gap-1 hover:shadow-md"
    :class="{
      'ring-2 ring-blue-700 ring-offset-2': isCurrentItem,
      'bg-neutral-600 text-white': isItemEvaluated,
      'bg-neutral-200 text-neutral-500': !isItemEvaluated,
      'size-12 min-w-12': buttonSize === 'xs',
      'size-14 min-w-14': buttonSize === 'sm',
    }"
  >
    <span class="font-bold text-lg leading-none">
      {{ itemIndex }}
    </span>
    <span v-if="subItemIndex" class="text-xs leading-none">
      {{ subItemIndex }}
    </span>
  </button>
</template>
