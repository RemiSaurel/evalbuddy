<script setup lang="ts">
const props = defineProps<{
  itemCount: number
  /** Pre-formatted HH:MM:SS, or undefined when the session had no timer. */
  duration?: string
}>()

const { t } = useI18n()
const reduceMotion = useReducedMotion()

// The whole app's delight budget is spent here: finishing a session is the one
// rare, earned moment. Everything else stays quiet.
const CONFETTI_COLORS = [
  'bg-primary',
  'bg-success',
  'bg-warning',
  'bg-primary/70',
] as const

// Deterministic scatter — no Math.random, so the burst is identical every run
// and reads as designed rather than noisy.
const confetti = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: 6 + ((i * 37) % 88),
  drift: ((i * 53) % 60) - 30,
  fall: 88 + ((i * 29) % 44),
  spin: ((i * 97) % 360) - 180,
  delay: i * 0.03,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
}))

const showStats = computed(() => props.itemCount > 0)
</script>

<template>
  <div class="relative flex flex-col items-center gap-4 overflow-hidden py-2 text-center">
    <!-- Confetti sits behind the content and never intercepts clicks. -->
    <div
      v-if="!reduceMotion"
      class="pointer-events-none absolute inset-x-0 top-0 h-40"
      aria-hidden="true"
    >
      <Motion
        v-for="piece in confetti"
        :key="piece.id"
        class="absolute top-0 size-1.5 rounded-[2px]"
        :class="piece.color"
        :style="{ left: `${piece.left}%` }"
        :initial="{ opacity: 0, transform: 'translate(0px, -8px) rotate(0deg)' }"
        :animate="{
          opacity: [0, 1, 1, 0],
          transform: `translate(${piece.drift}px, ${piece.fall}px) rotate(${piece.spin}deg)`,
        }"
        :transition="{ duration: 1.1, delay: piece.delay, ease: 'easeOut' }"
      />
    </div>

    <!-- Check mark, drawn rather than dropped in. -->
    <svg
      class="celebration-check size-12 text-success"
      viewBox="0 0 52 52"
      fill="none"
      aria-hidden="true"
    >
      <circle
        class="celebration-check__circle"
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        stroke-width="2.5"
      />
      <path
        class="celebration-check__mark"
        d="M15 27.5 L22.5 35 L37 19"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <div class="flex flex-col gap-1">
      <p class="text-sm text-muted">
        {{ t('evaluation.completion.message') }}
      </p>

      <p v-if="showStats" class="text-sm font-medium text-highlighted">
        {{ t('evaluation.completion.statsItems', { count: itemCount }) }}
        <span v-if="duration" class="tabular-nums text-muted">
          {{ t('evaluation.completion.statsDuration', { duration }) }}
        </span>
      </p>
    </div>
  </div>
</template>

<style scoped>
/*
  A one-shot, non-interruptible reveal — the one place keyframes beat
  transitions, since there is no state to retarget to.
*/
.celebration-check__circle {
  stroke-dasharray: 151;
  stroke-dashoffset: 151;
  animation: celebration-draw 400ms var(--ease-out-expo) forwards;
}

.celebration-check__mark {
  stroke-dasharray: 40;
  stroke-dashoffset: 40;
  animation: celebration-draw 250ms var(--ease-out-expo) 250ms forwards;
}

@keyframes celebration-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  /* No drawing: the mark simply fades in. */
  .celebration-check__circle,
  .celebration-check__mark {
    stroke-dashoffset: 0;
    animation: celebration-fade 150ms ease forwards;
  }

  @keyframes celebration-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
</style>
