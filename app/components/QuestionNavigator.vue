<script setup lang="ts">
import type { EvaluationItem } from '~/models'

const props = defineProps<{
  isSingleEvaluation: boolean
  groupedItems: { [key: string]: readonly EvaluationItem[] }
  groupKeys: readonly string[]
  items: readonly EvaluationItem[]
  currentItemGroup: readonly EvaluationItem[]
  currentItemIndexInGroup: number
  currentGroupIndex: number
  evaluatedItems: {
    [itemId: string]: { value?: any, masteryLevel?: string, comment?: string }
  }
  onNavigate: (groupIndex: number, itemIndexInGroup: number) => void
}>()

const { t } = useI18n()
const { scrollToItem, scrollToActiveQuestion } = useScrollToListItem()

// Reference to the scrollable containers
const questionScrollContainer = ref<HTMLElement>()
const questionGroupScrollContainer = ref<HTMLElement>()

// Handle navigation and auto-scroll
function handleSingleNavigation(itemIndex: number) {
  props.onNavigate(0, itemIndex)
  nextTick(() => {
    scrollToActiveQuestion(
      true, // single navigation
      questionScrollContainer,
      questionGroupScrollContainer,
      itemIndex,
      props.currentItemGroup,
      props.groupedItems,
    )
  })
}
function handleGroupNavigation(groupIndex: number) {
  props.onNavigate(groupIndex, 0)
  nextTick(() => {
    scrollToActiveQuestion(
      false,
      questionScrollContainer,
      questionGroupScrollContainer,
      groupIndex,
      props.currentItemGroup,
      props.groupedItems,
    )
    scrollToItem(questionGroupScrollContainer, groupIndex)
  })
}

// Watch for current item changes to auto-scroll when navigation happens externally
watch(() => [props.currentGroupIndex, props.currentItemIndexInGroup], () => {
  scrollToCurrentQuestion()
}, { immediate: false })

// Check if a question is evaluated by looking for the specific item ID
function isQuestionEvaluated(question: EvaluationItem) {
  // Check only for this specific item ID
  const evaluated = props.evaluatedItems[question.id]
  return evaluated && (evaluated.value !== undefined || evaluated.masteryLevel !== undefined)
}

// Auto-scroll to current question on mount
onMounted(() => scrollToCurrentQuestion())

function scrollToCurrentQuestion() {
  nextTick(() => {
    scrollToItem(
      props.isSingleEvaluation ? questionScrollContainer : questionGroupScrollContainer,
      props.isSingleEvaluation ? props.currentItemIndexInGroup : props.currentGroupIndex,
    )
  })
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <!-- Legend -->
    <div class="flex items-center mb-2 gap-1.5 text-sm font-medium text-neutral-900">
      <h3>
        {{ isSingleEvaluation
          ? t('evaluation.navigation.overviewAnswers')
          : t('evaluation.navigation.overviewQuestions') }}
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
          v-for="(question, itemIndex) in items"
          :key="question.id"
          button-size="sm"
          :item-index="`${itemIndex + 1}`"
          :is-current-item="itemIndex === currentItemIndexInGroup"
          :is-item-evaluated="isQuestionEvaluated(question) ?? false"
          @click="() => handleSingleNavigation(itemIndex)"
        />
      </div>

      <!-- Group navigation otherwise -->
      <div v-else ref="questionGroupScrollContainer" class="flex overflow-auto gap-2 p-1">
        <NavigatorItem
          v-for="(groupKey, groupIndex) in groupKeys"
          :key="groupKey"
          button-size="sm"
          :item-index="`Q${groupKey}`"
          :is-current-item="groupIndex === currentGroupIndex"
          :is-item-evaluated="groupedItems[groupKey]?.every(isQuestionEvaluated) ?? false"
          @click="() => handleGroupNavigation(groupIndex)"
        />
      </div>
    </div>
  </div>
</template>
