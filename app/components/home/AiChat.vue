<template>
  <div>
    <!-- Chat Modal (Centered) -->
    <Transition enter-active-class="transition-all duration-300 ease-out" enter-from-class="opacity-0 translate-y-8"
      enter-to-class="opacity-100 translate-y-0" leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0" leave-to-class="opacity-0 translate-y-8">
      <div v-if="showChat" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="toggleChat" />

        <!-- Modal Card -->
        <div
          class="relative w-full max-w-2xl h-[80vh] bg-neutral-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-full overflow-hidden border border-white/20 bg-black/40 flex items-center justify-center">
                <img src="/onicon-dark.png" alt="Petit-Oni" class="w-7 h-7 object-cover">
              </div>
              <div>
                <h3 class="font-medium text-white">
                  Petit-Oni
                </h3>
                <p class="text-xs text-white/50">
                  {{ locale === 'fr' ? 'Assistant IA' : 'AI Assistant' }}
                </p>
              </div>
            </div>
            <UButton variant="ghost" color="neutral" icon="lucide:x" @click="toggleChat" />
          </div>

          <!-- Messages Container -->
          <div id="chat-messages"
            class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            <!-- Preset Questions (Only show if no messages) -->
            <div v-if="messages.length === 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div class="col-span-full text-center mb-4">
                <div
                  class="inline-flex items-center justify-center size-10 rounded-full border border-white/5 bg-zinc-900/10 text-white/75 shadow-2xl shadow-white/50 backdrop-blur-3xl">
                  <Icon name="lucide:sparkles" class="size-5 sm:size-6 text-white" />
                </div>
                <p class="text-white/60 text-sm">
                  {{ locale === 'fr' ? 'Comment puis-je vous aider ?' : 'How can I help you today?' }}
                </p>
              </div>
              <button v-for="preset in presetQuestions" :key="preset.id"
                class="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 group flex flex-col gap-2"
                @click="askPresetQuestion(preset.question)">
                <Icon :name="preset.icon || 'lucide:help-circle'"
                  class="w-5 h-5 text-white/60 group-hover:text-white/90" />
                <span class="text-sm text-white/80 group-hover:text-white font-medium">{{ preset.question }}</span>
              </button>
            </div>

            <TransitionGroup name="message" tag="div" class="space-y-6">
              <div v-for="message in messages" :key="message.id" class="flex items-start gap-4 message-item"
                :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
                <!-- Assistant Avatar -->
                <div v-if="message.role === 'assistant'"
                  class="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-black/40 mt-1">
                  <img src="/onicon-dark.png" alt="Petit-Oni" height="24" width="24">
                </div>

                <!-- Message Content -->
                <div class="max-w-[85%] sm:max-w-[75%] rounded-2xl px-5 py-3.5 message-bubble shadow-sm" :class="message.role === 'user'
                  ? 'bg-white text-black rounded-tr-sm'
                  : 'bg-white/10 text-white/90 border border-white/10 rounded-tl-sm'">
                  <div v-if="message.role === 'assistant'" class="text-sm leading-relaxed markdown-content max-w-none"
                    v-html="renderMarkdown(message.content)" />
                  <p v-else class="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {{ message.content }}
                  </p>
                  <p class="text-[10px] mt-1.5 text-right opacity-50">
                    {{ message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                  </p>
                </div>
              </div>
            </TransitionGroup>

            <!-- Loading indicator -->
            <div v-if="isLoading" class="flex items-start gap-4 justify-start">
              <div class="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden border border-white/20 bg-black/40 mt-1">
                <img src="/onicon-dark.png" alt="Petit-Oni" class="w-full h-full object-cover">
              </div>
              <div class="bg-white/5 text-white/90 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
                <div class="flex items-center gap-2">
                  <div class="flex space-x-1">
                    <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                    <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                    <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style="animation-delay: 0.2s" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input Area -->
          <div class="p-4 border-t border-white/10 bg-white/5">
            <div
              class="flex gap-3 items-center bg-black/20 rounded-full border border-white/10 px-2 py-2 focus-within:border-white/30 transition-colors">
              <UInput v-model="inputMessage"
                :placeholder="locale === 'fr' ? 'Posez votre question...' : 'Ask your question...'"
                class="flex-1 text-md" variant="none" :disabled="isLoading"
                :ui="{ base: 'bg-transparent focus:ring-0 p-0 pl-2' }" @keypress="handleKeyPress" />
              <UButton :disabled="!inputMessage.trim() || isLoading" color="neutral" variant="solid"
                class="rounded-full w-8 h-8 flex items-center justify-center p-0" @click="sendMessage(inputMessage)">
                <Icon name="lucide:arrow-up" class="w-4 h-4 text-black" />
              </UButton>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Bottom Bar (Always visible when chat is closed, hidden on mobile) -->
    <ClientOnly>
      <Transition enter-active-class="transition-all duration-500 ease-out delay-200"
        enter-from-class="opacity-0 translate-y-20" enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300 ease-in" leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-20">
        <div v-if="!showChat" class="block fixed bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-2 sm:px-5">
          <!-- Bubble Hint -->
          <Transition enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 transform translate-y-4 scale-95"
            enter-to-class="opacity-100 transform translate-y-0 scale-100"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 transform translate-y-0 scale-100"
            leave-to-class="opacity-0 transform translate-y-4 scale-95">
            <div v-if="showBubble"
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-64 bg-white text-black p-4 rounded-2xl rounded-b-sm shadow-xl text-center cursor-pointer"
              @click="toggleChat">
              <div class="text-sm font-medium leading-snug">
                {{ welcomeBubbleMessage }}
              </div>
              <div class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
            </div>
          </Transition>

          <!-- Input Bar -->
          <div class="relative group">
            <div
              class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rainbow-border" />
            <div
              class="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 group-hover:border-transparent rounded-full p-1.5 pl-5 pr-1.5 flex items-center gap-3 shadow-2xl transition-all duration-300 hover:shadow-white/5 hover:scale-[1.02] cursor-text z-10"
              @click.stop="bottomInput?.focus()">

              <Icon name="lucide:sparkles" class="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors" />
              <input ref="bottomInput" v-model="inputMessage" type="text"
                :placeholder="locale === 'fr' ? 'Demandez-moi quelque chose...' : 'Ask me anything...'"
                class="flex-1 bg-transparent border-none outline-none text-white text-md placeholder-white/40 h-10"
                @keydown.enter="sendMessage(inputMessage)" />

              <button
                class="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                @click.stop="inputMessage.trim() ? sendMessage(inputMessage) : toggleChat()">
                <Icon v-if="inputMessage.trim()" name="lucide:arrow-up" class="w-5 h-5" />
                <Icon v-else name="lucide:maximize-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </ClientOnly>
  </div>
</template>
<script setup lang="ts">
const {
  messages,
  inputMessage,
  isLoading,
  showChat,
  showBubble,
  presetQuestions,
  welcomeBubbleMessage,
  renderMarkdown,
  initBubble,
  sendMessage,
  askPresetQuestion,
  toggleChat,
  handleKeyPress,
  cleanup,
} = useAiChat()

const { locale } = useI18n()
const bottomInput = ref<HTMLInputElement | null>(null)

// Initialize bubble on mount
onMounted(() => {
  initBubble()
})

// Cleanup timers on unmount
onUnmounted(() => {
  cleanup()
})

// Scroll to bottom when new messages are added
watch(messages, () => {
  nextTick(() => {
    const chatContainer = document.getElementById('chat-messages')
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight
    }
  })
}, { deep: true })
</script>

<style scoped>
.scrollbar-thin {
  scrollbar-width: thin;
}

.scrollbar-thumb-white\/20::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
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
  color: inherit;
  text-decoration: underline;
  text-decoration-color: rgba(255, 255, 255, 0.4);
  transition: all 0.2s ease;
}

.markdown-content :deep(a:hover) {
  text-decoration-color: currentColor;
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

.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 12px;
  margin: 0.75em 0;
  display: block;
}

/* Rainbow border animation */
@keyframes rainbow-rotate {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.rainbow-border {
  background: linear-gradient(90deg,
      #ff0080,
      #ff8c00,
      #40e0d0,
      #4169e1,
      #9370db,
      #ff1493,
      #ff0080);
  background-size: 200% 100%;
  animation: rainbow-rotate 3s linear infinite;
  padding: 2px;

  mask-composite: exclude;
}
</style>
