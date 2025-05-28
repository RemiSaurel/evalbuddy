<script setup lang="ts">
import type { EvaluationSession } from '@/models/index'
import { ImportExportService } from '@/utils/importExport'
import { evaluationStorage } from '@/utils/storage'

const { t } = useI18n()

const router = useRouter()

// Session management
const sessions = ref<EvaluationSession[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Import functionality
const isImportModalOpen = ref(false)
const selectedFile = ref<File | null>(null)
const importErrors = ref<string[]>([])
const isImporting = ref(false)

// Load sessions on mount
onMounted(async () => {
  await loadSessions()
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

function createEvaluation() {
  // Open import modal instead of directly creating evaluation
  openImportModal()
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

function openImportModal() {
  isImportModalOpen.value = true
  selectedFile.value = null
  importErrors.value = []
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  selectedFile.value = target.files?.[0] || null
}

async function importItems() {
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

    // Create new session with imported items
    const sessionName = `Imported ${new Date().toLocaleDateString()}`
    const session = await evaluationStorage.createSessionFromItems(items, sessionName)

    await loadSessions()
    isImportModalOpen.value = false

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

function dropdownItems(session: EvaluationSession) {
  return [
    {
      label: t('evaluation.actions.export'),
      icon: 'i-lucide:download',
      click: () => exportSession(session),
    },
    {
      label: t('evaluation.actions.delete'),
      icon: 'i-lucide:trash-2',
      click: () => deleteSession(session.id),
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
      :close-button="{ icon: 'i-lucide:x', color: 'gray', variant: 'link', padded: false }"
      @close="error = null"
    />

    <!-- Existing Sessions -->
    <div class="flex flex-col gap-4">
      <div class="flex justify-between items-center">
        <span class="text-neutral-800 font-semibold">
          {{ $t('evaluation.overview.resumeTitle') }}
        </span>
      </div>

      <div v-if="isLoading" class="flex gap-4 flex-wrap">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="min-w-64 h-32"
        />
      </div>

      <div v-else-if="sessions.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <UCard
          v-for="session in sessions"
          :key="session.id"
          class="cursor-pointer hover:shadow-lg transition-all duration-200"
          @click="openSession(session.id)"
        >
          <template #header>
            <div class="flex justify-between items-start">
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-base truncate text-neutral-900  transition-colors">
                  {{ session.name }}
                </h3>
              </div>
              <UDropdownMenu
                :items="dropdownItems(session)"
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
              <div class="flex items-center gap-4 text-sm text-gray-600">
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
                <div class="text-sm font-medium text-gray-900">
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

      <div v-else class="text-center py-8 text-gray-500">
        <UIcon name="i-lucide:folder-open" class="text-4xl mb-2" />
        <p>{{ $t('evaluation.overview.noSessions') }}</p>
      </div>
    </div>

    <!-- Create New Session -->
    <div class="flex justify-center gap-8 mt-12">
      <BigButton :label="$t('evaluation.actions.create')" @click="createEvaluation()">
        <template #icon>
          <UIcon name="i-lucide:plus" />
        </template>
      </BigButton>
    </div>

    <!-- Import Modal -->
    <UModal v-model:open="isImportModalOpen">
      <template #content>
        <UCard>
          <template #header>
            <h3 class="font-semibold text-lg">
              {{ $t('evaluation.importModal.importItems') }}
            </h3>
          </template>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('evaluation.importModal.selectFile') }}
              </label>
              <input
                type="file"
                accept=".json"
                class="block w-full text-sm text-gray-500
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
                {{ $t('evaluation.importModal.importErrors') }}:
              </h4>
              <ul class="list-disc list-inside text-sm text-red-700 space-y-1">
                <li v-for="err in importErrors" :key="err">
                  {{ err }}
                </li>
              </ul>
            </div>

            <div class="text-sm text-gray-600">
              <p class="mb-2">
                {{ $t('evaluation.importModal.importInstructions') }}:
              </p>
              <ul class="list-disc list-inside space-y-1 ml-4">
                <li>{{ $t('evaluation.importModal.importFormat') }}</li>
                <li>{{ $t('evaluation.importModal.importFields') }}</li>
              </ul>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="ghost"
                @click="isImportModalOpen = false"
              >
                {{ $t('evaluation.actions.cancel') }}
              </UButton>
              <UButton
                :disabled="!selectedFile || isImporting"
                :loading="isImporting"
                @click="importItems"
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
