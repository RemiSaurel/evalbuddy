<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isBlurPauseModalOpen = computed({
  get: () => props.open ?? false,
  set: (v: boolean) => emit('update:open', v),
})

function onConfirm() {
  emit('confirm')
  emit('update:open', false)
}

function onCancel() {
  emit('cancel')
  emit('update:open', false)
}
</script>

<template>
  <UModal
    v-model:open="isBlurPauseModalOpen"
    :title="$t('evaluation.blurPauseModal.title')"
    :description="$t('evaluation.blurPauseModal.body')"
    :close="false"
    :dismissible="false"
  >
    <template #footer>
      <UButton
        icon="i-lucide:pause"
        variant="soft"
        @click="onConfirm"
      >
        {{ $t('evaluation.blurPauseModal.pauseButton') }}
      </UButton>
      <UButton
        icon="i-lucide:play"
        variant="ghost"
        @click="onCancel"
      >
        {{ $t('evaluation.blurPauseModal.continueButton') }}
      </UButton>
    </template>
  </UModal>
</template>
