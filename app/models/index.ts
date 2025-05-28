export interface EvaluatedItem {
  id: string
  questionID: string
  question: string
  referenceAnswer: string
  learnerAnswer: string
  difficulty: Difficulty
}

export interface EvaluationResult {
  questionId: string
  masteryLevel: MasteryLevelType
  comment?: string
  evaluatedAt: string // ISO timestamp
}

export interface EvaluationSession {
  id: string
  name: string
  description?: string
  items: EvaluatedItem[]
  results: EvaluationResult[]
  createdAt: string
  updatedAt: string
  evaluatorName?: string
  isCompleted: boolean
}

export interface ExportData {
  session: EvaluationSession
  statistics: {
    totalQuestions: number
    evaluatedQuestions: number
    completionRate: number
    masteryDistribution: Record<MasteryLevelType, number>
    difficultyBreakdown: Record<Difficulty, { total: number, evaluated: number }>
  }
  exportedAt: string
  version: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export const MasteryLevel = {
  NOT_ATTAINED: 'NOT_ATTAINED',
  INSUFFICIENT: 'INSUFFICIENT',
  SUFFICIENT: 'SUFFICIENT',
  TOTAL: 'TOTAL',
} as const

export type MasteryLevelType = typeof MasteryLevel[keyof typeof MasteryLevel]
