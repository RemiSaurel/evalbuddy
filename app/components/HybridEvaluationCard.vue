<script setup lang="ts">
import type { EvaluationConfig, EvaluationItem } from '~/models'

interface Props {
  currentItem: EvaluationItem & { questionText?: string, referenceAnswer?: string }
  evaluatorComment: string
  evaluatedItems: { [itemId: string]: { value?: any, masteryLevel?: any, comment?: string } }

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

// State for selected evaluation value
const selectedValue = ref<any>(null)
const localComment = ref('')

// Watch for item changes to reset selection and load existing evaluation
watch(() => props.currentItem, () => {
  loadEvaluationForCurrentItem()
}, { immediate: true })

// Watch for evaluatedItems changes to update the selection
watch(() => props.evaluatedItems, () => {
  loadEvaluationForCurrentItem()
}, { deep: true })

// Watch for comment prop changes
watch(() => props.evaluatorComment, (newComment) => {
  localComment.value = newComment || ''
}, { immediate: true })

// Helper function to load evaluation for current item
function loadEvaluationForCurrentItem() {
  if (props.currentItem) {
    const existingEvaluation = props.evaluatedItems[props.currentItem.id]
    if (existingEvaluation) {
      selectedValue.value = existingEvaluation.value ?? existingEvaluation.masteryLevel ?? null
      localComment.value = existingEvaluation.comment || ''
    }
    else {
      // Reset to null - don't auto-populate any default values
      selectedValue.value = null
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

  if (props.evaluateGenericAndGoNext) {
    // Use new generic evaluation
    const comment = commentsAllowed.value ? localComment.value : undefined
    props.evaluateGenericAndGoNext(selectedValue.value, comment)
  }

  // Reset selection for next question
  selectedValue.value = null
  localComment.value = ''
}
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <div class="text-neutral-800 text-sm font-semibold">
        {{ t('evaluation.question.submittedAnswer') }}
      </div>
      {{ currentItem.submittedAnswer }}
    </div>

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

        <!-- Generic Evaluation Options -->
        <div>
          <!-- Score-based Evaluation -->
          <div v-if="isScoreEvaluation && scoreSettings" class="space-y-3">
            <label class="block text-sm font-medium text-neutral-700">
              Score ({{ scoreSettings.minValue }} - {{ scoreSettings.maxValue }}{{ scoreSettings.unit || '' }})
            </label>

            <div class="flex items-center gap-4">
              <USlider
                :model-value="selectedValue !== null ? selectedValue : scoreSettings.minValue"
                :min="scoreSettings.minValue"
                :max="scoreSettings.maxValue"
                :step="scoreSettings.step"
                color="primary"
                size="xl"
                class="flex-1"
                @update:model-value="updateScore(Number($event))"
              />

              <span class="text-sm text-right text-neutral-500 min-w-10">
                {{ selectedValue !== null ? selectedValue : '---' }}{{ selectedValue !== null ? (scoreSettings.unit || '') : '' }}
              </span>
            </div>

            <!-- Passing score indicator -->
            <div v-if="scoreSettings.passingScore" class="text-xs text-neutral-500">
              {{ t('evaluation.passingScore') }}: {{ scoreSettings.passingScore }}{{ scoreSettings.unit || '' }}
            </div>
          </div>

          <!-- Option-based Evaluation (Mastery, Boolean, etc.) -->
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <UButton
              v-for="option in evaluationOptions"
              :key="option.id"
              :class="[option.color || '', {
                'ring-2 ring-offset-1': selectedValue === option.value,
                'opacity-70': selectedValue !== null && selectedValue !== option.value,
              }]"
              size="lg"
              block
              @click="selectValue(option.value)"
            >
              <div class="text-left w-full">
                <div class="font-semibold">
                  {{ option.label }}
                </div>
                <div v-if="'description' in option && option.description" class="text-xs opacity-75 mt-0.5">
                  {{ option.description }}
                </div>
              </div>
            </UButton>
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
            :rows="5"
            :required="commentsRequired"
            class="w-full"
            @update:model-value="onCommentUpdate"
          />

          <!-- Validation messages -->
          <div v-if="commentsRequired && !localComment.trim()" class="text-sm text-red-600">
            {{ t('evaluation.evaluator.commentRequired') }}
          </div>
        </div>

        <!-- Confirm Evaluation Button - Always visible -->
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
