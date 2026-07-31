<script setup lang="ts">
import type { EvaluatedValue, EvaluationSession } from '@/models/index'
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
  loadExistingResults,
  saveEvaluationResult,
  evaluateAndGoNext,
} = useEvaluation(session)

const {
  evaluationPass,
  showAiEvaluation,
  startSecondPass,
  setPassForItem,
  saveFirstPass,
  saveSecondPass,
} = useComposedEvaluation(session)

const evaluationConfig = computed(() => session?.config || null)
const isGenericEvaluation = computed(() => !!evaluationConfig.value)

const isCompletionModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isBlurPauseModalOpen = ref(false)
const isPausedModalOpen = ref(false)
const startEvaluationActions = computed(() => [
  {
    label: t('evaluation.timerAlertModal.button'),
    icon: 'i-lucide:play',
    variant: 'soft' as const,
  },
])
const blurPauseActions = computed(() => [
  {
    label: t('evaluation.blurPauseModal.pauseButton'),
    icon: 'i-lucide:pause',
    variant: 'soft' as const,
    onClick: confirmPauseOnBlur,
  },
  {
    label: t('evaluation.blurPauseModal.continueButton'),
    icon: 'i-lucide:play',
    variant: 'ghost' as const,
    onClick: cancelPauseOnBlur,
  },
])

const totalEvaluated = computed(() =>
  Object.values(evaluatedItems.value).filter(
    item => item.value !== undefined || item.masteryLevel !== undefined,
  ).length,
)

const isEvaluationComplete = computed(() =>
  items.value.length > 0 && totalEvaluated.value === items.value.length,
)

whenever(isEvaluationComplete, async () => {
  isCompletionModalOpen.value = true

  if (!session.isCompleted) {
    session.isCompleted = true
    await evaluationStorage.saveSession(session)
  }
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
const firstPersistedElapsedTimes = ref<Record<number, number>>({})
const secondPersistedElapsedTimes = ref<Record<number, number>>({})
const isStartModalOpen = ref(isTimerEnabled.value)
const timerActive = computed(() => isTimerEnabled.value && !isStartModalOpen.value && !isCompletionModalOpen.value && !isDeleteModalOpen.value)

// Arrow-key navigation must not fire while a modal is on screen.
const isAnyModalOpen = computed(() =>
  isCompletionModalOpen.value
  || isDeleteModalOpen.value
  || isBlurPauseModalOpen.value
  || isPausedModalOpen.value
  || isStartModalOpen.value,
)

const {
  formatted,
  elapsed,
  setElapsed,
  pause,
  resume,
  running,
  sync,
} = useTimer(timerActive)

const pausedActions = computed(() => [
  {
    label: t('evaluation.pausedModal.resumeButton'),
    icon: 'i-lucide:play',
    variant: 'soft' as const,
    onClick: () => {
      resume()
      isPausedModalOpen.value = false
    },
  },
  {
    label: t('evaluation.pausedModal.homeButton'),
    icon: 'i-lucide:home',
    variant: 'ghost' as const,
    onClick: () => {
      goToHomePage()
      isPausedModalOpen.value = false
    },
  },
])

// Whole-session time for the completion summary: every item's persisted time
// across both passes, plus whatever the live timer holds for the current item.
const totalElapsedFormatted = computed(() => {
  const sum = (times: Record<number, number>) =>
    Object.values(times).reduce((acc, ms) => acc + ms, 0)

  const currentId = currentItem.value?.id
  const persisted = evaluationPass.value === 2
    ? secondPersistedElapsedTimes.value
    : firstPersistedElapsedTimes.value
  const alreadyCounted = currentId != null ? persisted[currentId] ?? 0 : 0

  return formatElapsed(
    sum(firstPersistedElapsedTimes.value)
    + sum(secondPersistedElapsedTimes.value)
    - alreadyCounted
    + elapsed.value,
  )
})

function elapsedTimeFor(itemId: number, pass: 1 | 2): number {
  return pass === 2
    ? secondPersistedElapsedTimes.value[itemId] ?? 0
    : firstPersistedElapsedTimes.value[itemId] ?? 0
}

async function loadPersistedElapsedTimes() {
  if (!isTimerEnabled.value)
    return

  firstPersistedElapsedTimes.value = await evaluationStorage.getSessionElapsedTimes(session.id)
  secondPersistedElapsedTimes.value = await evaluationStorage.getSessionSecondElapsedTimes(session.id)
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
const sessionMenuItems = computed(() => [
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

async function handleEvaluateAndGoNext(value: EvaluatedValue, comment?: string) {
  if (isTimerEnabled.value)
    sync()

  const elapsed = isTimerEnabled.value ? formatted.value : undefined

  if (evaluationPass.value === 2 && currentItem.value) {
    await saveSecondPass(currentItem.value, value, comment, elapsed)
    loadExistingResults(session)
    goToNextItem()
  }
  else {
    await evaluateAndGoNext(value, comment, elapsed)
  }
}

async function handleSaveEvaluation(value: EvaluatedValue, comment?: string) {
  const elapsed = isTimerEnabled.value ? formatted.value : undefined

  if (evaluationPass.value === 1 && currentItem.value) {
    await saveFirstPass(currentItem.value, value, comment, elapsed)
    loadExistingResults(session)
  }
  else {
    await saveEvaluationResult(value, comment, elapsed)
  }
}

async function persistCurrentElapsedTime(itemId?: number) {
  if (!isTimerEnabled.value || itemId == null)
    return

  sync()

  const isSecondPass = evaluationPass.value === 2
  const elapsedByPass = isSecondPass
    ? secondPersistedElapsedTimes.value
    : firstPersistedElapsedTimes.value

  if (elapsedByPass[itemId] === elapsed.value)
    return

  elapsedByPass[itemId] = elapsed.value
  const pass: 'first' | 'second' = isSecondPass ? 'second' : 'first'
  await evaluationStorage.saveSessionElapsedTime(session.id, itemId, elapsed.value, pass)
}

async function handleStartSecondPass() {
  if (!isTimerEnabled.value)
    return

  const currentItemId = currentItem.value?.id
  if (currentItemId == null)
    return

  await persistCurrentElapsedTime(currentItemId)
  startSecondPass()
  setElapsed(elapsedTimeFor(currentItemId, 2))
}

watch(
  () => currentItem.value?.id,
  async (newItemId, oldItemId) => {
    if (isTimerEnabled.value && oldItemId != null) {
      await persistCurrentElapsedTime(oldItemId)
    }

    if (newItemId != null) {
      setPassForItem(newItemId)
    }

    if (!isTimerEnabled.value)
      return

    setElapsed(newItemId != null ? elapsedTimeFor(newItemId, evaluationPass.value) : 0)
  },
  { immediate: true },
)

onBeforeUnmount(async () => {
  await persistCurrentElapsedTime(currentItem.value?.id)
})
</script>

<template>
  <ConfirmationModal
    v-model:open="isStartModalOpen"
    :title="$t('evaluation.timerAlertModal.title')"
    :description="$t('evaluation.timerAlertModal.body')"
    :actions="startEvaluationActions"
  />

  <ConfirmationModal
    v-model:open="isBlurPauseModalOpen"
    :title="$t('evaluation.blurPauseModal.title')"
    :description="$t('evaluation.blurPauseModal.body')"
    :actions="blurPauseActions"
  />

  <div class="flex flex-col flex-1 min-h-0">
    <!-- Session title bar spanning full width -->
    <div class="flex shrink-0 items-center gap-2 px-4 py-2 border-b border-default bg-default">
      <h1 class="truncate text-base font-semibold text-highlighted">
        {{ session.name }}
      </h1>
      <ContextDataCollapsible
        v-if="session.dataset.context"
        :label="$t('evaluation.displayContext')"
        :context="session.dataset.context"
      />
      <div class="ms-auto flex items-center gap-1">
        <!-- Timer and its control read as one unit, not as peers of the
             session metadata. tabular-nums stops the 1Hz digit jitter. -->
        <div
          v-if="isTimerEnabled"
          class="flex items-center gap-1 rounded-md bg-elevated py-1 pe-1 ps-2.5"
        >
          <span class="font-mono text-sm tabular-nums text-highlighted">{{ formatted }}</span>
          <UButton
            :icon="running ? 'i-lucide:pause' : 'i-lucide:play'"
            variant="ghost"
            color="neutral"
            size="xs"
            :aria-label="running ? $t('evaluation.actions.pause') : $t('evaluation.actions.resume')"
            @click="running ? handlePauseClick() : resume()"
          />
        </div>
        <UDropdownMenu :items="sessionMenuItems" :modal="false">
          <UButton
            icon="i-lucide:more-vertical"
            variant="ghost"
            color="neutral"
          />
        </UDropdownMenu>
      </div>
    </div>

    <ConfirmationModal
      v-model:open="isPausedModalOpen"
      :title="$t('evaluation.pausedModal.title')"
      :description="$t('evaluation.pausedModal.body')"
      :actions="pausedActions"
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
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0 bg-default">
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
      >
        <template #header>
          <div class="flex flex-col gap-3 p-4 pb-0 bg-default">
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
              :shortcuts-enabled="!isAnyModalOpen"
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
              :save-evaluation="handleSaveEvaluation"
              :evaluate-generic-and-go-next="isGenericEvaluation ? handleEvaluateAndGoNext : undefined"
              :evaluation-pass="evaluationPass"
              :show-ai-evaluation="showAiEvaluation"
              @start-second-pass="handleStartSecondPass"
              @update:evaluator-comment="evaluatorComment = $event"
            />
          </div>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>

    <!-- Mobile: single column scrollable -->
    <div v-else class="flex flex-col gap-4 p-4 bg-default">
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
        :shortcuts-enabled="!isAnyModalOpen"
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
        :save-evaluation="handleSaveEvaluation"
        :evaluate-generic-and-go-next="isGenericEvaluation ? handleEvaluateAndGoNext : undefined"
        :evaluation-pass="evaluationPass"
        :show-ai-evaluation="showAiEvaluation"
        @start-second-pass="handleStartSecondPass"
        @update:evaluator-comment="evaluatorComment = $event"
      />
    </div>

    <!-- Completion modal — outside the desktop-only branch so it also fires on mobile -->
    <UModal
      v-model:open="isCompletionModalOpen"
      :title="$t('evaluation.completion.title')"
      :description="$t('evaluation.completion.message')"
      :ui="{ description: 'sr-only' }"
    >
      <template #body>
        <CompletionCelebration
          :item-count="totalEvaluated"
          :duration="isTimerEnabled ? totalElapsedFormatted : undefined"
        />
      </template>

      <template #footer>
        <UButton
          :label="$t('evaluation.completion.review')"
          color="neutral"
          variant="ghost"
          @click="reviewEvaluations"
        />
        <UButton
          :label="$t('evaluation.completion.goHome')"
          @click="goToHomePage"
        />
      </template>
    </UModal>

    <!-- Delete confirmation modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :title="$t('evaluation.deleteModal.title')"
      :description="$t('evaluation.deleteModal.message', { name: session.name })"
    >
      <template #body>
        <p class="text-sm text-error">
          {{ $t('evaluation.deleteModal.warning') }}
        </p>
      </template>

      <template #footer>
        <UButton
          :label="$t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="() => { isDeleteModalOpen = false }"
        />
        <UButton
          :label="$t('common.delete')"
          color="error"
          @click="handleDelete"
        />
      </template>
    </UModal>
  </div>
</template>
