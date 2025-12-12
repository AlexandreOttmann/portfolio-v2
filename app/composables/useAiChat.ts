import { marked } from 'marked'

export interface Message {
    id: string
    content: string
    role: 'user' | 'assistant'
    timestamp: Date
}

export interface PresetQuestion {
    id: string
    question: string
    icon?: string
}

// Configure marked for safe rendering
marked.setOptions({
    breaks: true,
    gfm: true,
})

// Shared state
const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const showChat = ref(false)
const showBubble = ref(false)
const hasInteracted = ref(false)

// Store timers for cleanup
let bubbleTimer: ReturnType<typeof setTimeout> | null = null
let scrollTimer: ReturnType<typeof setTimeout> | null = null

// Maximum messages to keep in memory (prevent unbounded growth)
const MAX_MESSAGES = 50

export const useAiChat = () => {
    const { locale } = useI18n()

    // Function to render markdown to HTML
    const renderMarkdown = (text: string): string => {
        if (!text) return ''
        return marked.parse(text) as string
    }

    // Preset questions
    const presetQuestions = computed<PresetQuestion[]>(() => [
        {
            id: 'tech-stack',
            question: locale.value === 'fr' ? 'Quelle est votre stack technique principale?' : 'What is your main tech stack?',
            icon: 'lucide:code',
        },
        {
            id: 'education',
            question: locale.value === 'fr' ? 'Quel est votre parcours scolaire ?' : 'What is your educational background?',
            icon: 'lucide:graduation-cap',
        },
        {
            id: 'current-work',
            question: locale.value === 'fr' ? 'Sur quoi travaillez-vous actuellement?' : 'What are you currently working on?',
            icon: 'lucide:briefcase',
        },
        {
            id: 'projects',
            question: locale.value === 'fr' ? 'Parlez-moi de vos derniers projets' : 'Tell me about your recent projects',
            icon: 'lucide:folder-kanban',
        },
    ])

    const welcomeBubbleMessage = computed(() => {
        return locale.value === 'fr'
            ? "Bonjour! Je suis Petit-Oni, l'assistant d'Alex! 👹"
            : "Hello! I'm Petit-Oni, Alex's assistant! 👹"
    })

    // Check for first visit
    const initBubble = () => {
        const visited = localStorage.getItem('hasVisitedAiChat')
        if (!visited) {
            // Clear any existing timer
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
            localStorage.setItem('hasVisitedAiChat', 'true')
        }
    }

    const scrollToBottom = () => {
        // Clear any existing scroll timer
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

    const sendMessage = async (message: string) => {
        if (!message.trim() || isLoading.value) return

        // Open chat if closed
        if (!showChat.value) {
            showChat.value = true
            handleInteraction()
            scrollToBottom()
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            content: message,
            role: 'user',
            timestamp: new Date(),
        }
        messages.value.push(userMessage)

        // Limit message history to prevent memory issues
        if (messages.value.length > MAX_MESSAGES) {
            messages.value = messages.value.slice(-MAX_MESSAGES)
        }

        // Clear input
        inputMessage.value = ''

        // Show loading state
        isLoading.value = true

        try {
            const { response } = await $fetch('/api/chat', {
                method: 'POST',
                body: { message, locale: locale.value },
            })
            console.log(response)
            // Add assistant response
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: response,
                role: 'assistant',
                timestamp: new Date(),
            }
            messages.value.push(assistantMessage)

            // Limit message history again
            if (messages.value.length > MAX_MESSAGES) {
                messages.value = messages.value.slice(-MAX_MESSAGES)
            }
        }
        catch (error) {
            console.error('Chat error:', error)
            // Add error message
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: locale.value === 'fr'
                    ? 'Désolé, je rencontre un problème technique. Veuillez réessayer plus tard.'
                    : 'Sorry, I\'m experiencing a technical issue. Please try again later.',
                role: 'assistant',
                timestamp: new Date(),
            }
            messages.value.push(errorMessage)
        }
        finally {
            isLoading.value = false
        }
    }

    const askPresetQuestion = (question: string) => {
        console.log(question)
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
        renderMarkdown,
        initBubble,
        handleInteraction,
        scrollToBottom,
        sendMessage,
        askPresetQuestion,
        toggleChat,
        handleKeyPress,
        cleanup,
    }
}
