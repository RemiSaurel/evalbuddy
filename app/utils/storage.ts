import type { EvaluatedItem, EvaluationSession } from '@/models/index'

const DB_NAME = 'EvalBuddyDB'
const DB_VERSION = 1
const SESSIONS_STORE = 'sessions'

class EvaluationStorage {
  private db: IDBDatabase | null = null

  async initDB(): Promise<IDBDatabase> {
    if (this.db)
      return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' })
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false })
          sessionsStore.createIndex('name', 'name', { unique: false })
        }
      }
    })
  }

  async saveSession(session: EvaluationSession): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)

    // Create a plain object copy to avoid proxy cloning issues
    const plainSession: EvaluationSession = {
      id: session.id,
      name: session.name,
      description: session.description,
      items: session.items.map(item => ({
        id: item.id,
        questionID: item.questionID,
        question: item.question,
        referenceAnswer: item.referenceAnswer,
        learnerAnswer: item.learnerAnswer,
        difficulty: item.difficulty,
      })),
      results: session.results.map(result => ({
        questionId: result.questionId,
        masteryLevel: result.masteryLevel,
        comment: result.comment,
        evaluatedAt: result.evaluatedAt,
      })),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      evaluatorName: session.evaluatorName,
      isCompleted: session.isCompleted,
    }

    return new Promise((resolve, reject) => {
      const request = store.put(plainSession)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSession(id: string): Promise<EvaluationSession | null> {
    const db = await this.initDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readonly')
    const store = transaction.objectStore(SESSIONS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllSessions(): Promise<EvaluationSession[]> {
    const db = await this.initDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readonly')
    const store = transaction.objectStore(SESSIONS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async createSessionFromItems(items: EvaluatedItem[], name: string, description?: string): Promise<EvaluationSession> {
    const session: EvaluationSession = {
      id: crypto.randomUUID(),
      name,
      description,
      items,
      results: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isCompleted: false,
    }

    await this.saveSession(session)
    return session
  }
}

export const evaluationStorage = new EvaluationStorage()
