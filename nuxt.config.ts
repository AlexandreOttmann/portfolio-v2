export default defineNuxtConfig({
  modules: [
    'motion-v/nuxt',
    '@vueuse/nuxt',
    '@nuxt/ui',
    '@nuxtjs/i18n',
    '@nuxtjs/seo',
    '@nuxt/content',
    '@nuxt/image',
    '@nuxt/scripts',
    'vue-sonner/nuxt',
  ],

  imports: {
    presets: [
      {
        from: 'vue-sonner',
        imports: ['toast'],
      },
    ],
  },

  devtools: {
    enabled: true,
  },

  css: ['~/assets/style/main.css'],

  site: {
    url: 'https://alexottmann.com',
    defaultLocale: 'fr',
    indexable: true,
  },

  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },

  content: {
    preview: {
      api: 'https://api.nuxt.studio',
      dev: true,
    },
  },

  mdc: {
    highlight: {
      theme: {
        dark: 'github-dark',
        default: 'github-dark',
        light: 'github-light',
      },
    },
  },

  runtimeConfig: {
    public: {
      resend: !!process.env.NUXT_PRIVATE_RESEND_API_KEY,
    },
  },

  routeRules: {
    // Needed to activate preview on Nuxt Studio
    '/': { prerender: false },
  },

  experimental: {
    viewTransition: true,
  },

  compatibilityDate: '2025-01-05',

  nitro: {
    experimental: {
      websocket: true,
    },
    prerender: {
      autoSubfolderIndex: false,
      crawlLinks: true,
      routes: ['/en', '/fr'],
    },
  },

  hooks: {
    'nitro:config': (config) => {
      if (process.env.NUXT_PRIVATE_RESEND_API_KEY) {
        config.handlers?.push({
          method: 'post',
          route: '/api/emails/send',
          handler: '~~/server/emails/send.ts',
        })
      }
    },
    // Copy content files to server/assets during build
    // 'nitro:build:before': async () => {
    //   const { copyContentFiles } = await import('./server/utils/copy-content-files')
    //   const { resolve } = await import('path')

    //   const contentDir = resolve('./content')
    //   const targetDir = resolve('./server/assets/content')

    //   // Specify which directories/files to copy
    //   // You can customize this list based on your needs
    //   const dirsToCopy = [
    //     'en',           // English content
    //     'fr',           // French content
    //     'ai-context.md', // AI context file
    //     'stack.json',   // Stack data
    //   ]

    //   await copyContentFiles(contentDir, targetDir, dirsToCopy)
    // },
  },

  i18n: {
    locales: [
      { code: 'fr', name: 'French', language: 'fr-FR' },
      { code: 'en', name: 'English', language: 'en-US' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
    },
    strategy: 'prefix',
    defaultLocale: 'fr',
  },

  icon: {
    customCollections: [
      {
        prefix: 'custom',
        dir: './app/assets/icons',
      },
    ],
    clientBundle: {
      scan: true,
      includeCustomCollections: true,
    },
    provider: 'iconify',
  },
  ogImage: {
    zeroRuntime: true,
  },
})
