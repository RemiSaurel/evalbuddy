<script setup lang="ts">
import type { EvaluationSession } from '@/models/index'
import { ImportExportService } from '@/utils/importExport'
import { evaluationStorage } from '@/utils/storage'

const { t } = useI18n()
const router = useRouter()

// Get configurations for selection
const { configs, loadConfigs } = useEvaluationConfig()

// Session management
const sessions = ref<EvaluationSession[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Import functionality
const isCreationModalOpen = ref(false)
const selectedFile = ref<File | null>(null)
const importErrors = ref<string[]>([])
const isImporting = ref(false)
const selectedConfigId = ref<string>('default')

// Load sessions and configs on mount
onMounted(async () => {
  await Promise.all([
    loadSessions(),
    loadConfigs(), // This will ensure configs are loaded
  ])
})

// Computed items for configuration selection
const configItems = computed(() => {
  // Ensure configs.value is an array
  const configArray = Array.isArray(configs.value) ? configs.value : []

  const items = configArray.map(config => ({
    value: config.id,
    label: config.name,
  }))

  // Add default option with a special value instead of empty string
  items.unshift({
    value: 'default',
    label: t('configuration.useDefault'),
  })

  return items
})

async function loadSessions() {
  isLoading.value = true
  error.value = null
  try {
    sessions.value = await evaluationStorage.getAllSessions()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load sessions'
  }
  finally {
    isLoading.value = false
  }
}

function openSession(sessionId: string) {
  router.push({
    path: `/evaluation/${sessionId}`,
  })
}

async function deleteSession(sessionId: string) {
  try {
    await evaluationStorage.deleteSession(sessionId)
    await loadSessions()
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to delete session'
  }
}

async function exportSession(session: EvaluationSession) {
  try {
    const blob = await ImportExportService.exportSession(session.id)
    const filename = ImportExportService.generateExportFilename(session.name)
    ImportExportService.downloadBlob(blob, filename)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to export session'
  }
}

function openCreationEvaluation() {
  isCreationModalOpen.value = true
  selectedFile.value = null
  importErrors.value = []
  selectedConfigId.value = 'default'
  // Force reload configs when opening modal to ensure latest data
  loadConfigs()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

async function createEvaluation() {
  if (!selectedFile.value)
    return

  isImporting.value = true
  importErrors.value = []

  try {
    const { items, errors } = await ImportExportService.importFromFile(selectedFile.value)

    if (errors.length > 0) {
      importErrors.value = errors
      if (items.length === 0) {
        isImporting.value = false
        return
      }
    }

    // Find selected configuration
    const selectedConfig = selectedConfigId.value && selectedConfigId.value !== 'default'
      ? configs.value.find(c => c.id === selectedConfigId.value)
      : undefined

    // Create a serializable copy of the config to avoid proxy cloning issues
    const serializableConfig = selectedConfig
      ? JSON.parse(JSON.stringify(selectedConfig))
      : undefined

    // Create new session with imported items and selected configuration
    const sessionName = `Imported ${new Date().toLocaleDateString()}`
    const session = await evaluationStorage.createSessionFromItems(
      items,
      sessionName,
      undefined, // description
      serializableConfig,
    )

    await loadSessions()
    isCreationModalOpen.value = false

    // Navigate to the new session
    router.push(`/evaluation/${session.id}`)
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to import file'
  }
  finally {
    isImporting.value = false
  }
}

function getDropdownItems(session: EvaluationSession) {
  return [
    {
      label: t('evaluation.actions.export'),
      icon: 'i-lucide:download',
      onSelect: () => exportSession(session),
    },
    {
      label: t('evaluation.actions.delete'),
      icon: 'i-lucide:trash-2',
      onSelect: () => deleteSession(session.id),
    },
  ]
}
</script>

<template>
  <div class="flex flex-col gap-8 mt-8">
    <!-- Error Display -->
    <UAlert
      v-if="error"
      icon="i-lucide:alert-circle"
      color="error"
      variant="subtle"
      :title="$t('evaluation.error')"
      :description="error"
      :close-button="{ icon: 'i-lucide:x', color: 'neutral', variant: 'link', padded: false }"
      @close="error = null"
    />

    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">
          {{ t('evaluation.title') }}
        </h1>
        <p class="text-neutral-600 mt-2">
          {{ t('evaluation.subtitle') }}
        </p>
      </div>

      <div class="flex gap-3">
        <UButton
          icon="i-lucide:plus"
          size="lg"
          @click="openCreationEvaluation()"
        >
          {{ t('evaluation.actions.create') }}
        </UButton>
      </div>
    </div>

    <!-- Existing Sessions -->
    <div class="flex flex-col gap-4">
      <div v-if="sessions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <UCard
          v-for="session in sessions"
          :key="session.id"
          class="cursor-pointer hover:shadow-lg transition-all duration-200"
          @click="openSession(session.id)"
        >
          <template #header>
            <div class="flex justify-between items-start">
              <div class="flex flex-col gap-1">
                <h3 class="font-semibold text-base truncate text-neutral-900  transition-colors">
                  {{ session.name }}
                </h3>
                <div class="text-sm text-neutral-500 truncate">
                  {{ session.config.name }}
                </div>
              </div>
              <UDropdownMenu
                :items="getDropdownItems(session)"
              >
                <UButton
                  icon="i-lucide:more-vertical"
                  variant="ghost"
                  size="xs"
                  class="opacity-60 hover:opacity-100"
                  @click.stop
                />
              </UDropdownMenu>
            </div>
          </template>

          <div class="space-y-2">
            <!-- Stats Row -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4 text-sm text-neutral-600">
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide:help-circle" class="w-3 h-3" />
                  <span>{{ session.items.length }}</span>
                </div>
                <div class="flex items-center gap-1">
                  <UIcon name="i-lucide:check-circle" class="w-3 h-3 text-green-600" />
                  <span>{{ session.results.length }}</span>
                </div>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium text-neutral-900">
                  {{ Math.round((session.results.length / session.items.length) * 100) }}%
                </div>
              </div>
            </div>

            <!-- Progress Bar -->
            <UProgress
              :model-value="session.results.length"
              :max="session.items.length"
              size="sm"
              class="h-1.5"
            />
          </div>
        </UCard>
      </div>

      <div v-else class="text-center py-8 text-neutral-500">
        <UIcon name="i-lucide:folder-open" class="text-4xl mb-2" />
        <p>{{ $t('evaluation.overview.noSessions') }}</p>
      </div>
    </div>

    <!-- Import Modal -->
    <UModal v-model:open="isCreationModalOpen" title="Creation Evaluation Modal" description="Creation Evaluation Modal">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-lg">
              {{ $t('evaluation.creationModal.createEvaluation') }}
            </h3>
          </template>

          <div class="space-y-4">
            <!-- Configuration Selection -->
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('configuration.selectForEvaluation') }}
              </label>
              <USelect
                v-model="selectedConfigId"
                :items="configItems"
                :placeholder="$t('configuration.selectForEvaluation')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('evaluation.creationModal.selectFile') }}
              </label>
              <input
                type="file"
                accept=".json"
                class="block w-full text-sm text-neutral-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
                @change="handleFileSelect"
              >
            </div>

            <div v-if="importErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 class="font-medium text-red-800 mb-2">
                {{ $t('evaluation.creationModal.importErrors') }}:
              </h4>
              <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
                <li v-for="err in importErrors" :key="err">
                  {{ err }}
                </li>
              </ul>
            </div>

            <div class="text-sm text-neutral-600">
              <p class="mb-2">
                {{ $t('evaluation.creationModal.importInstructions') }}:
              </p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>{{ $t('evaluation.creationModal.importFormat') }}</li>
                <li>{{ $t('evaluation.creationModal.importFields') }}</li>
              </ul>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                @click="isCreationModalOpen = false"
              >
                {{ $t('evaluation.actions.cancel') }}
              </UButton>
              <UButton
                :disabled="!selectedFile || isImporting"
                :loading="isImporting"
                @click="createEvaluation"
              >
                {{ $t('evaluation.actions.import') }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>
  </div>
</template>
