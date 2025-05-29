import type { EvaluatedItem, EvaluationConfig, ExportData } from '@/models/index'
import { evaluationStorage } from './storage'

// Configuration export/import data structure
export interface ConfigExportData {
  config: EvaluationConfig
  exportedAt: string
  version: string
  type: 'evalbuddy-config'
}

export class ImportExportService {
  /**
   * Import items from a JSON file
   */
  static async importFromFile(file: File): Promise<{ items: EvaluatedItem[], errors: string[] }> {
    const errors: string[] = []

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate the data structure
      if (!Array.isArray(data)) {
        errors.push('File must contain an array of items')
        return { items: [], errors }
      }

      const items: EvaluatedItem[] = []

      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        const validationError = this.validateEvaluatedItem(item, i)

        if (validationError) {
          errors.push(validationError)
          continue
        }

        items.push(item)
      }

      return { items, errors }
    }
    catch (error) {
      errors.push(`Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { items: [], errors }
    }
  }

  /**
   * Validate a single EvaluatedItem
   */
  private static validateEvaluatedItem(item: any, index: number): string | null {
    if (!item || typeof item !== 'object') {
      return `Item at index ${index}: Must be an object`
    }

    const required = ['id', 'questionID', 'question', 'referenceAnswer', 'learnerAnswer', 'difficulty']

    for (const field of required) {
      if (!item[field] || typeof item[field] !== 'string') {
        return `Item at index ${index}: Missing or invalid field '${field}'`
      }
    }

    const validDifficulties = ['easy', 'medium', 'hard']
    if (!validDifficulties.includes(item.difficulty)) {
      return `Item at index ${index}: Invalid difficulty '${item.difficulty}'. Must be one of: ${validDifficulties.join(', ')}`
    }

    return null
  }

  /**
   * Export evaluation session with results and statistics
   */
  static async exportSession(sessionId: string): Promise<Blob> {
    const session = await evaluationStorage.getSession(sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    const exportData: ExportData = {
      session,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  /**
   * Download a blob as a file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * Generate a filename for export
   */
  static generateExportFilename(sessionName: string): string {
    const timestamp = new Date().toISOString().split('T')[0]
    const safeName = sessionName.replace(/[^a-z0-9]/gi, '_')
    return `evaluation_${safeName}_${timestamp}.json`
  }

  /**
   * Export evaluation configuration
   */
  static exportConfig(config: EvaluationConfig): Blob {
    const exportData: ConfigExportData = {
      config: JSON.parse(JSON.stringify(config)), // Deep clone to avoid proxy issues
      exportedAt: new Date().toISOString(),
      version: '1.0',
      type: 'evalbuddy-config',
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    return new Blob([jsonString], { type: 'application/json' })
  }

  /**
   * Import configuration from a JSON file
   */
  static async importConfigFromFile(file: File): Promise<{ config: EvaluationConfig | null, errors: string[] }> {
    const errors: string[] = []

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Validate the data structure
      if (!data || typeof data !== 'object') {
        errors.push('File must contain a valid configuration object')
        return { config: null, errors }
      }

      // Check if it's a valid evalbuddy configuration file
      if (data.type !== 'evalbuddy-config') {
        errors.push('Invalid file type. This is not an EvalBuddy configuration file')
        return { config: null, errors }
      }

      if (!data.config) {
        errors.push('Configuration data is missing from the file')
        return { config: null, errors }
      }

      const configValidationError = this.validateEvaluationConfig(data.config)
      if (configValidationError) {
        errors.push(configValidationError)
        return { config: null, errors }
      }

      // Generate new ID and timestamps for the imported config
      const importedConfig: EvaluationConfig = {
        ...data.config,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      return { config: importedConfig, errors }
    }
    catch (error) {
      errors.push(`Failed to parse configuration file: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return { config: null, errors }
    }
  }

  /**
   * Validate an EvaluationConfig object
   */
  private static validateEvaluationConfig(config: any): string | null {
    if (!config || typeof config !== 'object') {
      return 'Configuration must be an object'
    }

    const required = ['name', 'type', 'settings']
    for (const field of required) {
      if (!config[field]) {
        return `Missing required field: ${field}`
      }
    }

    const validTypes = ['mastery', 'boolean', 'score']
    if (!validTypes.includes(config.type)) {
      return `Invalid evaluation type: ${config.type}. Must be one of: ${validTypes.join(', ')}`
    }

    // Validate settings based on type
    const settings = config.settings
    if (!settings || typeof settings !== 'object') {
      return 'Settings must be an object'
    }

    switch (config.type) {
      case 'mastery':
        if (!settings.masterySettings?.levels || !Array.isArray(settings.masterySettings.levels)) {
          return 'Mastery configuration must have levels array'
        }
        if (settings.masterySettings.levels.length === 0) {
          return 'Mastery configuration must have at least one level'
        }
        break

      case 'boolean':
        if (!settings.booleanSettings?.trueLabel || !settings.booleanSettings?.falseLabel) {
          return 'Boolean configuration must have trueLabel and falseLabel'
        }
        break

      case 'score': {
        if (!settings.scoreSettings) {
          return 'Score configuration must have scoreSettings'
        }
        const { minValue, maxValue, step } = settings.scoreSettings
        if (typeof minValue !== 'number' || typeof maxValue !== 'number' || typeof step !== 'number') {
          return 'Score settings must have numeric minValue, maxValue, and step'
        }
        if (minValue >= maxValue) {
          return 'Maximum value must be greater than minimum value'
        }
        if (step <= 0) {
          return 'Step must be greater than 0'
        }
        break
      }
    }

    return null
  }

  /**
   * Generate a filename for configuration export
   */
  static generateConfigExportFilename(configName: string): string {
    const safeName = configName.replace(/[^a-z0-9]/gi, '_')
    return `${safeName}.conf`
  }
}
