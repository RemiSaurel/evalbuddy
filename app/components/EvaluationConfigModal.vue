<script setup lang="ts">
import type { EvaluationConfig, EvaluationType, MasteryLevelDefinition } from '~/models'
import { useSortable } from '@vueuse/integrations/useSortable'
import { MASTERY_COLOR_CLASSES } from '~/models'

const props = defineProps<{
  modelValue: EvaluationConfig | null
  open: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [config: EvaluationConfig | null]
  'update:open': [open: boolean]
  'save': [config: EvaluationConfig]
}>()

// Maximum number of levels for mastery level evaluation
const MAXIMUM_LEVELS = 10

const { t } = useI18n()
const { getDefaultConfig, validateConfig, getEvaluationTypeMeta } = useEvaluationConfig()

// Local state
const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

const localConfig = ref<EvaluationConfig | null>(null)
const validationErrors = ref<string[]>([])
const activeTab = ref<string>('basic')
const isSaving = ref(false)

function onAfterLeave() {
  // Reset modal values once the modal is closed
  localConfig.value = null
  validationErrors.value = []
  isSaving.value = false
  activeTab.value = 'basic'
}

// Seed the local copy from the parent's selection, but only while the modal is
// open. The parent clears its selection the moment closing starts; following
// that would null localConfig mid-leave-transition, and the closing modal would
// visibly revert to the "choose a type" creation view. onAfterLeave owns the
// reset, once the modal is off screen.
watch(
  [() => props.open, () => props.modelValue],
  ([isOpenNow, newConfig]) => {
    if (!isOpenNow)
      return

    localConfig.value = newConfig
      ? JSON.parse(JSON.stringify(newConfig)) // Deep clone
      : null
  },
  { immediate: true, deep: true },
)

// Evaluation type options
const evaluationTypes: ComputedRef<Array<{ value: EvaluationType, label: string, description: string, icon?: string }>> = computed(() => [
  {
    value: 'mastery',
    label: t('configuration.modal.types.mastery.label'),
    description: t('configuration.modal.types.mastery.description'),
    icon: getEvaluationTypeMeta('mastery')?.icon,
  },
  {
    value: 'boolean',
    label: t('configuration.modal.types.boolean.label'),
    description: t('configuration.modal.types.boolean.description'),
    icon: getEvaluationTypeMeta('boolean')?.icon,
  },
  {
    value: 'score',
    label: t('configuration.modal.types.score.label'),
    description: t('configuration.modal.types.score.description'),
    icon: getEvaluationTypeMeta('score')?.icon,
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

  if (localConfig.value.type === 'mastery' && localConfig.value.settings.masterySettings?.levels) {
    syncMasteryLevelColors(localConfig.value.settings.masterySettings.levels)
  }

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
  isOpen.value = false
}

// Add mastery level
function addMasteryLevel() {
  const levels = localConfig.value?.settings.masterySettings?.levels

  if (!levels || levels.length >= MAXIMUM_LEVELS) // maximum capacity of 10 levels
    return

  const newOrder = Math.max(...levels.map(l => l.order), 0) + 1

  levels.push({
    id: `level_${Date.now()}`,
    label: `${t('configuration.modal.fields.level')} ${newOrder}`,
    description: '',
    color: '',
    order: newOrder,
  })
}

// Remove mastery level
function removeMasteryLevel(index: number) {
  if (!localConfig.value?.settings.masterySettings?.levels || localConfig.value?.settings.masterySettings?.levels.length <= 2) // 2 levels minimum required
    return
  localConfig.value?.settings.masterySettings?.levels.splice(index, 1)
}

function getMasteryLevelColor(index: number, total: number): string {
  if (total <= 1) {
    return MASTERY_COLOR_CLASSES[0]
  }

  const paletteLength = MASTERY_COLOR_CLASSES.length
  const paletteIndex = Math.round((index / (total - 1)) * (paletteLength - 1))
  return MASTERY_COLOR_CLASSES[paletteIndex] ?? MASTERY_COLOR_CLASSES[paletteLength - 1]!
}

function syncMasteryLevelColors(levels: MasteryLevelDefinition[]) {
  const total = levels.length
  levels.forEach((level, index) => {
    level.color = getMasteryLevelColor(index, total)
  })
}

// Swap mastery levels with drag-and-drop
const dragAndDropHandle = 'grip'
const masteryLevelsList = useTemplateRef<HTMLElement>('masteryLevels')
const sortableInstance = ref<ReturnType<typeof useSortable> | null>(null)

watch([isOpen, masteryLevelsList], async ([isOpenNow, list]) => {
  if (isOpenNow && list) { // list initialized after DOM rendering
    await nextTick()

    // Initialize drag-and-drop swapping
    sortableInstance.value = useSortable<MasteryLevelDefinition>(
      list,
      localConfig.value?.settings.masterySettings?.levels ?? [],
      {
        animation: 150,
        handle: `.${dragAndDropHandle}`,
        ghostClass: 'opacity-40',
        chosenClass: 'sortable-chosen',
        dragClass: 'shadow-lg',
      },
    )
  }
  else {
    sortableInstance.value = null
  }
})

// List of evaluation modes
const evaluationModes = computed(() => [
  { label: t('configuration.modal.modes.withoutAi'), value: 'without-ai' },
  { label: t('configuration.modal.modes.withAi'), value: 'with-ai' },
  { label: t('configuration.modal.modes.withoutThenWithAi'), value: 'without-then-with-ai' },
])

// Ensure a default evaluation mode is set when a local config is initialized
watch(() => localConfig.value, (cfg) => {
  if (cfg && !cfg.settings.evaluationMode) {
    cfg.settings.evaluationMode = 'without-ai'
  }
}, { immediate: true })
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="localConfig ? t('configuration.modal.title.edit') : t('configuration.modal.title.create')"
    :description="t('configuration.modal.chooseType')"
    :ui="{ content: 'max-w-2xl' }"
    @after:leave="onAfterLeave"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Evaluation Type Selection (only for new configs) -->
        <div v-if="!localConfig" class="space-y-4">
          <h4 class="text-sm font-medium text-highlighted">
            {{ t('configuration.modal.chooseType') }}
          </h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              v-for="type in evaluationTypes" :key="type.value"
              type="button"
              class="group flex flex-col gap-1 rounded-lg border border-default bg-default p-3 text-start transition-[border-color,box-shadow] hover:border-primary hover:shadow-sm active:scale-[0.99] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--ui-bg)]"
              @click="createNewConfig(type.value)"
            >
              <span class="flex items-center gap-2">
                <UIcon v-if="type.icon" :name="type.icon" class="size-4 text-dimmed" />
                <span class="font-medium text-highlighted">{{ type.label }}</span>
              </span>
              <span class="text-sm text-muted">
                {{ type.description }}
              </span>
            </button>
          </div>
        </div>

        <!-- Configuration Form -->
        <div v-if="localConfig" class="space-y-6">
          <!-- Tabs -->
          <UTabs
            v-model="activeTab" :unmount-on-hide="false" :ui="{ content: 'min-h-56' }" :items="[
              { label: t('configuration.modal.tabs.basic'), value: 'basic', slot: 'basic', icon: 'i-lucide:settings' },
              { label: t('configuration.modal.tabs.evaluation'), value: 'evaluation', slot: 'evaluation', icon: 'i-lucide:clipboard-list' },
              { label: t('configuration.modal.tabs.comments'), value: 'comments', slot: 'comments', icon: 'i-lucide:message-circle' },
              { label: t('configuration.modal.tabs.others'), value: 'others', slot: 'others', icon: 'i-lucide:list-filter-plus' },
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
                <UFormField :label="t('configuration.modal.fields.instructions')">
                  <UTextarea
                    v-model="localConfig.settings.instructions"
                    :placeholder="t('configuration.modal.fields.instructionsPlaceholder')"
                    :rows="4"
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
                    <SectionHeading icon="i-lucide:layers" :label="t('configuration.modal.fields.masteryLevels')" />
                    <UButton icon="i-lucide:plus" :label="t('configuration.modal.buttons.addLevel')" color="neutral" variant="subtle" @click="addMasteryLevel" />
                  </div>

                  <!-- The <ul> keeps the ref so useSortable still gets a real
                       DOM element; the tag-less TransitionGroup renders as a
                       fragment inside it. Adding and removing a level animates;
                       reordering is left to sortablejs, which owns the
                       transform during a drag. -->
                  <ul ref="masteryLevels" class="max-h-[50vh] space-y-3 overflow-y-auto">
                    <TransitionGroup
                      enter-active-class="transition-[opacity,transform] duration-200 ease-out-expo"
                      leave-active-class="transition-[opacity,transform] duration-150 ease-out-expo"
                      enter-from-class="opacity-0 translate-y-1"
                      leave-to-class="opacity-0 scale-95"
                      move-class="transition-transform duration-200 ease-out-expo"
                    >
                      <li
                        v-for="(level, index) in localConfig.settings.masterySettings.levels"
                        :key="level.id"
                      >
                        <div class="flex w-full gap-3">
                          <span class="mt-3 text-sm text-dimmed tabular-nums">
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
                      </li>
                    </TransitionGroup>
                  </ul>
                </div>

                <!-- Boolean Configuration -->
                <div
                  v-if="localConfig.type === 'boolean' && localConfig.settings.booleanSettings"
                  class="space-y-4"
                >
                  <SectionHeading icon="i-lucide:check-circle" :label="t('configuration.modal.fields.booleanLabels')" />

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
                  <SectionHeading icon="i-lucide:hash" :label="t('configuration.modal.fields.scoreSettings')" />

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
                <SectionHeading icon="i-lucide:message-circle" :label="t('configuration.modal.fields.commentSettings')" />

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

            <!-- Others Tab -->
            <template #others>
              <div class="space-y-4 mt-4">
                <SectionHeading icon="i-lucide:timer" :label="t('configuration.modal.fields.timerSettings')" />

                <div class="space-y-3">
                  <UCheckbox
                    v-model="localConfig.settings.timerEnabled"
                    :label="t('configuration.modal.fields.addTimer')"
                  />
                </div>

                <SectionHeading icon="i-lucide:bot" :label="t('configuration.modal.evaluationMode')" />

                <div class="space-y-3">
                  <URadioGroup
                    v-model="localConfig.settings.evaluationMode"
                    :items="evaluationModes"
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
    </template>

    <template #footer>
      <UButton :label="t('common.cancel')" color="neutral" variant="ghost" @click="cancel" />
      <UButton
        v-if="localConfig" :label="t('configuration.modal.buttons.save')" :loading="isSaving" :disabled="isSaving"
        @click="validateAndSave"
      />
    </template>
  </UModal>
</template>

<style scoped>
@reference "~/assets/css/main.css";

.sortable-chosen {
  @apply ring-2 ring-primary;
}
</style>
