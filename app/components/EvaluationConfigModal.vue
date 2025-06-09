<script setup lang="ts">
import type { EvaluationConfig, EvaluationType, MasteryLevelDefinition } from '@/models/index'
import { useSortable } from '@vueuse/integrations/useSortable'

const props = defineProps<{
  modelValue: EvaluationConfig | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [config: EvaluationConfig | null]
  'update:open': [open: boolean]
  'save': [config: EvaluationConfig]
}>()

const { t } = useI18n()
const { getDefaultConfig, validateConfig } = useEvaluationConfig()

// Local state
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const localConfig = ref<EvaluationConfig | null>(null)
const validationErrors = ref<string[]>([])
const activeTab = ref<string>('basic')
const isSaving = ref(false)

// Initialize local config when props change
watch(() => props.modelValue, (newConfig) => {
  if (newConfig) {
    localConfig.value = JSON.parse(JSON.stringify(newConfig)) // Deep clone
  }
  else {
    localConfig.value = null
  }
}, { immediate: true, deep: true })

// Reset state when modal closes
watch(isOpen, (isOpenNow) => {
  if (!isOpenNow) {
    // Reset all state when modal is closed
    localConfig.value = null
    validationErrors.value = []
    isSaving.value = false
    activeTab.value = 'basic'
  }
})

const currentMasteryLevels = computed(() =>
  localConfig.value?.settings.masterySettings?.levels ?? [],
)

// Evaluation type options
const evaluationTypes: ComputedRef<Array<{ value: EvaluationType, label: string, description: string }>> = computed(() => [
  {
    value: 'mastery',
    label: t('configuration.modal.types.mastery.label'),
    description: t('configuration.modal.types.mastery.description'),
  },
  {
    value: 'boolean',
    label: t('configuration.modal.types.boolean.label'),
    description: t('configuration.modal.types.boolean.description'),
  },
  {
    value: 'score',
    label: t('configuration.modal.types.score.label'),
    description: t('configuration.modal.types.score.description'),
  },
])

// Methods
function createNewConfig(type: EvaluationType) {
  const defaultName = `${evaluationTypes.value.find(t => t.value === type)?.label} ${t('configuration.modal.configurationSuffix')}`
  localConfig.value = getDefaultConfig(type, defaultName)
  activeTab.value = 'basic'
}

function validateAndSave() {
  if (!localConfig.value)
    return

  isSaving.value = true
  validationErrors.value = validateConfig(localConfig.value)

  if (validationErrors.value.length === 0) {
    emit('save', localConfig.value)
    emit('update:modelValue', localConfig.value)
    isOpen.value = false
  }

  isSaving.value = false
}

function cancel() {
  localConfig.value = null
  validationErrors.value = []
  isSaving.value = false
  activeTab.value = 'basic' // Reset tab to default
  emit('update:modelValue', null)
  isOpen.value = false
}

// Add mastery level
function addMasteryLevel() {
  if (!localConfig.value?.settings.masterySettings)
    return

  const levels = localConfig.value.settings.masterySettings.levels
  const newOrder = Math.max(...levels.map(l => l.order), 0) + 1

  levels.push({
    id: `level_${Date.now()}`,
    label: `${t('configuration.modal.fields.level')} ${newOrder}`,
    description: '',
    color: 'bg-neutral-300 text-neutral-800 hover:bg-neutral-400',
    order: newOrder,
  })
}

// Remove mastery level
function removeMasteryLevel(index: number) {
  if (!localConfig.value?.settings.masterySettings)
    return
  localConfig.value.settings.masterySettings.levels.splice(index, 1)
}

function swapOrders(levels: Array<{ order: number }>, index1: number, index2: number) {
  if (index1 < 0 || index2 < 0 || index1 >= levels.length || index2 >= levels.length) {
    return
  }

  const level1 = levels[index1]
  const level2 = levels[index2]

  if (!level1 || !level2) {
    return
  }

  // Swap the order values
  const temp = level1.order
  level1.order = level2.order
  level2.order = temp

  // Sort the array by order to reflect the new positions
  levels.sort((a, b) => a.order - b.order)
}

// Swap mastery levels
function swapMasteryLevels(index1: number, index2: number) {
  if (!localConfig.value?.settings.masterySettings?.levels) {
    return
  }
  swapOrders(localConfig.value.settings.masterySettings.levels, index1, index2)
}

// Swap mastery levels with drag-and-drop
const dragAndDropHandle = 'grip'
const masteryLevelsList = useTemplateRef<HTMLElement>('masteryLevels')
onMounted(() => {
  // FIXME not working at all
  useSortable<MasteryLevelDefinition>(
    masteryLevelsList,
    currentMasteryLevels,
    {
      animation: 200,
      handle: `.${dragAndDropHandle}`, // allow dragging only with the handle
    },
  )
})
</script>

<template>
  <UModal v-model:open="isOpen" title="Evaluation Config Modal" description="Evaluation Config Modal">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">
              {{ localConfig ? t('configuration.modal.title.edit') : t('configuration.modal.title.create') }}
            </h3>
            <UButton icon="i-lucide:x" color="neutral" variant="ghost" size="sm" @click="cancel" />
          </div>
        </template>

        <div class="space-y-6">
          <!-- Evaluation Type Selection (only for new configs) -->
          <div v-if="!localConfig" class="space-y-4">
            <h4 class="font-medium">
              {{ t('configuration.modal.chooseType') }}
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="type in evaluationTypes" :key="type.value"
                class="cursor-pointer hover:shadow-md transition-all duration-200 border border-neutral-200 hover:border-primary-300 p-3 rounded-lg"
                @click="createNewConfig(type.value)"
              >
                <div class="font-medium text-neutral-900">
                  {{ type.label }}
                </div>
                <div class="text-sm text-neutral-500 mt-1">
                  {{ type.description }}
                </div>
              </div>
            </div>
          </div>

          <!-- Configuration Form -->
          <div v-if="localConfig" class="space-y-6">
            <!-- Tabs -->
            <UTabs
              v-model="activeTab" :unmount-on-hide="false" :items="[
                { label: t('configuration.modal.tabs.basic'), value: 'basic', slot: 'basic', icon: 'i-lucide:settings' },
                { label: t('configuration.modal.tabs.evaluation'), value: 'evaluation', slot: 'evaluation', icon: 'i-lucide:clipboard-list' },
                { label: t('configuration.modal.tabs.comments'), value: 'comments', slot: 'comments', icon: 'i-lucide:message-circle' },
              ]"
            >
              <!-- Basic Settings Tab -->
              <template #basic>
                <div class="space-y-4 mt-4">
                  <UFormField :label="t('configuration.modal.fields.configurationName')">
                    <UInput
                      v-model="localConfig.name"
                      :placeholder="t('configuration.modal.fields.configurationNamePlaceholder')"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </template>

              <!-- Evaluation Options Tab -->
              <template #evaluation>
                <div class="space-y-6 mt-4">
                  <!-- Mastery Level Configuration -->
                  <div
                    v-if="localConfig.type === 'mastery' && localConfig.settings.masterySettings"
                    class="space-y-4"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide:layers" class="w-5 h-5 text-primary-500" />
                        <h5 class="font-medium">
                          {{ t('configuration.modal.fields.masteryLevels') }}
                        </h5>
                      </div>
                      <UButton icon="i-lucide:plus" size="sm" @click="addMasteryLevel">
                        {{ t('configuration.modal.buttons.addLevel') }}
                      </UButton>
                    </div>

                    <ul ref="masteryLevels" class="space-y-3">
                      <!-- TODO fix modal height with scroll when too much elements -->
                      <li
                        v-for="(level, index) in currentMasteryLevels"
                        :key="level.id"
                        class="flex flex-col gap-0 items-center"
                      >
                        <div class="flex w-full gap-3">
                          <span class="mt-1.5">
                            {{ index + 1 }}.
                          </span>
                          <EvaluationConfigMasteryLevelOption
                            v-model:label="level.label"
                            v-model:description="level.description"
                            :handle-class="dragAndDropHandle"
                            class="flex-1"
                            @remove="removeMasteryLevel(index)"
                          />
                        </div>

                        <UButton
                          v-if="index < currentMasteryLevels.length - 1"
                          class="mt-2" size="lg" variant="ghost"
                          icon="i-lucide:arrow-up-down"
                          @click="swapMasteryLevels(index, index + 1)"
                        />
                      </li>
                    </ul>
                  </div>

                  <!-- Boolean Configuration -->
                  <div
                    v-if="localConfig.type === 'boolean' && localConfig.settings.booleanSettings"
                    class="space-y-4"
                  >
                    <USeparator />
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide:check-circle" class="w-5 h-5 text-primary-500" />
                      <h5 class="font-medium">
                        {{ t('configuration.modal.fields.booleanLabels') }}
                      </h5>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <UFormField :label="t('configuration.modal.fields.trueLabel')">
                        <UInput
                          v-model="localConfig.settings.booleanSettings.trueLabel"
                          :placeholder="t('configuration.modal.fields.trueLabelPlaceholder')"
                        />
                      </UFormField>

                      <UFormField :label="t('configuration.modal.fields.falseLabel')">
                        <UInput
                          v-model="localConfig.settings.booleanSettings.falseLabel"
                          :placeholder="t('configuration.modal.fields.falseLabelPlaceholder')"
                        />
                      </UFormField>
                    </div>
                  </div>

                  <!-- Score Configuration -->
                  <div
                    v-if="localConfig.type === 'score' && localConfig.settings.scoreSettings"
                    class="space-y-4"
                  >
                    <USeparator />
                    <div class="flex items-center gap-2">
                      <UIcon name="i-lucide:hash" class="w-5 h-5 text-primary-500" />
                      <h5 class="font-medium">
                        {{ t('configuration.modal.fields.scoreSettings') }}
                      </h5>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                      <UFormField :label="t('configuration.modal.fields.minimumValue')">
                        <UInput
                          :model-value="localConfig.settings.scoreSettings.minValue"
                          type="number"
                          @update:model-value="localConfig.settings.scoreSettings.minValue = Number($event)"
                        />
                      </UFormField>

                      <UFormField :label="t('configuration.modal.fields.maximumValue')">
                        <UInput
                          :model-value="localConfig.settings.scoreSettings.maxValue"
                          type="number"
                          @update:model-value="localConfig.settings.scoreSettings.maxValue = Number($event)"
                        />
                      </UFormField>

                      <UFormField :label="t('configuration.modal.fields.step')">
                        <UInput
                          :model-value="localConfig.settings.scoreSettings.step"
                          type="number" :min="0.1" :step="0.1"
                          @update:model-value="localConfig.settings.scoreSettings.step = Number($event)"
                        />
                      </UFormField>

                      <UFormField :label="t('configuration.modal.fields.unit')">
                        <UInput
                          v-model="localConfig.settings.scoreSettings.unit"
                          :placeholder="t('configuration.modal.fields.unitPlaceholder')"
                        />
                      </UFormField>
                    </div>

                    <UFormField :label="t('configuration.modal.fields.passingScore')">
                      <UInput
                        :model-value="localConfig.settings.scoreSettings.passingScore"
                        type="number" :placeholder="t('configuration.modal.fields.passingScorePlaceholder')"
                        @update:model-value="localConfig.settings.scoreSettings.passingScore = Number($event)"
                      />
                    </UFormField>
                  </div>
                </div>
              </template>

              <!-- Comments Tab -->
              <template #comments>
                <div class="space-y-4 mt-4">
                  <div class="flex items-center gap-2">
                    <UIcon name="i-lucide:message-circle" class="w-5 h-5 text-primary-500" />
                    <h5 class="font-medium">
                      {{ t('configuration.modal.fields.commentSettings') }}
                    </h5>
                  </div>

                  <div class="space-y-3">
                    <UCheckbox
                      v-model="localConfig.settings.allowComments"
                      :label="t('configuration.modal.fields.allowComments')"
                    />

                    <UCheckbox
                      v-model="localConfig.settings.requireComments"
                      :disabled="!localConfig.settings.allowComments" :label="t('configuration.modal.fields.requireComments')"
                    />
                  </div>
                </div>
              </template>
            </UTabs>

            <!-- Validation Errors -->
            <UAlert
              v-if="validationErrors.length > 0" icon="i-lucide:alert-circle" color="error"
              variant="subtle" :title="t('configuration.modal.validation.title')"
            >
              <template #description>
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="error in validationErrors" :key="error">
                    {{ error }}
                  </li>
                </ul>
              </template>
            </UAlert>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton color="neutral" variant="ghost" @click="cancel">
              {{ t('configuration.modal.buttons.cancel') }}
            </UButton>
            <UButton
              v-if="localConfig" color="primary" :loading="isSaving" :disabled="isSaving"
              @click="validateAndSave"
            >
              {{ t('configuration.modal.buttons.save') }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
