<script setup lang="ts">
definePageMeta({
  layout: 'evaluation',
})

const route = useRoute()
const router = useRouter()

const sessionId = route.params.uuid as string
const { evaluationStorage } = await import('@/utils/storage')

const session = await evaluationStorage.getSession(sessionId)
if (!session) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Evaluation session not found',
  })
}

const {
  items,
  questions,
  groupedItems,
  groupKeys,
  currentGroupIndex,
  currentItem,
  currentItemGroup,
  evaluatedItems,
  evaluatorComment,
  isSingleEvaluation,
  currentItemIndexInGroup,
  goToItem,
  goToPreviousItem,
  goToNextItem,
  evaluateAndGoNext,
} = useEvaluation(session)

async function handleEvaluateAndGoNext(value: any, comment?: string) {
  await evaluateAndGoNext(value, comment)
}

const evaluationConfig = computed(() => session?.config || null)
const isGenericEvaluation = computed(() => !!evaluationConfig.value)

const isCompletionModalOpen = ref(false)

const totalEvaluated = computed(() =>
  Object.values(evaluatedItems.value).filter(
    item => item.value !== undefined || item.masteryLevel !== undefined,
  ).length,
)

const isEvaluationComplete = computed(() =>
  items.value.length > 0 && totalEvaluated.value === items.value.length,
)

whenever(isEvaluationComplete, () => {
  isCompletionModalOpen.value = true
})

function goToHomePage() {
  router.push('/')
}

function reviewEvaluations() {
  isCompletionModalOpen.value = false
}

const currentQuestionProgress = computed(() => {
  if (!currentItem.value || !currentItemGroup.value.length)
    return 0
  return currentItemGroup.value.filter((item) => {
    const evaluation = evaluatedItems.value[item.id]
    return evaluation && (evaluation.value !== undefined || evaluation.masteryLevel !== undefined)
  }).length
})

const questionKey = computed(() => currentItem.value?.questionID ?? 0)
const answerKey = computed(() => currentItem.value?.id ?? '')

const isDesktop = useMediaQuery('(min-width: 1024px)')
</script>

<template>
  <div class="flex flex-col flex-1 min-h-0">
    <!-- Session title bar spanning full width -->
    <div class="flex shrink-0 items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-neutral-50">
      <h1 class="font-bold text-lg text-neutral-900 truncate">
        {{ session.name }}
      </h1>
      <ContextDataCollapsible
        v-if="session.dataset.context"
        :label="$t('evaluation.displayContext')"
        :context="session.dataset.context"
      />
    </div>

    <!-- Desktop: side-by-side resizable panels -->
    <UDashboardGroup
      v-if="isDesktop"
      storage="local"
      storage-key="evalbuddy-panels"
      :ui="{ base: 'relative flex-1 min-h-0 flex overflow-hidden' }"
    >
      <!-- LEFT PANEL: Question side -->
      <UDashboardPanel
        id="question-panel"
        resizable
        :default-size="50"
        :min-size="30"
        :max-size="70"
        :ui="{ root: 'min-h-0!' }"
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0">
            <QuestionProgress
              :label="$t('evaluation.progress.total')"
              :progress="totalEvaluated"
              :max="items.length"
            />

            <QuestionNavigator
              :is-single-evaluation="isSingleEvaluation"
              :grouped-items="groupedItems"
              :group-keys="groupKeys"
              :items="items"
              :current-group-index="currentGroupIndex"
              :current-item-index-in-group="currentItemIndexInGroup"
              :current-item-group="currentItemGroup"
              :evaluated-items="evaluatedItems"
              :on-navigate="goToItem"
            />
          </div>
        </template>

        <template #body>
          <ContextDataCollapsible
            v-if="currentItem && questions.get(currentItem.questionID)?.context"
            :label="$t('evaluation.question.displayQuestionContext')"
            :context="questions.get(currentItem.questionID)!.context!"
          />

          <Motion
            :key="questionKey"
            :initial="{ opacity: 0, x: -12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.2 }"
          >
            <QuestionCard
              v-if="currentItem"
              :current-question="currentItem"
            />
          </Motion>
        </template>
      </UDashboardPanel>

      <!-- RIGHT PANEL: Answer + Scoring -->
      <UDashboardPanel
        id="answer-panel"
        :ui="{ root: 'min-h-0!' }"
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0">
            <QuestionProgress
              :label="$t('evaluation.progress.current')"
              :progress="currentQuestionProgress"
              :max="currentItemGroup.length"
            />

            <EvaluationNavigator
              :is-single-evaluation="isSingleEvaluation"
              :grouped-items="groupedItems"
              :items="items"
              :current-item-group="currentItemGroup"
              :current-group-index="currentGroupIndex"
              :current-item-index-in-group="currentItemIndexInGroup"
              :evaluated-items="evaluatedItems"
              :on-navigate="goToItem"
              :go-to-previous="goToPreviousItem"
              :go-to-next="goToNextItem"
            />
          </div>
        </template>

        <template #body>
          <ContextDataCollapsible
            v-if="currentItem?.context"
            :label="$t('evaluation.question.displayAnswerContext')"
            :context="currentItem?.context"
          />

          <Motion
            :key="answerKey"
            :initial="{ opacity: 0, x: 12 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ duration: 0.2 }"
          >
            <HybridEvaluationCard
              v-if="currentItem"
              :current-item="currentItem"
              :evaluator-comment="evaluatorComment"
              :evaluated-items="evaluatedItems"
              :evaluation-config="evaluationConfig || undefined"
              :evaluate-generic-and-go-next="isGenericEvaluation ? handleEvaluateAndGoNext : undefined"
              @update:evaluator-comment="evaluatorComment = $event"
            />
          </Motion>
        </template>
      </UDashboardPanel>

      <!-- Completion Modal -->
      <UModal
        v-model:open="isCompletionModalOpen"
        title="Evaluation Completed"
        description="Evaluation Completed"
      >
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

            <p class="text-muted">
              {{ $t('evaluation.completion.message') }}
            </p>

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
    </UDashboardGroup>

    <!-- Mobile: single column scrollable -->
    <div v-else class="flex flex-col flex-1 overflow-y-auto gap-4 p-4">
      <!-- Total progress -->
      <QuestionProgress
        :label="$t('evaluation.progress.total')"
        :progress="totalEvaluated"
        :max="items.length"
      />

      <!-- Question navigation -->
      <QuestionNavigator
        :is-single-evaluation="isSingleEvaluation"
        :grouped-items="groupedItems"
        :group-keys="groupKeys"
        :items="items"
        :current-group-index="currentGroupIndex"
        :current-item-index-in-group="currentItemIndexInGroup"
        :current-item-group="currentItemGroup"
        :evaluated-items="evaluatedItems"
        :on-navigate="goToItem"
      />

      <ContextDataCollapsible
        v-if="currentItem && questions.get(currentItem.questionID)?.context"
        :label="$t('evaluation.question.displayQuestionContext')"
        :context="questions.get(currentItem.questionID)!.context!"
      />

      <!-- Question card -->
      <QuestionCard
        v-if="currentItem"
        :current-question="currentItem"
      />

      <USeparator />

      <!-- Current question progress -->
      <QuestionProgress
        :label="$t('evaluation.progress.current')"
        :progress="currentQuestionProgress"
        :max="currentItemGroup.length"
      />

      <!-- Answer navigation -->
      <EvaluationNavigator
        :is-single-evaluation="isSingleEvaluation"
        :grouped-items="groupedItems"
        :items="items"
        :current-item-group="currentItemGroup"
        :current-group-index="currentGroupIndex"
        :current-item-index-in-group="currentItemIndexInGroup"
        :evaluated-items="evaluatedItems"
        :on-navigate="goToItem"
        :go-to-previous="goToPreviousItem"
        :go-to-next="goToNextItem"
      />

      <ContextDataCollapsible
        v-if="currentItem?.context"
        :label="$t('evaluation.question.displayAnswerContext')"
        :context="currentItem?.context"
      />

      <!-- Evaluation card -->
      <HybridEvaluationCard
        v-if="currentItem"
        :current-item="currentItem"
        :evaluator-comment="evaluatorComment"
        :evaluated-items="evaluatedItems"
        :evaluation-config="evaluationConfig || undefined"
        :evaluate-generic-and-go-next="isGenericEvaluation ? handleEvaluateAndGoNext : undefined"
        @update:evaluator-comment="evaluatorComment = $event"
      />
    </div>
  </div>
</template>
