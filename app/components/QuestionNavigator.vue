<script setup lang="ts">
import type { EvaluatedItem, EvaluationItem } from '~/models'

const props = defineProps<{
  isSingleEvaluation: boolean
  groupedItems: { [key: string]: readonly EvaluationItem[] }
  groupKeys: readonly string[]
  items: readonly EvaluationItem[]
  currentItemGroup: readonly EvaluationItem[]
  currentItemIndexInGroup: number
  currentGroupIndex: number
  evaluatedItems: Record<string, EvaluatedItem>
  onNavigate: (groupIndex: number, itemIndexInGroup: number) => void
}>()

const { t } = useI18n()
const { scrollToItem } = useScrollToListItem()

// Reference to the scrollable containers
const questionScrollContainer = ref<HTMLElement>()
const questionGroupScrollContainer = ref<HTMLElement>()

// Navigation only moves the index. Scrolling is owned solely by the watcher
// below, so a click and an arrow press take the exact same path — previously a
// click queued three overlapping smooth scrolls on the same container.
function handleSingleNavigation(itemIndex: number) {
  props.onNavigate(0, itemIndex)
}
function handleGroupNavigation(groupIndex: number) {
  props.onNavigate(groupIndex, 0)
}

// Check if a question is evaluated by looking for the specific item ID
function isQuestionEvaluated(question: EvaluationItem) {
  // Check only for this specific item ID
  const evaluated = props.evaluatedItems[question.id]
  return evaluated && (evaluated.value !== undefined || evaluated.masteryLevel !== undefined)
}

// Watch for navigation changes from arrow keys to auto-scroll active question
watch(() => [props.currentGroupIndex, props.currentItemIndexInGroup], () => {
  scrollToCurrentQuestion()
})

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
  <div class="w-full overflow-x-auto pb-2">
    <!-- Legend -->
    <div class="mb-2 flex items-center gap-1.5 text-sm font-medium text-highlighted">
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
        class="flex gap-2 overflow-auto p-1"
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
      <div v-else ref="questionGroupScrollContainer" class="flex gap-2 overflow-auto p-1">
        <NavigatorItem
          v-for="(groupKey, groupIndex) in groupKeys"
          :key="groupKey"
          button-size="sm"
          :item-index="`Q${groupIndex + 1}`"
          :is-current-item="groupIndex === currentGroupIndex"
          :is-item-evaluated="groupedItems[groupKey]?.every(isQuestionEvaluated) ?? false"
          @click="() => handleGroupNavigation(groupIndex)"
        />
      </div>
    </div>
  </div>
</template>
