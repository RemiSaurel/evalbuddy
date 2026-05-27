<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { EvaluationSession } from '@/models/index'
import { ImportExportService } from '@/utils/importExport'

definePageMeta({
  layout: 'evaluation',
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const sessionId = route.params.uuid as string
const { evaluationStorage } = await import('@/utils/storage')

const session = await evaluationStorage.getSession(sessionId) as EvaluationSession
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

const evaluationConfig = computed(() => session?.config || null)
const isGenericEvaluation = computed(() => !!evaluationConfig.value)

const isCompletionModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isBlurPauseModalOpen = ref(false)
const isPausedModalOpen = ref(false)

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
const isDesktop = useMediaQuery('(min-width: 1024px)')

// View settings (persisted in localStorage)
const hideProgressBar = useLocalStorage('evalbuddy-hide-progress', false)

async function handleExport() {
  await persistCurrentElapsedTime(currentItem.value?.id)
  const blob = await ImportExportService.exportSession(session.id)
  const filename = ImportExportService.generateExportFilename(session.name)
  ImportExportService.downloadBlob(blob, filename)
}

async function handleDelete() {
  await evaluationStorage.deleteSession(session.id)
  isDeleteModalOpen.value = false
  router.push('/')
}

const isTimerEnabled = computed(() => evaluationConfig.value?.settings.timerEnabled ?? false)
const persistedElapsedTimes = ref<Record<number, number>>({})
const isStartModalOpen = ref(false)
const timerActive = computed(() => isTimerEnabled.value && !isStartModalOpen.value && !isCompletionModalOpen.value && !isDeleteModalOpen.value)

const {
  formatted,
  elapsed,
  setElapsed,
  pause,
  resume,
  running,
  sync,
} = useTimer(timerActive)

async function loadPersistedElapsedTimes() {
  if (!isTimerEnabled.value)
    return

  persistedElapsedTimes.value = await evaluationStorage.getSessionElapsedTimes(session.id)

  const currentItemId = currentItem.value?.id
  if (currentItemId != null) {
    setElapsed(persistedElapsedTimes.value[currentItemId] ?? 0)
  }
}

await loadPersistedElapsedTimes()

function handleWindowBlur() {
  if (!timerActive.value || !running.value || isBlurPauseModalOpen.value)
    return

  isBlurPauseModalOpen.value = true
}

function confirmPauseOnBlur() {
  pause()
  isBlurPauseModalOpen.value = false
  isPausedModalOpen.value = true
}

function handlePauseClick() {
  pause()
  isPausedModalOpen.value = true
}

function cancelPauseOnBlur() {
  isBlurPauseModalOpen.value = false
}

onMounted(() => {
  window.addEventListener('blur', handleWindowBlur)
})

onBeforeUnmount(() => {
  window.removeEventListener('blur', handleWindowBlur)
})

// Session dropdown menu
const sessionMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: t('evaluation.settings.hideProgressBar'),
      icon: 'i-lucide:chart-bar',
      type: 'checkbox' as const,
      checked: hideProgressBar.value,
      onUpdateChecked: (checked: boolean) => { hideProgressBar.value = checked },
    },
  ],
  [
    {
      label: t('evaluation.actions.export'),
      icon: 'i-lucide:download',
      onSelect: () => handleExport(),
    },
    {
      label: t('evaluation.actions.delete'),
      icon: 'i-lucide:trash-2',
      color: 'error' as const,
      onSelect: () => { isDeleteModalOpen.value = true },
    },
  ],
])

async function handleEvaluateAndGoNext(value: any, comment?: string) {
  await evaluateAndGoNext(value, comment, undefined, formatted.value)
}

async function persistCurrentElapsedTime(itemId?: number) {
  if (!isTimerEnabled.value || itemId == null)
    return

  sync()

  if (persistedElapsedTimes.value[itemId] === elapsed.value)
    return

  persistedElapsedTimes.value[itemId] = elapsed.value
  await evaluationStorage.saveSessionElapsedTime(session.id, itemId, elapsed.value)
}

watch(
  () => currentItem.value?.id,
  async (newItemId, oldItemId) => {
    if (!isTimerEnabled.value)
      return

    if (oldItemId != null) {
      await persistCurrentElapsedTime(oldItemId)
    }

    setElapsed(newItemId != null
      ? persistedElapsedTimes.value[newItemId] ?? 0
      : 0,
    )
  },
  { immediate: true },
)

watch(
  isTimerEnabled,
  (enabled) => {
    if (enabled) {
      isStartModalOpen.value = true
    }
  },
  { immediate: true },
)

onUnmounted(async () => {
  await persistCurrentElapsedTime(currentItem.value?.id)
})
</script>

<template>
  <StartEvaluationModal
    v-model:is-start-modal-open="isStartModalOpen"
  />

  <PauseConfirmationModal
    v-model:open="isBlurPauseModalOpen"
    @confirm="confirmPauseOnBlur"
    @cancel="cancelPauseOnBlur"
  />

  <div class="flex flex-col flex-1 min-h-0">
    <!-- Session title bar spanning full width -->
    <div class="flex shrink-0 items-center gap-2 px-4 py-2 border-b border-neutral-200 bg-white dark:bg-neutral-900 transition-colors">
      <h1 class="font-bold text-lg text-neutral-900 dark:text-neutral-100 truncate">
        {{ session.name }}
      </h1>
      <ContextDataCollapsible
        v-if="session.dataset.context"
        :label="$t('evaluation.displayContext')"
        :context="session.dataset.context"
      />
      <div v-if="isTimerEnabled">
        {{ formatted }}
      </div>
      <div class="ml-auto flex items-center gap-2">
        <UButton
          v-if="isTimerEnabled"
          :icon="running ? 'i-lucide:pause' : 'i-lucide:play'"
          variant="ghost"
          color="neutral"
          @click="running ? handlePauseClick() : resume()"
        >
          {{ running ? $t('evaluation.actions.pause') : $t('evaluation.actions.resume') }}
        </UButton>
        <UDropdownMenu :items="sessionMenuItems" :modal="false">
          <UButton
            icon="i-lucide:more-vertical"
            variant="ghost"
            color="neutral"
            size="sm"
          />
        </UDropdownMenu>
      </div>
    </div>

    <PausedModal
      v-model:open="isPausedModalOpen"
      @resume="() => { resume(); isPausedModalOpen = false }"
      @go-home="goToHomePage"
    />

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
        :ui="{ root: 'min-h-[0px]!', body: 'min-h-[0px]!' }"
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0 dark:bg-neutral-900">
            <QuestionProgress
              v-if="!hideProgressBar"
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
          <div class="flex flex-col gap-3 overflow-hidden">
            <ContextDataCollapsible
              v-if="currentItem && questions.get(currentItem.questionID)?.context"
              :label="$t('evaluation.question.displayQuestionContext')"
              :context="questions.get(currentItem.questionID)!.context!"
            />
            <div class="min-h-0 p-0.5 mb-1 overflow-auto">
              <QuestionCard
                v-if="currentItem"
                :current-question="currentItem"
              />
            </div>
          </div>
        </template>
      </UDashboardPanel>

      <!-- RIGHT PANEL: Answer + Scoring -->
      <UDashboardPanel
        id="answer-panel"
        :ui="{ root: 'min-h-[0px]!', body: 'min-h-[0px]!' }"
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0 dark:bg-neutral-900">
            <QuestionProgress
              v-if="!hideProgressBar"
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

          <div class="min-h-0 mb-1">
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
    <div v-else class="flex flex-col gap-4 p-4 bg-white dark:bg-neutral-900">
      <!-- Total progress -->
      <QuestionProgress
        v-if="!hideProgressBar"
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
        v-if="!hideProgressBar"
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

    <!-- Delete confirmation modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Delete Evaluation Session Modal" description="Delete Evaluation Session Modal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ $t('evaluation.deleteModal.title') }}
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-neutral-600">
              {{ $t('evaluation.deleteModal.message', { name: session.name }) }}
            </p>
            <p class="text-sm text-error">
              {{ $t('evaluation.deleteModal.warning') }}
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="outline"
                @click="isDeleteModalOpen = false"
              >
                {{ $t('evaluation.actions.cancel') }}
              </UButton>
              <UButton
                color="error"
                @click="handleDelete"
              >
                {{ $t('evaluation.actions.delete') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
