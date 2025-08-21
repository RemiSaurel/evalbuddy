import type { EvaluationItem, EvaluationResult, EvaluationSession, Question } from '~/models'
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
  const evaluatedItems = ref<{ [itemId: string]: { value?: any, masteryLevel?: string, comment?: string } }>({})
  const evaluatorComment = ref('')
  const isSingleEvaluation = ref(true)

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

    // Set current item
    if (allItems.length > 0 && groupKeys.value.length > 0 && groupKeys.value[0]) {
      currentGroupIndex.value = 0
      currentItemGroup.value = grouped[groupKeys.value[0]] || []
      currentItemIndexInGroup.value = 0
      currentItem.value = currentItemGroup.value[0] ?? null
    }

    // Load existing evaluation results
    loadExistingResults(session)
  }

  // Load existing evaluation results
  function loadExistingResults(session: EvaluationSession) {
    if (session.results) {
      const evaluated: { [itemId: string]: { value?: any, masteryLevel?: string, comment?: string } } = {}

      session.results.forEach((result) => {
        // Handle cases where itemId might be undefined (legacy data)
        const itemId = result.itemId ?? result.questionId
        if (itemId) {
          evaluated[itemId.toString()] = {
            value: result.value,
            masteryLevel: result.value, // For backward compatibility
            comment: result.comment,
          }
        }
      })

      evaluatedItems.value = evaluated
    }
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
  async function saveEvaluationResult(value: any, comment?: string, masteryLevel?: string) {
    if (!currentItem.value || !evaluationSession)
      return

    // Update local state
    evaluatedItems.value[currentItem.value.id.toString()] = {
      value,
      masteryLevel,
      comment: comment || '',
    }

    // Create evaluation result
    const result: EvaluationResult = {
      itemId: currentItem.value.id,
      questionId: currentItem.value.questionID,
      value,
      comment: comment || '',
      evaluatedAt: new Date().toISOString(),
    }

    // Update session results
    if (!evaluationSession.results) {
      evaluationSession.results = []
    }

    // Remove existing result for this item
    evaluationSession.results = evaluationSession.results.filter(r => r.itemId !== result.itemId)
    evaluationSession.results.push(result)

    // Save to storage
    try {
      await evaluationStorage.saveSession(evaluationSession)
    }
    catch (error) {
      console.error('Failed to save evaluation result:', error)
      throw error
    }
  }

  async function evaluateAndGoNext(value: any, comment?: string, masteryLevel?: string) {
    await saveEvaluationResult(value, comment, masteryLevel)
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
