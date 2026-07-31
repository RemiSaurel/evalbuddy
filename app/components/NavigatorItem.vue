<script setup lang="ts">
import { NAVIGATOR_STATE_CLASSES } from '@/utils/navigatorStyles'

defineProps<{
  buttonSize: 'xs' | 'sm'
  itemIndex: number | string
  subItemIndex?: number
  isCurrentItem: boolean
  isItemEvaluated: boolean
}>()
</script>

<template>
  <!-- Hottest element in the app: one of these re-renders per arrow press,
       dozens at a time. Only colour and shadow transition — never width or
       size, which would animate layout. -->
  <button
    type="button"
    class="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-full text-xs font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]"
    :class="[
      isItemEvaluated ? NAVIGATOR_STATE_CLASSES.evaluated : NAVIGATOR_STATE_CLASSES.pending,
      {
        [NAVIGATOR_STATE_CLASSES.current]: isCurrentItem,
        'size-9': buttonSize === 'xs',
        'size-10': buttonSize === 'sm',
      },
    ]"
  >
    <span class="text-sm font-semibold leading-none">
      {{ itemIndex }}
    </span>
    <span v-if="subItemIndex" class="text-[10px] leading-none opacity-70">
      {{ subItemIndex }}
    </span>
  </button>
</template>
