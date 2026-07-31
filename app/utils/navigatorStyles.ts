/**
 * Single source of truth for navigator pill states.
 *
 * NavigatorItem renders these; NavigatorHelp renders the legend from the same
 * constants. Previously the two were written out separately and had drifted —
 * the legend showed colours the pills never used in dark mode.
 */
export const NAVIGATOR_STATE_CLASSES = {
  evaluated: 'bg-primary/15 text-primary hover:bg-primary/25',
  pending: 'bg-elevated text-dimmed hover:bg-accented',
  current: 'ring-2 ring-primary ring-offset-2 ring-offset-[var(--ui-bg)]',
} as const
