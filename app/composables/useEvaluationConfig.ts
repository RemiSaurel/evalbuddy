import type {
  EvaluationConfig,
  EvaluationSettings,
  EvaluationType,
} from '@/models/index'
import {
  DEFAULT_BOOLEAN_CONFIG,
  DEFAULT_MASTERY_CONFIG,
  DEFAULT_SCORE_CONFIG,
  EVALUATION_TYPE_META,
} from '@/models/index'
import { ImportExportService } from '@/utils/importExport'
import { evaluationStorage } from '@/utils/storage'

export function useEvaluationConfig() {
  // Use Nuxt's global state to ensure sharing across components
  const configs = useState<EvaluationConfig[]>('evaluation-configs', () => [])
  const currentConfig = useState<EvaluationConfig | null>('current-config', () => null)
  const isLoading = useState<boolean>('configs-loading', () => false)
  const error = useState<string | null>('configs-error', () => null)

  // Load configurations from IndexedDB
  const loadConfigs = async () => {
    try {
      isLoading.value = true
      const storedConfigs = await evaluationStorage.getAllConfigs()
      configs.value = storedConfigs
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load configurations'
      console.error('Failed to load configurations:', err)
    }
    finally {
      isLoading.value = false
    }
  }

  // Load configurations from storage on initialization (client-side only)
  if (import.meta.client) {
    // Ensure configs are loaded if not already loaded
    if (configs.value.length === 0 && !isLoading.value) {
      loadConfigs()
    }
  }

  // Default configurations for different evaluation types
  const getDefaultConfig = (type: EvaluationType, name: string): EvaluationConfig => {
    const baseConfig: Omit<EvaluationConfig, 'settings'> = {
      id: crypto.randomUUID(),
      name,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    switch (type) {
      case 'mastery':
        return {
          ...baseConfig,
          settings: {
            allowComments: true,
            requireComments: false,
            masterySettings: DEFAULT_MASTERY_CONFIG,
          },
        }

      case 'boolean': {
        return {
          ...baseConfig,
          settings: {
            allowComments: true,
            requireComments: false,
            booleanSettings: DEFAULT_BOOLEAN_CONFIG,
          },
        }
      }

      case 'score': {
        return {
          ...baseConfig,
          settings: {
            allowComments: true,
            requireComments: false,
            scoreSettings: DEFAULT_SCORE_CONFIG,
          },
        }
      }

      default:
        throw new Error(`Unknown evaluation type: ${type}`)
    }
  }

  // Create a new configuration
  const createConfig = async (type: EvaluationType, name: string, settings?: EvaluationSettings): Promise<EvaluationConfig> => {
    try {
      const config = getDefaultConfig(type, name)

      // Override with provided settings if available
      if (settings) {
        config.settings = settings
      }

      await evaluationStorage.saveConfig(config)
      configs.value.push(config)
      return config
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create configuration'
      throw err
    }
  }

  // Update an existing configuration
  const updateConfig = async (id: string, updates: { name?: string, settings?: EvaluationSettings }): Promise<void> => {
    try {
      const index = configs.value.findIndex(c => c.id === id)
      if (index !== -1) {
        const existing = configs.value[index]!
        const updatedConfig = {
          id: existing.id,
          name: updates.name ?? existing.name,
          type: existing.type,
          settings: updates.settings ?? existing.settings,
          createdAt: existing.createdAt,
          updatedAt: new Date().toISOString(),
        }

        await evaluationStorage.saveConfig(updatedConfig)
        configs.value[index] = updatedConfig
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update configuration'
      throw err
    }
  }

  // Delete a configuration
  const deleteConfig = async (id: string): Promise<void> => {
    try {
      await evaluationStorage.deleteConfig(id)
      const index = configs.value.findIndex(c => c.id === id)
      if (index !== -1) {
        configs.value.splice(index, 1)
      }
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete configuration'
      throw err
    }
  }

  // Get configuration by ID
  const getConfig = (id: string): EvaluationConfig | undefined => {
    return configs.value.find(c => c.id === id)
  }

  // Set current working configuration
  const setCurrentConfig = (config: EvaluationConfig | null): void => {
    currentConfig.value = config
  }

  // Validate configuration
  const validateConfig = (config: EvaluationConfig): string[] => {
    const errors: string[] = []

    if (!config.name.trim()) {
      errors.push('Configuration name is required')
    }

    switch (config.type) {
      case 'mastery':
        if (!config.settings.masterySettings?.levels?.length) {
          errors.push('Mastery levels are required')
        }
        break

      case 'boolean':
        if (!config.settings.booleanSettings?.trueLabel || !config.settings.booleanSettings?.falseLabel) {
          errors.push('Boolean labels are required')
        }
        break

      case 'score': {
        const scoreSettings = config.settings.scoreSettings
        if (!scoreSettings) {
          errors.push('Score settings are required')
        }
        else {
          if (scoreSettings.minValue >= scoreSettings.maxValue) {
            errors.push('Maximum value must be greater than minimum value')
          }
          if (scoreSettings.step <= 0) {
            errors.push('Step must be greater than 0')
          }
        }
        break
      }
    }

    return errors
  }

  // Get evaluation options for rendering
  const getEvaluationOptions = (config: EvaluationConfig) => {
    switch (config.type) {
      case 'mastery':
        return config.settings.masterySettings?.levels?.map(level => ({
          id: level.id,
          label: level.label,
          value: level.id,
          color: level.color,
          description: level.description,
        })) || []

      case 'boolean': {
        const boolSettings = config.settings.booleanSettings
        return boolSettings
          ? [
              {
                id: 'true',
                label: boolSettings.trueLabel,
                value: true,
                color: boolSettings.trueColor,
              },
              {
                id: 'false',
                label: boolSettings.falseLabel,
                value: false,
                color: boolSettings.falseColor,
              },
            ]
          : []
      }

      default:
        return []
    }
  }

  // Check if evaluation type supports scoring/numeric input
  const isScoreType = (config: EvaluationConfig): boolean => {
    return config.type === 'score'
  }

  // Get score settings for score-type evaluations
  const getScoreSettings = (config: EvaluationConfig) => {
    return config.settings.scoreSettings
  }

  // Get evaluation type metadata
  const getEvaluationTypeMeta = (type: EvaluationType) => {
    return EVALUATION_TYPE_META[type]
  }

  // Clone a configuration
  const cloneConfig = (config: EvaluationConfig, newName: string): EvaluationConfig => {
    return {
      ...config,
      id: crypto.randomUUID(),
      name: newName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // Format evaluation value for display
  const formatEvaluationValue = (config: EvaluationConfig, value: any): string => {
    switch (config.type) {
      case 'mastery': {
        const level = config.settings.masterySettings?.levels?.find(l => l.id === value)
        return level?.label || String(value)
      }
      case 'boolean': {
        const boolSettings = config.settings.booleanSettings
        return value === true
          ? (boolSettings?.trueLabel || 'True')
          : (boolSettings?.falseLabel || 'False')
      }
      case 'score': {
        const scoreSettings = config.settings.scoreSettings
        return `${value}${scoreSettings?.unit || ''}`
      }
      default:
        return String(value)
    }
  }

  // Get all available evaluation types
  const getAvailableTypes = (): Array<{ value: EvaluationType, meta: typeof EVALUATION_TYPE_META[EvaluationType] }> => {
    return Object.entries(EVALUATION_TYPE_META).map(([type, meta]) => ({
      value: type as EvaluationType,
      meta,
    }))
  }

  // Export configuration to file
  const exportConfig = (config: EvaluationConfig): void => {
    try {
      const blob = ImportExportService.exportConfig(config)
      const filename = ImportExportService.generateConfigExportFilename(config.name)
      ImportExportService.downloadBlob(blob, filename)
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to export configuration'
      throw err
    }
  }

  // Import configuration from file
  const importConfigFromFile = async (file: File): Promise<EvaluationConfig | null> => {
    try {
      const { config: importedConfig, errors } = await ImportExportService.importConfigFromFile(file)

      if (errors.length > 0) {
        error.value = `Import errors: ${errors.join(', ')}`
        return null
      }

      if (!importedConfig) {
        error.value = 'No configuration found in file'
        return null
      }

      // Check if a configuration with the same name already exists
      const existingConfig = configs.value.find(c => c.name === importedConfig.name)
      if (existingConfig) {
        // Append a suffix to make the name unique
        importedConfig.name = `${importedConfig.name} (Imported)`
      }

      // Save the imported configuration
      await evaluationStorage.saveConfig(importedConfig)
      configs.value.push(importedConfig)

      return importedConfig
    }
    catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to import configuration'
      throw err
    }
  }

  return {
    // State
    configs,
    currentConfig,
    isLoading,
    error,

    // Actions
    createConfig,
    updateConfig,
    deleteConfig,
    getConfig,
    setCurrentConfig,
    getDefaultConfig,
    validateConfig,
    getEvaluationOptions,
    isScoreType,
    getScoreSettings,
    getEvaluationTypeMeta,
    cloneConfig,
    formatEvaluationValue,
    getAvailableTypes,
    loadConfigs, // Export loadConfigs so it can be called manually
    exportConfig,
    importConfigFromFile,
  }
}
