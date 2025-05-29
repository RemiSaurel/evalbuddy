<script setup lang="ts">
import type { EvaluationConfig, MasteryLevelType } from '@/models/index'

interface Props {
  currentQuestion: any
  currentAbsoluteQuestionIndex: number
  evaluatorComment: string
  evaluatedQuestions: { [questionId: string]: { value?: any, masteryLevel?: any, comment?: string } }

  // Legacy mastery-based evaluation
  masteryLevels?: Array<{ label: string, value: MasteryLevelType, color: string }>
  evaluateAndGoNext?: (masteryLevel: MasteryLevelType) => void

  // New generic evaluation
  evaluationConfig?: EvaluationConfig | any // Allow any to handle readonly versions
  evaluateGenericAndGoNext?: (value: any, comment?: string) => void
  saveEvaluation?: (value: any, comment?: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:evaluatorComment': [comment: string]
}>()

const { t } = useI18n()
const { getEvaluationOptions, isScoreType, getScoreSettings } = useEvaluationConfig()

// Determine if we're using the new generic system or legacy mastery system
const isGenericEvaluation = computed(() => {
  return !!(props.evaluationConfig && props.evaluateGenericAndGoNext)
})

const isLegacyMastery = computed(() => {
  return !!(props.masteryLevels && props.evaluateAndGoNext)
})

// State for selected evaluation value
const selectedValue = ref<any>(null)
const localComment = ref('')

// Watch for question changes to reset selection and load existing evaluation
watch(() => props.currentQuestion, () => {
  loadEvaluationForCurrentQuestion()
}, { immediate: true })

// Watch for evaluatedQuestions changes to update the selection
watch(() => props.evaluatedQuestions, () => {
  loadEvaluationForCurrentQuestion()
}, { deep: true })

// Watch for comment prop changes
watch(() => props.evaluatorComment, (newComment) => {
  localComment.value = newComment || ''
}, { immediate: true })

// Helper function to load evaluation for current question
function loadEvaluationForCurrentQuestion() {
  if (props.currentQuestion) {
    const existingEvaluation = props.evaluatedQuestions[props.currentQuestion.id]
    if (existingEvaluation) {
      // Support both legacy masteryLevel and new value properties
      selectedValue.value = existingEvaluation.value ?? existingEvaluation.masteryLevel ?? null
      localComment.value = existingEvaluation.comment || ''
    }
    else {
      // For score evaluations, set default value to minValue for better UX
      if (isGenericEvaluation.value && props.evaluationConfig && isScoreType(props.evaluationConfig)) {
        const settings = getScoreSettings(props.evaluationConfig)
        selectedValue.value = settings?.minValue ?? null
      }
      else {
        selectedValue.value = null
      }
      localComment.value = ''
    }
  }
  else {
    selectedValue.value = null
    localComment.value = ''
  }
}

// Generic evaluation helpers
const evaluationOptions = computed(() => {
  if (isGenericEvaluation.value && props.evaluationConfig) {
    return getEvaluationOptions(props.evaluationConfig)
  }
  return []
})

const scoreSettings = computed(() => {
  if (isGenericEvaluation.value && props.evaluationConfig) {
    return getScoreSettings(props.evaluationConfig)
  }
  return null
})

const isScoreEvaluation = computed(() => {
  if (isGenericEvaluation.value && props.evaluationConfig) {
    return isScoreType(props.evaluationConfig)
  }
  return false
})

const commentsAllowed = computed(() => {
  if (isGenericEvaluation.value && props.evaluationConfig) {
    return props.evaluationConfig.settings.allowComments
  }
  return true // Default for legacy system
})

const commentsRequired = computed(() => {
  if (isGenericEvaluation.value && props.evaluationConfig) {
    return props.evaluationConfig.settings.requireComments
  }
  return false // Default for legacy system
})

// Difficulty badge helpers
const difficultyLevels: { [key: string]: string } = {
  easy: 'bg-blue-200 text-blue-900',
  medium: 'bg-purple-300 text-purple-800',
  hard: 'bg-pink-200 text-pink-800',
}

const difficultyLabel = computed(() =>
  props.currentQuestion?.difficulty ? t(`evaluation.difficultyLevels.${props.currentQuestion.difficulty}`) : '',
)

const difficultyClass = computed(() =>
  props.currentQuestion?.difficulty ? difficultyLevels[props.currentQuestion.difficulty] : '',
)

// Validation
const canConfirmEvaluation = computed(() => {
  const hasValue = selectedValue.value !== null && selectedValue.value !== undefined
  const hasRequiredComment = !commentsRequired.value || (localComment.value && localComment.value.trim())
  return hasValue && hasRequiredComment
})

// Event handlers
function onCommentUpdate(value: string) {
  localComment.value = value
  emit('update:evaluatorComment', value)
}

function selectValue(value: any) {
  selectedValue.value = value
}

function updateScore(value: number) {
  selectedValue.value = value
}

function confirmEvaluation() {
  if (!canConfirmEvaluation.value)
    return

  if (isGenericEvaluation.value && props.evaluateGenericAndGoNext) {
    // Use new generic evaluation
    const comment = commentsAllowed.value ? localComment.value : undefined
    props.evaluateGenericAndGoNext(selectedValue.value, comment)
  }
  else if (isLegacyMastery.value && props.evaluateAndGoNext) {
    // Use legacy mastery evaluation
    props.evaluateAndGoNext(selectedValue.value as MasteryLevelType)
  }

  // Reset selection for next question
  selectedValue.value = null
  localComment.value = ''
}

// Function to get button classes for legacy mastery levels
function getMasteryButtonClasses(level: { value: MasteryLevelType, color: string }) {
  const baseClasses = 'h-20 text-lg text-white font-bold uppercase transition-all duration-200'
  const isSelected = selectedValue.value === level.value

  // Extract color from bg-color-nnn value
  const color = level.color.replace(/bg-([a-z]+)-\d+/, '$1')

  if (isSelected) {
    return `${baseClasses} ${level.color} ring-3 ring-${color}-200 ring-offset-1 transform`
  }
  else {
    return `${baseClasses} ${level.color} opacity-70 hover:opacity-100`
  }
}
</script>

<template>
  <UCard v-if="currentQuestion">
    <template #header>
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="text-neutral-800 text-sm font-semibold">
            Question {{ currentQuestion.questionID }}
          </div>
          <div v-if="currentQuestion.difficulty">
            <UBadge
              :label="difficultyLabel"
              class="text-xs"
              :class="difficultyClass"
            />
          </div>
        </div>
        <div>
          {{ currentQuestion.question }}
        </div>
      </div>
    </template>

    <div class="flex flex-col gap-4">
      <div class="text-neutral-800 text-sm font-semibold">
        {{ $t('evaluation.question.submittedAnswer') }}
      </div>
      {{ currentQuestion.submittedAnswer }}
    </div>

    <template #footer>
      <div class="flex flex-col gap-4">
        <!-- Evaluation Type Header -->
        <div class="flex justify-between items-center">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ $t('evaluation.title') }}
          </div>
          <div v-if="isGenericEvaluation && evaluationConfig" class="text-xs text-neutral-500">
            {{ evaluationConfig.name }} ({{ evaluationConfig.type }})
          </div>
        </div>

        <!-- Legacy Mastery Level Buttons -->
        <div v-if="isLegacyMastery" class="flex flex-col-reverse gap-4 justify-between items-center md:flex-row">
          <UButton
            v-for="level in masteryLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
            :class="getMasteryButtonClasses(level)"
            size="lg"
            block
            @click="selectValue(level.value)"
          />
        </div>

        <!-- Generic Evaluation Options -->
        <div v-else-if="isGenericEvaluation">
          <!-- Score-based Evaluation -->
          <div v-if="isScoreEvaluation && scoreSettings" class="space-y-3">
            <label class="block text-sm font-medium text-neutral-700">
              Score ({{ scoreSettings.minValue }} - {{ scoreSettings.maxValue }}{{ scoreSettings.unit || '' }})
            </label>

            <div class="flex items-center gap-4">
              <USlider
                :model-value="selectedValue || scoreSettings.minValue"
                :min="scoreSettings.minValue"
                :max="scoreSettings.maxValue"
                :step="scoreSettings.step"
                color="primary"
                size="xl"
                class="flex-1"
                @update:model-value="updateScore(Number($event))"
              />

              <span class="text-sm text-right text-neutral-500 min-w-10">
                {{ selectedValue || scoreSettings.minValue }}{{ scoreSettings.unit || '' }}
              </span>
            </div>

            <!-- Passing score indicator -->
            <div v-if="scoreSettings.passingScore" class="text-xs text-neutral-500">
              Passing score: {{ scoreSettings.passingScore }}{{ scoreSettings.unit || '' }}
            </div>
          </div>

          <!-- Option-based Evaluation (Boolean, Score, etc.) -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <UButton
              v-for="option in evaluationOptions"
              :key="option.id"
              :variant="selectedValue === option.value ? 'solid' : 'outline'"
              :color="selectedValue === option.value ? 'primary' : 'neutral'"
              size="lg"
              block
              @click="selectValue(option.value)"
            >
              <div class="text-left w-full">
                <div class="font-medium">
                  {{ option.label }}
                </div>
                <div v-if="'description' in option && option.description" class="text-xs opacity-75 mt-1">
                  {{ option.description }}
                </div>
              </div>
            </UButton>
          </div>
        </div>

        <!-- Comments Section -->
        <div v-if="commentsAllowed" class="flex flex-col gap-1">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ $t('evaluation.evaluator.comment') }}
            <span v-if="commentsRequired" class="text-red-500">*</span>
          </div>
          <UTextarea
            :model-value="localComment"
            :placeholder="$t('evaluation.evaluator.commentPlaceholder')"
            :rows="5"
            :required="commentsRequired"
            class="w-full"
            @update:model-value="onCommentUpdate"
          />

          <!-- Validation messages -->
          <div v-if="commentsRequired && !localComment.trim()" class="text-sm text-red-600">
            {{ $t('evaluation.evaluator.commentRequired') }}
          </div>
        </div>

        <!-- Confirm Evaluation Button - Always visible -->
        <div class="flex justify-end pt-2">
          <UButton
            icon="i-lucide:check"
            color="primary"
            variant="solid"
            :disabled="!canConfirmEvaluation"
            :label="$t('evaluation.actions.confirm')"
            @click="confirmEvaluation"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
