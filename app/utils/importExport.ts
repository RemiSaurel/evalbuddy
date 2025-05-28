import type { Difficulty, EvaluatedItem, EvaluationSession, ExportData, MasteryLevelType } from '@/models/index'
import { evaluationStorage } from './storage'

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
}
