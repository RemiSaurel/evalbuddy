<script setup lang="ts">
import type { EvaluationConfig } from '@/models/index'

const { t } = useI18n()
const {
  configs,
  createConfig,
  updateConfig,
  deleteConfig,
  cloneConfig,
  getEvaluationTypeMeta,
  exportConfig,
  importConfigFromFile,
} = useEvaluationConfig()

// State
const selectedConfig = ref<EvaluationConfig | null>(null)
const isConfigModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const configToDelete = ref<EvaluationConfig | null>(null)
const searchQuery = ref('')

// Import functionality
const isImportModalOpen = ref(false)
const selectedImportFile = ref<File | null>(null)
const importErrors = ref<string[]>([])
const isImporting = ref(false)

// Computed
const filteredConfigs = computed(() => {
  if (!searchQuery.value)
    return configs.value

  const query = searchQuery.value.toLowerCase()
  return configs.value.filter(config =>
    config.name.toLowerCase().includes(query)
    || config.type.toLowerCase().includes(query),
  )
})

// Methods
function openCreateModal() {
  selectedConfig.value = null
  isConfigModalOpen.value = true
}

function openEditModal(config: EvaluationConfig) {
  selectedConfig.value = config // Already serializable from getConfigActions
  isConfigModalOpen.value = true
}

async function handleConfigSave(config: EvaluationConfig) {
  try {
    if (selectedConfig.value && configs.value.find(c => c.id === selectedConfig.value!.id)) {
      // Update existing
      await updateConfig(selectedConfig.value.id, {
        name: config.name,
        settings: config.settings,
      })
    }
    else {
      // Create new with settings
      await createConfig(config.type, config.name, config.settings)
    }

    selectedConfig.value = null
    isConfigModalOpen.value = false
  }
  catch (error) {
    console.error('Failed to save configuration:', error)
  }
}

function handleConfigModalClose() {
  selectedConfig.value = null
  isConfigModalOpen.value = false
}

function confirmDelete(config: EvaluationConfig) {
  configToDelete.value = config
  isDeleteModalOpen.value = true
}

async function handleDelete() {
  try {
    if (configToDelete.value) {
      await deleteConfig(configToDelete.value.id)
    }
    configToDelete.value = null
    isDeleteModalOpen.value = false
  }
  catch (error) {
    console.error('Failed to delete configuration:', error)
    // TODO: Show error toast/notification
  }
}

async function handleClone(config: EvaluationConfig) {
  try {
    const clonedName = `${config.name} (${t('configuration.actions.clone')})`
    const cloned = cloneConfig(config, clonedName) // Already serializable from getConfigActions
    await createConfig(cloned.type, cloned.name, cloned.settings)
  }
  catch (error) {
    console.error('Failed to clone configuration:', error)
    // TODO: Show error toast/notification
  }
}

function getTypeIcon(type: string) {
  const meta = getEvaluationTypeMeta(type as any)
  return meta?.icon || 'i-lucide:settings'
}

function getTypeLabel(type: string) {
  const meta = getEvaluationTypeMeta(type as any)
  return meta?.label || type
}

// Dropdown items for each config
function getConfigActions(config: EvaluationConfig) {
  // Create a serializable copy to avoid proxy cloning issues
  const serializableConfig = JSON.parse(JSON.stringify(config))

  return [
    [
      {
        label: t('configuration.actions.edit'),
        icon: 'i-lucide:edit',
        onSelect: () => openEditModal(serializableConfig),
      },
      {
        label: t('configuration.actions.clone'),
        icon: 'i-lucide:copy',
        onSelect: () => handleClone(serializableConfig),
      },
      {
        label: t('configuration.actions.export'),
        icon: 'i-lucide:download',
        onSelect: () => handleExport(serializableConfig),
      },
    ],
    [
      {
        label: t('configuration.actions.delete'),
        icon: 'i-lucide:trash-2',
        onSelect: () => confirmDelete(serializableConfig),
      },
    ],
  ]
}

// Handle configuration export
function handleExport(config: EvaluationConfig) {
  try {
    exportConfig(config)
  }
  catch (error) {
    console.error('Failed to export configuration:', error)
    // TODO: Show error toast/notification
  }
}

// Import functionality
function openImportModal() {
  isImportModalOpen.value = true
  selectedImportFile.value = null
  importErrors.value = []
}

function handleImportFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  selectedImportFile.value = target.files?.[0] || null
}

async function handleImport() {
  if (!selectedImportFile.value)
    return

  isImporting.value = true
  importErrors.value = []

  try {
    const importedConfig = await importConfigFromFile(selectedImportFile.value)

    if (importedConfig) {
      isImportModalOpen.value = false
      selectedImportFile.value = null
      // TODO: Show success toast/notification
    }
  }
  catch (error) {
    console.error('Failed to import configuration:', error)
    importErrors.value = [error instanceof Error ? error.message : 'Failed to import configuration']
  }
  finally {
    isImporting.value = false
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto mt-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row justify-between items-center mb-4">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">
          {{ t('configuration.title') }}
        </h1>
        <p class="text-neutral-600 mt-2">
          {{ t('configuration.subtitle') }}
        </p>
      </div>

      <div class="flex gap-3">
        <UButton
          icon="i-lucide:upload"
          variant="outline"
          size="lg"
          @click="openImportModal"
        >
          {{ t('configuration.actions.import') }}
        </UButton>
        <UButton
          icon="i-lucide:plus"
          size="lg"
          @click="openCreateModal"
        >
          {{ t('configuration.new') }}
        </UButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredConfigs.length === 0" class="text-center py-12">
      <div class="text-neutral-400 mb-4">
        <UIcon name="i-lucide:settings" class="text-6xl" />
      </div>
      <h3 class="text-lg font-medium text-neutral-900 mb-2">
        {{ t('configuration.noConfigurations') }}
      </h3>
      <p class="text-neutral-600 mb-4">
        {{ searchQuery ? t('configuration.noSearchResults') : t('configuration.noConfigurationsMessage') }}
      </p>
    </div>

    <!-- Configurations Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div
        v-for="config in filteredConfigs"
        :key="config.id"
        class="p-3 border border-neutral-200 rounded-lg"
      >
        <div class="flex flex-1 items-center justify-between">
          <div class="flex items-center gap-3">
            <UIcon
              :name="getTypeIcon(config.type)"
              class="text-blue-600 text-xl"
            />
            <div>
              <h3 class="font-semibold text-neutral-900">
                {{ config.name }}
              </h3>
              <p class="text-sm text-neutral-500">
                {{ getTypeLabel(config.type) }}
              </p>
            </div>
          </div>

          <UDropdownMenu :items="getConfigActions(config)">
            <UButton
              icon="i-lucide:more-horizontal"
              color="neutral"
              variant="ghost"
              size="sm"
            />
          </UDropdownMenu>
        </div>
      </div>
    </div>

    <!-- Configuration Modal -->
    <EvaluationConfigModal
      v-model="selectedConfig"
      v-model:open="isConfigModalOpen"
      @save="handleConfigSave"
      @update:open="value => { if (!value) handleConfigModalClose() }"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="isDeleteModalOpen" title="Delete Configuration Modal" description="Delete Configuration Modal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('configuration.deleteModal.title') }}
            </h3>
          </template>

          <div class="space-y-4">
            <p class="text-neutral-600">
              {{ t('configuration.deleteModal.message', { name: configToDelete?.name }) }}
            </p>
            <p class="text-sm text-error">
              {{ t('configuration.deleteModal.warning') }}
            </p>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                color="neutral"
                variant="outline"
                @click="isDeleteModalOpen = false"
              >
                {{ t('configuration.actions.cancel') }}
              </UButton>
              <UButton
                color="error"
                @click="handleDelete"
              >
                {{ t('configuration.actions.delete') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Import Configuration Modal -->
    <UModal v-model:open="isImportModalOpen" title="Import Configuration Modal" description="Import Configuration Modal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ t('configuration.importModal.title') }}
            </h3>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ t('configuration.importModal.selectFile') }}
              </label>
              <input
                type="file"
                accept=".conf,.json"
                class="block w-full text-sm text-neutral-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-medium
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100"
                @change="handleImportFileSelect"
              >
            </div>

            <!-- Import Errors -->
            <UAlert
              v-if="importErrors.length > 0"
              icon="i-lucide:alert-circle"
              color="error"
              variant="subtle"
              :title="t('configuration.importModal.importErrors')"
            >
              <template #description>
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="error in importErrors" :key="error">
                    {{ error }}
                  </li>
                </ul>
              </template>
            </UAlert>

            <!-- Import Instructions -->
            <div class="text-sm text-neutral-600">
              <h4 class="font-medium mb-2">
                {{ t('configuration.importModal.importInstructions') }}
              </h4>
              <ul class="list-disc list-inside space-y-1">
                <li>{{ t('configuration.importModal.importFormat') }}</li>
                <li>{{ t('configuration.importModal.importVersion') }}</li>
              </ul>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                @click="isImportModalOpen = false"
              >
                {{ t('configuration.actions.cancel') }}
              </UButton>
              <UButton
                :disabled="!selectedImportFile || isImporting"
                :loading="isImporting"
                @click="handleImport"
              >
                {{ t('configuration.actions.import') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
