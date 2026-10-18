// Nuxt Content picks its SQLite driver at build time and silently falls back to
// the native `better-sqlite3` binary when `node:sqlite` is missing. That binary
// fails to load on Vercel, so refuse to deploy rather than ship a broken chat.
if (process.env.VERCEL && !process.getBuiltinModule?.('node:sqlite')) {
  throw new Error(`Node ${process.version} has no built-in node:sqlite: set the Vercel project to Node.js 22.13+ (Settings > Build and Deployment > Node.js Version).`)
}

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
    experimental: {
      // Server-side queries (the AI chat) use Node's built-in `node:sqlite` (Node >= 22.5).
      // The default `better-sqlite3` native binary fails to load on Vercel
      // ("Module did not self-register"), which broke every server-side query.
      sqliteConnector: 'native',
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
      // Nitro's dev storage watches the whole rootDir, and its default
      // `**/node_modules/**` ignore never matches once a path has a dot segment
      // (`.claude/worktrees/*`, `.pnpm`): `nuxt dev` then watches every file in
      // node_modules and dies with EMFILE. Ignore these folders by absolute path.
      const rootDir = config.rootDir!
      config.devStorage ||= {}
      config.devStorage.root = {
        driver: 'fs',
        readOnly: true,
        base: rootDir,
        ignore: [
          '**/node_modules/**',
          '**/.git/**',
          ...['node_modules', '.git', '.claude', '.nuxt', '.output', '.data'].map(dir => `${rootDir}/${dir}`),
        ],
      }

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
