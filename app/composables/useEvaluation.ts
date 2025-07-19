import type { EvaluationItem, EvaluationResult, EvaluationSession, Question } from '~/models'
import { evaluationStorage } from '@/utils/storage'

/**
 * Clean evaluation composable that matches component expectations
 */
export function useEvaluation(evaluationSession?: EvaluationSession) {
  // Core reactive state
  const items = ref<EvaluationItem[]>([])
  const groupedItems = ref<{ [key: string]: EvaluationItem[] }>({})
  const currentIndex = ref(0)
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

    items.value = allItems
    groupedItems.value = grouped

    // Determine if single evaluation: only 1 question (regardless of how many student answers/items)
    isSingleEvaluation.value = Object.keys(grouped).length === 1

    // Set current item
    if (allItems.length > 0) {
      currentItem.value = allItems[0] || null
      const firstGroupKey = Object.keys(grouped)[0]
      if (firstGroupKey) {
        currentItemGroup.value = grouped[firstGroupKey] || []
      }
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
  function goToItem(index: number) {
    if (index >= 0 && index < items.value.length) {
      currentIndex.value = index
      const item = items.value[index]
      if (item) {
        currentItem.value = item

        // Update current item group
        const questionId = item.questionID
        if (questionId) {
          currentItemGroup.value = groupedItems.value[questionId.toString()] || []
        }

        // Load existing evaluation comment for this item (don't create new state)
        const existing = evaluatedItems.value[item.id.toString()]
        if (existing && existing.comment) {
          evaluatorComment.value = existing.comment
        }
        else {
          evaluatorComment.value = ''
        }
      }
    }
  }

  function goToNextItem() {
    if (currentIndex.value < items.value.length - 1) {
      goToItem(currentIndex.value + 1)
    }
  }

  function goToPreviousItem() {
    if (currentIndex.value > 0) {
      goToItem(currentIndex.value - 1)
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

  const currentQuestionIndexInGroup = computed(() => {
    if (!currentItem.value || !currentItemGroup.value.length)
      return 0
    return currentItemGroup.value.findIndex(item => item.id === currentItem.value?.id)
  })

  const currentAbsoluteQuestionIndex = computed(() => currentIndex.value)

  const hasNextItem = computed(() => currentIndex.value < items.value.length - 1)
  const hasPreviousItem = computed(() => currentIndex.value > 0)

  return {
    // State
    items,
    groupedItems,
    currentIndex,
    currentItem,
    currentItemGroup,
    evaluatedItems,
    evaluatorComment,
    isSingleEvaluation,

    // Computed
    progress,
    isCurrentItemEvaluated,
    currentQuestionIndexInGroup,
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
