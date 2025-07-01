<script setup lang="ts">
import type { EvaluatedItem } from '~/models'

const props = defineProps<{
  isSingleEvaluation: boolean
  groupedQuestions: { [key: string]: EvaluatedItem[] }
  questions: EvaluatedItem[]
  currentQuestionGroup: EvaluatedItem[]
  currentAbsoluteQuestionIndex: number
  currentQuestionIndexInGroup: number
  currentIndex: number
  evaluatedQuestions: {
    [questionId: string]: { value?: any, masteryLevel?: string, comment?: string }
  }
  onNavigate: (index: number) => void
}>()

const { t } = useI18n()

// Reference to the scrollable container
const questionScrollContainer = ref<HTMLElement>()

function scrollToActiveQuestion(questionIndex: number) {
  useScrollToListItem(questionScrollContainer, questionIndex)
}

// Handle navigation and auto-scroll
function handleNavigation(questionIndex: number) {
  props.onNavigate(questionIndex)
  nextTick(() => {
    scrollToActiveQuestion(questionIndex)
  })
}

// Watch for currentIndex changes to auto-scroll when navigation happens externally
watch(() => props.currentIndex, (newIndex) => {
  nextTick(() => {
    scrollToActiveQuestion(newIndex)
  })
})

// Check if a question is evaluated by looking for the specific item ID
function isQuestionEvaluated(question: EvaluatedItem) {
  // Check only for this specific item ID
  const evaluated = props.evaluatedQuestions[question.id]
  return evaluated && (evaluated.value !== undefined || evaluated.masteryLevel !== undefined)
}

// Auto-scroll to current question on mount
onMounted(() => {
  scrollToActiveQuestion(props.currentIndex)
})

// Shortcuts with arrow keys to navigate
defineShortcuts({
  ArrowLeft: () => {
    if (props.currentIndex > 0) {
      handleNavigation(props.currentIndex - 1)
    }
  },
  ArrowRight: () => {
    if (props.currentIndex < props.questions.length - 1) {
      handleNavigation(props.currentIndex + 1)
    }
  },
})
</script>

<template>
  <!-- Evaluation navigation if there is more than one evaluation per question -->
  <div v-if="!isSingleEvaluation" class="w-full overflow-x-auto">
    <!-- Legend -->
    <div class="flex items-center mb-2 gap-1.5 text-sm font-medium text-neutral-900">
      <h3>
        {{ t('evaluation.navigation.overviewAnswers') }}
      </h3>

      <NavigatorHelp />
    </div>

    <!-- Navigation -->
    <div class="flex flex-col gap-1">
      <div ref="questionScrollContainer" class="flex overflow-auto gap-2 p-1">
        <NavigatorItem
          v-for="(question, questionIndex) in currentQuestionGroup"
          :key="question.id"
          button-size="xs"
          :item-index="(questionIndex + 1).toString()"
          :is-current-item="questionIndex === currentQuestionIndexInGroup"
          :is-item-evaluated="isQuestionEvaluated(question) ?? false"
          @click="() => handleNavigation(
            currentAbsoluteQuestionIndex - currentQuestionIndexInGroup // first question in group
              + questionIndex,
          )"
        />
      </div>
    </div>
  </div>
</template>
