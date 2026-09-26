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

export type JobMatchVerdict = 'excellent' | 'good' | 'partial' | 'low'

/** Alex's profile checked against a job offer, requirement by requirement. */
export interface ChatJobMatch {
  role: string
  company?: string
  /** Computed from the requirement statuses, not chosen by the model. */
  verdict: JobMatchVerdict
  met: number
  partial: number
  total: number
  summary: string
  requirements: Array<{
    requirement: string
    status: 'met' | 'partial' | 'gap'
    evidence: string
    projects: Array<{ slug: string, name: string, stem: string }>
  }>
}

/** Payloads rendered as components instead of text. */
export type ChatUiPayload
  = | { type: 'projects', projects: ChatProjectCard[] }
    | { type: 'article', article: ChatArticleCard }
    | { type: 'contact' }
    | { type: 'site-action', action: ChatSiteAction }
    | { type: 'suggestions', questions: string[] }
    | { type: 'job-match', match: ChatJobMatch }

export type ChatStreamEvent
  = | { type: 'text', delta: string }
    | { type: 'tool-start', id: string, name: string }
    | { type: 'tool-end', id: string, name: string, ok: boolean, ui?: ChatUiPayload }
    | { type: 'error', message: string }
    | { type: 'done' }

/** What the Petit-Oni avatar is doing, derived from the stream and the input. */
export type OniState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'showing' | 'navigating' | 'error'

/** What the widget sends: text-only history, the server rebuilds the rest. */
export interface ChatRequestBody {
  locale: 'fr' | 'en'
  /** Sent in "Évaluer une offre d'emploi" mode: the server uses the matcher model. */
  intent?: 'job-offer'
  messages: Array<{ role: 'user' | 'assistant', content: string }>
}
