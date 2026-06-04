import type { EvaluationItem, EvaluationMode, EvaluationSession, ExportEvaluationEntry, ExportResult, Question } from '~/models'
import { evaluationStorage } from '@/utils/storage'

/**
 * Clean evaluation composable that matches component expectations
 */
export function useEvaluation(evaluationSession?: EvaluationSession) {
  // Core reactive state
  const items = ref<EvaluationItem[]>([])
  const questions = ref<Map<number, Question>>(new Map())
  const groupedItems = ref<{ [key: string]: EvaluationItem[] }>({})
  const groupKeys = ref<string[]>([])
  const currentGroupIndex = ref(0)
  const currentItemIndexInGroup = ref(0)
  const currentItem = ref<EvaluationItem | null>(null)
  const currentItemGroup = ref<EvaluationItem[]>([])
  type EvaluatedValue = ExportEvaluationEntry['value']
  interface EvaluatedItem {
    value?: EvaluatedValue
    masteryLevel?: string
    comment?: string
  }

  const evaluatedItems = ref<Record<string, EvaluatedItem>>({})
  const evaluatorComment = ref('')
  const isSingleEvaluation = ref(true)
  const evaluationMode = computed<EvaluationMode>(
    () => evaluationSession?.config?.settings?.evaluationMode ?? 'without-ai',
  )

  function isComposedEvaluationMode() {
    return evaluationMode.value === 'without-then-with-ai'
  }

  function isFinalResult(result: ExportResult | unknown) {
    if (!isComposedEvaluationMode())
      return true

    if (typeof result !== 'object' || result === null)
      return true

    const obj = result as Record<string, unknown>

    let secondEntry: unknown
    const evaluations = obj.evaluations
    if (evaluations && typeof evaluations === 'object') {
      const ev = evaluations as Record<string, unknown>
      secondEntry = ev[1 as unknown as string] ?? ev['1'] ?? ev['1']
    }

    if (secondEntry === undefined && 'secondValue' in obj) {
      secondEntry = obj.secondValue
    }

    return secondEntry !== undefined
  }

  // Initialize data from session
  function initializeFromSession(session: EvaluationSession) {
    if (!session?.dataset?.questionList || !session?.dataset?.items)
      return

    // Get all questions and items from dataset
    const questionMap = new Map<number, Question>()
    session.dataset.questionList.forEach((question) => {
      questionMap.set(question.id, question)
    })

    // Transform items to evaluation items with question data
    const allItems: EvaluationItem[] = []
    const grouped: { [key: string]: EvaluationItem[] } = {}

    session.dataset.items.forEach((item) => {
      const question = questionMap.get(item.questionID)
      if (question) {
        const evaluationItem: EvaluationItem & { questionText?: string, referenceAnswer?: string, difficulty?: string } = {
          ...item,
          questionText: question.question,
          referenceAnswer: question.referenceAnswer,
          difficulty: question.difficulty,
        }
        allItems.push(evaluationItem)

        // Group by questionID
        const groupKey = item.questionID.toString()
        if (!grouped[groupKey]) {
          grouped[groupKey] = []
        }
        grouped[groupKey].push(evaluationItem)
      }
    })

    questions.value = questionMap
    items.value = allItems
    groupedItems.value = grouped
    groupKeys.value = Object.keys(grouped)

    // Determine if single evaluation:
    // 1. Only 1 question (regardless of how many student answers/items)
    // 2. OR every question has exactly 1 evaluation item
    isSingleEvaluation.value = groupKeys.value.length === 1
      || Object.values(grouped).every(group => group.length === 1)

    // Set current item to first unevaluated item or first item if all are evaluated
    if (allItems.length > 0 && groupKeys.value.length > 0 && groupKeys.value[0]) {
      // Load existing evaluation results first
      loadExistingResults(session)

      // Find the first unevaluated item
      const firstUnevaluated = findFirstUnevaluatedItem()

      if (firstUnevaluated) {
        // Navigate to first unevaluated item
        currentGroupIndex.value = firstUnevaluated.groupIndex
        currentItemIndexInGroup.value = firstUnevaluated.itemIndexInGroup
      }
      else {
        // All items are evaluated, default to first item
        currentGroupIndex.value = 0
        currentItemIndexInGroup.value = 0
      }

      // Set current item group and current item based on the selected indices
      const currentGroupKey = groupKeys.value[currentGroupIndex.value]
      if (currentGroupKey) {
        currentItemGroup.value = grouped[currentGroupKey] || []
        currentItem.value = currentItemGroup.value[currentItemIndexInGroup.value] ?? null
      }
    }
  }

  // Load existing evaluation results
  function loadExistingResults(session: EvaluationSession) {
    if (!session.results) {
      evaluatedItems.value = {}
      return
    }

    const seen = new Map<number, { value?: EvaluatedValue, masteryLevel?: string, comment?: string, isFinal: boolean }>()

    session.results.forEach((r: unknown) => {
      if (typeof r !== 'object' || r === null)
        return

      const res = r as Record<string, unknown>
      const rawItemId = res.itemId ?? res.questionId
      let itemId: number | undefined
      if (typeof rawItemId === 'number') {
        itemId = rawItemId
      }
      else if (typeof rawItemId === 'string') {
        const parsed = Number(rawItemId)
        if (!Number.isNaN(parsed))
          itemId = parsed
      }

      if (!itemId)
        return

      let firstEntry: Record<string, unknown> | undefined
      let secondEntry: Record<string, unknown> | undefined
      const evaluations = res.evaluations
      if (evaluations && typeof evaluations === 'object') {
        const ev = evaluations as Record<string, unknown>
        const e0 = ev[0 as unknown as string] ?? ev['0']
        const e1 = ev[1 as unknown as string] ?? ev['1']
        if (e0 && typeof e0 === 'object')
          firstEntry = e0 as Record<string, unknown>
        if (e1 && typeof e1 === 'object')
          secondEntry = e1 as Record<string, unknown>
      }

      const legacyEntry = ('secondValue' in res)
        ? { value: res.secondValue, comment: res.secondComment, elapsedTime: res.secondElapsedTime }
        : { value: res.value, comment: res.comment, elapsedTime: res.elapsedTime }

      const displayEntry = (secondEntry ?? firstEntry) ?? legacyEntry
      const displayValue = displayEntry && typeof displayEntry === 'object' ? displayEntry.value : undefined
      const displayComment = displayEntry && typeof displayEntry === 'object' ? displayEntry.comment as string | undefined : undefined
      const isFinal = isFinalResult(res)

      if (isComposedEvaluationMode() && !isFinal)
        return

      const existing = seen.get(itemId)
      if (!existing) {
        seen.set(itemId, { value: displayValue, masteryLevel: typeof displayValue === 'string' ? displayValue : undefined, comment: displayComment, isFinal })
        return
      }

      if (!existing.isFinal || isFinal) {
        seen.set(itemId, { value: displayValue, masteryLevel: typeof displayValue === 'string' ? displayValue : undefined, comment: displayComment, isFinal })
      }
    })

    const evaluated: Record<string, EvaluatedItem> = {}
    for (const [id, entry] of seen.entries()) {
      evaluated[id.toString()] = {
        value: entry.value,
        masteryLevel: entry.masteryLevel,
        comment: entry.comment,
      }
    }
    evaluatedItems.value = evaluated
  }

  // Helper function to find the first unevaluated item
  function findFirstUnevaluatedItem(): { groupIndex: number, itemIndexInGroup: number } | null {
    // Iterate through all groups and items to find the first unevaluated one
    for (let groupIndex = 0; groupIndex < groupKeys.value.length; groupIndex++) {
      const groupKey = groupKeys.value[groupIndex]
      if (!groupKey)
        continue

      const group = groupedItems.value[groupKey] || []

      for (let itemIndexInGroup = 0; itemIndexInGroup < group.length; itemIndexInGroup++) {
        const item = group[itemIndexInGroup]
        if (!item)
          continue

        const evaluation = evaluatedItems.value[item.id.toString()]

        // Check if item is not evaluated (no value or masteryLevel)
        if (!evaluation || (evaluation.value === undefined && evaluation.masteryLevel === undefined)) {
          return { groupIndex, itemIndexInGroup }
        }
      }
    }

    // If all items are evaluated, return null (will fall back to first item)
    return null
  }

  // Navigation functions
  function goToItem(groupIndex: number, itemIndexInGroup: number) {
    const groupKey = groupKeys.value[groupIndex]
    if (groupIndex >= 0 && groupIndex < groupKeys.value.length && groupKey // valid group index
      && itemIndexInGroup >= 0
      && itemIndexInGroup < (groupedItems.value[groupKey]?.length ?? 0)) { // valid item index
      currentGroupIndex.value = groupIndex
      currentItemGroup.value = groupedItems.value[groupKey] || []
      currentItemIndexInGroup.value = itemIndexInGroup
      currentItem.value = currentItemGroup.value[itemIndexInGroup] ?? null

      // Load existing evaluation comment for this item (don't create new state)
      const item = currentItem.value
      if (item) {
        const existing = evaluatedItems.value[item.id.toString()]
        evaluatorComment.value = existing?.comment || ''
      }
    }
  }

  function goToNextItem() {
    const groupIndex = currentGroupIndex.value
    const itemIndexInGroup = currentItemIndexInGroup.value
    const group = groupKeys.value[groupIndex]
      ? (groupedItems.value[groupKeys.value[groupIndex]] ?? [])
      : []

    if (itemIndexInGroup < group.length - 1) {
      goToItem(groupIndex, itemIndexInGroup + 1)
    }
    else if (groupIndex < groupKeys.value.length - 1) {
      goToItem(groupIndex + 1, 0)
    }
  }

  function goToPreviousItem() {
    const groupIndex = currentGroupIndex.value
    const itemIndexInGroup = currentItemIndexInGroup.value

    if (itemIndexInGroup > 0) {
      goToItem(groupIndex, itemIndexInGroup - 1)
    }
    else if (groupIndex > 0) {
      const previousGroupKey = groupKeys.value[groupIndex - 1]
      const previousGroup = previousGroupKey
        ? groupedItems.value[previousGroupKey] || []
        : []

      goToItem(groupIndex - 1, previousGroup.length - 1)
    }
  }

  // Evaluation functions
  async function saveEvaluationResult(value: unknown, comment?: string, masteryLevel?: string, elapsedTime?: string, isSecond?: boolean) {
    if (!currentItem.value || !evaluationSession)
      return

    const composedMode = evaluationMode.value === 'without-then-with-ai'
    const finalForUi = !composedMode || !!isSecond

    if (finalForUi) {
      // Update local state only for the final pass in composed mode
      evaluatedItems.value[currentItem.value.id.toString()] = {
        value,
        masteryLevel,
        comment: comment || '',
      }
    }

    const evaluationEntry = {
      value,
      comment: comment || '',
      elapsedTime,
    }

    const result: ExportResult = {
      itemId: currentItem.value.id,
      questionId: currentItem.value.questionID,
      evaluations: {
        ...(isSecond ? {} : { 0: evaluationEntry }),
        ...(isSecond ? { 1: evaluationEntry } : {}),
      },
      evaluatedAt: new Date().toISOString(),
    }

    const existingIndex = (evaluationSession.results || []).findIndex(r => r.itemId === result.itemId)
    if (existingIndex >= 0) {
      const existingResult = evaluationSession.results[existingIndex]
      if (!existingResult) {
        evaluationSession.results.push(result)
      }
      else {
        const currentItemId = currentItem.value.id
        const currentQuestionId = currentItem.value.questionID
        evaluationSession.results[existingIndex] = {
          ...existingResult,
          itemId: currentItemId,
          questionId: currentQuestionId,
          evaluatedAt: result.evaluatedAt,
          evaluations: {
            ...existingResult.evaluations,
            ...result.evaluations,
          },
        }
      }
    }
    else {
      evaluationSession.results.push(result)
    }

    // Save to storage
    try {
      await evaluationStorage.saveSession(evaluationSession)
    }
    catch (error) {
      console.error('Failed to save evaluation result:', error)
      throw error
    }
  }

  async function evaluateAndGoNext(value: unknown, comment?: string, masteryLevel?: string, elapsedTime?: string, isSecond?: boolean) {
    await saveEvaluationResult(value, comment, masteryLevel, elapsedTime, isSecond)
    goToNextItem()
  }

  // Initialize if session provided
  if (evaluationSession) {
    initializeFromSession(evaluationSession)
  }

  // Computed properties
  const progress = computed(() => {
    const totalItems = items.value.length
    // Only count items that have actual evaluation values (not just navigation)
    const evaluatedCount = Object.values(evaluatedItems.value).filter(
      item => item.value !== undefined || item.masteryLevel !== undefined,
    ).length
    return totalItems > 0 ? (evaluatedCount / totalItems) * 100 : 0
  })

  const isCurrentItemEvaluated = computed(() => {
    if (!currentItem.value)
      return false
    const evaluation = evaluatedItems.value[currentItem.value.id.toString()]
    return evaluation && (evaluation.value !== undefined || evaluation.masteryLevel !== undefined)
  })

  const currentAbsoluteQuestionIndex = computed(() => { // index in all groupedItems values
    let previousItemsCount = 0
    // Sum of all previous groups' items
    for (let i = 0; i < currentGroupIndex.value; i++) {
      const groupKey = groupKeys.value[i]
      previousItemsCount += groupKey
        ? (groupedItems.value[groupKey]?.length ?? 0)
        : 0
    }
    return previousItemsCount + currentItemIndexInGroup.value
  })

  const hasNextItem = computed(() => {
    const groupIndex = currentGroupIndex.value
    const itemIndexInGroup = currentItemIndexInGroup.value
    const groupKey = groupKeys.value[groupIndex]
    const group = groupKey ? groupedItems.value[groupKey] || [] : []

    return (itemIndexInGroup < group.length - 1) // has next item in current group
      || (groupIndex < groupKeys.value.length - 1) // has next group
  })
  const hasPreviousItem = computed(() => {
    return currentItemIndexInGroup.value > 0 || currentGroupIndex.value > 0
  })

  return {
    // State
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

    // Computed
    progress,
    isCurrentItemEvaluated,
    currentAbsoluteQuestionIndex,
    hasNextItem,
    hasPreviousItem,

    // Methods
    initializeFromSession,
    goToItem,
    goToNextItem,
    goToPreviousItem,
    saveEvaluationResult,
    evaluateAndGoNext,
    onNavigate: goToItem,
  }
}
