<script setup lang="ts">
defineProps<{
  handleClass: string
}>()

const emit = defineEmits<{
  (e: 'remove'): void
}>()

const label = defineModel<string>('label')
const description = defineModel<string>('description')

const { t } = useI18n()
</script>

<template>
  <div class="flex gap-2 w-full pl-1.5 pr-3 py-3 rounded-lg bg-neutral-100">
    <UIcon
      name="i-lucide-grip-vertical"
      :class="handleClass"
      class="size-5 text-neutral-500 cursor-grab hover:text-neutral-700
      transition-colors duration-150"
    />

    <div class="flex-1">
      <div class="flex items-center gap-3 mb-2">
        <UInput
          v-model="label"
          :placeholder="t('configuration.modal.fields.levelName')"
          class="flex-1"
        />
        <!-- Delete action -->
        <UButton
          icon="i-lucide:trash-2"
          color="error"
          variant="ghost"
          size="sm"
          @click="emit('remove')"
        />
      </div>

      <UTextarea
        v-model="description"
        :rows="1"
        :placeholder="t('configuration.modal.fields.levelDescription')"
        class="w-full"
      />
    </div>
  </div>
</template>
