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
      class="size-3.5 hover:text-black dark:hover:text-white transition-colors duration-200"
    />

    <template #content>
      <!-- Legend -->
      <div class="flex items-center gap-4 text-xs p-2 text-neutral-800 dark:text-neutral-200 transition-colors">
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-600" />
          <span>{{ t('evaluation.navigation.evaluated') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-900 transition-colors" />
          <span>{{ t('evaluation.navigation.pending') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full border border-blue-700 dark:border-blue-400" />
          <span>{{ t('evaluation.navigation.current') }}</span>
        </div>
      </div>
    </template>
  </UPopover>
</template>
