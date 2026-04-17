<script setup lang="ts">
import type { EvaluationConfig, EvaluationItem } from '~/models'

interface Props {
  currentItem: EvaluationItem & { questionText?: string, referenceAnswer?: string }
  evaluatorComment: string
  evaluatedItems: { [itemId: string]: { value?: any, masteryLevel?: any, comment?: string } }
  evaluationConfig?: EvaluationConfig | any
  evaluateGenericAndGoNext?: (value: any, comment?: string) => void
  saveEvaluation?: (value: any, comment?: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:evaluatorComment': [comment: string]
}>()

const { t } = useI18n()
const { getEvaluationOptions, isScoreType, getScoreSettings } = useEvaluationConfig()

const selectedValue = ref<any>(null)
const localComment = ref('')

// Track item ID for motion transitions
const itemKey = computed(() => props.currentItem?.id ?? '')

watch(() => props.currentItem, () => {
  loadEvaluationForCurrentItem()
}, { immediate: true })

watch(() => props.evaluatedItems, () => {
  loadEvaluationForCurrentItem()
}, { deep: true })

watch(() => props.evaluatorComment, (newComment) => {
  localComment.value = newComment || ''
}, { immediate: true })

function loadEvaluationForCurrentItem() {
  if (props.currentItem) {
    const existingEvaluation = props.evaluatedItems[props.currentItem.id]
    if (existingEvaluation) {
      selectedValue.value = existingEvaluation.value ?? existingEvaluation.masteryLevel ?? null
      localComment.value = existingEvaluation.comment || ''
    }
    else {
      selectedValue.value = null
      localComment.value = ''
    }
  }
  else {
    selectedValue.value = null
    localComment.value = ''
  }
}

const evaluationOptions = computed(() => {
  if (props.evaluationConfig) {
    return getEvaluationOptions(props.evaluationConfig)
  }
  return []
})

const scoreSettings = computed(() => {
  if (props.evaluationConfig) {
    return getScoreSettings(props.evaluationConfig)
  }
  return null
})

const isScoreEvaluation = computed(() => {
  if (props.evaluationConfig) {
    return isScoreType(props.evaluationConfig)
  }
  return false
})

const commentsAllowed = computed(() => {
  if (props.evaluationConfig) {
    return props.evaluationConfig.settings.allowComments
  }
  return true
})

const commentsRequired = computed(() => {
  if (props.evaluationConfig) {
    return props.evaluationConfig.settings.requireComments
  }
  return false
})

const canConfirmEvaluation = computed(() => {
  const hasValue = selectedValue.value !== null && selectedValue.value !== undefined
  const hasRequiredComment = !commentsRequired.value || (localComment.value && localComment.value.trim())
  return hasValue && hasRequiredComment
})

// Auto-advance: when comments are not allowed or not required and empty,
// selecting a value auto-confirms
const shouldAutoAdvance = computed(() => {
  return !commentsAllowed.value || (!commentsRequired.value && !localComment.value?.trim())
})

function onCommentUpdate(value: string) {
  localComment.value = value
  emit('update:evaluatorComment', value)
}

function selectValue(value: any) {
  selectedValue.value = value

  // Auto-advance for non-score types when comments not needed
  if (!isScoreEvaluation.value && shouldAutoAdvance.value) {
    nextTick(() => confirmEvaluation())
  }
}

function incrementScore() {
  if (!scoreSettings.value)
    return
  const current = selectedValue.value ?? scoreSettings.value.minValue
  const next = Math.min(current + scoreSettings.value.step, scoreSettings.value.maxValue)
  selectedValue.value = next
}

function decrementScore() {
  if (!scoreSettings.value)
    return
  const current = selectedValue.value ?? scoreSettings.value.minValue
  const next = Math.max(current - scoreSettings.value.step, scoreSettings.value.minValue)
  selectedValue.value = next
}

function confirmEvaluation() {
  if (!canConfirmEvaluation.value)
    return

  if (props.evaluateGenericAndGoNext) {
    const comment = commentsAllowed.value ? localComment.value : undefined
    props.evaluateGenericAndGoNext(selectedValue.value, comment)
  }

  selectedValue.value = null
  localComment.value = ''
}

// Keyboard shortcuts
useEvaluationShortcuts({
  onSelectOption: (index: number) => {
    const options = evaluationOptions.value
    if (index < options.length) {
      selectValue(options[index]!.value)
    }
  },
  onConfirm: () => confirmEvaluation(),
  onIncrement: () => incrementScore(),
  onDecrement: () => decrementScore(),
  optionCount: computed(() => evaluationOptions.value.length),
  isScoreMode: isScoreEvaluation,
})

// Score display helpers
const scoreDisplayValue = computed(() => {
  if (selectedValue.value === null || selectedValue.value === undefined)
    return '—'
  return `${selectedValue.value}${scoreSettings.value?.unit || ''}`
})

const scoreIsAtPassing = computed(() => {
  if (!scoreSettings.value?.passingScore || selectedValue.value === null)
    return null
  return selectedValue.value >= scoreSettings.value.passingScore
})
</script>

<template>
  <UCard>
    <!-- Submitted answer with transition -->
    <Motion
      :key="itemKey"
      :initial="{ opacity: 0, y: 8 }"
      :animate="{ opacity: 1, y: 0 }"
      :transition="{ duration: 0.2 }"
    >
      <div class="flex flex-col gap-3">
        <div class="text-neutral-800 text-sm font-semibold">
          {{ t('evaluation.question.submittedAnswer') }}
        </div>
        <ContentRenderer :content="currentItem.submittedAnswer" />
      </div>
    </Motion>

    <template #footer>
      <div class="flex flex-col gap-4">
        <!-- Evaluation Type Header -->
        <div class="flex justify-between items-center">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ t('evaluation.title') }}
          </div>
          <div v-if="evaluationConfig" class="text-xs text-neutral-500">
            {{ evaluationConfig.name }} ({{ evaluationConfig.type }})
          </div>
        </div>

        <!-- Score-based Evaluation: Stepper + Input -->
        <div v-if="isScoreEvaluation && scoreSettings" class="space-y-3">
          <label class="block text-sm font-medium text-neutral-700">
            Score ({{ scoreSettings.minValue }}–{{ scoreSettings.maxValue }}{{ scoreSettings.unit || '' }})
          </label>

          <div class="flex items-center gap-3">
            <UButton
              icon="i-lucide-minus"
              color="neutral"
              variant="soft"
              size="lg"
              :disabled="selectedValue !== null && selectedValue <= scoreSettings.minValue"
              @click="decrementScore"
            />

            <UInput
              :model-value="selectedValue !== null ? String(selectedValue) : ''"
              type="number"
              :min="scoreSettings.minValue"
              :max="scoreSettings.maxValue"
              :step="scoreSettings.step"
              placeholder="—"
              class="w-20 text-center [&_input]:text-center"
              size="lg"
              @update:model-value="(v: string | number) => {
                const num = Number(v)
                if (!Number.isNaN(num)) {
                  selectedValue = Math.min(Math.max(num, scoreSettings!.minValue), scoreSettings!.maxValue)
                }
              }"
            />

            <UButton
              icon="i-lucide-plus"
              color="neutral"
              variant="soft"
              size="lg"
              :disabled="selectedValue !== null && selectedValue >= scoreSettings.maxValue"
              @click="incrementScore"
            />

            <!-- Score feedback -->
            <div class="ml-2 flex items-center gap-2">
              <span
                class="text-lg font-semibold transition-colors duration-200"
                :class="scoreIsAtPassing === true ? 'text-green-600' : scoreIsAtPassing === false ? 'text-red-500' : 'text-neutral-400'"
              >
                {{ scoreDisplayValue }}
              </span>
            </div>
          </div>

          <!-- Passing score indicator -->
          <div v-if="scoreSettings.passingScore" class="text-xs text-neutral-500">
            {{ t('evaluation.passingScore') }}: {{ scoreSettings.passingScore }}{{ scoreSettings.unit || '' }}
          </div>

          <!-- Keyboard shortcut hint for score -->
          <div class="text-xs text-neutral-400">
            <UKbd>+</UKbd> / <UKbd>-</UKbd> {{ t('evaluation.shortcuts.adjustScore', 'adjust score') }}
            &middot; <UKbd>Enter</UKbd> {{ t('evaluation.shortcuts.confirm', 'confirm') }}
          </div>
        </div>

        <!-- Option-based Evaluation (Mastery, Boolean) -->
        <div v-else>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Motion
              v-for="(option, index) in evaluationOptions"
              :key="option.id"
              :while-hover="{ scale: 1.02 }"
              :while-press="{ scale: 0.97 }"
              :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
              as-child
            >
              <UButton
                :class="[option.color || '', {
                  'ring-2 ring-offset-1': selectedValue === option.value,
                  'opacity-60': selectedValue !== null && selectedValue !== option.value,
                }]"
                size="lg"
                block
                @click="selectValue(option.value)"
              >
                <div class="flex items-center justify-between w-full">
                  <div class="text-left">
                    <div class="font-semibold">
                      {{ option.label }}
                    </div>
                    <div v-if="'description' in option && option.description" class="text-xs opacity-75 mt-0.5">
                      {{ option.description }}
                    </div>
                  </div>
                  <UKbd class="opacity-50 ml-2">
                    {{ index + 1 }}
                  </UKbd>
                </div>
              </UButton>
            </Motion>
          </div>

          <!-- Keyboard shortcut hint -->
          <div class="text-xs text-neutral-400 mt-2">
            <UKbd>1</UKbd>–<UKbd>{{ evaluationOptions.length }}</UKbd> {{ t('evaluation.shortcuts.selectOption', 'select') }}
            &middot; <UKbd>Enter</UKbd> {{ t('evaluation.shortcuts.confirm', 'confirm') }}
          </div>
        </div>

        <!-- Comments Section -->
        <div v-if="commentsAllowed" class="flex flex-col gap-1">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ t('evaluation.evaluator.comment') }}
            <span v-if="commentsRequired" class="text-red-500">*</span>
          </div>
          <UTextarea
            :model-value="localComment"
            :placeholder="t('evaluation.evaluator.commentPlaceholder')"
            :rows="3"
            :required="commentsRequired"
            class="w-full"
            @update:model-value="onCommentUpdate"
          />

          <div v-if="commentsRequired && !localComment.trim()" class="text-sm text-red-600">
            {{ t('evaluation.evaluator.commentRequired') }}
          </div>
        </div>

        <!-- Confirm Evaluation Button -->
        <div class="flex justify-end pt-2">
          <UButton
            icon="i-lucide:check"
            color="primary"
            variant="solid"
            :disabled="!canConfirmEvaluation"
            :label="t('evaluation.actions.confirm')"
            @click="confirmEvaluation"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
