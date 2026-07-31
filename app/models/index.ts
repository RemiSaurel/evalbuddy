// Restricted context type for better display handling
export type ContextData = Record<string, string | string[]> | string

export interface Question {
  id: number
  question: string
  referenceAnswer?: string
  difficulty?: Difficulty // Optional
  context?: ContextData // Optional - supports string and string[] for display
}

export interface AiEvaluation {
  score?: number
  justification?: string
}

export interface EvaluationItem {
  id: number
  questionID: number
  submittedAnswer: string
  context?: ContextData // Optional - supports string and string[] for display
  aiEvaluation?: AiEvaluation // Optional
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

export type EvaluationMode = 'without-ai' | 'with-ai' | 'without-then-with-ai'

export interface EvaluationSettings {
  // Common settings
  allowComments: boolean
  requireComments: boolean
  instructions?: string
  timerEnabled?: boolean
  evaluationMode: EvaluationMode

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

export interface EvaluationSession {
  id: string
  name: string
  description?: string
  dataset: DatasetStructure
  results: ExportResult[]
  config: EvaluationConfig
  createdAt: string
  updatedAt: string
  evaluatorName?: string
  isCompleted: boolean
}

// The raw evaluation value: a mastery level id (string), a boolean verdict,
// or a numeric score, depending on the EvaluationConfig type. Null means unset.
export type EvaluatedValue = string | number | boolean | null

export interface ExportEvaluationEntry {
  value: EvaluatedValue
  comment?: string
  elapsedTime?: string
}

export interface ExportResult {
  itemId: number
  questionId: number
  evaluations: Record<string, ExportEvaluationEntry>
  evaluatedAt: string
}

export interface ExportData {
  session: EvaluationSession
  exportedAt: string
  version: string
}

export interface EvaluatedItem {
  value?: EvaluatedValue
  masteryLevel?: string
  comment?: string
}

export interface ParsedEvaluationResult {
  itemId: number
  questionId: number
  firstPass?: ExportEvaluationEntry
  secondPass?: ExportEvaluationEntry
  evaluatedAt: string
}

export function parseExportResult(result: ExportResult): ParsedEvaluationResult {
  const evaluations = result.evaluations ?? {}
  const e0 = evaluations['0']
  const e1 = evaluations['1']

  return {
    itemId: result.itemId,
    questionId: result.questionId,
    firstPass: e0,
    secondPass: e1,
    evaluatedAt: result.evaluatedAt,
  }
}

export type Difficulty = 'easy' | 'medium' | 'hard'

/**
 * Mastery level colours, red → emerald.
 *
 * Soft tints rather than saturated fills: these buttons sit next to dense text
 * all day and loud colour is fatiguing. Each entry is a static literal so
 * Tailwind can extract it, and carries its own `dark:` variants so the palette
 * works in both colour modes. No `ring-*` here — the selected state owns the
 * ring (see HybridEvaluationCard).
 */
export const MASTERY_COLOR_CLASSES = [
  'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-400/20 dark:text-red-200 dark:hover:bg-red-400/30',
  'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-400/10 dark:text-red-300 dark:hover:bg-red-400/20',
  'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-400/20 dark:text-orange-200 dark:hover:bg-orange-400/30',
  'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-400/10 dark:text-orange-300 dark:hover:bg-orange-400/20',
  'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-400/20 dark:text-amber-200 dark:hover:bg-amber-400/30',
  'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-400/20 dark:text-yellow-200 dark:hover:bg-yellow-400/30',
  'bg-lime-100 text-lime-800 hover:bg-lime-200 dark:bg-lime-400/20 dark:text-lime-200 dark:hover:bg-lime-400/30',
  'bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-400/10 dark:text-green-300 dark:hover:bg-green-400/20',
  'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-400/20 dark:text-green-200 dark:hover:bg-green-400/30',
  'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-400/20 dark:text-emerald-200 dark:hover:bg-emerald-400/30',
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
  trueColor: MASTERY_COLOR_CLASSES[8],
  falseColor: MASTERY_COLOR_CLASSES[0],
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
