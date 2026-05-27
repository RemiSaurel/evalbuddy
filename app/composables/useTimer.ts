import type { Ref } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'

export function useTimer(enabled: Ref<boolean>) {
  const elapsed = ref(0)

  let startTime = 0
  let accumulated = 0
  let interval: ReturnType<typeof setInterval> | null = null
  const running = ref(false)

  const sync = () => {
    elapsed.value = interval
      ? accumulated + (Date.now() - startTime)
      : accumulated

    return elapsed.value
  }

  const tick = () => {
    sync()
  }

  const startInterval = () => {
    if (interval)
      return

    startTime = Date.now()

    interval = setInterval(() => {
      tick()
    }, 1000)
    running.value = true
  }

  const pause = () => {
    if (!interval)
      return

    sync()

    clearInterval(interval)
    interval = null

    accumulated = elapsed.value
    running.value = false
  }

  const resume = () => {
    if (interval)
      return

    startInterval()
  }

  const formatted = computed(() => {
    const total = Math.floor(elapsed.value / 1000)

    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60

    return [hours, minutes, seconds]
      .map(v => String(v).padStart(2, '0'))
      .join(':')
  })

  watch(enabled, (isEnabled) => {
    if (isEnabled) {
      resume()
    }
    else {
      pause()
    }
  }, { immediate: true })

  const stop = () => {
    const wasRunning = interval !== null

    if (interval) {
      sync()
      clearInterval(interval)
      interval = null
    }
    running.value = false

    elapsed.value = wasRunning ? elapsed.value : accumulated
  }

  const setElapsed = (value: number) => {
    const wasRunning = interval !== null

    if (wasRunning)
      pause()

    elapsed.value = value
    accumulated = value

    if (wasRunning)
      resume()
  }

  onUnmounted(() => {
    stop()
  })

  return { elapsed, setElapsed, formatted, pause, resume, running, sync }
}
