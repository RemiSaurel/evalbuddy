import type { EvaluatedItem, EvaluatedValue, EvaluationSession, ExportEvaluationEntry, ExportResult } from '~/models'
import { evaluationStorage } from '@/utils/storage'
import { parseExportResult } from '~/models'

export function useComposedEvaluation(session: EvaluationSession) {
  const evaluationPass = ref<1 | 2>(1)

  const showAiEvaluation = computed(() => evaluationPass.value === 2)

  function startSecondPass() {
    evaluationPass.value = 2
  }

  function resetPass() {
    evaluationPass.value = 1
  }

  function isComposedMode(): boolean {
    return session.config?.settings?.evaluationMode === 'without-then-with-ai'
  }

  async function saveFirstPass(
    item: { id: number, questionID: number },
    value: EvaluatedValue,
    comment?: string,
    elapsedTime?: string,
  ) {
    const entry: ExportEvaluationEntry = { value, comment: comment || '', elapsedTime }
    await upsertResult(session, item, entry, false)
  }

  async function saveSecondPass(
    item: { id: number, questionID: number },
    value: EvaluatedValue,
    comment?: string,
    elapsedTime?: string,
  ) {
    const entry: ExportEvaluationEntry = { value, comment: comment || '', elapsedTime }
    await upsertResult(session, item, entry, true)
  }

  async function upsertResult(
    session: EvaluationSession,
    item: { id: number, questionID: number },
    entry: ExportEvaluationEntry,
    isSecond: boolean,
  ) {
    const result: ExportResult = {
      itemId: item.id,
      questionId: item.questionID,
      evaluations: {
        ...(isSecond ? {} : { 0: entry }),
        ...(isSecond ? { 1: entry } : {}),
      },
      evaluatedAt: new Date().toISOString(),
    }

    const existingIndex = (session.results || []).findIndex(r => r.itemId === result.itemId)
    if (existingIndex >= 0) {
      const existingResult = session.results[existingIndex]
      if (!existingResult) {
        session.results.push(result)
      }
      else {
        session.results[existingIndex] = {
          ...existingResult,
          itemId: item.id,
          questionId: item.questionID,
          evaluatedAt: result.evaluatedAt,
          evaluations: {
            ...existingResult.evaluations,
            ...result.evaluations,
          },
        }
      }
    }
    else {
      session.results.push(result)
    }

    await evaluationStorage.saveSession(session)
  }

  function loadDisplayValue(result: ExportResult): EvaluatedItem | null {
    const parsed = parseExportResult(result)
    if (!parsed.secondPass)
      return null

    const display = parsed.secondPass
    return {
      value: display.value,
      masteryLevel: typeof display.value === 'string' ? display.value : undefined,
      comment: display.comment,
    }
  }

  return {
    evaluationPass,
    showAiEvaluation,
    startSecondPass,
    resetPass,
    isComposedMode,
    saveFirstPass,
    saveSecondPass,
    loadDisplayValue,
  }
}
