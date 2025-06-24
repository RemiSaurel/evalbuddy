<script setup lang="ts">
import type { EvaluatedItem } from '~/models'

const props = defineProps<{
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

// Check if all question groups include only one question
const isSingleEvaluation = computed(() =>
  Object.values(props.groupedQuestions)
    .every((group: EvaluatedItem[]) => group.length === 1),
)

// Reference to the scrollable containers
const questionScrollContainer = ref<HTMLElement>()
const questionGroupScrollContainer = ref<HTMLElement>()

function scrollToActiveQuestion(questionIndex: number) {
  scrollToActiveItem(questionScrollContainer, questionIndex)
}

function scrollToActiveQuestionGroup(groupIndex: number) {
  scrollToActiveItem(questionGroupScrollContainer, groupIndex)
}

// Function to scroll the active item into view
function scrollToActiveItem(
  container: Ref<HTMLElement | undefined>,
  itemIndex: number,
) {
  if (!container.value)
    return

  const button = container.value.children[itemIndex] as HTMLElement
  if (!button)
    return

  // Use scrollIntoView with block: 'nearest' and inline: 'center' for better centering
  button.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center',
  })
}

// Handle navigation and auto-scroll
function handleNavigation(questionIndex: number, groupIndex?: number) {
  props.onNavigate(questionIndex)
  nextTick(() => {
    scrollToActiveQuestion(questionIndex)
    if (!isSingleEvaluation.value && groupIndex !== undefined) {
      scrollToActiveQuestionGroup(groupIndex)
    }
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

function getFirstGroupQuestionAbsoluteIndex(groupName: string) {
  const questionGroupKeys
  = computed(() => Object.keys(props.groupedQuestions))
  let index = 0

  for (let groupIndex = 0; groupIndex < questionGroupKeys.value.length; groupIndex++) {
    const groupKey = questionGroupKeys.value[groupIndex]
    if (groupKey === groupName) {
      return { index, groupIndex }
    }
    index += groupKey ? props.groupedQuestions[groupKey]?.length || 0 : 0
  }
  return { index: -1, groupIndex: -1 } // not found
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <!-- Legend -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-neutral-900">
        {{ t('evaluation.navigation.overview') }}
      </h3>
      <div class="flex items-center gap-4 text-xs">
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-600" />
          <span>{{ t('evaluation.navigation.evaluated') }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-blue-700" />
          <span>{{ t('evaluation.navigation.current') }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-neutral-200" />
          <span>{{ t('evaluation.navigation.pending') }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-1">
      <!-- Group navigation -->
      <div
        v-if="!isSingleEvaluation"
        ref="questionGroupScrollContainer"
        class="flex overflow-auto gap-2 p-1"
      >
        <!-- TODO component for item button (or simplify UI) -->
        <button
          v-for="(group, groupName) in groupedQuestions"
          :key="groupName"
          class="size-14 min-w-14 rounded-full text-xs font-medium transition-all
          duration-200 flex flex-col items-center justify-center gap-1 hover:shadow-md"
          :class="{
            'ring-2 ring-blue-700 ring-offset-2':
              groupName === currentQuestionGroup[0]?.questionID,
            'bg-neutral-600 text-white': group.every(isQuestionEvaluated),
            'bg-neutral-200 text-neutral-500': !group.every(isQuestionEvaluated),
          }"
          @click="() => {
            const { index, groupIndex }
              = getFirstGroupQuestionAbsoluteIndex(groupName as string)

            handleNavigation(index, groupIndex)
          }"
        >
          <span class="font-bold text-lg leading-none">{{ groupName }}</span>
        </button>
      </div>

      <!-- Question navigation on a single line -->
      <div ref="questionScrollContainer" class="flex overflow-auto gap-2 p-1">
        <button
          v-for="(question, questionIndex) in (
            isSingleEvaluation ? questions : currentQuestionGroup
          )"
          :key="question.id"
          class="rounded-full text-xs font-medium transition-all duration-200 flex
          flex-col items-center justify-center gap-1 hover:shadow-md"
          :class="{
            'ring-2 ring-blue-700 ring-offset-2':
              questionIndex === (isSingleEvaluation ? currentIndex : currentQuestionIndexInGroup),
            'bg-neutral-600 text-white': isQuestionEvaluated(question),
            'bg-neutral-200 text-neutral-500': !isQuestionEvaluated(question),
            'size-14 min-w-14': isSingleEvaluation,
            'size-12 min-w-12': !isSingleEvaluation,
          }"
          @click="() => handleNavigation(
            isSingleEvaluation
              ? questionIndex
              : currentAbsoluteQuestionIndex - currentQuestionIndexInGroup // first question in group
                + questionIndex,
          )"
        >
          <span class="font-bold text-lg leading-none">{{ questionIndex + 1 }}</span>
          <span v-if="isSingleEvaluation" class="text-xs leading-none">
            {{ question.questionID }}
          </span>
        </button>
      </div>
    </div>
  </div>
</template>
