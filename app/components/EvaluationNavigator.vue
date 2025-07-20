<script setup lang="ts">
import type { EvaluationItem } from '~/models'

const props = defineProps<{
  isSingleEvaluation: boolean
  groupedItems: { [key: string]: readonly EvaluationItem[] }
  items: readonly EvaluationItem[]
  currentItemGroup: readonly EvaluationItem[]
  currentAbsoluteItemIndex: number
  currentItemIndexInGroup: number
  currentIndex: number
  evaluatedItems: {
    [itemId: string]: { value?: any, masteryLevel?: string, comment?: string }
  }
  onNavigate: (index: number) => void
}>()

const { t } = useI18n()
const { scrollToItem } = useScrollToListItem()

// Reference to the scrollable container
const itemScrollContainer = ref<HTMLElement>()

function scrollToActiveItem(itemIndex: number) {
  scrollToItem(itemScrollContainer, itemIndex)
}

// Handle navigation and auto-scroll
function handleNavigation(itemIndex: number) {
  props.onNavigate(itemIndex)
  nextTick(() => {
    // Calculate the index within the current group for scrolling
    const indexInGroup = itemIndex - (props.currentAbsoluteItemIndex - props.currentItemIndexInGroup)
    scrollToActiveItem(indexInGroup)
  })
}

// Watch for currentIndex changes to auto-scroll when navigation happens externally
watch(() => props.currentIndex, (_newIndex) => {
  nextTick(() => {
    // For external navigation changes, use the current item index in group
    scrollToActiveItem(props.currentItemIndexInGroup)
  })
})

// Check if an item is evaluated
function isItemEvaluated(item: EvaluationItem) {
  // Check only for this specific item ID
  const evaluated = props.evaluatedItems[item.id]
  return evaluated && (evaluated.value !== undefined || evaluated.masteryLevel !== undefined)
}

// Auto-scroll to current item on mount
onMounted(() => {
  scrollToActiveItem(props.currentItemIndexInGroup)
})

// Shortcuts with arrow keys to navigate
defineShortcuts({
  ArrowLeft: () => {
    if (props.currentIndex > 0) {
      handleNavigation(props.currentIndex - 1)
    }
  },
  ArrowRight: () => {
    if (props.currentIndex < props.items.length - 1) {
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
      <div ref="itemScrollContainer" class="flex overflow-auto gap-2 p-1">
        <NavigatorItem
          v-for="(item, itemIndex) in currentItemGroup"
          :key="item.id"
          button-size="xs"
          :item-index="itemIndex + 1"
          :is-current-item="itemIndex === currentItemIndexInGroup"
          :is-item-evaluated="isItemEvaluated(item) ?? false"
          @click="() => handleNavigation(
            currentAbsoluteItemIndex - currentItemIndexInGroup // first question in group
              + itemIndex,
          )"
        />
      </div>
    </div>
  </div>
</template>
