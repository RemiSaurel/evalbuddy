<script setup lang="ts">
import type { ContextData } from '~/models'

defineProps<{
  label: string
  context: ContextData
}>()
</script>

<template>
  <UCollapsible v-if="context">
    <UButton
      trailing-icon="i-lucide-chevron-down"
      size="md"
      class="group w-fit"
      color="neutral"
      variant="soft"
      :label="label"
      :ui="{
        trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
      }"
    />

    <template #content>
      <div class="bg-neutral-100 mt-1.5 rounded-md p-5 flex flex-col gap-4 text-sm">
        <!-- Context key/values displayed as a list -->
        <div v-for="(value, key) in context" :key="key" class="flex gap-2">
          <span class="font-semibold text-neutral-800">
            {{ key.charAt(0).toUpperCase() + key.slice(1) }}:
          </span>

          <div v-if="Array.isArray(value)">
            <ul class="list-disc pl-5">
              <li v-for="(item, index) in value" :key="index">
                {{ item }}
              </li>
            </ul>
          </div>
          <span v-else class="whitespace-pre-line">{{ value }}</span>
        </div>
      </div>
    </template>
  </UCollapsible>
</template>
