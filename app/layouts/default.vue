<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col h-dvh bg-white text-black dark:bg-neutral-900 dark:text-white transition-colors">
    <!-- Top nav bar (same as evaluation layout) -->
    <nav class="flex shrink-0 gap-4 items-center py-3 px-4 justify-between border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors">
      <span class="text-2xl font-bold">
        <NuxtLink to="/">🧑‍🏫 EvalBuddy</NuxtLink>
      </span>

      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide:home"
          >
            {{ t('navigation.evaluations') }}
          </UButton>

          <UButton
            to="/configurations"
            variant="ghost"
            color="neutral"
            size="sm"
            icon="i-lucide:settings"
          >
            {{ t('navigation.configurations') }}
          </UButton>
          <ColorModeToggle />
        </div>

        <LocaleSelect />
      </div>
    </nav>

    <div class="flex-1 overflow-y-auto">
      <div class="max-w-6xl mx-auto px-4 py-4">
        <slot />
      </div>
    </div>
  </div>
</template>
