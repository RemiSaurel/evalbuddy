<script setup lang="ts">
import type { EvaluatedItem } from '~/models'

const props = defineProps<{
  isSingleEvaluation: boolean
  groupedQuestions: { [key: string]: EvaluatedItem[] }
  questions: EvaluatedItem[]
  currentQuestionGroup: EvaluatedItem[]
  currentIndex: number
  evaluatedQuestions: {
    [questionId: string]: { value?: any, masteryLevel?: string, comment?: string }
  }
  onNavigate: (index: number) => void
}>()

const { t } = useI18n()

// Reference to the scrollable containers
const questionScrollContainer = ref<HTMLElement>()
const questionGroupScrollContainer = ref<HTMLElement>()

function scrollToActiveQuestion(questionIndex: number) {
  useScrollToListItem(questionScrollContainer, questionIndex)
}

// Handle navigation and auto-scroll
function handleNavigation(questionIndex: number, groupIndex?: number) {
  props.onNavigate(questionIndex)
  nextTick(() => {
    scrollToActiveQuestion(questionIndex)

    // scroll to the active question group
    if (!props.isSingleEvaluation && groupIndex !== undefined) {
      useScrollToListItem(questionGroupScrollContainer, groupIndex)
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
    <div class="flex items-center mb-2 gap-1.5 text-sm font-medium text-neutral-900">
      <h3>
        {{ t('evaluation.navigation.overviewQuestions') }}
      </h3>

      <NavigatorHelp />
    </div>

    <div class="flex flex-col gap-1">
      <!-- Question navigation on a single line if every question have one evaluation -->
      <div
        v-if="isSingleEvaluation"
        ref="questionScrollContainer"
        class="flex overflow-auto gap-2 p-1"
      >
        <NavigatorItem
          v-for="(question, questionIndex) in questions"
          :key="question.id"
          button-size="sm"
          :item-index="(questionIndex + 1).toString()"
          :sub-item-index="question.questionID"
          :is-current-item="questionIndex === currentIndex"
          :is-item-evaluated="isQuestionEvaluated(question) ?? false"
          @click="() => handleNavigation(questionIndex)"
        />
      </div>

      <!-- Group navigation otherwise -->
      <div v-else ref="questionGroupScrollContainer" class="flex overflow-auto gap-2 p-1">
        <NavigatorItem
          v-for="(group, groupName) in groupedQuestions"
          :key="groupName"
          button-size="sm"
          :item-index="groupName.toString()"
          :is-current-item="groupName === currentQuestionGroup[0]?.questionID"
          :is-item-evaluated="group.every(isQuestionEvaluated)"
          @click="() => {
            const { index, groupIndex }
              = getFirstGroupQuestionAbsoluteIndex(groupName as string)

            handleNavigation(index, groupIndex)
          }"
        />
      </div>
    </div>
  </div>
</template>
