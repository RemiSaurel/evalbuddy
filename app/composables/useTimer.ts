import type { Ref } from 'vue'
import { useWindowFocus } from '@vueuse/core'
import { computed, onUnmounted, ref, watch } from 'vue'

export function useTimer(enabled: Ref<boolean>) {
  const elapsed = ref(0)

  const isFocused = useWindowFocus()

  let startTime = 0
  let accumulated = 0
  let interval: ReturnType<typeof setInterval> | null = null

  const tick = () => {
    elapsed.value = accumulated + (Date.now() - startTime)
  }

  const startInterval = () => {
    if (interval)
      return

    startTime = Date.now()

    interval = setInterval(() => {
      tick()
    }, 1000)
  }

  const pause = () => {
    if (!interval)
      return

    clearInterval(interval)
    interval = null

    accumulated += Date.now() - startTime
  }

  const resume = () => {
    if (interval)
      return

    startInterval()
  }

  // auto pause/resume based on the window focus
  watch(isFocused, (focused) => {
    if (!enabled.value) {
      return
    }

    if (focused) {
      resume()
    }
    else {
      pause()
    }
  })

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
      clearInterval(interval)
      interval = null
    }

    elapsed.value = wasRunning ? accumulated + (Date.now() - startTime) : accumulated
  }

  const setElapsed = (value: number) => {
    elapsed.value = value
    accumulated = value
    startTime = Date.now()
  }

  onUnmounted(() => {
    stop()
  })

  return { elapsed, setElapsed, formatted }
}
