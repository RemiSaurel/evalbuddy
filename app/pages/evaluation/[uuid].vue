<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { MasteryLevel } from '@/models/index'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const sessionId = route.params.uuid as string
const {
  currentQuestionGroup,
  currentQuestionGroupProgress,
  totalProgress,
  currentQuestion,
  currentAbsoluteQuestionIndex,
  evaluatorComment,
  evaluateAndGoNext,
  navigateToQuestion,
  isEvaluationCompleted,
  questions,
  evaluatedQuestions,
} = useEvaluation(sessionId)

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
          :label="$t('evaluation.progress.current')"
          :progress="currentQuestionGroupProgress"
          :max="currentQuestionGroup?.length || 0"
        />
        <QuestionProgress
          :label="$t('evaluation.progress.total')"
          :progress="totalProgress"
          :max="questions.length"
        />
      </div>

      <!-- Question Navigator replacing Previous/Next buttons -->
      <QuestionNavigator
        :questions="questions"
        :current-index="currentAbsoluteQuestionIndex"
        :evaluated-questions="evaluatedQuestions"
        :on-navigate="navigateToQuestion"
      />

      <EvaluationCard
        v-if="currentQuestion"
        :current-question="currentQuestion"
        :current-absolute-question-index="currentAbsoluteQuestionIndex"
        :evaluator-comment="evaluatorComment"
        :mastery-levels="masteryLevels"
        :evaluate-and-go-next="evaluateAndGoNext"
        :evaluated-questions="evaluatedQuestions"
        @update:evaluator-comment="evaluatorComment = $event"
      />
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
  </div>
</template>
