<script setup lang="ts">
import type { EvaluationConfig } from '~/models'

const props = defineProps<{
  config: EvaluationConfig | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [open: boolean]
}>()

const { t } = useI18n()
const { getEvaluationTypeMeta } = useEvaluationConfig()

// Local state
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

// Get evaluation type metadata
const typeMeta = computed(() => {
  if (!props.config)
    return null
  return getEvaluationTypeMeta(props.config.type as any)
})

function close() {
  isOpen.value = false
}
</script>

<template>
  <UModal v-model:open="isOpen" title="View Configuration Modal" description="View Configuration Modal">
    <template #content>
      <UCard v-if="config">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ t('configuration.viewModal.title') }}
            </h3>
            <UButton icon="i-lucide:x" color="neutral" variant="ghost" size="sm" @click="close" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Configuration Name -->
          <div class="space-y-2">
            <div class="text-sm font-medium text-neutral-700">
              {{ t('configuration.modal.fields.configurationName') }}
            </div>
            <div class="text-base">
              {{ config.name }}
            </div>
          </div>

          <!-- Configuration Type -->
          <div class="space-y-2">
            <div class="text-sm font-medium text-neutral-700">
              {{ t('configuration.modal.chooseType') }}
            </div>
            <div class="flex items-center gap-2">
              <UIcon v-if="typeMeta" :name="typeMeta.icon" class="text-primary-500" />
              <span class="text-base">{{ typeMeta?.label }}</span>
            </div>
          </div>

          <!-- Mastery Levels Configuration -->
          <div
            v-if="config.type === 'mastery' && config.settings.masterySettings"
            class="space-y-3"
          >
            <USeparator />
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide:layers" class="w-5 h-5 text-primary-500" />
              <h5 class="text-sm font-medium text-neutral-700">
                {{ t('configuration.modal.fields.masteryLevels') }}
              </h5>
            </div>

            <ul class="space-y-2">
              <li
                v-for="(level, index) in config.settings.masterySettings.levels"
                :key="level.id"
                class="flex items-start gap-3 p-3 border border-neutral-200 rounded-lg"
              >
                <span class="text-sm text-neutral-500">{{ index + 1 }}.</span>
                <div class="flex-1 space-y-1">
                  <div class="font-medium">
                    {{ level.label }}
                  </div>
                  <div v-if="level.description" class="text-sm text-neutral-600">
                    {{ level.description }}
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <!-- Boolean Configuration -->
          <div
            v-if="config.type === 'boolean' && config.settings.booleanSettings"
            class="space-y-3"
          >
            <USeparator />
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide:check-circle" class="w-5 h-5 text-primary-500" />
              <h5 class="text-sm font-medium text-neutral-700">
                {{ t('configuration.modal.fields.booleanLabels') }}
              </h5>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.trueLabel') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.booleanSettings.trueLabel }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.falseLabel') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.booleanSettings.falseLabel }}
                </div>
              </div>
            </div>
          </div>

          <!-- Score Configuration -->
          <div
            v-if="config.type === 'score' && config.settings.scoreSettings"
            class="space-y-3"
          >
            <USeparator />
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide:hash" class="w-5 h-5 text-primary-500" />
              <h5 class="text-sm font-medium text-neutral-700">
                {{ t('configuration.modal.fields.scoreSettings') }}
              </h5>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.minimumValue') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.scoreSettings.minValue }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.maximumValue') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.scoreSettings.maxValue }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.step') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.scoreSettings.step }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-sm text-neutral-600">
                  {{ t('configuration.modal.fields.unit') }}
                </div>
                <div class="font-medium">
                  {{ config.settings.scoreSettings.unit || '—' }}
                </div>
              </div>
            </div>

            <div v-if="config.settings.scoreSettings.passingScore !== undefined" class="space-y-1">
              <div class="text-sm text-neutral-600">
                {{ t('configuration.modal.fields.passingScore') }}
              </div>
              <div class="font-medium">
                {{ config.settings.scoreSettings.passingScore }}
              </div>
            </div>
          </div>

          <!-- Comment Settings -->
          <div class="space-y-3">
            <USeparator />
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide:message-circle" class="w-5 h-5 text-primary-500" />
              <h5 class="text-sm font-medium text-neutral-700">
                {{ t('configuration.modal.fields.commentSettings') }}
              </h5>
            </div>

            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <UIcon
                  :name="config.settings.allowComments ? 'i-lucide:check' : 'i-lucide:x'"
                  :class="config.settings.allowComments ? 'text-green-600' : 'text-neutral-400'"
                />
                <span class="text-sm">{{ t('configuration.modal.fields.allowComments') }}</span>
              </div>

              <div class="flex items-center gap-2">
                <UIcon
                  :name="config.settings.requireComments ? 'i-lucide:check' : 'i-lucide:x'"
                  :class="config.settings.requireComments ? 'text-green-600' : 'text-neutral-400'"
                />
                <span class="text-sm">{{ t('configuration.modal.fields.requireComments') }}</span>
              </div>
            </div>
          </div>

          <!-- Metadata -->
          <div class="space-y-3">
            <USeparator />
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="space-y-1">
                <div class="text-neutral-600">
                  {{ t('configuration.created') }}
                </div>
                <div class="font-medium">
                  {{ new Date(config.createdAt).toLocaleDateString() }}
                </div>
              </div>

              <div class="space-y-1">
                <div class="text-neutral-600">
                  {{ t('configuration.updated') }}
                </div>
                <div class="font-medium">
                  {{ new Date(config.updatedAt).toLocaleDateString() }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton color="neutral" variant="ghost" @click="close">
              {{ t('configuration.actions.cancel') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
