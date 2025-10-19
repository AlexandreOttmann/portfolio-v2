<script setup lang="ts">
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

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isLoading = ref(false)
const showChat = ref(false)

// Preset questions based on the original FAQ content
const presetQuestions: PresetQuestion[] = [
  {
    id: 'services',
    question: locale.value === 'fr' ? 'Quels services proposez-vous?' : 'What services do you offer?',
    icon: 'lucide:briefcase',
  },
  {
    id: 'pricing',
    question: locale.value === 'fr' ? 'Combien coûte un projet?' : 'How much does a project cost?',
    icon: 'lucide:credit-card',
  },
  {
    id: 'timeline',
    question: locale.value === 'fr' ? 'Combien de temps dure un projet?' : 'How long does a project take?',
    icon: 'lucide:clock',
  },
  {
    id: 'hobbies',
    question: locale.value === 'fr' ? 'Quelles sont vos passions en dehors du travail?' : 'What are your hobbies outside of work?',
    icon: 'lucide:heart',
  },
]

// Add welcome message when chat opens
const addWelcomeMessage = () => {
  if (messages.value.length === 0) {
    messages.value.push({
      id: 'welcome',
      content: locale.value === 'fr'
        ? 'Bonjour! Je suis Petit-Oni, l\'assistant d\'Alex!  \n👹  Posez-moi des questions sur ses services, son expérience ou son portfolio!'
        : 'Hello! I\'m Petit-Oni, Alex\'s assistant!  \n👹  Ask me anything about his services, experience, or portfolio!',
      role: 'assistant',
      timestamp: new Date(),
    })
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
    addWelcomeMessage()
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
            :name="preset.icon"
            class="w-5 h-5 text-white/80"
          />
          <span class="text-sm font-medium text-left">{{ preset.question }}</span>
        </div>
      </UButton>
    </div>

    <!-- Chat Toggle Button -->
    <UButton
      variant="outline"
      color="white"
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
          <div
            v-for="message in messages"
            :key="message.id"
            class="flex items-start gap-3"
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
              class="max-w-[80%] rounded-2xl px-4 py-3"
              :class="message.role === 'user'
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/90 border border-white/10'"
            >
              <p class="text-sm leading-relaxed whitespace-pre-wrap">
                {{ message.content }}
              </p>
              <p class="text-xs text-white/50 mt-1">
                {{ message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>

            <!-- User Avatar (placeholder for future) -->
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
</style>
