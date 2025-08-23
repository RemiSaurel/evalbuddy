import type { Locale } from 'vue-i18n'

interface LanguageType {
  label: string
  emoji: string
  value: Locale
}

export function useLanguage() {
  const { setLocale } = useI18n()

  const languages: LanguageType[] = [
    { label: 'Français', emoji: '🇫🇷', value: 'fr' },
    { label: 'English', emoji: '🇬🇧', value: 'en' },
  ]

  const languageValue = useState<Locale>('languageValue', () => {
    return (localStorage.getItem('selectedLanguage') as Locale) || 'fr'
  })

  watch(languageValue, (newValue) => {
    localStorage.setItem('selectedLanguage', newValue)
    setLocale(newValue)
  }, { immediate: true })

  return {
    languages,
    languageValue,
  }
}
