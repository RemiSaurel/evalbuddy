<script setup lang="ts">
import type { MasteryLevel } from '@/models/index'

const props = defineProps<{
  currentQuestion: any
  currentAbsoluteQuestionIndex: number
  evaluatorComment: string
  masteryLevels: Array<{ label: string, value: typeof MasteryLevel[keyof typeof MasteryLevel], color: string }>
  evaluateAndGoNext: (masteryLevel: typeof MasteryLevel[keyof typeof MasteryLevel]) => void
  evaluatedQuestions: { [questionId: string]: { masteryLevel: any, comment?: string } }
}>()

const emit = defineEmits(['update:evaluatorComment'])

const { t } = useI18n()

// State for selected mastery level
const selectedMasteryLevel = ref<typeof MasteryLevel[keyof typeof MasteryLevel] | null>(null)

// Watch for question changes to reset selection and load existing evaluation
watch(() => props.currentQuestion, (_newQuestion) => {
  loadMasteryLevelForCurrentQuestion()
}, { immediate: true })

// Watch for evaluatedQuestions changes to update the mastery level selection
watch(() => props.evaluatedQuestions, () => {
  loadMasteryLevelForCurrentQuestion()
}, { deep: true })

// Helper function to load mastery level for current question
function loadMasteryLevelForCurrentQuestion() {
  if (props.currentQuestion) {
    // Check if this question has already been evaluated
    const existingEvaluation = props.evaluatedQuestions[props.currentQuestion.id]
    if (existingEvaluation && existingEvaluation.masteryLevel) {
      // Load the previously selected mastery level
      selectedMasteryLevel.value = existingEvaluation.masteryLevel
    }
    else {
      // Reset selection for new questions
      selectedMasteryLevel.value = null
    }
  }
  else {
    selectedMasteryLevel.value = null
  }
}

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

// Computed property to check if evaluation can be confirmed
const canConfirmEvaluation = computed(() => {
  return selectedMasteryLevel.value !== null
})

function onCommentInput(event: Event) {
  emit('update:evaluatorComment', (event.target as HTMLTextAreaElement).value)
}

function selectMasteryLevel(level: typeof MasteryLevel[keyof typeof MasteryLevel]) {
  selectedMasteryLevel.value = level
}

function confirmEvaluation() {
  if (selectedMasteryLevel.value !== null) {
    props.evaluateAndGoNext(selectedMasteryLevel.value)
    // Reset selection for next question
    selectedMasteryLevel.value = null
  }
}

// Function to get button classes based on selection state
function getMasteryButtonClasses(level: { value: typeof MasteryLevel[keyof typeof MasteryLevel], color: string }) {
  const baseClasses = 'h-20 text-lg font-bold uppercase transition-all duration-200'
  const isSelected = selectedMasteryLevel.value === level.value

  if (isSelected) {
    // Selected state: darker background with border
    return `${baseClasses} ${level.color} ring-2 ring-blue-600 ring-offset-2 transform scale-105`
  }
  else {
    // Unselected state: lighter background
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
        {{ $t('evaluation.question.learnerAnswer') }}
      </div>
      {{ currentQuestion.learnerAnswer }}
    </div>

    <template #footer>
      <div class="flex flex-col gap-4">
        <div class="text-neutral-800 text-sm font-semibold">
          {{ $t('evaluation.title') }}
        </div>

        <!-- Mastery Level Buttons -->
        <div class="flex flex-col-reverse gap-4 justify-between items-center md:flex-row">
          <UButton
            v-for="level in masteryLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
            :class="getMasteryButtonClasses(level)"
            size="lg"
            block
            @click="selectMasteryLevel(level.value)"
          />
        </div>

        <!-- Comment Section -->
        <div class="flex flex-col gap-1">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ $t('evaluation.evaluator.comment') }}
          </div>
          <div class="flex gap-4 ">
            <UTextarea
              :model-value="evaluatorComment"
              :placeholder="$t('evaluation.evaluator.commentPlaceholder')"
              :rows="5"
              class="flex-1"
              @input="onCommentInput"
            />

            <!-- Confirm Evaluation Button -->
            <UButton
              icon="i-lucide:check"
              color="secondary"
              :disabled="!canConfirmEvaluation"
              class="flex items-center justify-center min-h-full min-w-20"
              :class="{ 'opacity-50 cursor-not-allowed': !canConfirmEvaluation }"
              :ui="{ }"
              @click="confirmEvaluation"
            />
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
