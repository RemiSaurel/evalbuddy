<script setup lang="ts">
import type { MasteryLevel } from '@/models/index'

const props = defineProps<{
  currentQuestion: any
  currentAbsoluteQuestionIndex: number
  evaluatorComment: string
  masteryLevels: Array<{ label: string, value: typeof MasteryLevel[keyof typeof MasteryLevel], color: string }>
  evaluateAndGoNext: (level: typeof MasteryLevel[keyof typeof MasteryLevel]) => void
}>()

const emit = defineEmits(['update:evaluatorComment'])

const { t } = useI18n()

const difficultyLevels: { [key: string]: string } = {
  easy: 'bg-blue-200 text-blue-900',
  medium: 'bg-purple-300 text-purple-800',
  hard: 'bg-pink-200 text-pink-800',
}

const difficultyLabel = computed(() =>
  props.currentQuestion?.difficulty ? t(`evaluation.difficultyLevels.${props.currentQuestion.difficulty}`) : '',
)
const difficultyClass = computed(() =>
  props.currentQuestion?.difficulty ? difficultyLevels[props.currentQuestion.difficulty] : '',
)

function onCommentInput(event: Event) {
  emit('update:evaluatorComment', (event.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <UCard v-if="currentQuestion">
    <template #header>
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="text-neutral-800 text-sm font-semibold">
            Question {{ currentAbsoluteQuestionIndex + 1 }}
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
    </template>

    <div class="flex flex-col gap-4">
      <div class="text-neutral-800 text-sm font-semibold">
        {{ $t('evaluation.learnerAnswer') }}
      </div>
      {{ currentQuestion.learnerAnswer }}
    </div>

    <template #footer>
      <div class="flex flex-col gap-4">
        <div class="text-neutral-800 text-sm font-semibold">
          {{ $t('evaluation.title') }}
        </div>
        <div class="flex flex-col-reverse gap-4 justify-between items-center md:flex-row">
          <UButton
            v-for="level in masteryLevels"
            :key="level.value"
            :label="level.label"
            :value="level.value"
            class="h-20 text-lg font-bold uppercase"
            :class="level.color"
            size="lg"
            block
            @click="() => evaluateAndGoNext(level.value)"
          />
        </div>
        <div class="flex flex-col gap-1">
          <div class="text-neutral-800 text-sm font-semibold">
            {{ $t('evaluation.evaluator.comment') }}
          </div>
          <UTextarea
            :model-value="evaluatorComment"
            :placeholder="$t('evaluation.evaluator.commentPlaceholder')"
            :rows="5"
            @input="onCommentInput"
          />
        </div>
      </div>
    </template>
  </UCard>
</template>
