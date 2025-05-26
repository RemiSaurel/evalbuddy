import type { MasteryLevel } from '@/models/index'
import { QUESTIONS } from '@/utils/data'

export function useEvaluation() {
  // Track current question group and index within that group
  const currentQuestionGroupIndex = ref(0)
  const currentQuestionIndexInGroup = ref(0)
  const evaluatorComment = ref('')

  // Track evaluated questions with their mastery levels
  const evaluatedQuestions = ref<{ [questionId: string]: { masteryLevel: typeof MasteryLevel[keyof typeof MasteryLevel], comment?: string } }>({})

  // Group questions by questionID and get ordered groups
  const groupedQuestions = computed(() => {
    const groups: { [key: string]: typeof QUESTIONS } = {}
    QUESTIONS.forEach((question) => {
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

  // Function to evaluate current question and go to next
  function evaluateAndGoNext(masteryLevel: typeof MasteryLevel[keyof typeof MasteryLevel]) {
    if (currentQuestion.value) {
      evaluatedQuestions.value[currentQuestion.value.id] = { masteryLevel, comment: evaluatorComment.value }
      // Clear comment for next question
      evaluatorComment.value = ''
      if (currentQuestionIndexInGroup.value < currentQuestionGroup.value.length - 1) {
        currentQuestionIndexInGroup.value++
      }
      else {
        if (currentQuestionGroupIndex.value < questionGroupKeys.value.length - 1) {
          currentQuestionGroupIndex.value++
          currentQuestionIndexInGroup.value = 0
        }
        // Potentially handle end of evaluation
      }
    }
  }

  // Function to go to previous question
  function goToPreviousQuestion() {
    // Save current comment before navigating
    if (currentQuestion.value && evaluatorComment.value) {
      if (evaluatedQuestions.value[currentQuestion.value.id]) {
        evaluatedQuestions.value[currentQuestion.value.id]!.comment = evaluatorComment.value
      }
      else {
        // This case should ideally not happen if we only allow editing evaluated questions
        // Or, if we allow commenting before evaluating, we need a different structure
      }
    }

    if (currentQuestionIndexInGroup.value > 0) {
      currentQuestionIndexInGroup.value--
    }
    else {
      if (currentQuestionGroupIndex.value > 0) {
        currentQuestionGroupIndex.value--
        const previousGroupKey = questionGroupKeys.value[currentQuestionGroupIndex.value]
        if (previousGroupKey) {
          currentQuestionIndexInGroup.value = (groupedQuestions.value[previousGroupKey]?.length || 1) - 1
        }
      }
    }
    // Load existing comment for the (now current) previous question
    if (currentQuestion.value && evaluatedQuestions.value[currentQuestion.value.id]) {
      evaluatorComment.value = evaluatedQuestions.value[currentQuestion.value.id]?.comment || ''
    }
    else {
      evaluatorComment.value = '' // Clear if no comment was stored
    }
  }

  // Function to go to next question
  function goToNextQuestion() {
    // Save current comment before navigating
    if (currentQuestion.value && evaluatorComment.value) {
      if (evaluatedQuestions.value[currentQuestion.value.id]) {
        evaluatedQuestions.value[currentQuestion.value.id]!.comment = evaluatorComment.value
      }
    }

    if (currentQuestionIndexInGroup.value < currentQuestionGroup.value.length - 1) {
      currentQuestionIndexInGroup.value++
    }
    else {
      if (currentQuestionGroupIndex.value < questionGroupKeys.value.length - 1) {
        currentQuestionGroupIndex.value++
        currentQuestionIndexInGroup.value = 0
      }
    }
    // Load existing comment for the (now current) next question
    if (currentQuestion.value && evaluatedQuestions.value[currentQuestion.value.id]) {
      evaluatorComment.value = evaluatedQuestions.value[currentQuestion.value.id]?.comment || ''
    }
    else {
      evaluatorComment.value = '' // Clear if no comment was stored or question not yet evaluated
    }
  }

  const isCurrentQuestionEvaluated = computed(() => {
    return !!(currentQuestion.value && evaluatedQuestions.value[currentQuestion.value.id])
  })

  const canGoNext = computed(() => {
    // Check if there is a next question in the current group
    if (currentQuestionIndexInGroup.value < currentQuestionGroup.value.length - 1) {
      return true
    }
    // Check if there is a next group
    if (currentQuestionGroupIndex.value < questionGroupKeys.value.length - 1) {
      return true
    }
    return false
  })

  const isEvaluationCompleted = computed(() => {
    return totalProgress.value === QUESTIONS.length
  })

  return {
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
    evaluateAndGoNext,
    goToPreviousQuestion,
    goToNextQuestion, // Add this line
    isCurrentQuestionEvaluated, // Add this line
    canGoNext, // Add this line
    isEvaluationCompleted, // Add this line
  }
}
