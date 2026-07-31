/** Below this gap between calls, scrolling snaps instead of animating. */
const RAPID_CALL_MS = 250

/**
 * Auto-scrolling for the navigator strips.
 *
 * Arrow keys are the primary navigation in this app, and holding one fires far
 * faster than a smooth scroll can settle. Browsers cancel and restart each
 * overlapping smooth scroll, which reads as stutter. So calls are coalesced
 * into a single frame, and rapid ones snap (`behavior: 'auto'`) instead —
 * holding an arrow gives instant tracking, a single press still animates.
 */
export function useScrollToListItem() {
  const reducedMotion = usePreferredReducedMotion()

  let frame = 0
  let lastCallAt = 0

  /**
   * Scroll a specific item of a v-for list into view.
   *
   * @param container - The element that holds the list items
   * @param itemIndex - The index of the item to scroll into view
   */
  const scrollToItem = (
    container: Ref<HTMLElement | undefined>,
    itemIndex: number,
  ) => {
    const now = performance.now()
    const isRapid = now - lastCallAt < RAPID_CALL_MS
    lastCallAt = now

    // Only the last request in a frame survives — no queue of competing scrolls.
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      const item = container.value?.children[itemIndex] as HTMLElement | undefined
      if (!item)
        return

      item.scrollIntoView({
        behavior: (isRapid || reducedMotion.value === 'reduce') ? 'auto' : 'smooth',
        block: 'nearest',
        inline: 'center',
      })
    })
  }

  return { scrollToItem }
}
