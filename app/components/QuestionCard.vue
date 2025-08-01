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

/* Difficulty badge helpers */
const difficultyLevels: { [key: string]: string } = {
  easy: 'bg-blue-200 text-blue-900',
  medium: 'bg-purple-300 text-purple-800',
  hard: 'bg-pink-200 text-pink-800',
}

const difficultyLabel = computed(() =>
  props.currentQuestion?.difficulty
    ? t(`evaluation.difficultyLevels.${props.currentQuestion.difficulty}`)
    : '',
)

const difficultyClass = computed(() =>
  props.currentQuestion?.difficulty
    ? difficultyLevels[props.currentQuestion.difficulty]
    : '',
)
</script>

<template>
  <UCard :ui="{ footer: 'sm:pb-6' }">
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <div class="text-neutral-800 text-sm font-semibold">
          Question {{ currentQuestion.questionID }}
        </div>

        <div v-if="currentQuestion.difficulty">
          <UBadge
            :label="difficultyLabel"
            class="text-xs"
            :class="difficultyClass"
          />
        </div>
      </div>

      <div>
        {{ currentQuestion.questionText }}
      </div>
    </div>

    <template v-if="currentQuestion.referenceAnswer" #footer>
      <div class="flex flex-col gap-4">
        <div class="text-neutral-800 text-sm font-semibold">
          {{ t('evaluation.question.referenceAnswer') }}
        </div>

        <div class="whitespace-pre-line max-h-60 overflow-y-auto">
          {{ currentQuestion.referenceAnswer }}
        </div>
      </div>
    </template>
  </UCard>
</template>
