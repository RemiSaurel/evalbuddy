<script setup lang="ts">
import type { EvaluatedItem } from '~/models'

interface Props {
  currentQuestion: EvaluatedItem
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
  <UCard>
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
        {{ currentQuestion.question }}
      </div>
    </div>
  </UCard>
</template>
