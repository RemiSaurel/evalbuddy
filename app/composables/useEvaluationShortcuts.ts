interface ShortcutOptions {
  onSelectOption: (index: number) => void
  onConfirm: () => void
  onIncrement?: () => void
  onDecrement?: () => void
  optionCount: Ref<number>
  isScoreMode: Ref<boolean>
  enabled?: Ref<boolean>
}

/**
 * Keyboard shortcuts for fast evaluation using Nuxt UI's defineShortcuts.
 *
 * - 1-9: Select option by index (mastery/boolean)
 * - +/=: Increment score (only without meta/ctrl to preserve browser zoom)
 * - -: Decrement score (only without meta/ctrl to preserve browser zoom)
 * - Enter: Confirm evaluation
 */
export function useEvaluationShortcuts(options: ShortcutOptions) {
  const {
    onSelectOption,
    onConfirm,
    onIncrement,
    onDecrement,
    optionCount,
    isScoreMode,
    enabled = ref(true),
  } = options

  // Number keys 1-9 for option selection
  for (let i = 1; i <= 9; i++) {
    defineShortcuts({
      [String(i)]: () => {
        if (!enabled.value || isScoreMode.value)
          return
        if (i - 1 < optionCount.value)
          onSelectOption(i - 1)
      },
    })
  }

  // Enter to confirm
  defineShortcuts({
    enter: () => {
      if (enabled.value)
        onConfirm()
    },
  })

  // +/= and - for score adjustment — use raw keydown to check meta/ctrl
  // so we don't intercept Cmd+/- (browser zoom)
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (!enabled.value || !isScoreMode.value)
      return
    if (e.metaKey || e.ctrlKey)
      return

    const activeEl = document.activeElement
    if (activeEl) {
      const tag = activeEl.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || (activeEl as HTMLElement).isContentEditable)
        return
    }

    if ((e.key === '+' || e.key === '=') && onIncrement) {
      e.preventDefault()
      onIncrement()
    }
    else if (e.key === '-' && onDecrement) {
      e.preventDefault()
      onDecrement()
    }
  })
}
