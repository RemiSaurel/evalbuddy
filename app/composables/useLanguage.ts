import type { Locale } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'

interface LanguageType {
  label: string
  value: Locale
}

export function useLanguage() {
  const { setLocale } = useI18n()

  const languages: LanguageType[] = [
    { label: 'FR', value: 'fr' },
    { label: 'EN', value: 'en' },
  ]

  const languageValue = useLocalStorage<Locale>('selectedLanguage', 'fr')

  watch(languageValue, (newValue) => {
    setLocale(newValue)
  }, { immediate: true })

  return {
    languages,
    languageValue,
  }
}
