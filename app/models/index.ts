export interface EvaluatedItem {
  id: string
  questionID: string
  question: string
  referenceAnswer: string
  submittedAnswer: string
  difficulty: Difficulty
}

// Evaluation Configuration Types
export interface EvaluationConfig {
  id: string
  name: string
  type: EvaluationType
  settings: EvaluationSettings
  createdAt: string
  updatedAt: string
}

export type EvaluationType = 'mastery' | 'boolean' | 'score'

export interface EvaluationSettings {
  // Common settings
  allowComments: boolean
  requireComments: boolean

  // Type-specific settings
  masterySettings?: MasterySettings
  booleanSettings?: BooleanSettings
  scoreSettings?: ScoreSettings
}

export interface MasterySettings {
  levels: MasteryLevelDefinition[]
  defaultLevel?: string
}

export interface MasteryLevelDefinition {
  id: string
  label: string
  description?: string
  color: string
  order: number
}

export interface BooleanSettings {
  trueLabel: string
  falseLabel: string
  trueColor: string
  falseColor: string
}

export interface ScoreSettings {
  minValue: number
  maxValue: number
  step: number
  unit?: string
  passingScore?: number
}

// Generic evaluation result that can handle any evaluation type
export interface EvaluationResult {
  questionId: string
  value: any // The actual evaluation value (mastery level, boolean, score, etc.)
  comment?: string
  evaluatedAt: string // ISO timestamp
}

export interface EvaluationSession {
  id: string
  name: string
  description?: string
  items: EvaluatedItem[]
  results: EvaluationResult[]
  config: EvaluationConfig
  createdAt: string
  updatedAt: string
  evaluatorName?: string
  isCompleted: boolean
}

export interface ExportData {
  session: EvaluationSession
  exportedAt: string
  version: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

// Default mastery level configuration
export const DEFAULT_MASTERY_CONFIG: MasterySettings = {
  levels: [
    {
      id: 'NOT_ATTAINED',
      label: 'Not Attained',
      description: 'Learning objective not achieved',
      color: 'bg-red-300 text-red-800 hover:bg-red-400',
      order: 1,
    },
    {
      id: 'INSUFFICIENT',
      label: 'Insufficient',
      description: 'Partial understanding but needs improvement',
      color: 'bg-orange-300 text-orange-800 hover:bg-orange-400',
      order: 2,
    },
    {
      id: 'SUFFICIENT',
      label: 'Sufficient',
      description: 'Adequate understanding achieved',
      color: 'bg-yellow-300 text-yellow-800 hover:bg-yellow-400',
      order: 3,
    },
    {
      id: 'TOTAL',
      label: 'Total',
      description: 'Complete mastery demonstrated',
      color: 'bg-green-300 text-green-800 hover:bg-green-400',
      order: 4,
    },
  ],
}

// Default boolean configuration
export const DEFAULT_BOOLEAN_CONFIG: BooleanSettings = {
  trueLabel: 'Correct',
  falseLabel: 'Incorrect',
  trueColor: 'bg-green-300 text-green-800 hover:bg-green-400',
  falseColor: 'bg-red-300 text-red-800 hover:bg-red-400',
}

// Default score configuration
export const DEFAULT_SCORE_CONFIG: ScoreSettings = {
  minValue: 0,
  maxValue: 100,
  step: 1,
  unit: '%',
  passingScore: 60,
}

// Evaluation type metadata for UI display
export const EVALUATION_TYPE_META = {
  mastery: {
    label: 'Mastery Level',
    description: 'Evaluate based on learning objective achievement levels',
    icon: 'i-lucide:target',
  },
  boolean: {
    label: 'Correct/Incorrect',
    description: 'Simple true/false evaluation',
    icon: 'i-lucide:check-circle',
  },
  score: {
    label: 'Numeric Score',
    description: 'Rate with a numeric value within a range',
    icon: 'i-lucide:hash',
  },
} as const
