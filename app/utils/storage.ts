import type { EvaluatedItem, EvaluationConfig, EvaluationSession } from '@/models/index'
import { DEFAULT_MASTERY_CONFIG } from '@/models/index'

const DB_NAME = 'EvalBuddyDB'
const DB_VERSION = 2
const SESSIONS_STORE = 'sessions'
const CONFIGS_STORE = 'configs'

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
        value: result.value,
        comment: result.comment,
        evaluatedAt: result.evaluatedAt,
      })),
      config: session.config,
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

  async createSessionFromItems(items: EvaluatedItem[], name: string, description?: string, config?: EvaluationConfig): Promise<EvaluationSession> {
    // If no config provided, create a default mastery configuration
    const defaultConfig: EvaluationConfig = config || {
      id: crypto.randomUUID(),
      name: 'Default Mastery Configuration',
      type: 'mastery',
      settings: {
        allowComments: true,
        requireComments: false,
        masterySettings: DEFAULT_MASTERY_CONFIG,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const session: EvaluationSession = {
      id: crypto.randomUUID(),
      name,
      description,
      items,
      results: [],
      config: defaultConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
