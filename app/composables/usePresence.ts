import type { Collections } from '@nuxt/content'

/**
 * Live presence: who else is on the portfolio right now. Each visitor joins
 * one Supabase Realtime channel, anonymously:
 * - Presence tells who is here, on which page, and what they look at
 *   (`viewing`: `page:works`, `project:oniauction`, `article:yuzu`),
 * - Broadcast carries cursor positions (up to 20 a second, only while others
 *   are on the same page) and reactions (a 👹 floating to everyone).
 * Nothing is stored: no table, no cookie, a random id per tab.
 *
 * Without `NUXT_PUBLIC_SUPABASE_KEY`, `nuxt dev` falls back to a
 * BroadcastChannel between the tabs of the same browser, to try it locally.
 */

/**
 * A point on the page. Inside a `[data-pilot]` section: `a` is the section and
 * x, y are fractions of its box, so the point lands on the same thing whatever
 * the screen size. Elsewhere: x from the center of the screen, y from the top
 * of the page, in CSS pixels.
 */
export interface PresencePoint { a?: string, x: number, y: number }

export interface PeerState {
  id: string
  /** Index in GHOST_COLORS. */
  color: number
  /** Path without the locale, to match visitors on the same page in any language. */
  page: string
  viewing: string
}

export interface CursorMessage { id: string, page: string, point: PresencePoint }
export interface ReactionMessage { id: string, page: string, emoji: string, point?: PresencePoint }

interface Transport {
  track: (state: PeerState) => void
  send: (event: 'cursor' | 'react', payload: CursorMessage | ReactionMessage) => void
  close: () => void
}

interface TransportHandlers {
  onPeers: (peers: PeerState[]) => void
  onCursor: (message: CursorMessage) => void
  onReaction: (message: ReactionMessage) => void
}

export const GHOST_COLORS = ['#F75474', '#6E7BFF', '#3CD3C2', '#FFB347', '#C77DFF', '#7BE36F']
export const REACTION_EMOJI = '👹'

const CHANNEL = 'portfolio:live'
/** Cursor messages per second, by how many other visitors share the page (Realtime quotas). */
const CURSOR_INTERVAL_MS = (others: number) => (others <= 1 ? 50 : others <= 4 ? 100 : 200)
const REACTION_COOLDOWN_MS = 700
/** Petit-Oni mentions what others look at, but not too often. */
const NOTICE_COOLDOWN_MS = 30_000
const NOTICE_REPEAT_MS = 5 * 60_000
const VIEWING_RE = /^(page|project|article):[a-z0-9-]{1,60}$/

const id = import.meta.client && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
const myColor = Math.floor(Math.random() * GHOST_COLORS.length)

const connected = ref(false)
/** The other visitors. */
const peers = shallowRef<PeerState[]>([])
/** What the visitor looks at beyond the page (an open project dialog), set by the page. */
const focus = ref<string | null>(null)
/** Latest cursor of each visitor; read every frame by PresenceLayer, so not reactive. */
const cursors = new Map<string, { page: string, point: PresencePoint, at: number }>()
const reactionHook = createEventHook<ReactionMessage & { mine?: boolean }>()
/** Something Petit-Oni can say about the others (shown by the companion, or by the pill). */
const notice = ref<{ text: string, at: number } | null>(null)

let transport: Transport | null = null
let started = false
let lastReactionAt = 0

// Dev: a hot-reloaded module must not leave its old connection behind (a phantom visitor).
import.meta.hot?.dispose(() => transport?.close())

/** Page key without the locale: `/fr/works` and `/en/works` are the same page. */
export function pageOf(path: string) {
  return path.split('/').filter(Boolean).slice(1).join('/') || 'home'
}

function viewingOf(path: string) {
  const [section, slug] = pageOf(path).split('/')
  if (section === 'articles' && slug) return `article:${slug}`
  return `page:${section}`
}

export function projectSlug(stem: string) {
  // "fr/projects/12.oniauction/data" -> "oniauction", like the assistant's slugs.
  const dir = stem.split('/').at(-2) ?? stem
  return dir.replace(/^\d+\./, '').toLowerCase()
}

export function encodePoint(clientX: number, clientY: number): PresencePoint {
  const section = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>('[data-pilot]')
  if (section?.dataset.pilot) {
    const rect = section.getBoundingClientRect()
    if (rect.width && rect.height) {
      return { a: section.dataset.pilot, x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height }
    }
  }
  return { x: clientX - window.innerWidth / 2, y: clientY + window.scrollY }
}

/** Point to page coordinates (CSS pixels from the top left of the document), or null if its section is not here. */
export function decodePoint(point: PresencePoint): { x: number, y: number } | null {
  if (point.a) {
    const section = document.querySelector(`[data-pilot="${CSS.escape(point.a)}"]`)
    if (!section) return null
    const rect = section.getBoundingClientRect()
    return { x: rect.left + window.scrollX + point.x * rect.width, y: rect.top + window.scrollY + point.y * rect.height }
  }
  return { x: window.innerWidth / 2 + point.x, y: point.y }
}

const isPeer = (value: unknown): value is PeerState => {
  const peer = value as PeerState
  return !!peer && typeof peer.id === 'string' && typeof peer.page === 'string' && typeof peer.color === 'number'
    && typeof peer.viewing === 'string' && VIEWING_RE.test(peer.viewing)
}

const isPoint = (value: unknown): value is PresencePoint => {
  const point = value as PresencePoint
  return !!point && Number.isFinite(point.x) && Number.isFinite(point.y) && (point.a === undefined || typeof point.a === 'string')
}

async function supabaseTransport(url: string, key: string, me: PeerState, handlers: TransportHandlers): Promise<Transport> {
  const { createClient } = await import('@supabase/supabase-js')
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    realtime: { params: { eventsPerSecond: 25 } },
  })
  const channel = client.channel(CHANNEL, { config: { presence: { key: me.id }, broadcast: { self: false } } })
  let state = me
  channel
    .on('presence', { event: 'sync' }, () => {
      const all = Object.values(channel.presenceState()).map((metas): unknown => metas[0]).filter(isPeer)
      handlers.onPeers(all)
    })
    .on('broadcast', { event: 'cursor' }, ({ payload }) => handlers.onCursor(payload as CursorMessage))
    .on('broadcast', { event: 'react' }, ({ payload }) => handlers.onReaction(payload as ReactionMessage))
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        connected.value = true
        void channel.track(state)
      }
      else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        connected.value = false
      }
    })
  return {
    track(next) {
      state = next
      if (connected.value) void channel.track(next)
    },
    send(event, payload) {
      void channel.send({ type: 'broadcast', event, payload })
    },
    close() {
      void client.removeChannel(channel)
    },
  }
}

/** Dev only: the tabs of this browser play the other visitors. */
function localTransport(me: PeerState, handlers: TransportHandlers): Transport {
  const channel = new BroadcastChannel(CHANNEL)
  const seen = new Map<string, { state: PeerState, at: number }>()
  let state = me
  const publish = () => handlers.onPeers([state, ...[...seen.values()].map(entry => entry.state)])
  channel.onmessage = ({ data }) => {
    if (data.type === 'state' && isPeer(data.state)) {
      const known = seen.has(data.state.id)
      seen.set(data.state.id, { state: data.state, at: Date.now() })
      // Newcomers get our state right away.
      if (!known) channel.postMessage({ type: 'state', state })
      publish()
    }
    else if (data.type === 'bye') {
      seen.delete(data.id)
      publish()
    }
    else if (data.type === 'cursor') handlers.onCursor(data.payload)
    else if (data.type === 'react') handlers.onReaction(data.payload)
  }
  const heartbeat = setInterval(() => {
    channel.postMessage({ type: 'state', state })
    for (const [key, entry] of seen) if (Date.now() - entry.at > 8000) seen.delete(key)
    publish()
  }, 3000)
  channel.postMessage({ type: 'state', state })
  connected.value = true
  publish()
  return {
    track(next) {
      state = next
      channel.postMessage({ type: 'state', state })
      publish()
    },
    send(type, payload) {
      channel.postMessage({ type, payload })
    },
    close() {
      clearInterval(heartbeat)
      channel.postMessage({ type: 'bye', id: me.id })
      channel.close()
      connected.value = false
    },
  }
}

// Names of projects and articles, to say what the others look at.
let labels: Promise<Map<string, string>> | null = null
let labelsLocale = ''
function loadLabels(locale: 'fr' | 'en') {
  if (!labels || labelsLocale !== locale) {
    labelsLocale = locale
    labels = Promise.all([
      queryCollection(`projects_${locale}` as keyof Collections).select('name' as never, 'stem' as never).all(),
      queryCollection(`articles_${locale}` as keyof Collections).select('title' as never, 'path' as never).all(),
    ]).then(([projects, articles]) => new Map([
      ...(projects as unknown as Array<{ name: string, stem: string }>).map(p => [`project:${projectSlug(p.stem)}`, p.name] as const),
      ...(articles as unknown as Array<{ title: string, path: string }>).map(a => [`article:${a.path.split('/').pop()}`, a.title] as const),
    ])).catch(() => new Map())
  }
  return labels
}

export function usePresence() {
  const route = useRoute()
  const { locale } = useI18n()
  const config = useRuntimeConfig()
  /** Visitor's choice: no ghosts on screen, and their own cursor is not shared. Remembered. */
  const hidden = useLocalStorage('presence-hidden', false)

  const page = computed(() => pageOf(route.path))
  const viewing = computed(() => focus.value ?? viewingOf(route.path))
  const count = computed(() => peers.value.length + 1)
  const othersOnPage = computed(() => peers.value.filter(peer => peer.page === page.value).length)
  const lang = () => (locale.value === 'en' ? 'en' : 'fr')

  /** Labels of what the others look at (projects and articles only), for the assistant. */
  const othersViewing = computed(() => [...new Set(peers.value.map(peer => peer.viewing).filter(v => !v.startsWith('page:')))])

  /** Joins the channel; called once, by PresenceLive (client only). */
  function start() {
    if (started) return
    const url = config.public.supabaseUrl as string
    const key = config.public.supabaseKey as string
    if (!(url && key) && !import.meta.dev) return
    started = true

    const me = (): PeerState => ({ id, color: myColor, page: page.value, viewing: viewing.value })
    const lastViewing = new Map<string, string>()
    const noticed = new Map<string, number>()
    let lastNoticeAt = 0

    const handlers: TransportHandlers = {
      onPeers(all) {
        const others = all.filter(peer => peer.id !== id)
        for (const known of cursors.keys()) if (!others.some(peer => peer.id === known)) cursors.delete(known)
        peers.value = others
        for (const peer of others) {
          const before = lastViewing.get(peer.id)
          lastViewing.set(peer.id, peer.viewing)
          if (before !== peer.viewing && !peer.viewing.startsWith('page:')) void mention(peer.viewing)
        }
      },
      onCursor(message) {
        if (message?.id === id || typeof message?.page !== 'string' || !isPoint(message.point)) return
        cursors.set(message.id, { page: message.page, point: message.point, at: Date.now() })
      },
      onReaction(message) {
        if (message?.id === id || message?.emoji !== REACTION_EMOJI || (message.point && !isPoint(message.point))) return
        void reactionHook.trigger(message)
      },
    }

    /** Petit-Oni: "someone else is looking at Oni Auction right now". */
    async function mention(key: string) {
      const now = Date.now()
      if (now - lastNoticeAt < NOTICE_COOLDOWN_MS || now - (noticed.get(key) ?? -Infinity) < NOTICE_REPEAT_MS) return
      const label = (await loadLabels(lang())).get(key)
      if (!label) return
      lastNoticeAt = now
      noticed.set(key, now)
      const same = key === viewing.value
      const text = lang() === 'fr'
        ? same ? `Quelqu'un d'autre regarde aussi ${label} en ce moment 👀` : `Quelqu'un d'autre regarde ${label} en ce moment 👀`
        : same ? `Someone else is looking at ${label} too right now 👀` : `Someone else is looking at ${label} right now 👀`
      notice.value = { text, at: now }
    }

    const connect = async () => {
      try {
        transport = url && key
          ? await supabaseTransport(url, key, me(), handlers)
          : localTransport(me(), handlers)
      }
      catch (error) {
        console.warn('[presence] Realtime unavailable:', error)
      }
    }
    void connect()

    watch([page, viewing], () => transport?.track(me()))
    useEventListener(window, 'pagehide', () => transport?.close())

    // Cursor: sent while it moves (or the page scrolls under it), only if someone shares the page.
    let pointer: { x: number, y: number } | null = null
    let lastSentAt = 0
    let pending: ReturnType<typeof setTimeout> | undefined
    const sendCursor = () => {
      pending = undefined
      if (!pointer || !transport || hidden.value || !othersOnPage.value) return
      const wait = CURSOR_INTERVAL_MS(othersOnPage.value) - (Date.now() - lastSentAt)
      if (wait > 0) {
        pending = setTimeout(sendCursor, wait)
        return
      }
      lastSentAt = Date.now()
      transport.send('cursor', { id, page: page.value, point: encodePoint(pointer.x, pointer.y) })
    }
    useEventListener(window, 'pointermove', (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      pointer = { x: event.clientX, y: event.clientY }
      pending ??= setTimeout(sendCursor, 0)
    }, { passive: true })
    useEventListener(window, 'scroll', () => {
      if (pointer) pending ??= setTimeout(sendCursor, 0)
    }, { passive: true })
    useEventListener(document, 'pointerleave', () => (pointer = null))
  }

  /** Sends a 👹 to everyone, from the cursor's place on the page if given. */
  function react(from?: { x: number, y: number }) {
    const now = Date.now()
    if (now - lastReactionAt < REACTION_COOLDOWN_MS) return
    lastReactionAt = now
    const message: ReactionMessage = { id, page: page.value, emoji: REACTION_EMOJI, ...(from ? { point: encodePoint(from.x, from.y) } : {}) }
    transport?.send('react', message)
    void reactionHook.trigger({ ...message, mine: true })
  }

  return {
    id,
    connected: readonly(connected),
    peers,
    count,
    page,
    othersOnPage,
    othersViewing,
    focus,
    hidden,
    cursors,
    notice,
    onReaction: reactionHook.on,
    start,
    react,
  }
}
