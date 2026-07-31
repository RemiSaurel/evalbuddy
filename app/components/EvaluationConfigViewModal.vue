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
  return getEvaluationTypeMeta(props.config.type)
})

function close() {
  isOpen.value = false
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="t('configuration.viewModal.title')"
    :description="config?.name ?? ''"
    :ui="{ body: 'max-h-[70vh] overflow-y-auto' }"
  >
    <template #body>
      <div v-if="config" class="space-y-6">
        <!-- Configuration Name -->
        <div class="space-y-1">
          <div class="text-sm font-medium text-highlighted">
            {{ t('configuration.modal.fields.configurationName') }}
          </div>
          <div class="text-sm text-default">
            {{ config.name }}
          </div>
        </div>

        <!-- Instructions -->
        <div v-if="config.settings.instructions" class="space-y-1">
          <div class="text-sm font-medium text-highlighted">
            {{ t('configuration.modal.fields.instructions') }}
          </div>
          <div class="text-sm text-default whitespace-pre-wrap">
            {{ config.settings.instructions }}
          </div>
        </div>

        <!-- Configuration Type -->
        <div class="space-y-1">
          <div class="text-sm font-medium text-highlighted">
            {{ t('configuration.modal.chooseType') }}
          </div>
          <div class="flex items-center gap-2">
            <UIcon v-if="typeMeta" :name="typeMeta.icon" class="size-4 text-dimmed" />
            <span class="text-sm text-default">{{ typeMeta?.label }}</span>
          </div>
        </div>

        <!-- Mastery Levels Configuration -->
        <div
          v-if="config.type === 'mastery' && config.settings.masterySettings"
          class="space-y-3"
        >
          <SectionHeading icon="i-lucide:layers" :label="t('configuration.modal.fields.masteryLevels')" />

          <ul class="space-y-2">
            <li
              v-for="(level, index) in config.settings.masterySettings.levels"
              :key="level.id"
              class="flex items-start gap-3 p-3 border border-default bg-default rounded-lg"
            >
              <span class="text-sm text-dimmed tabular-nums">{{ index + 1 }}.</span>
              <div class="flex-1 space-y-1">
                <div class="text-sm font-medium text-highlighted">
                  {{ level.label }}
                </div>
                <div v-if="level.description" class="text-sm text-muted">
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
          <SectionHeading icon="i-lucide:check-circle" :label="t('configuration.modal.fields.booleanLabels')" />

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.trueLabel') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
                {{ config.settings.booleanSettings.trueLabel }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.falseLabel') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
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
          <SectionHeading icon="i-lucide:hash" :label="t('configuration.modal.fields.scoreSettings')" />

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.minimumValue') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
                {{ config.settings.scoreSettings.minValue }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.maximumValue') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
                {{ config.settings.scoreSettings.maxValue }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.step') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
                {{ config.settings.scoreSettings.step }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-sm text-muted">
                {{ t('configuration.modal.fields.unit') }}
              </div>
              <div class="text-sm font-medium text-highlighted">
                {{ config.settings.scoreSettings.unit || '—' }}
              </div>
            </div>
          </div>

          <div v-if="config.settings.scoreSettings.passingScore !== undefined" class="space-y-1">
            <div class="text-sm text-muted">
              {{ t('configuration.modal.fields.passingScore') }}
            </div>
            <div class="text-sm font-medium text-highlighted">
              {{ config.settings.scoreSettings.passingScore }}
            </div>
          </div>
        </div>

        <!-- Comment Settings -->
        <div class="space-y-3">
          <SectionHeading icon="i-lucide:message-circle" :label="t('configuration.modal.fields.commentSettings')" />

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <UIcon
                :name="config.settings.allowComments ? 'i-lucide:check' : 'i-lucide:x'"
                class="size-4"
                :class="config.settings.allowComments ? 'text-success' : 'text-dimmed'"
              />
              <span class="text-sm text-default">{{ t('configuration.modal.fields.allowComments') }}</span>
            </div>

            <div class="flex items-center gap-2">
              <UIcon
                :name="config.settings.requireComments ? 'i-lucide:check' : 'i-lucide:x'"
                class="size-4"
                :class="config.settings.requireComments ? 'text-success' : 'text-dimmed'"
              />
              <span class="text-sm text-default">{{ t('configuration.modal.fields.requireComments') }}</span>
            </div>
          </div>
        </div>

        <!-- Timer Settings -->
        <div class="space-y-3">
          <SectionHeading icon="i-lucide:timer" :label="t('configuration.modal.fields.timerSettings')" />

          <div class="flex items-center gap-2">
            <UIcon
              :name="config.settings.timerEnabled ? 'i-lucide:check' : 'i-lucide:x'"
              class="size-4"
              :class="config.settings.timerEnabled ? 'text-success' : 'text-dimmed'"
            />
            <span class="text-sm text-default">{{ t('configuration.modal.fields.addTimer') }}</span>
          </div>
        </div>

        <!-- Metadata -->
        <div class="space-y-3">
          <USeparator />
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="space-y-1">
              <div class="text-muted">
                {{ t('configuration.created') }}
              </div>
              <div class="font-medium text-highlighted">
                {{ new Date(config.createdAt).toLocaleDateString() }}
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-muted">
                {{ t('configuration.updated') }}
              </div>
              <div class="font-medium text-highlighted">
                {{ new Date(config.updatedAt).toLocaleDateString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton :label="t('common.close')" color="neutral" variant="subtle" @click="close" />
    </template>
  </UModal>
</template>
