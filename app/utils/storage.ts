import type { DatasetStructure, EvaluationConfig, EvaluationSession } from '@/models/index'
import { DEFAULT_MASTERY_CONFIG } from '@/models/index'

const DB_NAME = 'EvalBuddyDB'
const DB_VERSION = 3
const SESSIONS_STORE = 'sessions'
const CONFIGS_STORE = 'configs'
const ELAPSED_TIMES_STORE = 'elapsedTimes'

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

        // Create configs store
        if (!db.objectStoreNames.contains(CONFIGS_STORE)) {
          const configsStore = db.createObjectStore(CONFIGS_STORE, { keyPath: 'id' })
          configsStore.createIndex('createdAt', 'createdAt', { unique: false })
          configsStore.createIndex('name', 'name', { unique: false })
          configsStore.createIndex('type', 'type', { unique: false })
        }

        // Create elapsed times store for lightweight timer persistence
        if (!db.objectStoreNames.contains(ELAPSED_TIMES_STORE)) {
          db.createObjectStore(ELAPSED_TIMES_STORE, { keyPath: 'sessionId' })
        }
      }
    })
  }

  async saveSessionElapsedTime(sessionId: string, elapsedTime: Record<number, number>): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([ELAPSED_TIMES_STORE], 'readwrite')
    const store = transaction.objectStore(ELAPSED_TIMES_STORE)

    return new Promise((resolve, reject) => {
      const request = store.put({ sessionId, elapsedTime })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getSessionElapsedTime(sessionId: string): Promise<Record<number, number> | undefined> {
    const db = await this.initDB()
    const transaction = db.transaction([ELAPSED_TIMES_STORE], 'readonly')
    const store = transaction.objectStore(ELAPSED_TIMES_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(sessionId)
      request.onsuccess = () => resolve(request.result?.elapsedTime)
      request.onerror = () => reject(request.error)
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
      dataset: {
        context: session.dataset.context,
        questionList: session.dataset.questionList.map(question => ({
          id: question.id,
          question: question.question,
          referenceAnswer: question.referenceAnswer,
          difficulty: question.difficulty,
          context: question.context,
        })),
        items: session.dataset.items.map(item => ({
          id: item.id,
          questionID: item.questionID,
          submittedAnswer: item.submittedAnswer,
          context: item.context,
        })),
      },
      results: session.results.map(result => ({
        itemId: result.itemId,
        questionId: result.questionId,
        value: result.value,
        comment: result.comment,
        elapsedTime: result.elapsedTime,
        evaluatedAt: result.evaluatedAt,
      })),
      config: session.config,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      evaluatorName: session.evaluatorName,
      isCompleted: session.isCompleted,
      elapsedTimeMsByItemId: session.elapsedTimeMsByItemId ?? {},
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
      request.onsuccess = async () => {
        const session = request.result || null
        if (!session) {
          resolve(null)
          return
        }

        try {
          const storedElapsedTime = await this.getSessionElapsedTime(id)
          session.elapsedTime = storedElapsedTime ?? session.elapsedTime ?? {}
          resolve(session)
        }
        catch (error) {
          reject(error)
        }
      }
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

  async updateSession(sessionId: string, updates: Partial<Pick<EvaluationSession, 'name' | 'description' | 'evaluatorName'>>): Promise<void> {
    const session = await this.getSession(sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    const updatedSession: EvaluationSession = {
      ...session,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.saveSession(updatedSession)
  }

  async deleteSession(id: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([SESSIONS_STORE, ELAPSED_TIMES_STORE], 'readwrite')
    const store = transaction.objectStore(SESSIONS_STORE)
    const timeStore = transaction.objectStore(ELAPSED_TIMES_STORE)

    return new Promise((resolve, reject) => {
      const sessionReq = store.delete(id)
      const elapsedReq = timeStore.delete(id)

      let done = 0
      const check = () => {
        done++
        if (done === 2)
          resolve()
      }

      sessionReq.onsuccess = check
      elapsedReq.onsuccess = check

      elapsedReq.onsuccess = () => resolve()
      elapsedReq.onerror = () => reject(elapsedReq.error)
    })
  }

  async createSessionFromDataset(dataset: DatasetStructure, name: string, description?: string, config?: EvaluationConfig, evaluatorName?: string): Promise<EvaluationSession> {
    // If no config provided, create a default mastery configuration
    const defaultConfig: EvaluationConfig = config || {
      id: crypto.randomUUID(),
      name: 'Default Mastery Configuration',
      type: 'mastery',
      settings: {
        allowComments: true,
        requireComments: false,
        timerEnabled: false,
        masterySettings: DEFAULT_MASTERY_CONFIG,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const session: EvaluationSession = {
      id: crypto.randomUUID(),
      name,
      description,
      dataset,
      results: [],
      config: defaultConfig,
      elapsedTimeMsByItemId: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evaluatorName,
      isCompleted: false,
    }

    await this.saveSession(session)
    return session
  }

  // Configuration management methods
  async saveConfig(config: EvaluationConfig): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([CONFIGS_STORE], 'readwrite')
    const store = transaction.objectStore(CONFIGS_STORE)

    const plainConfig: EvaluationConfig = {
      id: config.id,
      name: config.name,
      type: config.type,
      settings: JSON.parse(JSON.stringify(config.settings)),
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }

    return new Promise((resolve, reject) => {
      const request = store.put(plainConfig)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getConfig(id: string): Promise<EvaluationConfig | null> {
    const db = await this.initDB()
    const transaction = db.transaction([CONFIGS_STORE], 'readonly')
    const store = transaction.objectStore(CONFIGS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async getAllConfigs(): Promise<EvaluationConfig[]> {
    const db = await this.initDB()
    const transaction = db.transaction([CONFIGS_STORE], 'readonly')
    const store = transaction.objectStore(CONFIGS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }

  async deleteConfig(id: string): Promise<void> {
    const db = await this.initDB()
    const transaction = db.transaction([CONFIGS_STORE], 'readwrite')
    const store = transaction.objectStore(CONFIGS_STORE)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

export const evaluationStorage = new EvaluationStorage()
