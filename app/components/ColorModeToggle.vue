<script setup lang="ts">
type ColorModePreference = 'light' | 'dark' | 'system'

const colorMode = useColorMode()

function toggleColorMode() {
  const modes: ColorModePreference[] = ['light', 'dark', 'system']
  const current = modes.indexOf(colorMode.preference as ColorModePreference)
  colorMode.preference = modes[(current + 1) % modes.length] as ColorModePreference
}
</script>

<template>
  <UButton
    class="p-2 rounded-md transition-colors"
    aria-label="Toggle color mode"
    variant="ghost"
    color="neutral"
    @click="toggleColorMode"
  >
    <Icon v-if="colorMode.preference === 'light'" name="lucide:moon" />
    <Icon v-else-if="colorMode.preference === 'dark'" name="lucide:sun" />
    <Icon v-else name="lucide:monitor" />
  </UButton>
</template>
