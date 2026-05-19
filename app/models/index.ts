// Restricted context type for better display handling
export type ContextData = Record<string, string | string[]> | string

export interface Question {
  id: number
  question: string
  referenceAnswer?: string
  difficulty?: Difficulty // Optional
  context?: ContextData // Optional - supports string and string[] for display
}

export interface EvaluationItem {
  id: number
  questionID: number
  submittedAnswer: string
  context?: ContextData // Optional - supports string and string[] for display
}

export interface DatasetStructure {
  context?: ContextData // Optional - supports string and string[] for display
  questionList: Question[]
  items: EvaluationItem[]
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
  instructions?: string
  timerEnabled?: boolean

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
  itemId: number // The specific item that was evaluated
  questionId: number // The question this item belongs to
  value: any // The actual evaluation value (mastery level, boolean, score, etc.)
  comment?: string
  elapsedTime?: string
  evaluatedAt: string // ISO timestamp
}

export interface EvaluationSession {
  id: string
  name: string
  description?: string
  dataset: DatasetStructure
  results: EvaluationResult[]
  config: EvaluationConfig
  createdAt: string
  updatedAt: string
  evaluatorName?: string
  isCompleted: boolean
  elapsedTime?: Record<number, number>
}

export interface ExportData {
  session: EvaluationSession
  exportedAt: string
  version: string
}

export type Difficulty = 'easy' | 'medium' | 'hard'

// Mastery levels color definition
export const MASTERY_COLOR_CLASSES = [
  'bg-red-400 text-red-900 hover:bg-red-400',
  'bg-red-300 text-red-700 hover:bg-red-300',
  'bg-orange-400 text-orange-800 hover:bg-orange-400',
  'bg-orange-300 text-orange-700 hover:bg-orange-300',
  'bg-amber-300 text-amber-800 hover:bg-amber-400',
  'bg-yellow-300 text-yellow-800 hover:bg-yellow-400',
  'bg-lime-300 text-lime-800 hover:bg-lime-400',
  'bg-green-200 text-green-700 hover:bg-green-300',
  'bg-green-300 text-green-800 hover:bg-green-400',
  'bg-emerald-300 text-emerald-800 hover:bg-emerald-400',
] as const

// Default mastery level configuration
export const DEFAULT_MASTERY_CONFIG: MasterySettings = {
  levels: [
    {
      id: 'NOT_ATTAINED',
      label: 'Not Attained',
      description: 'Learning objective not achieved',
      color: MASTERY_COLOR_CLASSES[0],
      order: 1,
    },
    {
      id: 'INSUFFICIENT',
      label: 'Insufficient',
      description: 'Partial understanding but needs improvement',
      color: MASTERY_COLOR_CLASSES[3],
      order: 2,
    },
    {
      id: 'SUFFICIENT',
      label: 'Sufficient',
      description: 'Adequate understanding achieved',
      color: MASTERY_COLOR_CLASSES[5],
      order: 3,
    },
    {
      id: 'TOTAL',
      label: 'Total',
      description: 'Complete mastery demonstrated',
      color: MASTERY_COLOR_CLASSES[9],
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
  maxValue: 5,
  step: 1,
  unit: '',
  passingScore: 3,
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
