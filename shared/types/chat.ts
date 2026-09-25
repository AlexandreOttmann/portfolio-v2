/**
 * Contract between `server/api/chat.post.ts` and the chat widget.
 * The endpoint streams newline-delimited JSON, one `ChatStreamEvent` per line.
 */

export interface ChatProjectCard {
  slug: string
  /** Nuxt Content stem of the project's data file, used to open it on the site. */
  stem: string
  name: string
  release: string
  summary: string
  stack: string[]
  image: string
  link: string
  featured: boolean
}

export interface ChatArticleCard {
  slug: string
  title: string
  description: string
  date: string
  image?: string
  path: string
  tags: string[]
}

/**
 * Pages the assistant can drive the visitor to, and the sections it can
 * highlight on each of them (matched by `data-pilot="<target>"` in the DOM).
 */
export const PILOT_PAGES = {
  'home': { path: '/', targets: ['timeline', 'featured-projects', 'socials', 'cv'] },
  'works': { path: '/works', targets: ['projects'] },
  'writing': { path: '/writing', targets: ['articles'] },
  'about': { path: '/about', targets: ['intro', 'experiences', 'stack'] },
  'contact': { path: '/contact', targets: ['contact-form'] },
  'red-wire': { path: '/red-wire', targets: [] },
} as const

export type PilotPage = keyof typeof PILOT_PAGES

/** Something the assistant does on the site, executed by the chat widget. */
export type ChatSiteAction
  = | { kind: 'navigate', page: PilotPage, target?: string, label: string }
    | { kind: 'open-project', stem: string, label: string }

/** Payloads rendered as components instead of text. */
export type ChatUiPayload
  = | { type: 'projects', projects: ChatProjectCard[] }
    | { type: 'article', article: ChatArticleCard }
    | { type: 'contact' }
    | { type: 'site-action', action: ChatSiteAction }

export type ChatStreamEvent
  = | { type: 'text', delta: string }
    | { type: 'tool-start', id: string, name: string }
    | { type: 'tool-end', id: string, name: string, ok: boolean, ui?: ChatUiPayload }
    | { type: 'error', message: string }
    | { type: 'done' }

/** What the widget sends: text-only history, the server rebuilds the rest. */
export interface ChatRequestBody {
  locale: 'fr' | 'en'
  messages: Array<{ role: 'user' | 'assistant', content: string }>
}
