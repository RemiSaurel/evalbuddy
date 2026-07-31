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
const sessionName = ref<string>('')
const evaluatorName = ref<string>('')

// Delete functionality
const isDeleteModalOpen = ref(false)
const sessionToDelete = ref<EvaluationSession | null>(null)

// Edit functionality
const isEditModalOpen = ref(false)
const sessionToEdit = ref<EvaluationSession | null>(null)
const editSessionName = ref<string>('')
const editEvaluatorName = ref<string>('')

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

// Computed sorted sessions - most recent first
const sortedSessions = computed(() => {
  return [...sessions.value].sort((a, b) => {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
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

function sessionPercent(session: EvaluationSession) {
  const total = session.dataset.items.length
  return total ? Math.round((session.results.length / total) * 100) : 0
}

// Leading status glyph, the column you scan first: done, started, untouched.
function sessionStatus(session: EvaluationSession) {
  if (session.results.length >= session.dataset.items.length && session.dataset.items.length > 0)
    return { icon: 'i-lucide:circle-check-big', class: 'text-success' }
  if (session.results.length > 0)
    return { icon: 'i-lucide:circle-dashed', class: 'text-primary' }
  return { icon: 'i-lucide:circle', class: 'text-dimmed' }
}

function confirmDelete(session: EvaluationSession) {
  sessionToDelete.value = session
  isDeleteModalOpen.value = true
}

function openEditModal(session: EvaluationSession) {
  sessionToEdit.value = session
  editSessionName.value = session.name
  editEvaluatorName.value = session.evaluatorName || ''
  isEditModalOpen.value = true
}

async function updateSessionName() {
  if (!sessionToEdit.value || !editSessionName.value.trim()) {
    return
  }

  try {
    await evaluationStorage.updateSession(sessionToEdit.value.id, {
      name: editSessionName.value.trim(),
      evaluatorName: editEvaluatorName.value.trim() || undefined,
    })
    await loadSessions()
    isEditModalOpen.value = false
    sessionToEdit.value = null
    editSessionName.value = ''
    editEvaluatorName.value = ''
  }
  catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to update session'
  }
}

async function handleDelete() {
  try {
    if (sessionToDelete.value) {
      await evaluationStorage.deleteSession(sessionToDelete.value.id)
      await loadSessions()
    }
    sessionToDelete.value = null
    isDeleteModalOpen.value = false
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
  sessionName.value = ''
  evaluatorName.value = ''
  // Force reload configs when opening modal to ensure latest data
  loadConfigs()
}

async function createEvaluation() {
  if (!selectedFile.value)
    return

  isImporting.value = true
  importErrors.value = []

  try {
    const { dataset, errors } = await ImportExportService.importDatasetFromFile(selectedFile.value)

    if (errors.length > 0) {
      importErrors.value = errors
      if (!dataset) {
        isImporting.value = false
        return
      }
    }

    if (!dataset) {
      importErrors.value = ['Failed to import dataset']
      isImporting.value = false
      return
    }

    // Find selected configuration
    const selectedConfig = selectedConfigId.value && selectedConfigId.value !== 'default'
      ? configs.value.find(c => c.id === selectedConfigId.value)
      : undefined

    // Create a serializable copy of the config to avoid proxy cloning issues
    const serializableConfig = selectedConfig
      ? JSON.parse(JSON.stringify(selectedConfig))
      : undefined

    // Create new session with imported dataset and selected configuration
    const finalSessionName = sessionName.value.trim() || `Imported ${new Date().toLocaleDateString()}`
    const finalEvaluatorName = evaluatorName.value.trim() || undefined
    const session = await evaluationStorage.createSessionFromDataset(
      dataset,
      finalSessionName,
      undefined, // description
      serializableConfig,
      finalEvaluatorName,
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
      label: t('evaluation.actions.edit'),
      icon: 'i-lucide:edit',
      onSelect: () => openEditModal(session),
    },
    {
      label: t('evaluation.actions.export'),
      icon: 'i-lucide:download',
      onSelect: () => exportSession(session),
    },
    {
      label: t('evaluation.actions.delete'),
      icon: 'i-lucide:trash-2',
      color: 'error' as const,
      onSelect: () => confirmDelete(session),
    },
  ]
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Error Display -->
    <UAlert
      v-if="error"
      icon="i-lucide:alert-circle"
      color="error"
      variant="subtle"
      :title="t('evaluation.error')"
      :description="error"
      close
      @update:open="error = null"
    />

    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold text-highlighted">
          {{ t('evaluation.title') }}
        </h1>
        <p class="text-sm text-muted">
          {{ t('evaluation.subtitle') }}
        </p>
      </div>

      <div class="flex gap-2">
        <UButton
          icon="i-lucide:plus"
          :label="t('evaluation.actions.create')"
          @click="openCreationEvaluation()"
        />
      </div>
    </div>

    <div
      v-if="sortedSessions.length > 0"
      class="overflow-hidden rounded-lg border border-default transition-[opacity,translate] duration-200 ease-out-expo starting:translate-y-1 starting:opacity-0"
    >
      <ul class="divide-y divide-default">
        <li
          v-for="session in sortedSessions"
          :key="session.id"
          class="group relative flex items-center pe-2 hover:bg-elevated"
        >
          <!-- A real link, so middle-click and ⌘-click open a session in a new
               tab, and the kebab stays a separate control beside it. -->
          <NuxtLink
            :to="`/evaluation/${session.id}`"
            class="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          >
            <UIcon
              :name="sessionStatus(session).icon"
              class="size-4 shrink-0"
              :class="sessionStatus(session).class"
            />

            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate text-sm font-medium text-highlighted">
                {{ session.name }}
              </span>
              <span class="truncate text-xs text-muted">
                {{ session.config.name }}
              </span>
            </div>

            <span class="shrink-0 text-xs tabular-nums text-muted">
              {{ session.results.length }} / {{ session.dataset.items.length }}
            </span>

            <UProgress
              :model-value="session.results.length"
              :max="session.dataset.items.length"
              size="sm"
              class="hidden w-20 shrink-0 sm:block"
            />

            <span class="w-9 shrink-0 text-end text-xs tabular-nums text-highlighted">
              {{ sessionPercent(session) }}%
            </span>

            <span class="hidden w-24 shrink-0 text-end text-xs tabular-nums text-dimmed lg:block">
              {{ new Date(session.updatedAt).toLocaleDateString() }}
            </span>
          </NuxtLink>

          <UDropdownMenu :items="getDropdownItems(session)">
            <UButton
              icon="i-lucide:more-vertical"
              color="neutral"
              variant="ghost"
              :aria-label="t('evaluation.actions.edit')"
            />
          </UDropdownMenu>
        </li>
      </ul>
    </div>

    <UEmpty
      v-else-if="!isLoading"
      icon="i-lucide:folder-open"
      :title="t('evaluation.overview.noSessions')"
      :description="t('evaluation.subtitle')"
    >
      <template #actions>
        <UButton
          icon="i-lucide:plus"
          size="lg"
          :label="t('evaluation.overview.emptyCta')"
          @click="openCreationEvaluation()"
        />
      </template>
    </UEmpty>

    <!-- Import Modal -->
    <UModal
      v-model:open="isCreationModalOpen"
      :title="t('evaluation.creationModal.createEvaluation')"
      :description="t('evaluation.creationModal.selectFile')"
      :ui="{ content: 'overflow-y-auto' }"
    >
      <template #body>
        <div class="space-y-4">
          <!-- Session Name Input -->
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              {{ t('evaluation.creationModal.sessionName') }}
            </label>
            <UInput
              v-model="sessionName"
              class="w-full"
              :placeholder="t('evaluation.creationModal.sessionNamePlaceholder')"
            />
          </div>

          <!-- Evaluator Name Input -->
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              {{ t('evaluation.creationModal.evaluatorName') }}
            </label>
            <UInput
              v-model="evaluatorName"
              class="w-full"
              :placeholder="t('evaluation.creationModal.evaluatorNamePlaceholder')"
            />
          </div>

          <!-- Configuration Selection -->
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              {{ t('configuration.selectForEvaluation') }}
            </label>
            <USelect
              v-model="selectedConfigId"
              class="w-full"
              :items="configItems"
              :placeholder="t('configuration.selectForEvaluation')"
            />
          </div>

          <!-- Dataset File -->
          <UFileUpload
            v-model="selectedFile"
            accept=".json"
            :label="t('evaluation.creationModal.dropzone')"
            :description="t('evaluation.creationModal.dropzoneHint')"
          />

          <div v-if="importErrors.length > 0" class="bg-error/10 border border-error/25 rounded-md p-3">
            <h4 class="font-medium text-error mb-2">
              {{ t('evaluation.creationModal.importErrors') }}:
            </h4>
            <ul class="list-disc list-inside text-sm text-error space-y-1 max-h-48 overflow-y-auto pr-2">
              <li v-for="err in importErrors" :key="err">
                {{ err }}
              </li>
            </ul>
          </div>

          <!-- File Format Collapsible -->
          <UCollapsible>
            <UButton
              trailing-icon="i-lucide-chevron-down"
              class="group w-full justify-between"
              color="neutral"
              variant="subtle"
              :label="t('evaluation.creationModal.viewFileFormat')"
              :ui="{
                trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
              }"
            />
            <template #content>
              <pre class="mt-2 rounded-md bg-muted p-4 text-xs overflow-x-auto max-h-72 overflow-y-auto"><code>{
  // optional — dataset-level metadata (string or string[] values)
  "context": {
    "course": "Geography Assessment",
    "level": "Intermediate"
  },

  // required — list of questions
  "questionList": [
    {
      "id": 1,                          // required (number)
      "question": "What is the capital of France?", // required
      "referenceAnswer": "Paris",       // optional
      "difficulty": "easy",             // optional — "easy" | "medium" | "hard"
      "context": { "topic": "European Geography" }  // optional
    }
  ],

  // required — list of student submissions
  "items": [
    {
      "id": 1,                          // required (number)
      "questionID": 1,                  // required — references questionList id
      "submittedAnswer": "Paris is the capital of France.", // required
      "context": { "studentName": "Alice" }  // optional
    }
  ]
}</code></pre>
              <div class="mt-2 text-xs text-muted">
                {{ t('evaluation.creationModal.importInstructions') }}
                <a
                  href="https://github.com/RemiSaurel/evalbuddy"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary hover:text-primary/80 underline"
                >
                  EvalBuddy Repository
                </a>
              </div>
            </template>
          </UCollapsible>
        </div>
      </template>

      <template #footer>
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="() => { isCreationModalOpen = false }"
        />
        <UButton
          :label="t('evaluation.actions.import')"
          :disabled="!selectedFile || isImporting"
          :loading="isImporting"
          @click="createEvaluation"
        />
      </template>
    </UModal>

    <!-- Edit Session Modal -->
    <UModal
      v-model:open="isEditModalOpen"
      :title="t('evaluation.editModal.title')"
      :description="t('evaluation.editModal.sessionName')"
    >
      <template #body>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              {{ t('evaluation.editModal.sessionName') }}
            </label>
            <UInput
              v-model="editSessionName"
              class="w-full"
              :placeholder="t('evaluation.editModal.sessionNamePlaceholder')"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-default mb-2">
              {{ t('evaluation.editModal.evaluatorName') }}
            </label>
            <UInput
              v-model="editEvaluatorName"
              class="w-full"
              :placeholder="t('evaluation.editModal.evaluatorNamePlaceholder')"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          :label="t('common.cancel')"
          color="neutral"
          variant="ghost"
          @click="() => { isEditModalOpen = false }"
        />
        <UButton
          :label="t('evaluation.actions.save')"
          :disabled="!editSessionName.trim()"
          @click="updateSessionName"
        />
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal
      v-model:open="isDeleteModalOpen"
      :title="t('evaluation.deleteModal.title')"
      :description="t('evaluation.deleteModal.warning')"
    >
      <template #body>
        <div class="space-y-2">
          <p class="text-sm text-muted">
            {{ t('evaluation.deleteModal.message', { name: sessionToDelete?.name }) }}
          </p>
          <p class="text-sm text-error">
            {{ t('evaluation.deleteModal.warning') }}
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
          :label="t('evaluation.actions.delete')"
          color="error"
          @click="handleDelete"
        />
      </template>
    </UModal>
  </div>
</template>
