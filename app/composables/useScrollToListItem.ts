/**
 * Scroll into view to a specific item in a v-for list
 *
 * @param container - The element that holds the list items
 * @param itemIndex - The index of the item to scroll into view
 */
export function useScrollToListItem(
  container: Ref<HTMLElement | undefined>,
  itemIndex: number,
) {
  if (!container.value) {
    return
  }

  const item = container.value.children[itemIndex] as HTMLElement
  if (!item) {
    return
  }

  item.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center', // for better centering
  })
}
