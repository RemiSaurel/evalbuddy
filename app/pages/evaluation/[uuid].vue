<script setup lang="ts">
import { MasteryLevel } from '@/models/index'
import { QUESTIONS } from '@/utils/data'

const { t } = useI18n()

const colors = {
  [MasteryLevel.NOT_ATTAINED]: 'bg-red-300 text-red-800 hover:bg-red-400',
  [MasteryLevel.INSUFFICIENT]: 'bg-orange-300 text-orange-800 hover:bg-orange-400',
  [MasteryLevel.SUFFICIENT]: 'bg-yellow-300 text-yellow-800 hover:bg-yellow-400',
  [MasteryLevel.TOTAL]: 'bg-green-300 text-green-800 hover:bg-green-400',
}

const masteryLevels = computed(() => Object.values(MasteryLevel).map(level => ({
  label: t(`evaluation.mastery.${level}`),
  value: level,
  color: colors[level],
})))

const {
  currentQuestionGroup,
  currentQuestionGroupProgress,
  totalProgress,
  currentQuestion,
  currentAbsoluteQuestionIndex,
  evaluatorComment,
  evaluateAndGoNext,
  goToPreviousQuestion,
  goToNextQuestion,
  isCurrentQuestionEvaluated,
  canGoNext,
  isEvaluationCompleted,
} = useEvaluation()

const router = useRouter()
const isCompletionModalOpen = ref(false)

// Watch for evaluation completion
watch(isEvaluationCompleted, (newValue) => {
  if (newValue) {
    isCompletionModalOpen.value = true
  }
})

function goToHomePage() {
  router.push('/')
}

function reviewEvaluations() {
  isCompletionModalOpen.value = false
  // For now, just go to the first question to review
  // In a real app, you might want to implement a review mode
}
</script>

<template>
  <div>
    <div class="flex flex-col gap-8 mt-8">
      <div class="flex gap-8 justify-between">
        <QuestionProgress
          :label="$t('evaluation.progress.currentQuestion')"
          :progress="currentQuestionGroupProgress"
          :max="currentQuestionGroup?.length || 0"
        />
        <QuestionProgress
          :label="$t('evaluation.progress.total')"
          :progress="totalProgress"
          :max="QUESTIONS.length"
        />
      </div>
      <div class="flex justify-between gap-4">
        <UButton
          :label="$t('evaluation.previous')"
          color="info"
          :disabled="currentAbsoluteQuestionIndex === 0"
          icon="i-lucide:arrow-left"
          size="xl"
          variant="soft"
          @click="goToPreviousQuestion"
        />
        <UButton
          :label="$t('evaluation.next')"
          color="info"
          :disabled="!canGoNext || !isCurrentQuestionEvaluated"
          icon="i-lucide:arrow-right"
          trailing
          size="xl"
          variant="soft"
          @click="goToNextQuestion"
        />
      </div>
      <EvaluationCard
        v-if="currentQuestion"
        :current-question="currentQuestion"
        :current-absolute-question-index="currentAbsoluteQuestionIndex"
        :evaluator-comment="evaluatorComment"
        :mastery-levels="masteryLevels"
        :evaluate-and-go-next="evaluateAndGoNext"
      />
    </div>
  </div>

  <!-- Completion Modal -->
  <UModal v-model:open="isCompletionModalOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎉</span>
            <h3 class="text-lg font-semibold">
              {{ $t('evaluation.completion.title') }}
            </h3>
          </div>
        </template>

        <div class="">
          <p class="text-muted">
            {{ $t('evaluation.completion.message') }}
          </p>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              :label="$t('evaluation.completion.review')"
              color="neutral"
              variant="outline"
              @click="reviewEvaluations"
            />
            <UButton
              :label="$t('evaluation.completion.goHome')"
              color="primary"
              @click="goToHomePage"
            />
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
