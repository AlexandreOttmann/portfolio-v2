export default defineAppConfig({
  global: {
    meetingLink: 'https://cal.com/petit-oni/15and30min',
    available: true,
  },
  profile: {
    name: 'Alexandre Ottmann',
    job: 'Full Stack Developer',
    email: 'ottmann.alexandre@gmail.com',
    phone: '(+33) 6 31 87 08 76',
    picture: 'https://github.com/AlexandreOttmann/Dev-Portfolio/blob/main/public/images/alex.jpg?raw=true',
  },
  socials: {
    github: 'https://github.com/AlexandreOttmann',
    linkedin: 'https://www.linkedin.com/in/alexandre-ottmann/',
    instagram: 'https://www.instagram.com/alex.ottmann/',
    spotify: 'https://open.spotify.com/user/1133492538?si=6da7f4c7a2fa485f',
  },
  seo: {
    title: 'Portfolio Alexandre Ottmann',
    description: 'Portfolio of Alexandre Ottmann, fullstack developer and analyst',
    url: 'https://alexottmann.com',
  },
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'neutral',
    },
    notifications: {
      position: 'top-0 bottom-auto',
    },
    notification: {
      progress: {
        base: 'absolute bottom-0 end-0 start-0 h-0',
        background: 'bg-transparent dark:bg-transparent',
      },
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
      defaultVariants: {
        color: 'neutral',
      },
    },
    input: {
      defaultVariants: {
        color: 'neutral',
      },
    },
    textarea: {
      defaultVariants: {
        color: 'neutral',
      },
    },
    icons: {
      loading: 'lucide:loader',
    },
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
})
