export interface EvaluatedItem {
  id: string
  questionID: string
  question: string
  referenceAnswer: string
  learnerAnswer: string
  difficulty: Difficulty
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export const MasteryLevel = {
  NOT_ATTAINED: 'NOT_ATTAINED',
  INSUFFICIENT: 'INSUFFICIENT',
  SUFFICIENT: 'SUFFICIENT',
  TOTAL: 'TOTAL',
} as const
