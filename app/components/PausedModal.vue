<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ open?: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'resume'): void
  (e: 'goHome'): void
}>()

const openLocal = computed({
  get: () => props.open ?? false,
  set: (v: boolean) => emit('update:open', v),
})

function onResume() {
  emit('resume')
  emit('update:open', false)
}

function onGoHome() {
  emit('goHome')
  emit('update:open', false)
}
</script>

<template>
  <UModal
    v-model:open="openLocal"
    :title="$t('evaluation.pausedModal.title')"
    :description="$t('evaluation.pausedModal.body')"
    :close="false"
    :dismissible="false"
  >
    <template #footer>
      <UButton
        icon="i-lucide:play"
        variant="soft"
        @click="onResume"
      >
        {{ $t('evaluation.pausedModal.resumeButton') }}
      </UButton>
      <UButton
        icon="i-lucide:home"
        variant="ghost"
        @click="onGoHome"
      >
        {{ $t('evaluation.pausedModal.homeButton') }}
      </UButton>
    </template>
  </UModal>
</template>
