<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const sessionId = route.params.uuid as string
const {
  currentSession,
  currentQuestionGroup,
  currentQuestionGroupProgress,
  totalProgress,
  currentQuestion,
  currentAbsoluteQuestionIndex,
  currentQuestionIndexInGroup,
  evaluatorComment,
  evaluateGenericAndGoNext,
  navigateToQuestion,
  isEvaluationCompleted,
  isSingleEvaluation,
  questions,
  groupedQuestions,
  evaluatedQuestions,
} = useEvaluation(sessionId)

// Determine evaluation mode
const evaluationConfig = computed(() => {
  // Check if the session has an evaluation configuration
  return currentSession.value?.config || null
})

const isGenericEvaluation = computed(() => {
  return !!evaluationConfig.value
})

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

      <!-- Question navigation and context header -->
      <div class="flex flex-col gap-3">
        <QuestionNavigator
          :is-single-evaluation="isSingleEvaluation"
          :grouped-questions="groupedQuestions"
          :questions="questions"
          :current-question-group="currentQuestionGroup"
          :current-index="currentAbsoluteQuestionIndex"
          :evaluated-questions="evaluatedQuestions"
          :on-navigate="navigateToQuestion"
        />

        <QuestionCard v-if="currentQuestion" :current-question="currentQuestion" />
      </div>

      <!-- Evaluation navigation and card -->
      <div class="flex flex-col gap-3">
        <EvaluationNavigator
          :is-single-evaluation="isSingleEvaluation"
          :grouped-questions="groupedQuestions"
          :questions="questions"
          :current-question-group="currentQuestionGroup"
          :current-absolute-question-index="currentAbsoluteQuestionIndex"
          :current-question-index-in-group="currentQuestionIndexInGroup"
          :current-index="currentAbsoluteQuestionIndex"
          :evaluated-questions="evaluatedQuestions"
          :on-navigate="navigateToQuestion"
        />

        <HybridEvaluationCard
          v-if="currentQuestion"
          :current-question="currentQuestion"
          :evaluator-comment="evaluatorComment"
          :evaluated-questions="evaluatedQuestions"
          :evaluation-config="evaluationConfig || undefined"
          :evaluate-generic-and-go-next="isGenericEvaluation ? evaluateGenericAndGoNext : undefined"
          @update:evaluator-comment="evaluatorComment = $event"
        />
      </div>
    </div>

    <!-- Completion Modal -->
    <UModal v-model:open="isCompletionModalOpen" title="Evalaution Completed Modal" description="Evaluation Completed Modal">
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
