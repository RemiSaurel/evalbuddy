<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="flex flex-col h-dvh">
    <!-- Top nav bar -->
    <nav class="flex shrink-0 gap-4 items-center py-3 px-4 justify-between border-b border-neutral-200 bg-white">
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
        </div>

        <LocaleSelect />
      </div>
    </nav>

    <slot />
  </div>
</template>
