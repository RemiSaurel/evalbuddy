<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ isStartModalOpen?: boolean, open?: boolean }>()
const emit = defineEmits<{
  (e: 'update:isStartModalOpen', value: boolean): void
  (e: 'update:open', value: boolean): void
}>()

const isStartModalOpen = computed<boolean>({
  get: () => props.isStartModalOpen ?? props.open ?? false,
  set: (v: boolean) => {
    emit('update:isStartModalOpen', v)
    emit('update:open', v)
  },
})
</script>

<template>
  <UModal
    v-model:open="isStartModalOpen"
    :title="$t('evaluation.timerAlertModal.title')"
    :description="$t('evaluation.timerAlertModal.body')"
    :close="false"
    :dismissible="false"
  >
    <template #footer>
      <UButton
        icon="i-lucide:play"
        variant="soft"
        @click="isStartModalOpen = false"
      >
        {{ $t('evaluation.timerAlertModal.button') }}
      </UButton>
    </template>
  </UModal>
</template>
