import type { ChatRequestBody, ChatStreamEvent, ChatUiPayload } from '~~/shared/types/chat'

export type ChatPart
  = | { type: 'text', text: string }
    | { type: 'tool', id: string, name: string, state: 'running' | 'done' | 'error', ui?: ChatUiPayload }

export interface Message {
  id: string
  role: 'user' | 'assistant'
  parts: ChatPart[]
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
const showChat = ref(false)
const showBubble = ref(false)
const hasInteracted = ref(false)

let abortController: AbortController | null = null

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
    return ''
  }).filter(Boolean).join('\n').trim()
}

export const useAiChat = () => {
  const { locale } = useI18n()

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
        const last = assistant.parts.at(-1)
        if (last?.type === 'text') last.text += event.delta
        else assistant.parts.push({ type: 'text', text: event.delta })
        break
      }
      case 'tool-start':
        assistant.parts.push({ type: 'tool', id: event.id, name: event.name, state: 'running' })
        break
      case 'tool-end': {
        const part = assistant.parts.find(p => p.type === 'tool' && p.id === event.id)
        if (part?.type === 'tool') {
          part.state = event.ok ? 'done' : 'error'
          part.ui = event.ui
        }
        else {
          assistant.parts.push({ type: 'tool', id: event.id, name: event.name, state: event.ok ? 'done' : 'error', ui: event.ui })
        }
        break
      }
      case 'error':
        assistant.parts.push({ type: 'text', text: event.message })
        break
    }
  }

  const sendMessage = async (message: string) => {
    const content = message.trim()
    if (!content || isLoading.value) return

    // Open chat if closed
    if (!showChat.value) {
      showChat.value = true
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

  const toggleChat = () => {
    handleInteraction()
    showChat.value = !showChat.value
    if (showChat.value) {
      scrollToBottom()
    }
  }

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
    showChat,
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
    handleKeyPress,
    cleanup,
  }
}
