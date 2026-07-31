<script setup lang="ts">
import type { EvaluationItem } from '~/models'

interface Props {
  currentQuestion: EvaluationItem & {
    questionText?: string
    referenceAnswer?: string
    difficulty?: 'easy' | 'medium' | 'hard'
  }
}

const props = defineProps<Props>()

const { t } = useI18n()

// Difficulty maps onto the semantic colours so it stays readable in both
// colour modes and matches the rest of the app's status vocabulary.
const difficultyColors = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
} as const

const difficultyLabel = computed(() =>
  props.currentQuestion?.difficulty
    ? t(`evaluation.difficultyLevels.${props.currentQuestion.difficulty}`)
    : '',
)

const difficultyColor = computed(() =>
  props.currentQuestion?.difficulty
    ? difficultyColors[props.currentQuestion.difficulty]
    : 'neutral',
)
</script>

<template>
  <UCard>
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between">
        <div class="text-sm font-semibold text-default">
          {{ t('evaluation.question.title') }} {{ currentQuestion.questionID }}
        </div>

        <UBadge
          v-if="currentQuestion.difficulty"
          :label="difficultyLabel"
          :color="difficultyColor"
          variant="subtle"
          size="sm"
        />
      </div>

      <ContentRenderer :content="currentQuestion.questionText || ''" />
    </div>

    <template v-if="currentQuestion.referenceAnswer" #footer>
      <div class="flex flex-col gap-4">
        <div class="text-sm font-semibold text-default">
          {{ t('evaluation.question.referenceAnswer') }}
        </div>

        <ContentRenderer
          :content="currentQuestion.referenceAnswer"
        />
      </div>
    </template>
  </UCard>
</template>
