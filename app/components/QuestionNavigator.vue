<script setup lang="ts">
import type { EvaluatedItem } from '@/models/index'

defineProps<{
  questions: EvaluatedItem[]
  currentIndex: number
  evaluatedQuestions: { [questionId: string]: { masteryLevel: string, comment?: string } }
  onNavigate: (index: number) => void
}>()

const { t } = useI18n()
</script>

<template>
  <div class="w-full">
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
    <div class="flex flex-wrap gap-2">
      <button
        v-for="(question, questionIndex) in questions"
        :key="question.id"
        class="w-14 h-14 rounded-full text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center gap-1 hover:shadow-md"
        :class="{
          'ring-2 ring-blue-700 ring-offset-2': questionIndex === currentIndex,
          'bg-neutral-600 text-white': evaluatedQuestions[question.id],
          'bg-neutral-200 text-neutral-500': !evaluatedQuestions[question.id],
        }"
        @click="() => onNavigate(questionIndex)"
      >
        <span class="font-bold text-lg leading-none">{{ questionIndex + 1 }}</span>
        <span class="text-xs leading-none">{{ question.questionID }}</span>
      </button>
    </div>
  </div>
</template>
