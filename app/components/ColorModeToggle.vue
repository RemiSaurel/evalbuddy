<script setup lang="ts">
type ColorModePreference = 'light' | 'dark' | 'system'

const colorMode = useColorMode()

const icon = computed(() => {
  if (colorMode.preference === 'light')
    return 'i-lucide:moon'
  if (colorMode.preference === 'dark')
    return 'i-lucide:sun'
  return 'i-lucide:monitor'
})

function toggleColorMode() {
  const modes: ColorModePreference[] = ['light', 'dark', 'system']
  const current = modes.indexOf(colorMode.preference as ColorModePreference)
  colorMode.preference = modes[(current + 1) % modes.length] as ColorModePreference
}
</script>

<template>
  <UButton
    aria-label="Toggle color mode"
    variant="ghost"
    color="neutral"
    @click="toggleColorMode"
  >
    <!-- 100ms crossfade so the icon doesn't teleport while the whole page's
         colours are transitioning underneath it. -->
    <Transition
      mode="out-in"
      enter-active-class="transition duration-100 ease-out-expo"
      leave-active-class="transition duration-100 ease-out-expo"
      enter-from-class="opacity-0 scale-95"
      leave-to-class="opacity-0 scale-95"
    >
      <UIcon :key="icon" :name="icon" class="size-4" />
    </Transition>
  </UButton>
</template>
