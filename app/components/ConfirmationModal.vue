<script setup lang="ts">
import { computed } from 'vue'

interface ConfirmationModalAction {
  label: string
  icon?: string
  variant?: 'solid' | 'soft' | 'outline' | 'ghost' | 'link'
  color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error'
  closeOnClick?: boolean
  onClick?: () => void
}

const props = withDefaults(defineProps<{
  open?: boolean
  title: string
  description?: string
  actions?: ConfirmationModalAction[]
  close?: boolean
  dismissible?: boolean
}>(), {
  open: false,
  actions: () => [],
  close: false,
  dismissible: false,
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const isOpen = computed({
  get: () => props.open ?? false,
  set: (value: boolean) => emit('update:open', value),
})

function handleAction(action: ConfirmationModalAction) {
  action.onClick?.()

  if (action.closeOnClick !== false)
    isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :description="description"
    :close="close"
    :dismissible="dismissible"
  >
    <div @keydown.stop>
      <slot />
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2" @keydown.stop>
        <UButton
          v-for="(action, index) in actions"
          :key="`${action.label}-${index}`"
          :icon="action.icon"
          :variant="action.variant ?? 'soft'"
          :color="action.color"
          @click="handleAction(action)"
        >
          {{ action.label }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
