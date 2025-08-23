<script setup lang="ts">
const { languages, languageValue } = useLanguage()
</script>

<template>
  <USelect
    v-model="languageValue"
    :items="languages"
    color="neutral"
    class="w-fit"
    placeholder=" "
    :ui="{ content: 'min-w-32' }"
  >
    <!-- Override default slot to show only short language code -->
    <template #default="{ modelValue }">
      <span v-if="modelValue" class="uppercase text-sm font-medium">
        {{ modelValue }}
      </span>
    </template>

    <!-- Item rendering - show flag and language name -->
    <template #item-leading="{ item }">
      <span class="w-5 h-5 text-center">
        {{ item.emoji }}
      </span>
    </template>

    <!-- Item label - show the language name -->
    <template #item="{ item }">
      <div class="flex items-center gap-2">
        <span class="w-5 h-5 text-center">
          {{ item.emoji }}
        </span>
        <span>{{ item.label }}</span>
      </div>
    </template>
  </USelect>
</template>
