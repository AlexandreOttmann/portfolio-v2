import type { ChatMode } from './useSitePilot'
import type { ChatModelStep, ChatRequestBody, ChatRouteReason, ChatStreamEvent, ChatTrace, ChatUiPayload, ChatUsage, OniState } from '~~/shared/types/chat'
import { PRESET_QUESTIONS } from '~~/shared/presets'

export type ChatPart
  = | { type: 'text', text: string }
    | { type: 'tool', id: string, name: string, state: 'running' | 'done' | 'error', ui?: ChatUiPayload }

/** One bar of the glass box timeline. Times are ms since the question was sent. */
export type TraceStep
  = | { kind: 'model', id: string, step: ChatModelStep, startMs: number, endMs?: number, usage?: ChatUsage, stopReason?: string | null }
    | { kind: 'tool', id: string, name: string, startMs: number, endMs?: number, ok?: boolean, input?: string, output?: string }

/** Behind the scenes of an answer (glass box panel), measured in the browser from the stream. */
export interface MessageTrace {
  /** performance.now() when the question was sent. */
  startedAt: number
  firstTokenMs?: number
  totalMs?: number
  model?: string
  reason?: ChatRouteReason
  cached?: boolean
  steps: TraceStep[]
  usage?: ChatUsage
  cost?: number
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  parts: ChatPart[]
  /** Follow-up questions offered as buttons under the answer. */
  suggestions?: string[]
  trace?: MessageTrace
  timestamp: Date
}

export interface PresetQuestion {
  id: string
  question: string
  icon?: string
}

// Shared state
const messages = ref<Message[]>([])
const inputMessage = ref('')
// "Evaluate a job offer" mode: the next message is framed as an offer to match.
const offerMode = ref(false)
const isLoading = ref(false)
const showBubble = ref(false)
const hasInteracted = ref(false)
// Glass box panels under the answers: folded by default, one switch for all of them.
const showTrace = ref(false)

let abortController: AbortController | null = null

// Avatar: `speaking` while text streams in, plus short one-off reactions.
const speaking = ref(false)
const reaction = ref<OniState | null>(null)
let speakingTimer: ReturnType<typeof setTimeout> | null = null
let reactionTimer: ReturnType<typeof setTimeout> | null = null
let reactionAt = 0
const REACTION_MIN_MS = 600

function markSpeaking() {
  // A reaction (card, navigation) is seen for a moment, then the voice takes over.
  if (reaction.value && reaction.value !== 'error' && Date.now() - reactionAt > REACTION_MIN_MS) {
    reaction.value = null
  }
  speaking.value = true
  if (speakingTimer) clearTimeout(speakingTimer)
  // Pauses in the stream (tool calls, slow tokens) close the mouth.
  speakingTimer = setTimeout(() => (speaking.value = false), 350)
}

function react(state: OniState, ms: number) {
  reaction.value = state
  reactionAt = Date.now()
  if (reactionTimer) clearTimeout(reactionTimer)
  reactionTimer = setTimeout(() => (reaction.value = null), ms)
}

const avatarState = computed<OniState>(() => {
  if (reaction.value) return reaction.value
  if (isLoading.value) return speaking.value ? 'speaking' : 'thinking'
  if (inputMessage.value.trim()) return 'listening'
  return 'idle'
})

// Store timers for cleanup
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

// Maximum messages kept in memory and sent as history
const MAX_MESSAGES = 50
const MAX_HISTORY = 20
// Matches the server limit (a pasted job offer fits).
export const MAX_QUESTION_CHARS = 5800

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

/** Text-only view of a message, used as conversation history for the API. */
function toHistoryText(message: Message): string {
  return message.parts.map((part) => {
    if (part.type === 'text') return part.text
    if (part.ui?.type === 'projects') return `[Displayed project cards: ${part.ui.projects.map(p => p.name).join(', ')}]`
    if (part.ui?.type === 'article') return `[Displayed article card: ${part.ui.article.title}]`
    if (part.ui?.type === 'contact') return '[Displayed contact card]'
    if (part.ui?.type === 'site-action') return `[On the site: ${part.ui.action.label}]`
    if (part.ui?.type === 'job-match') return `[Displayed job match card: ${part.ui.match.role} — ${part.ui.match.verdict}, ${part.ui.match.met}/${part.ui.match.total} requirements met]`
    return ''
  }).filter(Boolean).join('\n').trim()
}

export const useAiChat = () => {
  const { locale } = useI18n()
  const pilot = useSitePilot()
  const { mode } = pilot

  const t = (fr: string, en: string) => locale.value === 'fr' ? fr : en

  // Preset questions (shared with the server, which caches their answers)
  const presetQuestions = computed<PresetQuestion[]>(() => PRESET_QUESTIONS.map(preset => ({
    id: preset.id,
    question: t(preset.fr, preset.en),
    icon: preset.icon,
  })))

  const welcomeBubbleMessage = computed(() => t(
    'Bonjour! Je suis Petit-Oni, l\'assistant d\'Alex! 👹',
    'Hello! I\'m Petit-Oni, Alex\'s assistant! 👹',
  ))

  // Check for first visit
  const initBubble = () => {
    let visited: string | null = null
    try {
      visited = localStorage.getItem('hasVisitedAiChat')
    }
    catch {
      // Storage unavailable (private mode): show the bubble.
    }
    if (!visited) {
      if (bubbleTimer) clearTimeout(bubbleTimer)
      bubbleTimer = setTimeout(() => {
        showBubble.value = true
        bubbleTimer = null
      }, 2000)
    }
  }

  const handleInteraction = () => {
    if (!hasInteracted.value) {
      hasInteracted.value = true
      showBubble.value = false
      try {
        localStorage.setItem('hasVisitedAiChat', 'true')
      }
      catch {
        // Ignore: purely cosmetic.
      }
    }
  }

  const scrollToBottom = () => {
    if (scrollTimer) clearTimeout(scrollTimer)

    scrollTimer = setTimeout(() => {
      nextTick(() => {
        const chatContainer = document.getElementById('chat-messages')
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight
        }
        scrollTimer = null
      })
    }, 0)
  }

  const applyTrace = (trace: MessageTrace, event: ChatTrace) => {
    const now = Math.round(performance.now() - trace.startedAt)
    switch (event.kind) {
      case 'route':
        trace.model = event.model
        trace.reason = event.reason
        trace.cached = event.cached
        break
      case 'model-start':
        trace.steps.push({ kind: 'model', id: `model-${event.step}`, step: event.step, startMs: now })
        break
      case 'model-end': {
        const step = trace.steps.find(s => s.id === `model-${event.step}`)
        if (step?.kind === 'model') Object.assign(step, { endMs: now, usage: event.usage, stopReason: event.stopReason })
        break
      }
      case 'tool-io': {
        const step = trace.steps.find(s => s.id === event.id)
        if (step?.kind === 'tool') Object.assign(step, { input: event.input, output: event.output })
        break
      }
      case 'usage':
        trace.usage = event.usage
        trace.cost = event.cost
        break
    }
  }

  /** Tool calls on the glass box timeline (visible ones and follow-up suggestions alike). */
  const traceTool = (trace: MessageTrace, event: Extract<ChatStreamEvent, { type: 'tool-start' | 'tool-end' }>) => {
    const now = Math.round(performance.now() - trace.startedAt)
    const step = trace.steps.find(s => s.id === event.id)
    if (event.type === 'tool-start') {
      if (!step) trace.steps.push({ kind: 'tool', id: event.id, name: event.name, startMs: now })
    }
    else if (step?.kind === 'tool') {
      Object.assign(step, { endMs: now, ok: event.ok })
    }
    else {
      trace.steps.push({ kind: 'tool', id: event.id, name: event.name, startMs: now, endMs: now, ok: event.ok })
    }
  }

  const applyEvent = (assistant: Message, event: ChatStreamEvent) => {
    const trace = assistant.trace
    if (trace) {
      if (event.type === 'text' && trace.firstTokenMs === undefined) trace.firstTokenMs = Math.round(performance.now() - trace.startedAt)
      if (event.type === 'tool-start' || event.type === 'tool-end') traceTool(trace, event)
      if (event.type === 'done') trace.totalMs = Math.round(performance.now() - trace.startedAt)
    }
    switch (event.type) {
      case 'trace':
        if (trace) applyTrace(trace, event.trace)
        break
      case 'text': {
        markSpeaking()
        const last = assistant.parts.at(-1)
        if (last?.type === 'text') last.text += event.delta
        else assistant.parts.push({ type: 'text', text: event.delta })
        break
      }
      case 'tool-start':
        // Suggestions are not a visible step of the answer.
        if (event.name === 'suggest_follow_ups') break
        assistant.parts.push({ type: 'tool', id: event.id, name: event.name, state: 'running' })
        break
      case 'tool-end': {
        if (event.ui?.type === 'suggestions') {
          assistant.suggestions = event.ui.questions
          break
        }
        const part = assistant.parts.find(p => p.type === 'tool' && p.id === event.id)
        if (part?.type === 'tool') {
          part.state = event.ok ? 'done' : 'error'
          part.ui = event.ui
        }
        else {
          assistant.parts.push({ type: 'tool', id: event.id, name: event.name, state: event.ok ? 'done' : 'error', ui: event.ui })
        }
        if (event.ui?.type === 'projects' || event.ui?.type === 'article' || event.ui?.type === 'contact' || event.ui?.type === 'job-match') react('showing', 1600)
        if (!event.ok) react('error', 1500)
        // The assistant drives the site: navigate, open a project, highlight.
        if (event.ui?.type === 'site-action') {
          react('navigating', 1800)
          pilot.run(event.ui.action).catch(error => console.error('Site action failed:', error))
        }
        break
      }
      case 'error':
        react('error', 2500)
        assistant.parts.push({ type: 'text', text: event.message })
        break
    }
  }

  const sendMessage = async (message: string) => {
    let content = message.trim()
    if (!content || isLoading.value) return
    if (content.length > MAX_QUESTION_CHARS) return

    const isJobOffer = offerMode.value
    if (offerMode.value) {
      content = `${t('Voici une offre d\'emploi : le profil d\'Alex correspond-il ?', 'Here is a job offer: is Alex a good fit?')}\n\n${content}`
      offerMode.value = false
    }

    // Open chat if closed (a docked or minimized chat stays where it is)
    if (mode.value === 'closed') {
      mode.value = 'open'
      handleInteraction()
      scrollToBottom()
    }

    const history = messages.value
      .slice(-MAX_HISTORY)
      .map(m => ({ role: m.role, content: toHistoryText(m) }))
      .filter(m => m.content)

    messages.value.push({ id: newId(), role: 'user', parts: [{ type: 'text', text: content }], timestamp: new Date() })
    messages.value.push({ id: newId(), role: 'assistant', parts: [], trace: { startedAt: performance.now(), steps: [] }, timestamp: new Date() })
    if (messages.value.length > MAX_MESSAGES) {
      messages.value = messages.value.slice(-MAX_MESSAGES)
    }
    // Go through the reactive array so mutations below trigger updates.
    const assistant = messages.value.at(-1)!

    inputMessage.value = ''
    isLoading.value = true
    abortController = new AbortController()

    const body: ChatRequestBody = {
      locale: locale.value === 'en' ? 'en' : 'fr',
      messages: [...history, { role: 'user', content }],
      ...(isJobOffer ? { intent: 'job-offer' as const } : {}),
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortController.signal,
      })

      if (!response.ok || !response.body) {
        const text = response.status === 429
          ? t('Vous envoyez beaucoup de messages ! Réessayez dans une minute.', 'You\'re sending a lot of messages! Try again in a minute.')
          : t('Désolé, je rencontre un problème technique. Réessayez plus tard.', 'Sorry, I\'m experiencing a technical issue. Please try again later.')
        assistant.parts.push({ type: 'text', text })
        react('error', 2500)
        return
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
      let buffer = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += value
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          try {
            applyEvent(assistant, JSON.parse(line) as ChatStreamEvent)
          }
          catch {
            // Ignore a malformed line rather than breaking the whole answer.
          }
        }
        scrollToBottom()
      }
    }
    catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Chat error:', error)
        react('error', 2500)
        assistant.parts.push({
          type: 'text',
          text: t('Désolé, je rencontre un problème technique. Réessayez plus tard.', 'Sorry, I\'m experiencing a technical issue. Please try again later.'),
        })
      }
    }
    finally {
      isLoading.value = false
      abortController = null
      if (assistant.trace && assistant.trace.totalMs === undefined) {
        assistant.trace.totalMs = Math.round(performance.now() - assistant.trace.startedAt)
      }
      // Drop an answer that never received anything (e.g. stopped immediately).
      if (assistant.parts.length === 0) {
        messages.value = messages.value.filter(m => m.id !== assistant.id)
      }
    }
  }

  const stop = () => {
    abortController?.abort()
  }

  const askPresetQuestion = (question: string) => {
    sendMessage(question)
  }

  /** Ask the visitor to paste a job offer (text or link) in the composer. */
  const startOfferMode = (prefill = '') => {
    offerMode.value = true
    if (prefill) inputMessage.value = prefill
    if (mode.value === 'closed') setMode('open')
    nextTick(() => document.querySelector<HTMLTextAreaElement>('#chat-composer textarea')?.focus())
  }

  const setMode = (next: ChatMode) => {
    handleInteraction()
    mode.value = next
    if (next === 'open' || next === 'docked') scrollToBottom()
  }

  const toggleChat = () => setMode(mode.value === 'closed' ? 'open' : 'closed')

  const handleKeyPress = (event: KeyboardEvent) => {
    // Enter sends, Shift+Enter adds a line (and never while composing an accented character).
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault()
      sendMessage(inputMessage.value)
    }
  }

  // Cleanup function for timers
  const cleanup = () => {
    if (bubbleTimer) {
      clearTimeout(bubbleTimer)
      bubbleTimer = null
    }
    if (scrollTimer) {
      clearTimeout(scrollTimer)
      scrollTimer = null
    }
  }

  return {
    messages,
    inputMessage,
    isLoading,
    showTrace,
    avatarState,
    mode,
    status: pilot.status,
    isDesktop: pilot.isDesktop,
    showBubble,
    hasInteracted,
    presetQuestions,
    welcomeBubbleMessage,
    renderMarkdown: renderSafeMarkdown,
    initBubble,
    handleInteraction,
    scrollToBottom,
    sendMessage,
    stop,
    askPresetQuestion,
    offerMode,
    startOfferMode,
    toggleChat,
    setMode,
    handleKeyPress,
    cleanup,
  }
}
