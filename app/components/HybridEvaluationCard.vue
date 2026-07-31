<script setup lang="ts">
import type { EvaluatedItem, EvaluatedValue, EvaluationConfig, EvaluationItem, EvaluationMode } from '~/models'

interface Props {
  currentItem: EvaluationItem & { questionText?: string, referenceAnswer?: string }
  evaluatorComment: string
  evaluatedItems: Record<string, EvaluatedItem>
  evaluationConfig?: EvaluationConfig
  evaluateGenericAndGoNext?: (value: EvaluatedValue, comment?: string) => void
  saveEvaluation?: (value: EvaluatedValue, comment?: string) => void
  evaluationPass?: 1 | 2
  showAiEvaluation?: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:evaluatorComment': [comment: string]
  'startSecondPass': []
}>()

const { t } = useI18n()
const { getEvaluationOptions, isScoreType, getScoreSettings } = useEvaluationConfig()
const reduceMotion = useReducedMotion()

const selectedValue = ref<EvaluatedValue>(null)
const localComment = ref('')

// The "comment required" message used to mount and unmount on every keystroke.
// It now waits until the field has been left, or a confirm has been attempted.
const commentTouched = ref(false)

watch(() => props.currentItem, () => {
  loadEvaluationForCurrentItem()
}, { immediate: true })

watch(() => props.evaluatedItems, () => {
  loadEvaluationForCurrentItem()
}, { deep: true })

watch(() => props.evaluatorComment, (newComment) => {
  localComment.value = newComment || ''
}, { immediate: true })

function loadEvaluationForCurrentItem() {
  if (props.currentItem) {
    const existingEvaluation = props.evaluatedItems[props.currentItem.id]
    if (existingEvaluation) {
      selectedValue.value = existingEvaluation.value ?? existingEvaluation.masteryLevel ?? null
      localComment.value = existingEvaluation.comment || ''
    }
    else {
      selectedValue.value = null
      localComment.value = ''
    }
  }
  else {
    selectedValue.value = null
    localComment.value = ''
  }

  commentTouched.value = false
}

const evaluationOptions = computed(() => {
  if (props.evaluationConfig) {
    return getEvaluationOptions(props.evaluationConfig)
  }
  return []
})

const scoreSettings = computed(() => {
  if (props.evaluationConfig) {
    return getScoreSettings(props.evaluationConfig)
  }
  return null
})

const isScoreEvaluation = computed(() => {
  if (props.evaluationConfig) {
    return isScoreType(props.evaluationConfig)
  }
  return false
})

const evaluationMode = computed<EvaluationMode>(
  () => props.evaluationConfig?.settings?.evaluationMode ?? 'without-ai',
)

const isComposedMode = computed(() => evaluationMode.value === 'without-then-with-ai')

const commentsAllowed = computed(() => {
  if (props.evaluationConfig) {
    return props.evaluationConfig.settings.allowComments ?? true
  }
  return true
})

const commentsRequired = computed(() => {
  if (!commentsAllowed.value) {
    return false
  }

  if (props.evaluationConfig) {
    return props.evaluationConfig.settings.requireComments ?? false
  }
  return false
})

const commentInvalid = computed(() =>
  commentsRequired.value && commentTouched.value && !localComment.value.trim(),
)

const canConfirmEvaluation = computed(() => {
  const hasValue = selectedValue.value !== null && selectedValue.value !== undefined
  const hasRequiredComment = !commentsRequired.value || (localComment.value && localComment.value.trim())
  return hasValue && hasRequiredComment
})

const shouldAutoAdvance = computed(() => {
  return !commentsAllowed.value
})

function onCommentUpdate(value: string) {
  localComment.value = value
  emit('update:evaluatorComment', value)
}

function selectValue(value: EvaluatedValue) {
  selectedValue.value = value

  if (!isScoreEvaluation.value && shouldAutoAdvance.value) {
    nextTick(() => confirmEvaluation())
  }
}

function incrementScore() {
  if (!scoreSettings.value)
    return
  const current = Number(selectedValue.value ?? scoreSettings.value.minValue)
  const next = Math.min(current + scoreSettings.value.step, scoreSettings.value.maxValue)
  selectedValue.value = next
}

function decrementScore() {
  if (!scoreSettings.value)
    return
  const current = Number(selectedValue.value ?? scoreSettings.value.minValue)
  const next = Math.max(current - scoreSettings.value.step, scoreSettings.value.minValue)
  selectedValue.value = next
}

async function confirmEvaluation() {
  if (!canConfirmEvaluation.value) {
    // Surfaces the "comment required" message on a blocked confirm attempt.
    commentTouched.value = true
    return
  }

  const comment = commentsAllowed.value ? localComment.value : undefined

  if (isComposedMode.value && props.evaluationPass === 1) {
    await props.saveEvaluation?.(selectedValue.value, comment)
    emit('startSecondPass')
    selectedValue.value = null
    localComment.value = ''
    return
  }

  if (props.evaluateGenericAndGoNext) {
    await props.evaluateGenericAndGoNext(selectedValue.value, comment)
  }

  selectedValue.value = null
  localComment.value = ''
}

useEvaluationShortcuts({
  onSelectOption: (index: number) => {
    const options = evaluationOptions.value
    if (index < options.length) {
      selectValue(options[index]!.value)
    }
  },
  onConfirm: () => confirmEvaluation(),
  onIncrement: () => incrementScore(),
  onDecrement: () => decrementScore(),
  optionCount: computed(() => evaluationOptions.value.length),
  isScoreMode: isScoreEvaluation,
})

const aiScoreDisplay = computed(() => {
  const score = props.currentItem?.aiEvaluation?.score
  if (score === undefined || score === null)
    return '—'

  const numericScore = Number(score)
  if (Number.isNaN(numericScore))
    return String(score)

  return String(numericScore)
})

const aiJustificationDisplay = computed(() => {
  return props.currentItem?.aiEvaluation?.justification || '—'
})
</script>

<template>
  <UCard>
    <!-- Submitted answer.
         min-h, not an animation: arrowing between a one-line answer and a
         paragraph would otherwise jump the option buttons under the cursor.
         Stability beats a transition on a swap this frequent. -->
    <div class="flex min-h-24 flex-col gap-2">
      <SectionHeading icon="i-lucide:message-square-quote" :label="t('evaluation.question.submittedAnswer')" />
      <ContentRenderer :content="currentItem.submittedAnswer" />
    </div>

    <template #footer>
      <!-- Grid column count flips 1 → 2 when the AI pass starts. The flip
           itself stays instant (track counts don't interpolate); the incoming
           panel animates so the reflow is explained rather than jarring. -->
      <div class="grid gap-5" :class="showAiEvaluation ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'">
        <Motion
          v-if="showAiEvaluation"
          :initial="reduceMotion ? { opacity: 0 } : { opacity: 0, transform: 'translateX(8px)' }"
          :animate="{ opacity: 1, transform: 'translateX(0px)' }"
          :transition="{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }"
        >
          <div class="flex flex-col gap-2">
            <SectionHeading icon="i-lucide:bot" :label="t('evaluation.aiEvaluation.title')" />
            <div class="grid grid-cols-[1fr_3fr] gap-2">
              <div class="flex flex-col gap-1">
                <div class="text-xs font-medium text-muted">
                  {{ t('evaluation.aiEvaluation.score') }}
                </div>
                <div class="rounded-md bg-muted p-2 text-sm tabular-nums text-default">
                  {{ aiScoreDisplay }}
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <div class="text-xs font-medium text-muted">
                  {{ t('evaluation.aiEvaluation.justification') }}
                </div>
                <div class="rounded-md bg-muted p-2 text-sm text-default">
                  {{ aiJustificationDisplay }}
                </div>
              </div>
            </div>
          </div>
        </Motion>

        <div class="flex flex-col gap-3">
          <!-- Evaluation header -->
          <div class="flex items-center justify-between gap-2">
            <SectionHeading icon="i-lucide:user-round-pen" :label="t('evaluation.title')" />
            <div v-if="evaluationConfig" class="truncate text-xs text-dimmed">
              {{ evaluationConfig.name }}
            </div>
          </div>

          <!-- Instructions Collapsible -->
          <UCollapsible v-if="evaluationConfig?.settings?.instructions" class="w-full">
            <UButton
              icon="i-lucide-message-circle-more"
              trailing-icon="i-lucide-chevron-down"
              class="group justify-between"
              color="neutral"
              variant="subtle"
              :label="$t('evaluation.instructions')"
              :ui="{
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            />
            <template #content>
              <div class="whitespace-pre-wrap px-2 py-2 text-sm text-default">
                {{ evaluationConfig.settings.instructions }}
              </div>
            </template>
          </UCollapsible>

          <!-- Score-based Evaluation: Stepper + Input + Comments side by side -->
          <div v-if="isScoreEvaluation && scoreSettings" class="flex flex-col gap-4 sm:flex-row">
            <div class="flex flex-1 flex-col gap-3">
              <label class="block text-sm font-medium text-default">
                {{ t('evaluation.score.range', {
                  min: scoreSettings.minValue,
                  max: `${scoreSettings.maxValue}${scoreSettings.unit || ''}`,
                }) }}
              </label>

              <div class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-minus"
                  color="neutral"
                  variant="subtle"
                  size="lg"
                  :disabled="selectedValue !== null && Number(selectedValue) <= scoreSettings.minValue"
                  @click="decrementScore"
                />

                <UInput
                  :model-value="selectedValue !== null ? String(selectedValue) : ''"
                  type="number"
                  :min="scoreSettings.minValue"
                  :max="scoreSettings.maxValue"
                  :step="scoreSettings.step"
                  placeholder="—"
                  class="w-20 [&_input]:text-center [&_input]:tabular-nums"
                  size="lg"
                  @update:model-value="(v: string | number) => {
                    const num = Number(v)
                    if (!Number.isNaN(num)) {
                      selectedValue = Math.min(Math.max(num, scoreSettings!.minValue), scoreSettings!.maxValue)
                    }
                  }"
                />

                <UButton
                  icon="i-lucide-plus"
                  color="neutral"
                  variant="subtle"
                  size="lg"
                  :disabled="selectedValue !== null && Number(selectedValue) >= scoreSettings.maxValue"
                  @click="incrementScore"
                />
              </div>

              <!-- Passing score indicator -->
              <div v-if="scoreSettings.passingScore" class="text-xs text-muted">
                {{ t('evaluation.passingScore') }}: {{ scoreSettings.passingScore }}{{ scoreSettings.unit || '' }}
              </div>

              <!-- Keyboard shortcut hint for score -->
              <div class="flex items-center gap-1 text-xs text-dimmed">
                <UKbd>+</UKbd> / <UKbd>-</UKbd> {{ t('evaluation.shortcuts.adjustScore') }}
                <span class="text-dimmed">&middot;</span> <UKbd>Enter</UKbd> {{ t('evaluation.shortcuts.confirm') }}
              </div>
            </div>

            <EvaluatorCommentField
              v-if="commentsAllowed"
              :model-value="localComment"
              :required="commentsRequired"
              :invalid="commentInvalid"
              @update:model-value="onCommentUpdate"
              @blur="commentTouched = true"
            />
          </div>

          <!-- Option-based Evaluation (Mastery, Boolean) -->
          <div v-else class="flex flex-col gap-3">
            <!-- min-h keeps the frame from jumping between short and long
                 option sets as the grader arrows through items. -->
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Motion
                v-for="(option, index) in evaluationOptions"
                :key="option.id"
                :while-hover="reduceMotion ? undefined : { scale: 1.02 }"
                :while-press="reduceMotion ? undefined : { scale: 0.97 }"
                :transition="{ type: 'spring', stiffness: 500, damping: 30 }"
                as-child
              >
                <UButton
                  :class="[option.color || '', {
                    'ring-2 ring-primary ring-offset-2 ring-offset-[var(--ui-bg)]': selectedValue === option.value,
                    'opacity-60': selectedValue !== null && selectedValue !== option.value,
                  }]"
                  size="lg"
                  block
                  @click="selectValue(option.value)"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <div class="text-start">
                      <div class="font-medium">
                        {{ option.label }}
                      </div>
                      <div v-if="'description' in option && option.description" class="mt-0.5 text-xs opacity-75">
                        {{ option.description }}
                      </div>
                    </div>
                    <UKbd class="shrink-0 opacity-60">
                      {{ index }}
                    </UKbd>
                  </div>
                </UButton>
              </Motion>
            </div>

            <!-- Keyboard shortcut hint -->
            <div class="flex items-center gap-1 text-xs text-dimmed">
              <UKbd>0</UKbd>–<UKbd>{{ evaluationOptions.length - 1 }}</UKbd> {{ t('evaluation.shortcuts.selectOption') }}
              <span>&middot;</span> <UKbd>Enter</UKbd> {{ t('evaluation.shortcuts.confirm') }}
            </div>

            <EvaluatorCommentField
              v-if="commentsAllowed"
              :model-value="localComment"
              :required="commentsRequired"
              :invalid="commentInvalid"
              @update:model-value="onCommentUpdate"
              @blur="commentTouched = true"
            />
          </div>

          <!-- Confirm Evaluation Button -->
          <div class="flex justify-end">
            <UButton
              icon="i-lucide:check"
              :disabled="!canConfirmEvaluation"
              :label="t('evaluation.actions.confirm')"
              @click="confirmEvaluation"
            />
          </div>
        </div>
      </div>
    </template>
  </UCard>
</template>
