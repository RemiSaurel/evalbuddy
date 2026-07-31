<script setup lang="ts">
const { t } = useI18n()

const items = computed(() => [
  {
    label: t('navigation.evaluations'),
    icon: 'i-lucide:clipboard-check',
    to: '/',
    exact: true,
  },
  {
    label: t('navigation.configurations'),
    icon: 'i-lucide:sliders-horizontal',
    to: '/configurations',
  },
])
</script>

<template>
  <header class="flex shrink-0 items-center gap-4 border-b border-default bg-default px-4 py-2">
    <NuxtLink
      to="/"
      class="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]"
    >
      <span class="flex size-6 items-center justify-center rounded-md bg-primary">
        <UIcon name="i-lucide:check" class="size-4 text-inverted" />
      </span>
      <span class="text-sm font-semibold tracking-tight text-highlighted">EvalBuddy</span>
    </NuxtLink>

    <!-- Labels collapse below sm so the bar never overflows on a phone; the
         icons plus the active state still say where you are. -->
    <UNavigationMenu
      :items="items"
      variant="link"
      class="ms-2"
      :ui="{ linkLabel: 'truncate hidden sm:inline' }"
    />

    <div class="ms-auto flex items-center gap-1">
      <LocaleSelect />
      <ColorModeToggle />
    </div>
  </header>
</template>
