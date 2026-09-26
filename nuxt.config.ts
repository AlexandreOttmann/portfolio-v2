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
    // Vercel BotID proxy rewrites (see app/plugins/botid.client.ts).
    'botid/nuxt',
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
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/onicon.png' },
        { rel: 'apple-touch-icon', href: '/onicon.png' },
      ],
    },
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
      // Petit-Oni animation gallery (/oni-lab): always on in dev, opt-in elsewhere.
      oniLab: false,
    },
  },

  routeRules: {
    // Needed to activate preview on Nuxt Studio
    '/': { prerender: false },
    // Dev tool, 404 unless NUXT_PUBLIC_ONI_LAB is set: never prerender nor index it.
    '/fr/oni-lab': { prerender: false, robots: false },
    '/en/oni-lab': { prerender: false, robots: false },
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
