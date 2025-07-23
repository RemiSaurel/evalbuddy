<script setup lang="ts">
const route = useRoute()
const router = useRouter()

// Get session from storage
const sessionId = route.params.uuid as string
const { evaluationStorage } = await import('@/utils/storage')

const session = await evaluationStorage.getSession(sessionId)
if (!session) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Evaluation session not found',
  })
}

// Initialize evaluation composable with session
const {
  items,
  groupedItems,
  currentIndex,
  currentItem,
  currentItemGroup,
  evaluatedItems,
  evaluatorComment,
  isSingleEvaluation,
  currentQuestionIndexInGroup,
  currentAbsoluteQuestionIndex,
  goToItem,
  evaluateAndGoNext,
} = useEvaluation(session)

// Navigation functions
async function handleEvaluateAndGoNext(value: any, comment?: string) {
  await evaluateAndGoNext(value, comment)
}

// Determine evaluation mode
const evaluationConfig = computed(() => {
  return session?.config || null
})

const isGenericEvaluation = computed(() => {
  return !!evaluationConfig.value
})

const isCompletionModalOpen = ref(false)

// Watch for evaluation completion
const isEvaluationComplete = computed(() => {
  const actuallyEvaluatedCount = Object.values(evaluatedItems.value).filter(
    item => item.value !== undefined || item.masteryLevel !== undefined,
  ).length
  return items.value.length > 0 && actuallyEvaluatedCount === items.value.length
})

watch(isEvaluationComplete, (newValue) => {
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

// Computed property for current question progress (only evaluated items in current question group)
const currentQuestionProgress = computed(() => {
  if (!currentItem.value || !currentItemGroup.value.length) {
    return 0
  }

  // Count how many items in the current question group have been evaluated
  return currentItemGroup.value.filter((item) => {
    const evaluation = evaluatedItems.value[item.id]
    return evaluation && (evaluation.value !== undefined || evaluation.masteryLevel !== undefined)
  }).length
})
</script>

<template>
  <div class="mt-8">
    <div class="flex flex-col gap-1.5">
      <!-- Evaluation title and dataset context button -->
      <h1 class="font-bold text-xl text-neutral-900">
        <span>{{ session.name }}</span>
      </h1>
    </div>

    <div class="flex flex-col gap-8 mt-5">
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-8 justify-between">
        <QuestionProgress
          :label="$t('evaluation.progress.current')"
          :progress="currentQuestionProgress"
          :max="currentItemGroup.length"
        />
        <QuestionProgress
          :label="$t('evaluation.progress.total')"
          :progress="Object.values(evaluatedItems)
            .filter(item => item.value !== undefined || item.masteryLevel !== undefined).length"
          :max="items.length"
        />
      </div>

      <!-- Question navigation and context header -->
      <div class="flex flex-col gap-3">
        <QuestionNavigator
          :is-single-evaluation="isSingleEvaluation"
          :grouped-items="groupedItems"
          :items="items"
          :current-item-group="currentItemGroup"
          :current-index="currentIndex"
          :evaluated-items="evaluatedItems"
          :on-navigate="goToItem"
        />

        <QuestionCard v-if="currentItem" :current-question="currentItem" />
      </div>

      <!-- Evaluation navigation and card -->
      <div class="flex flex-col gap-3">
        <EvaluationNavigator
          :is-single-evaluation="isSingleEvaluation"
          :grouped-items="groupedItems"
          :items="items"
          :current-item-group="currentItemGroup"
          :current-absolute-item-index="currentAbsoluteQuestionIndex"
          :current-item-index-in-group="currentQuestionIndexInGroup"
          :current-index="currentIndex"
          :evaluated-items="evaluatedItems"
          :on-navigate="goToItem"
        />

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

    <!-- Completion Modal -->
    <UModal
      v-model:open="isCompletionModalOpen"
      title="Evalaution Completed Modal"
      description="Evaluation Completed Modal"
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
