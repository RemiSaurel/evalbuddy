<script setup lang="ts">
defineProps<{
  modelValue: string
  required: boolean
  /**
   * Only true once the field has been touched, so the message doesn't flicker
   * in and out on every keystroke of a fresh item.
   */
  invalid: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="flex flex-1 flex-col gap-1.5">
    <div class="text-sm font-medium text-default">
      {{ t('evaluation.evaluator.comment') }}
      <span v-if="required" class="text-error">*</span>
    </div>

    <UTextarea
      :model-value="modelValue"
      :placeholder="t('evaluation.evaluator.commentPlaceholder')"
      :rows="3"
      :required="required"
      class="w-full"
      @update:model-value="(v: string | number) => emit('update:modelValue', String(v))"
      @blur="emit('blur')"
    />

    <div v-if="invalid" class="text-xs text-error">
      {{ t('evaluation.evaluator.commentRequired') }}
    </div>
  </div>
</template>
