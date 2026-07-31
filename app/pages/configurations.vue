<script setup lang="ts">
import type { EvaluationConfig, EvaluationType } from '@/models/index'

const { t } = useI18n()
const toast = useToast()
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
const isViewModalOpen = ref(false)
const configToView = ref<EvaluationConfig | null>(null)
const isDeleteModalOpen = ref(false)
const configToDelete = ref<EvaluationConfig | null>(null)

// Import functionality
const isImportModalOpen = ref(false)
const selectedImportFile = ref<File | null>(null)
const importErrors = ref<string[]>([])
const isImporting = ref(false)

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
  const isUpdate = !!(selectedConfig.value && configs.value.find(c => c.id === selectedConfig.value!.id))

  try {
    if (isUpdate) {
      // Update existing
      await updateConfig(selectedConfig.value!.id, {
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

    toast.add({
      title: t(isUpdate ? 'configuration.toasts.updated' : 'configuration.toasts.created'),
      color: 'success',
      icon: 'i-lucide:check',
    })
  }
  catch (error) {
    console.error('Failed to save configuration:', error)
    toast.add({
      title: t('configuration.toasts.saveError'),
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
      icon: 'i-lucide:circle-alert',
    })
  }
}

function handleConfigModalClose() {
  selectedConfig.value = null
  isConfigModalOpen.value = false
}

function openViewModal(config: EvaluationConfig) {
  // Clone: the row click hands over a reactive proxy, and the view modal
  // must get plain data like the dropdown action already passes.
  configToView.value = JSON.parse(JSON.stringify(config))
  isViewModalOpen.value = true
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

    toast.add({
      title: t('configuration.toasts.deleted'),
      color: 'success',
      icon: 'i-lucide:check',
    })
  }
  catch (error) {
    console.error('Failed to delete configuration:', error)
    toast.add({
      title: t('configuration.toasts.deleteError'),
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
      icon: 'i-lucide:circle-alert',
    })
  }
}

async function handleClone(config: EvaluationConfig) {
  try {
    const clonedName = `${config.name} (${t('configuration.actions.clone')})`
    const cloned = cloneConfig(config, clonedName) // Already serializable from getConfigActions
    await createConfig(cloned.type, cloned.name, cloned.settings)

    toast.add({
      title: t('configuration.toasts.cloned'),
      color: 'success',
      icon: 'i-lucide:check',
    })
  }
  catch (error) {
    console.error('Failed to clone configuration:', error)
    toast.add({
      title: t('configuration.toasts.cloneError'),
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
      icon: 'i-lucide:circle-alert',
    })
  }
}

function getTypeIcon(type: EvaluationType) {
  const meta = getEvaluationTypeMeta(type)
  return meta?.icon || 'i-lucide:settings'
}

function getTypeLabel(type: EvaluationType) {
  const meta = getEvaluationTypeMeta(type)
  return meta?.label || type
}

interface ConfigFact {
  key: string
  label: string
  icon?: string
}

/**
 * At-a-glance facts shown on a configuration row: what the scale looks like,
 * whether comments are expected, and whether the timer runs. Everything is
 * derived from `settings` so the row never lies about the stored config.
 */
function getConfigFacts(config: EvaluationConfig): ConfigFact[] {
  const facts: ConfigFact[] = []
  const settings = config.settings

  if (config.type === 'mastery' && settings.masterySettings) {
    facts.push({
      key: 'scale',
      label: `${t('configuration.levels')}: ${settings.masterySettings.levels.length}`,
    })
  }
  else if (config.type === 'boolean' && settings.booleanSettings) {
    const { trueLabel, falseLabel } = settings.booleanSettings
    facts.push({
      key: 'scale',
      label: `${t('configuration.options')}: ${trueLabel} / ${falseLabel}`,
    })
  }
  else if (config.type === 'score' && settings.scoreSettings) {
    const { minValue, maxValue, unit } = settings.scoreSettings
    const range = `${minValue}–${maxValue}${unit ? ` ${unit}` : ''}`
    facts.push({
      key: 'scale',
      label: `${t('configuration.range')}: ${range}`,
    })
  }

  const commentsState = settings.requireComments
    ? t('configuration.required')
    : settings.allowComments
      ? t('configuration.optional')
      : t('configuration.disabled')

  facts.push({
    key: 'comments',
    label: `${t('configuration.comments')}: ${commentsState}`,
  })

  if (settings.timerEnabled) {
    facts.push({
      key: 'timer',
      label: t('configuration.modal.fields.timerSettings'),
      icon: 'i-lucide:timer',
    })
  }

  return facts
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
        label: t('configuration.actions.view'),
        icon: 'i-lucide:eye',
        onSelect: () => openViewModal(serializableConfig),
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
        color: 'error' as const,
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
    toast.add({
      title: t('configuration.toasts.exportError'),
      description: error instanceof Error ? error.message : undefined,
      color: 'error',
      icon: 'i-lucide:circle-alert',
    })
  }
}

// Import functionality
function openImportModal() {
  isImportModalOpen.value = true
  selectedImportFile.value = null
  importErrors.value = []
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

      toast.add({
        title: t('configuration.toasts.imported'),
        color: 'success',
        icon: 'i-lucide:check',
      })
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
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">
          {{ t('configuration.title') }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('configuration.subtitle') }}
        </p>
      </div>

      <div class="flex gap-2">
        <UButton
          icon="i-lucide:upload"
          color="neutral"
          variant="subtle"
          :label="t('configuration.actions.import')"
          @click="openImportModal"
        />
        <UButton
          icon="i-lucide:plus"
          :label="t('configuration.new')"
          @click="openCreateModal"
        />
      </div>
    </div>

    <!-- Empty State -->
    <UEmpty
      v-if="configs.length === 0"
      icon="i-lucide:sliders-horizontal"
      :title="t('configuration.noConfigurations')"
      :description="t('configuration.noConfigurationsMessage')"
    >
      <template #actions>
        <UButton
          icon="i-lucide:plus"
          size="lg"
          :label="t('configuration.emptyCta')"
          @click="openCreateModal()"
        />
      </template>
    </UEmpty>

    <div
      v-else
      class="overflow-hidden rounded-lg border border-default transition-[opacity,translate] duration-200 ease-out-expo starting:translate-y-1 starting:opacity-0"
    >
      <ul class="divide-y divide-default">
        <li
          v-for="config in configs"
          :key="config.id"
          class="group relative flex items-center pe-2 hover:bg-elevated"
        >
          <!-- Opening the detail view is a modal, not a route, so this is a
               button rather than a link. -->
          <button
            type="button"
            class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
            @click="openViewModal(config)"
          >
            <UIcon :name="getTypeIcon(config.type)" class="size-4 shrink-0 text-dimmed" />

            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm font-medium text-highlighted">
                {{ config.name }}
              </span>
              <span class="truncate text-xs text-muted">
                {{ getTypeLabel(config.type) }}
              </span>
            </div>

            <div class="hidden shrink-0 flex-wrap items-center gap-1.5 md:flex">
              <UBadge
                v-for="fact in getConfigFacts(config)"
                :key="fact.key"
                color="neutral"
                variant="subtle"
                size="sm"
                :icon="fact.icon"
                :label="fact.label"
              />
            </div>

            <span class="hidden w-24 shrink-0 text-end text-xs tabular-nums text-dimmed lg:block">
              {{ new Date(config.updatedAt).toLocaleDateString() }}
            </span>
          </button>

          <UDropdownMenu :items="getConfigActions(config)">
            <UButton
              icon="i-lucide:more-vertical"
              color="neutral"
              variant="ghost"
              :aria-label="t('configuration.actions.edit')"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </div>

    <!-- Configuration Modal -->
    <EvaluationConfigModal
      v-model="selectedConfig"
      v-model:open="isConfigModalOpen"
      @save="handleConfigSave"
      @update:open="value => { if (!value) handleConfigModalClose() }"
    />

    <!-- View Configuration Modal -->
    <EvaluationConfigViewModal
      v-model:open="isViewModalOpen"
      :config="configToView"
    />

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :title="t('configuration.deleteModal.title')"
      :description="t('configuration.deleteModal.warning')"
    >
      <template #body>
        <div class="space-y-2">
          <p class="text-sm text-muted">
            {{ t('configuration.deleteModal.message', { name: configToDelete?.name }) }}
          </p>
          <p class="text-sm text-error">
            {{ t('configuration.deleteModal.warning') }}
          </p>
        </div>
      </template>

      <template #footer>
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="() => { isDeleteModalOpen = false }"
        />
        <UButton
          :label="t('configuration.actions.delete')"
          color="error"
          @click="handleDelete"
        />
      </template>
    </UModal>

    <!-- Import Configuration Modal -->
    <UModal
      v-model:open="isImportModalOpen"
      :title="t('configuration.importModal.title')"
      :description="t('configuration.importModal.importInstructions')"
    >
      <template #body>
        <div class="space-y-4">
          <UFileUpload
            v-model="selectedImportFile"
            accept=".conf,.json"
            :label="t('evaluation.creationModal.dropzone')"
            :description="t('evaluation.creationModal.dropzoneHint')"
          />

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
          <div class="text-sm text-muted">
            <h4 class="font-medium text-default mb-2">
              {{ t('configuration.importModal.importInstructions') }}
            </h4>
            <ul class="list-disc list-inside space-y-1">
              <li>{{ t('configuration.importModal.importFormat') }}</li>
              <li>{{ t('configuration.importModal.importVersion') }}</li>
            </ul>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="() => { isImportModalOpen = false }"
        />
        <UButton
          :label="t('configuration.actions.import')"
          :disabled="!selectedImportFile || isImporting"
          :loading="isImporting"
          @click="handleImport"
        />
      </template>
    </UModal>
  </div>
</template>
