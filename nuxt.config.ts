// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: '🧑‍🏫 Evalbuddy',
    },
  },
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxtjs/i18n',
    '@vueuse/nuxt',
  ],

  css: ['~/assets/css/main.css'],

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
