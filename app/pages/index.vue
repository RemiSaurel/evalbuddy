<script setup lang="ts">
const router = useRouter()

function createEvaluation() {
  const uuid = crypto.randomUUID()

  router.push({
    path: `/evaluation/${uuid}`,
  })
}
</script>

<template>
  <div class="flex flex-col gap-8 mt-8">
    <div class="flex flex-col gap-4">
      <span class="text-neutral-800 font-semibold">
        {{ $t('evaluation.resumeTitle') }}
      </span>
      <div class="flex gap-4 flex-wrap">
        <USkeleton
          v-for="i in 3"
          :key="i"
          class="min-w-64 h-32"
        />
      </div>
    </div>

    <div class="flex justify-center gap-8 mt-12">
      <BigButton :label="$t('evaluation.create')" @click="createEvaluation()">
        <template #icon>
          <UIcon
            name="i-lucide:plus"
          />
        </template>
      </BigButton>
    </div>
  </div>
</template>
