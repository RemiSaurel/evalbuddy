<script setup lang="ts">
const { languages, languageValue } = useLanguage()
</script>

<template>
  <div class="w-screen h-screen max-w-5xl m-auto px-4 ">
    <nav class="flex gap-4 items-center py-4 justify-between ">
      <span class="text-2xl font-bold">
        <NuxtLink to="/">🧑‍🏫 EvalBuddy</NuxtLink>
      </span>

      <USelect
        v-model="languageValue"
        :items="languages"
        color="neutral"
      />
    </nav>
    <slot />
  </div>
</template>
