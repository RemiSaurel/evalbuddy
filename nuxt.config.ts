// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: '🧑‍🏫 EvalBuddy',
    },
  },
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],

  fonts: {
    families: [
      { name: 'Instrument Sans', provider: 'google' },
    ],
  },

  css: [
    '~/assets/css/main.css',
    'katex/dist/katex.min.css',
  ],

  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: '2024-11-27',
  i18n: {
    strategy: 'no_prefix',
    locales: [
      { code: 'en', iso: 'en-US', file: 'en.json' },
      { code: 'fr', iso: 'fr-FR', file: 'fr.json' },
    ],
    defaultLocale: 'fr',
  },

  ui: {
    colorMode: false,
  },

  ssr: false,
})
