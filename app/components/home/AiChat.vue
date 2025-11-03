<script setup lang="ts">
import { marked } from 'marked'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface PresetQuestion {
  id: string
  question: string
  icon?: string
}

const { locale } = useI18n()

// Configure marked for safe rendering
marked.setOptions({
  breaks: true, // Convert line breaks to <br>
  gfm: true, // GitHub Flavored Markdown
})

// Function to render markdown to HTML
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  return marked.parse(text) as string
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const showChat = ref(false)

// Preset questions based on Alex's background and work
const presetQuestions: PresetQuestion[] = [
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
]

// Add welcome message when chat opens
const addWelcomeMessage = () => {
  if (messages.value.length === 0) {
    // Add a delay before showing the welcome message
    setTimeout(() => {
      messages.value.push({
        id: 'welcome',
        content: locale.value === 'fr'
          ? 'Bonjour! Je suis Petit-Oni, l\'assistant d\'Alex!  \n👹  Posez-moi des questions sur ses services, son expérience ou son portfolio!'
          : 'Hello! I\'m Petit-Oni, Alex\'s assistant!  \n👹  Ask me anything about his services, experience, or portfolio!',
        role: 'assistant',
        timestamp: new Date(),
      })
    }, 200) // 800ms delay after chat opens
  }
}

const sendMessage = async (message: string) => {
  if (!message.trim() || isLoading.value) return

  // Add user message
  const userMessage: Message = {
    id: Date.now().toString(),
    content: message,
    role: 'user',
    timestamp: new Date(),
  }
  messages.value.push(userMessage)

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
  toggleChat(true)
  sendMessage(question)
}

const toggleChat = (isAskPreset: boolean) => {
  if (isAskPreset && showChat.value) {
    return
  }
  showChat.value = !showChat.value
  if (showChat.value) {
    setTimeout(() => {
      scrollToBottom()
      addWelcomeMessage()
    }, 500)
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    const chatContainer = document.getElementById('chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
}

// Scroll to bottom when new messages are added
watch(messages, () => {
  scrollToBottom()
}, { deep: true })

// Handle enter key press
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage(inputMessage.value)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center space-y-8 w-full sm:px-20 md:px-30">
    <div class="flex flex-col items-center justify-center gap-2">
      <h3 class="font-newsreader italic text-white-shadow text-4xl">
        {{ locale === 'fr' ? 'Parlez avec Petit-Oni' : 'Chat with Petit-Oni' }}
      </h3>
      <p class="text-center text-sm font-medium text-muted">
        {{ locale === 'fr' ? 'Mon assistant IA peut répondre à vos questions sur mon travail et mon expérience' : 'My AI assistant can answer questions about my work and experience' }}
      </p>
    </div>

    <!-- Preset Questions -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
      <UButton
        v-for="preset in presetQuestions"
        :key="preset.id"
        variant="outline"
        color="neutral"
        size="lg"
        class="justify-start h-auto p-4 border-white/20 hover:border-white/40 transition-all duration-200"
        @click="askPresetQuestion(preset.question)"
      >
        <div class="flex items-center gap-3">
          <Icon
            :name="preset.icon || 'lucide:help-circle'"
            class="w-5 h-5 text-white/80"
          />
          <span class="text-sm font-medium text-left">{{ preset.question }}</span>
        </div>
      </UButton>
    </div>

    <!-- Chat Toggle Button -->
    <UButton
      variant="outline"
      color="neutral"
      size="xl"
      class="border-white/20 hover:border-white/40 transition-all duration-200"
      @click="toggleChat(false)"
    >
      <div class="flex items-center gap-3">
        <Icon
          name="lucide:message-circle"
          class="w-6 h-6"
        />
        <span class="font-medium">
          {{ showChat ? (locale === 'fr' ? 'Fermer le chat' : 'Close Chat') : (locale === 'fr' ? 'Parler avec Petit-Oni' : 'Chat with Petit-Oni') }}
        </span>
      </div>
    </UButton>

    <!-- Chat Interface -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 transform scale-95 translate-y-4"
      enter-to-class="opacity-100 transform scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 transform scale-100 translate-y-0"
      leave-to-class="opacity-0 transform scale-95 translate-y-4"
    >
      <div
        v-if="showChat"
        class="w-full max-w-2xl bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 space-y-4"
      >
        <!-- Messages Container -->
        <div
          id="chat-messages"
          class="h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
        >
          <TransitionGroup
            name="message"
            tag="div"
            class="space-y-4"
          >
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex items-start gap-3 message-item"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <!-- Assistant Avatar -->
              <div
                v-if="message.role === 'assistant'"
                class="flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-full overflow-hidden border-2 border-white/20"
              >
                <img
                  src="/onicon-dark.png"
                  alt="Petit-Oni"
                  height="26"
                  width="26"
                >
              </div>

              <!-- Message Content -->
              <div
                class="max-w-[80%] rounded-2xl px-4 py-3 message-bubble"
                :class="message.role === 'user'
                  ? 'bg-white/10 text-white'
                  : 'bg-white/5 text-white/90 border border-white/10'"
              >
                <div
                  v-if="message.role === 'assistant'"
                  class="text-sm leading-relaxed markdown-content max-w-none"
                  v-html="renderMarkdown(message.content)"
                />
                <p
                  v-else
                  class="text-sm leading-relaxed whitespace-pre-wrap"
                >
                  {{ message.content }}
                </p>
                <p class="text-xs text-white/50 mt-1">
                  {{ message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>

              <!-- User Avatar -->
              <div
                v-if="message.role === 'user'"
                class="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center"
              >
                <Icon
                  name="lucide:user"
                  class="w-4 h-4 text-white/70"
                />
              </div>
            </div>
          </TransitionGroup>

          <!-- Loading indicator -->
          <div
            v-if="isLoading"
            class="flex items-start gap-3 justify-start"
          >
            <!-- Petit-Oni Avatar -->
            <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border-2 border-white/20">
              <img
                src="/onicon-dark.png"
                alt="Petit-Oni"
                class="w-full h-full object-cover"
              >
            </div>

            <!-- Loading Message -->
            <div class="bg-white/5 text-white/90 border border-white/10 rounded-2xl px-4 py-3">
              <div class="flex items-center gap-2">
                <div class="flex space-x-1">
                  <div class="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                  <div
                    class="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style="animation-delay: 0.1s"
                  />
                  <div
                    class="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                    style="animation-delay: 0.2s"
                  />
                </div>
                <span class="text-sm text-white/70">
                  {{ locale === 'fr' ? 'Petit-Oni réfléchit...' : 'Petit-Oni is thinking...' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="flex gap-2">
          <UInput
            v-model="inputMessage"
            :placeholder="locale === 'fr' ? 'Posez votre question...' : 'Ask your question...'"
            class="flex-1"
            :disabled="isLoading"
            @keypress="handleKeyPress"
          />
          <UButton
            :disabled="!inputMessage.trim() || isLoading"
            class="px-6"
            @click="sendMessage(inputMessage)"
          >
            <Icon
              name="lucide:send"
              class="w-4 h-4"
            />
          </UButton>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

.scrollbar-track-transparent::-webkit-scrollbar-track {
  background-color: transparent;
}

.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
}

/* Message animations */
.message-enter-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.message-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.message-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Staggered animation for multiple messages */
.message-item:nth-child(1) .message-bubble {
  animation-delay: 0ms;
}

.message-item:nth-child(2) .message-bubble {
  animation-delay: 100ms;
}

.message-item:nth-child(3) .message-bubble {
  animation-delay: 200ms;
}

.message-item:nth-child(4) .message-bubble {
  animation-delay: 300ms;
}

/* Bounce effect for assistant messages */
.message-item:has(.message-bubble:not(.bg-white\/10)) .message-bubble {
  animation: messageBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes messageBounce {
  0% {
    transform: translateY(20px) scale(0.9);
    opacity: 0;
  }
  50% {
    transform: translateY(-5px) scale(1.02);
    opacity: 0.8;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Slide in from right for user messages */
.message-item:has(.message-bubble.bg-white\/10) .message-bubble {
  animation: slideInRight 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

@keyframes slideInRight {
  0% {
    transform: translateX(30px) scale(0.95);
    opacity: 0;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* Markdown content styling */
.markdown-content :deep(p) {
  margin: 0.5em 0;
}

.markdown-content :deep(p:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: inherit;
}

.markdown-content :deep(ol),
.markdown-content :deep(ul) {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.markdown-content :deep(li) {
  margin: 0.25em 0;
}

.markdown-content :deep(a) {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.markdown-content :deep(a:hover) {
  color: white;
  text-decoration-color: rgba(255, 255, 255, 0.8);
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  margin: 0.75em 0 0.5em;
  color: inherit;
}

.markdown-content :deep(h1:first-child),
.markdown-content :deep(h2:first-child),
.markdown-content :deep(h3:first-child),
.markdown-content :deep(h4:first-child),
.markdown-content :deep(h5:first-child),
.markdown-content :deep(h6:first-child) {
  margin-top: 0;
}
</style>
