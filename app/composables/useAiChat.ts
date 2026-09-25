import type { ChatMode } from './useSitePilot'
import type { ChatRequestBody, ChatStreamEvent, ChatUiPayload, OniState } from '~~/shared/types/chat'

export type ChatPart
  = | { type: 'text', text: string }
    | { type: 'tool', id: string, name: string, state: 'running' | 'done' | 'error', ui?: ChatUiPayload }

export interface Message {
  id: string
  role: 'user' | 'assistant'
  parts: ChatPart[]
  /** Follow-up questions offered as buttons under the answer. */
  suggestions?: string[]
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
const isLoading = ref(false)
const showBubble = ref(false)
const hasInteracted = ref(false)

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

const newId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`

/** Text-only view of a message, used as conversation history for the API. */
function toHistoryText(message: Message): string {
  return message.parts.map((part) => {
    if (part.type === 'text') return part.text
    if (part.ui?.type === 'projects') return `[Displayed project cards: ${part.ui.projects.map(p => p.name).join(', ')}]`
    if (part.ui?.type === 'article') return `[Displayed article card: ${part.ui.article.title}]`
    if (part.ui?.type === 'contact') return '[Displayed contact card]'
    if (part.ui?.type === 'site-action') return `[On the site: ${part.ui.action.label}]`
    return ''
  }).filter(Boolean).join('\n').trim()
}

export const useAiChat = () => {
  const { locale } = useI18n()
  const pilot = useSitePilot()
  const { mode } = pilot

  const t = (fr: string, en: string) => locale.value === 'fr' ? fr : en

  // Preset questions
  const presetQuestions = computed<PresetQuestion[]>(() => [
    {
      id: 'tech-stack',
      question: t('Quelle est sa stack technique principale ?', 'What is his main tech stack?'),
      icon: 'lucide:code',
    },
    {
      id: 'projects',
      question: t('Montre-moi ses projets IA et temps réel', 'Show me his AI and realtime projects'),
      icon: 'lucide:folder-kanban',
    },
    {
      id: 'current-work',
      question: t('Sur quoi travaille-t-il en ce moment ?', 'What is he working on right now?'),
      icon: 'lucide:briefcase',
    },
    {
      id: 'hire',
      question: t('Comment travailler avec Alex ?', 'How can I work with Alex?'),
      icon: 'lucide:handshake',
    },
  ])

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

  const applyEvent = (assistant: Message, event: ChatStreamEvent) => {
    switch (event.type) {
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
        if (event.ui?.type === 'projects' || event.ui?.type === 'article' || event.ui?.type === 'contact') react('showing', 1600)
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
    const content = message.trim()
    if (!content || isLoading.value) return

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
    messages.value.push({ id: newId(), role: 'assistant', parts: [], timestamp: new Date() })
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

  const setMode = (next: ChatMode) => {
    handleInteraction()
    mode.value = next
    if (next === 'open' || next === 'docked') scrollToBottom()
  }

  const toggleChat = () => setMode(mode.value === 'closed' ? 'open' : 'closed')

  const handleKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
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
    toggleChat,
    setMode,
    handleKeyPress,
    cleanup,
  }
}
