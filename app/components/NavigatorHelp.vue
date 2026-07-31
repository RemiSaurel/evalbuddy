<script setup lang="ts">
import { NAVIGATOR_STATE_CLASSES } from '@/utils/navigatorStyles'

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
      class="size-3.5 text-dimmed transition-colors hover:text-default"
    />

    <template #content>
      <!-- Swatches read from the same constants NavigatorItem uses, so the
           legend can never describe a colour the pills don't have. -->
      <div class="flex items-center gap-4 p-2 text-xs text-default">
        <div class="flex items-center gap-1.5">
          <div class="size-2.5 rounded-full" :class="NAVIGATOR_STATE_CLASSES.evaluated" />
          <span>{{ t('evaluation.navigation.evaluated') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="size-2.5 rounded-full" :class="NAVIGATOR_STATE_CLASSES.pending" />
          <span>{{ t('evaluation.navigation.pending') }}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <div class="size-2.5 rounded-full bg-elevated ring-2 ring-primary" />
          <span>{{ t('evaluation.navigation.current') }}</span>
        </div>
      </div>
    </template>
  </UPopover>
</template>
