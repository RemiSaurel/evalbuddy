import type { EvaluatedItem, EvaluatedValue, EvaluationItem, EvaluationSession, ExportResult, Question } from '~/models'
import { evaluationStorage } from '@/utils/storage'
import { parseExportResult } from '~/models'

export function useEvaluation(evaluationSession?: EvaluationSession) {
  const items = ref<EvaluationItem[]>([])
  const questions = ref<Map<number, Question>>(new Map())
  const groupedItems = ref<{ [key: string]: EvaluationItem[] }>({})
  const groupKeys = ref<string[]>([])
  const currentGroupIndex = ref(0)
  const currentItemIndexInGroup = ref(0)
  const currentItem = ref<EvaluationItem | null>(null)
  const currentItemGroup = ref<EvaluationItem[]>([])
  const evaluatedItems = ref<Record<string, EvaluatedItem>>({})
  const evaluatorComment = ref('')
  const isSingleEvaluation = ref(true)

  function initializeFromSession(session: EvaluationSession) {
    if (!session?.dataset?.questionList || !session?.dataset?.items)
      return

    const questionMap = new Map<number, Question>()
    session.dataset.questionList.forEach((question) => {
      questionMap.set(question.id, question)
    })

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

    isSingleEvaluation.value = groupKeys.value.length === 1
      || Object.values(grouped).every(group => group.length === 1)

    if (allItems.length > 0 && groupKeys.value.length > 0 && groupKeys.value[0]) {
      loadExistingResults(session)

      const firstUnevaluated = findFirstUnevaluatedItem()

      if (firstUnevaluated) {
        currentGroupIndex.value = firstUnevaluated.groupIndex
        currentItemIndexInGroup.value = firstUnevaluated.itemIndexInGroup
      }
      else {
        currentGroupIndex.value = 0
        currentItemIndexInGroup.value = 0
      }

      const currentGroupKey = groupKeys.value[currentGroupIndex.value]
      if (currentGroupKey) {
        currentItemGroup.value = grouped[currentGroupKey] || []
        currentItem.value = currentItemGroup.value[currentItemIndexInGroup.value] ?? null
      }
    }
  }

  function loadExistingResults(session: EvaluationSession) {
    if (!session.results) {
      evaluatedItems.value = {}
      return
    }

    const seen = new Map<number, EvaluatedItem & { isFinal: boolean }>()

    session.results.forEach((r) => {
      const parsed = parseExportResult(r)
      const itemId = parsed.itemId

      const display = parsed.secondPass ?? parsed.firstPass
      if (!display)
        return

      const isFinal = parsed.secondPass !== undefined

      const existing = seen.get(itemId)
      if (!existing || !existing.isFinal || isFinal) {
        seen.set(itemId, {
          value: display.value,
          masteryLevel: typeof display.value === 'string' ? display.value : undefined,
          comment: display.comment,
          isFinal,
        })
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

  function findFirstUnevaluatedItem(): { groupIndex: number, itemIndexInGroup: number } | null {
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

        if (!evaluation || (evaluation.value === undefined && evaluation.masteryLevel === undefined)) {
          return { groupIndex, itemIndexInGroup }
        }
      }
    }

    return null
  }

  function goToItem(groupIndex: number, itemIndexInGroup: number) {
    const groupKey = groupKeys.value[groupIndex]
    if (groupIndex >= 0 && groupIndex < groupKeys.value.length && groupKey
      && itemIndexInGroup >= 0
      && itemIndexInGroup < (groupedItems.value[groupKey]?.length ?? 0)) {
      currentGroupIndex.value = groupIndex
      currentItemGroup.value = groupedItems.value[groupKey] || []
      currentItemIndexInGroup.value = itemIndexInGroup
      currentItem.value = currentItemGroup.value[itemIndexInGroup] ?? null

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

  async function saveEvaluationResult(value: EvaluatedValue, comment?: string, elapsedTime?: string) {
    if (!currentItem.value || !evaluationSession)
      return

    evaluatedItems.value[currentItem.value.id.toString()] = {
      value,
      masteryLevel: typeof value === 'string' ? value : undefined,
      comment: comment || '',
    }

    const evaluationEntry = { value, comment: comment || '', elapsedTime }

    const result: ExportResult = {
      itemId: currentItem.value.id,
      questionId: currentItem.value.questionID,
      evaluations: { 0: evaluationEntry },
      evaluatedAt: new Date().toISOString(),
    }

    const existingIndex = (evaluationSession.results || []).findIndex(r => r.itemId === result.itemId)
    if (existingIndex >= 0) {
      const existingResult = evaluationSession.results[existingIndex]
      if (!existingResult) {
        evaluationSession.results.push(result)
      }
      else {
        evaluationSession.results[existingIndex] = {
          ...existingResult,
          itemId: currentItem.value.id,
          questionId: currentItem.value.questionID,
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

    try {
      await evaluationStorage.saveSession(evaluationSession)
    }
    catch (error) {
      console.error('Failed to save evaluation result:', error)
      throw error
    }
  }

  async function evaluateAndGoNext(value: EvaluatedValue, comment?: string, elapsedTime?: string) {
    await saveEvaluationResult(value, comment, elapsedTime)
    goToNextItem()
  }

  if (evaluationSession) {
    initializeFromSession(evaluationSession)
  }

  const progress = computed(() => {
    const totalItems = items.value.length
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

  const currentAbsoluteQuestionIndex = computed(() => {
    let previousItemsCount = 0
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

    return (itemIndexInGroup < group.length - 1)
      || (groupIndex < groupKeys.value.length - 1)
  })

  const hasPreviousItem = computed(() => {
    return currentItemIndexInGroup.value > 0 || currentGroupIndex.value > 0
  })

  return {
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

    progress,
    isCurrentItemEvaluated,
    currentAbsoluteQuestionIndex,
    hasNextItem,
    hasPreviousItem,

    initializeFromSession,
    goToItem,
    goToNextItem,
    goToPreviousItem,
    saveEvaluationResult,
    evaluateAndGoNext,
    onNavigate: goToItem,
  }
}
