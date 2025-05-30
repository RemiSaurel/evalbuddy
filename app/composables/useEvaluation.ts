import type { EvaluationResult, EvaluationSession } from '@/models/index'
import { evaluationStorage } from '@/utils/storage'

export function useEvaluation(sessionId?: string) {
  // Session management
  const currentSession = ref<EvaluationSession | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Track current question group and index within that group
  const currentQuestionGroupIndex = ref(0)
  const currentQuestionIndexInGroup = ref(0)
  const evaluatorComment = ref('')

  // Track evaluated questions with their values and comments
  const evaluatedQuestions = ref<{ [questionId: string]: { value: any, comment?: string } }>({})

  // Load session and results from IndexedDB
  const initializeSession = async (id?: string) => {
    if (!id)
      return
    isLoading.value = true
    error.value = null
    try {
      const session = await evaluationStorage.getSession(id)
      if (session) {
        currentSession.value = session
        // Load results into evaluatedQuestions
        const resultsMap: typeof evaluatedQuestions.value = {}
        session.results.forEach((result) => {
          resultsMap[result.questionId] = {
            value: result.value,
            comment: result.comment,
          }
        })
        evaluatedQuestions.value = resultsMap
      }
      else {
        error.value = 'Session not found'
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load session'
    }
    finally {
      isLoading.value = false
    }
  }

  // Save evaluation result to session in IndexedDB
  const saveEvaluationResult = async (questionId: string, value: any, comment?: string) => {
    if (!currentSession.value)
      return

    const result: EvaluationResult = {
      questionId,
      value,
      comment,
      evaluatedAt: new Date().toISOString(),
    }

    // Update or add result
    const existingIndex = currentSession.value.results.findIndex(r => r.questionId === questionId)
    if (existingIndex >= 0) {
      currentSession.value.results[existingIndex] = result
    }
    else {
      currentSession.value.results.push(result)
    }

    currentSession.value.updatedAt = new Date().toISOString()
    currentSession.value.isCompleted = currentSession.value.results.length === currentSession.value.items.length

    // Create a plain object copy of the session to avoid proxy cloning issues
    const sessionToSave = toRaw(currentSession.value)
    await evaluationStorage.saveSession(sessionToSave)
  }

  // Use session items as questions
  const questions = computed(() => currentSession.value?.items || [])

  // Group questions by questionID and get ordered groups
  const groupedQuestions = computed(() => {
    const groups: { [key: string]: typeof questions.value } = {}
    questions.value.forEach((question) => {
      if (!groups[question.questionID]) {
        groups[question.questionID] = []
      }
      groups[question.questionID]!.push(question)
    })
    return groups
  })

  // Get array of question group keys in order
  const questionGroupKeys = computed(() => {
    return Object.keys(groupedQuestions.value).sort()
  })

  // Current question group being evaluated
  const currentQuestionGroup = computed(() => {
    const groupKey = questionGroupKeys.value[currentQuestionGroupIndex.value]
    return groupKey ? groupedQuestions.value[groupKey] || [] : []
  })

  // Current question being displayed
  const currentQuestion = computed(() => {
    const q = currentQuestionGroup.value[currentQuestionIndexInGroup.value]
    if (q && evaluatedQuestions.value[q.id]) {
      evaluatorComment.value = evaluatedQuestions.value[q.id]?.comment || ''
    }
    return q
  })

  // Progress within current question group (only count evaluated questions)
  const currentQuestionGroupProgress = computed(() => {
    if (!currentQuestionGroup.value || currentQuestionGroup.value.length === 0)
      return 0
    const evaluatedInGroup = currentQuestionGroup.value.filter(q =>
      evaluatedQuestions.value[q.id] !== undefined,
    ).length
    return evaluatedInGroup
  })

  // Total progress across all questions (only count evaluated questions)
  const totalProgress = computed(() => {
    return Object.keys(evaluatedQuestions.value).length
  })

  // Get current absolute question index for display
  const currentAbsoluteQuestionIndex = computed(() => {
    let index = 0
    for (let i = 0; i < currentQuestionGroupIndex.value; i++) {
      const groupKey = questionGroupKeys.value[i]
      if (groupKey) {
        index += groupedQuestions.value[groupKey]?.length || 0
      }
    }
    return index + currentQuestionIndexInGroup.value
  })

  // Helper functions for navigation logic
  const canMoveWithinGroup = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      return currentQuestionIndexInGroup.value < currentQuestionGroup.value.length - 1
    }
    return currentQuestionIndexInGroup.value > 0
  }

  const canMoveToGroup = (direction: 'next' | 'previous') => {
    if (direction === 'next') {
      return currentQuestionGroupIndex.value < questionGroupKeys.value.length - 1
    }
    return currentQuestionGroupIndex.value > 0
  }

  const saveCurrentComment = async () => {
    if (currentQuestion.value) {
      const questionId = currentQuestion.value.id
      // If the question has an existing evaluation (mastery level set)
      if (evaluatedQuestions.value[questionId]) {
        // Update the comment in the local cache
        evaluatedQuestions.value[questionId]!.comment = evaluatorComment.value

        // Persist this change to IndexedDB
        const evaluationValue = evaluatedQuestions.value[questionId]!.value
        await saveEvaluationResult(questionId, evaluationValue, evaluatorComment.value)
      }
      // If the question is not yet evaluated, the comment will be saved
      // along with the mastery level when evaluateAndGoNext is called.
    }
  }

  const loadCommentForCurrentQuestion = () => {
    if (currentQuestion.value && evaluatedQuestions.value[currentQuestion.value.id]) {
      evaluatorComment.value = evaluatedQuestions.value[currentQuestion.value.id]?.comment || ''
    }
    else {
      evaluatorComment.value = ''
    }
  }

  const moveToNextPosition = () => {
    if (canMoveWithinGroup('next')) {
      currentQuestionIndexInGroup.value++
    }
    else if (canMoveToGroup('next')) {
      currentQuestionGroupIndex.value++
      currentQuestionIndexInGroup.value = 0
    }
  }

  const moveToPreviousPosition = () => {
    if (canMoveWithinGroup('previous')) {
      currentQuestionIndexInGroup.value--
    }
    else if (canMoveToGroup('previous')) {
      currentQuestionGroupIndex.value--
      const previousGroupKey = questionGroupKeys.value[currentQuestionGroupIndex.value]
      if (previousGroupKey) {
        currentQuestionIndexInGroup.value = (groupedQuestions.value[previousGroupKey]?.length || 1) - 1
      }
    }
  }

  // Function to evaluate current question with generic value and go to next
  const evaluateGenericAndGoNext = async (value: any, comment?: string) => {
    if (currentQuestion.value) {
      evaluatedQuestions.value[currentQuestion.value.id] = {
        value,
        comment: comment || evaluatorComment.value,
      }
      await saveEvaluationResult(currentQuestion.value.id, value, comment || evaluatorComment.value)
      evaluatorComment.value = ''
      moveToNextPosition()
    }
  }

  // Function to save evaluation without moving (for intermediate saves)
  const saveEvaluation = async (value: any, comment?: string) => {
    if (currentQuestion.value) {
      evaluatedQuestions.value[currentQuestion.value.id] = {
        value,
        comment: comment || evaluatorComment.value,
      }
      await saveEvaluationResult(currentQuestion.value.id, value, comment || evaluatorComment.value)
    }
  }

  // Function to go to previous question
  const goToPreviousQuestion = async () => {
    await saveCurrentComment()
    moveToPreviousPosition()
    loadCommentForCurrentQuestion()
  }

  // Function to go to next question
  const goToNextQuestion = async () => {
    await saveCurrentComment()
    moveToNextPosition()
    loadCommentForCurrentQuestion()
  }

  // Function to navigate directly to a specific question by absolute index
  const navigateToQuestion = async (absoluteIndex: number) => {
    if (absoluteIndex < 0 || absoluteIndex >= questions.value.length)
      return

    await saveCurrentComment()

    // Find the group and index within group for this absolute index
    let currentIndex = 0
    for (let groupIndex = 0; groupIndex < questionGroupKeys.value.length; groupIndex++) {
      const groupKey = questionGroupKeys.value[groupIndex]
      if (!groupKey)
        continue

      const group = groupedQuestions.value[groupKey] || []

      if (currentIndex + group.length > absoluteIndex) {
        // Found the right group
        currentQuestionGroupIndex.value = groupIndex
        currentQuestionIndexInGroup.value = absoluteIndex - currentIndex
        break
      }
      currentIndex += group.length
    }

    loadCommentForCurrentQuestion()
  }

  const isCurrentQuestionEvaluated = computed(() => {
    return !!(currentQuestion.value && evaluatedQuestions.value[currentQuestion.value.id])
  })

  const canGoNext = computed(() => {
    return canMoveWithinGroup('next') || canMoveToGroup('next')
  })

  const canGoPrevious = computed(() => {
    return canMoveWithinGroup('previous') || canMoveToGroup('previous')
  })

  const isEvaluationCompleted = computed(() => {
    return totalProgress.value === questions.value.length
  })

  // Initialize session if sessionId is provided
  if (sessionId) {
    initializeSession(sessionId)
  }

  return {
    currentSession: readonly(currentSession),
    isLoading: readonly(isLoading),
    error: readonly(error),
    initializeSession,
    saveEvaluationResult,
    currentQuestionGroupIndex,
    currentQuestionIndexInGroup,
    evaluatorComment,
    evaluatedQuestions,
    groupedQuestions,
    questionGroupKeys,
    currentQuestionGroup,
    currentQuestion,
    currentQuestionGroupProgress,
    totalProgress,
    currentAbsoluteQuestionIndex,
    evaluateGenericAndGoNext,
    saveEvaluation,
    goToPreviousQuestion,
    goToNextQuestion,
    navigateToQuestion,
    isCurrentQuestionEvaluated,
    canGoNext,
    canGoPrevious,
    isEvaluationCompleted,
    questions,
  }
}
