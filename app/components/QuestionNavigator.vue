<script setup lang="ts">
import type { EvaluatedItem } from '@/models/index'

const props = defineProps<{
  questions: EvaluatedItem[]
  currentIndex: number
  evaluatedQuestions: { [questionId: string]: { masteryLevel: string, comment?: string } }
  onNavigate: (index: number) => void
}>()

const { t } = useI18n()

// Reference to the scrollable container
const scrollContainer = ref<HTMLElement>()

// Function to scroll the active question into view
function scrollToActiveQuestion(questionIndex: number) {
  if (!scrollContainer.value)
    return

  const button = scrollContainer.value.children[questionIndex] as HTMLElement
  if (!button)
    return

  // Calculate the position to center the button
  const containerWidth = scrollContainer.value.clientWidth
  const buttonLeft = button.offsetLeft
  const buttonWidth = button.offsetWidth
  const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2)

  // Smooth scroll to center the button
  scrollContainer.value.scrollTo({
    left: Math.max(0, scrollLeft),
    behavior: 'smooth',
  })
}

// Handle navigation and auto-scroll
function handleNavigation(index: number) {
  props.onNavigate(index)
  nextTick(() => {
    scrollToActiveQuestion(index)
  })
}

// Watch for currentIndex changes to auto-scroll when navigation happens externally
watch(() => props.currentIndex, (newIndex) => {
  nextTick(() => {
    scrollToActiveQuestion(newIndex)
  })
})

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
  <div class="w-full overflow-x-auto">
    <!-- Legend -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-medium text-gray-900">
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
          <div class="w-2.5 h-2.5 rounded-full bg-gray-200" />
          <span>{{ t('evaluation.navigation.pending') }}</span>
        </div>
      </div>
    </div>

    <!-- Single Line Question Navigation -->
    <div ref="scrollContainer" class="flex overflow-auto gap-2 p-1">
      <button
        v-for="(question, questionIndex) in questions"
        :key="question.id"
        class="size-14 min-w-14 rounded-full text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 hover:shadow-md"
        :class="{
          'ring-2 ring-blue-700 ring-offset-2': questionIndex === currentIndex,
          'bg-neutral-600 text-white': evaluatedQuestions[question.id],
          'bg-neutral-200 text-neutral-500': !evaluatedQuestions[question.id],
        }"
        @click="() => handleNavigation(questionIndex)"
      >
        <span class="font-bold text-lg leading-none">{{ questionIndex + 1 }}</span>
        <span class="text-xs leading-none">{{ question.questionID }}</span>
      </button>
    </div>
  </div>
</template>
