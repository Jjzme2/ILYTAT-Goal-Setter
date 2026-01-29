// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-27',
  devtools: { enabled: false },

  devServer: {
    port: 4000
  },


  experimental: {
    appManifest: false
  },

  // SEO and App Metadata
  app: {
    head: {
      title: 'ILYTAT Goals - Track Your Daily, Weekly & Monthly Goals',
      titleTemplate: '%s | ILYTAT Goals',
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        {
          name: 'description',
          content: 'Track your daily, weekly, monthly, quarterly, and yearly goals with ILYTAT Goals. Build streaks, earn achievements, and stay on top of your objectives.'
        },
        { name: 'theme-color', content: '#0f0f1a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'ILYTAT Goals' },
        // Open Graph
        { property: 'og:type', content: 'website' },
        { property: 'og:title', content: 'ILYTAT Goals - Goal Tracking Made Simple' },
        { property: 'og:description', content: 'Track daily, weekly, monthly, quarterly, and yearly goals. Build streaks and earn achievements.' },
        { property: 'og:site_name', content: 'ILYTAT Goals' },
        // Twitter
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'ILYTAT Goals' },
        { name: 'twitter:description', content: 'Track your goals across all timeframes. Build streaks. Stay motivated.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/manifest.json' }
      ]
    }
  },

  // Runtime config - Nuxt auto-maps NUXT_PUBLIC_* env vars
  // No need for explicit process.env references
  runtimeConfig: {
    public: {
      firebaseApiKey: '',
      firebaseAuthDomain: '',
      firebaseProjectId: '',
      firebaseStorageBucket: '',
      firebaseMessagingSenderId: '',
      firebaseAppId: ''
    }
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ]
})
