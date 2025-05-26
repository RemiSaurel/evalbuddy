<script setup lang="ts">
import { MasteryLevel } from '@/models/index'
import { QUESTIONS } from '@/utils/data'

const { t } = useI18n()

// Track current question group and index within that group
const currentQuestionGroupIndex = ref(0)
const currentQuestionIndexInGroup = ref(0)
const evaluatorComment = ref('')

// Track evaluated questions with their mastery levels
const evaluatedQuestions = ref<{ [questionId: string]: typeof MasteryLevel[keyof typeof MasteryLevel] }>({})

// Group questions by questionID and get ordered groups
const groupedQuestions = computed(() => {
  const groups: { [key: string]: typeof QUESTIONS } = {}
  QUESTIONS.forEach((question) => {
    if (!groups[question.questionID]) {
      groups[question.questionID] = []
    }
    groups[question.questionID]!.push(question)
  })
  return groups
})

// Get array of question group keys in order
const questionGroupKeys = computed(() => {
  return Object.keys(groupedQuestions.value).sort()
})

// Current question group being evaluated
const currentQuestionGroup = computed(() => {
  const groupKey = questionGroupKeys.value[currentQuestionGroupIndex.value]
  return groupKey ? groupedQuestions.value[groupKey] || [] : []
})

// Current question being displayed
const currentQuestion = computed(() => {
  return currentQuestionGroup.value[currentQuestionIndexInGroup.value]
})

// Progress within current question group (only count evaluated questions)
const currentQuestionGroupProgress = computed(() => {
  if (!currentQuestionGroup.value || currentQuestionGroup.value.length === 0)
    return 0

  // Count how many questions in this group have been evaluated
  const evaluatedInGroup = currentQuestionGroup.value.filter(q =>
    evaluatedQuestions.value[q.id] !== undefined,
  ).length

  return evaluatedInGroup
})

// Total progress across all questions (only count evaluated questions)
const totalProgress = computed(() => {
  return Object.keys(evaluatedQuestions.value).length
})

// Get current absolute question index for display
const currentAbsoluteQuestionIndex = computed(() => {
  let index = 0
  for (let i = 0; i < currentQuestionGroupIndex.value; i++) {
    const groupKey = questionGroupKeys.value[i]
    if (groupKey) {
      index += groupedQuestions.value[groupKey]?.length || 0
    }
  }
  return index + currentQuestionIndexInGroup.value
})

const colors = {
  [MasteryLevel.NOT_ATTAINED]: 'bg-red-300 text-red-800 hover:bg-red-400',
  [MasteryLevel.INSUFFICIENT]: 'bg-orange-300 text-orange-800 hover:bg-orange-400',
  [MasteryLevel.SUFFICIENT]: 'bg-yellow-300 text-yellow-800 hover:bg-yellow-400',
  [MasteryLevel.TOTAL]: 'bg-green-300 text-green-800 hover:bg-green-400',
}

const difficultyLevels = {
  easy: 'bg-blue-200 text-blue-900',
  medium: 'bg-purple-300 text-purple-800',
  hard: 'bg-pink-200 text-pink-800',
}

const masteryLevels = computed(() => {
  return Object.values(MasteryLevel).map(level => ({
    label: t(`evaluation.mastery.${level}`),
    value: level,
    color: colors[level],
  }))
})

// Function to evaluate current question and go to next
function evaluateAndGoNext(masteryLevel: typeof MasteryLevel[keyof typeof MasteryLevel]) {
  if (currentQuestion.value) {
    // Record the evaluation for the current question
    evaluatedQuestions.value[currentQuestion.value.id] = masteryLevel

    // Move to next question within the same group
    if (currentQuestionIndexInGroup.value < currentQuestionGroup.value.length - 1) {
      currentQuestionIndexInGroup.value++
    }
    else {
      // Move to next question group if available
      if (currentQuestionGroupIndex.value < questionGroupKeys.value.length - 1) {
        currentQuestionGroupIndex.value++
        currentQuestionIndexInGroup.value = 0
      }
      // If no more groups, we're done (could add completion logic here)
    }
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-8 mt-8">
      <div class="flex gap-8 justify-between">
        <!-- Current Question Group Progress -->
        <div class="flex flex-col flex-1 gap-1">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600">
              {{ $t('evaluation.progress.currentQuestion') }}
            </div>
            <div class="text-xs text-gray-500">
              {{ currentQuestionGroupProgress }} / {{ currentQuestionGroup?.length || 0 }}
            </div>
          </div>
          <UProgress
            v-model="currentQuestionGroupProgress"
            :max="currentQuestionGroup?.length || 1"
            size="xl"
            status
          />
        </div>
        <!-- Total Progress -->
        <div class="flex flex-col flex-1 gap-1">
          <div class="flex justify-between items-center">
            <div class="text-sm text-gray-600">
              {{ $t('evaluation.progress.total') }}
            </div>
            <div class="text-xs text-gray-500">
              {{ totalProgress }} / {{ QUESTIONS.length }}
            </div>
          </div>
          <UProgress
            v-model="totalProgress"
            :max="QUESTIONS.length"
            size="xl"
            status
          />
        </div>
      </div>

      <UCard v-if="currentQuestion">
        <template #header>
          <div class="flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <div class="text-neutral-800 text-sm font-semibold">
                Question {{ currentAbsoluteQuestionIndex + 1 }}
              </div>
              <div v-if="currentQuestion.difficulty">
                <UBadge
                  :label="$t(`evaluation.difficultyLevels.${currentQuestion.difficulty}`)"
                  class="text-xs"
                  :class="difficultyLevels[currentQuestion.difficulty]"
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
            {{ $t('evaluation.learnerAnswer') }}
          </div>
          {{ currentQuestion.learnerAnswer }}
        </div>

        <template #footer>
          <div class="flex flex-col gap-4">
            <div class="text-neutral-800 text-sm font-semibold">
              {{ $t('evaluation.title') }}
            </div>

            <div class="flex flex-col-reverse gap-4 justify-between items-center md:flex-row">
              <UButton
                v-for="level in masteryLevels"
                :key="level.value"
                :label="level.label"
                :value="level.value"
                class="h-20 text-lg font-bold uppercase"
                :class="level.color"
                size="lg"
                block
                @click="evaluateAndGoNext(level.value)"
              />
            </div>
            <div class="flex flex-col gap-1">
              <div class="text-neutral-800 text-sm font-semibold">
                {{ $t('evaluation.evaluator.comment') }}
              </div>
              <UTextarea
                v-model="evaluatorComment"
                :placeholder="$t('evaluation.evaluator.commentPlaceholder')"
                :rows="5"
              />
            </div>
          </div>
        </template>
      </UCard>
    </div>
  </div>
</template>
