<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const isNotFound = computed(() => props.error?.statusCode === 404)
</script>

<template>
  <UApp>
    <div class="flex h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <div class="flex size-11 items-center justify-center rounded-lg bg-elevated">
        <UIcon
          :name="isNotFound ? 'i-lucide:file-question' : 'i-lucide:triangle-alert'"
          class="size-5 text-muted"
        />
      </div>

      <div class="space-y-1">
        <h1 class="text-lg font-semibold text-highlighted">
          {{ isNotFound ? $t('error.notFound') : $t('error.title') }}
        </h1>
        <p class="max-w-sm text-sm text-muted">
          {{ isNotFound ? $t('error.notFoundMessage') : $t('error.message') }}
        </p>
      </div>

      <UButton
        icon="i-lucide:arrow-left"
        :label="$t('error.backHome')"
        @click="clearError({ redirect: '/' })"
      />
    </div>
  </UApp>
</template>
