<template>
    <button
        @click="toggleColorMode"
        class="p-2 rounded-md transition hover:bg-gray-200 dark:hover:bg-gray-700"
        aria-label="Toggle dark mode"
    >
        <Icon v-if="colorMode.preference === 'light'" name="lucide:moon" />
        <Icon v-else-if="colorMode.preference === 'dark'" name="lucide:sun" />
        <Icon v-else name="lucide:monitor" />
    </button>
</template>

<script setup>
    const colorMode = useColorMode();

    const toggleColorMode = () => {
        const modes = ['light', 'dark', 'system']
        const current = modes.indexOf(colorMode.preference)
        colorMode.preference = modes[(current + 1) % modes.length]
    }
</script>