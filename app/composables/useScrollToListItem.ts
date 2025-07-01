/**
 * Composable for handling scroll to list items in navigation components
 */
export function useScrollToListItem() {
  /**
   * Scroll into view to a specific item in a v-for list
   *
   * @param container - The element that holds the list items
   * @param itemIndex - The index of the item to scroll into view
   */
  const scrollToItem = (
    container: Ref<HTMLElement | undefined>,
    itemIndex: number,
  ) => {
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

  /**
   * Scroll to active question in navigation based on evaluation mode
   *
   * @param isSingleEvaluation - Whether it's single evaluation mode
   * @param questionContainer - Container for individual questions
   * @param groupContainer - Container for question groups
   * @param questionIndex - Index of the current question
   * @param currentQuestionGroup - Current question group data
   * @param groupedQuestions - All grouped questions
   */
  const scrollToActiveQuestion = (
    isSingleEvaluation: boolean,
    questionContainer: Ref<HTMLElement | undefined>,
    groupContainer: Ref<HTMLElement | undefined>,
    questionIndex: number,
    currentQuestionGroup: any[],
    groupedQuestions: { [key: string]: any[] },
  ) => {
    if (isSingleEvaluation) {
      // For single evaluation mode, scroll in the questions container
      scrollToItem(questionContainer, questionIndex)
    }
    else {
      // For grouped evaluations, scroll to the current group
      const currentGroup = currentQuestionGroup[0]?.questionID
      if (currentGroup) {
        const groupNames = Object.keys(groupedQuestions)
        const groupIndex = groupNames.indexOf(currentGroup)
        if (groupIndex >= 0) {
          scrollToItem(groupContainer, groupIndex)
        }
      }
    }
  }

  return {
    scrollToItem,
    scrollToActiveQuestion,
  }
}
