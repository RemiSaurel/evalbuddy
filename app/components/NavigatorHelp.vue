<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <UPopover
    mode="hover"
    :content="{ align: 'center', side: 'right' }"
    arrow
    :open-delay="200"
    :close-delay="200"
  >
    <UIcon
      name="i-lucide-circle-question-mark"
      class="size-3.5 hover:text-black transition-colors duration-200"
    />

    <template #content>
      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs p-2">
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-600" />
          <span>{{ t('evaluation.navigation.evaluated') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-200" />
          <span>{{ t('evaluation.navigation.pending') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full border-1 border-blue-700" />
          <span>{{ t('evaluation.navigation.current') }}</span>
        </div>
      </div>
    </template>
  </UPopover>
</template>
