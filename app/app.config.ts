export default defineAppConfig({
  ui: {
    colors: {
      primary: 'indigo',
      neutral: 'slate',
    },

    // Press feedback on every button. Pointer-only — :active never fires
    // for the keyboard grading path, which must stay instant.
    button: {
      slots: {
        base: 'transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.98] active:duration-100',
      },
      defaultVariants: {
        size: 'sm',
      },
    },

    modal: {
      slots: {
        title: 'text-highlighted font-semibold',
        footer: 'flex items-center gap-2 p-4 sm:px-6 justify-end',
      },
    },
  },
})
