/**
 * Contract between `server/api/chat.post.ts` and the chat widget.
 * The endpoint streams newline-delimited JSON, one `ChatStreamEvent` per line.
 */

export interface ChatProjectCard {
  slug: string
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

/** Payloads rendered as components instead of text. */
export type ChatUiPayload
  = | { type: 'projects', projects: ChatProjectCard[] }
    | { type: 'article', article: ChatArticleCard }
    | { type: 'contact' }

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
