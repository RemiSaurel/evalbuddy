<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="w-screen h-screen max-w-6xl m-auto px-4 ">
    <nav class="flex gap-4 items-center py-4 justify-between ">
      <span class="text-2xl font-bold">
        <NuxtLink to="/">🧑‍🏫 EvalBuddy</NuxtLink>
      </span>

      <div class="flex items-center gap-4">
        <!-- Navigation Links -->
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

        <!-- Language Selector -->
        <LocaleSelect />
      </div>
    </nav>
    <slot />
  </div>
</template>
