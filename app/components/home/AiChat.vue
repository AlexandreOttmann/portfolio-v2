<template>
  <div>
    <!-- Teleported to <body>: #__nuxt is an isolated stacking context, and the chat must stay above project dialogs (also portaled to <body>). -->
    <Teleport to="body">
      <!-- Backdrop: only when the chat is centered. Docked or minimized, the page stays sharp and usable. -->
      <Transition
        enter-active-class="transition-opacity duration-300"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-300"
        leave-to-class="opacity-0"
      >
        <div
          v-if="mode === 'open'"
          class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          @click="setMode('closed')"
        />
      </Transition>

      <!-- Chat window: one element whose geometry follows the mode, animated with a layout transition -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-8"
        leave-active-class="transition-all duration-200 ease-in"
        leave-to-class="opacity-0 translate-y-8"
      >
        <Motion
          v-if="mode !== 'closed'"
          layout
          :transition="{ type: 'spring', stiffness: 260, damping: 30 }"
          class="pointer-events-auto fixed z-[100] flex flex-col overflow-hidden border border-white/10 bg-card/70 shadow-2xl backdrop-blur-xl"
          :class="windowClass"
          role="dialog"
          :aria-label="locale === 'fr' ? 'Assistant Petit-Oni' : 'Petit-Oni assistant'"
        >
          <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div class="noise pointer-events-none absolute inset-[-200%] size-[400%] bg-[url('/noise.png')] opacity-[4%]" />
          </div>

          <!-- Minimized: what the assistant is doing, in one line -->
          <div
            v-if="mode === 'minimized'"
            class="relative flex items-center gap-3 p-2 pl-3"
          >
            <button
              class="flex min-w-0 flex-1 items-center gap-3 text-left"
              @click="setMode(isDesktop ? 'docked' : 'open')"
            >
              <span class="relative flex size-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5">
                <ChatPetitOniAvatar
                  :variant="avatarVariant"
                  :state="avatarState"
                  class="w-10"
                />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-medium text-white">Petit-Oni</span>
                <span class="block truncate text-xs text-white/60">{{ minimizedPreview }}</span>
              </span>
            </button>
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="lucide:chevron-up"
              :aria-label="locale === 'fr' ? 'Agrandir' : 'Expand'"
              @click="setMode(isDesktop ? 'docked' : 'open')"
            />
            <UButton
              variant="ghost"
              color="neutral"
              size="sm"
              icon="lucide:x"
              :aria-label="locale === 'fr' ? 'Fermer' : 'Close'"
              @click="setMode('closed')"
            />
          </div>

          <template v-else>
            <!-- Header -->
            <div class="relative p-3 sm:p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full border border-white/15 bg-white/5 flex items-center justify-center"
                >
                  <ChatPetitOniAvatar
                    :variant="avatarVariant"
                    :state="avatarState"
                    class="w-11"
                  />
                </div>
                <div class="min-w-0">
                  <h3 class="font-medium text-white">
                    Petit-Oni
                  </h3>
                  <p class="truncate text-xs text-white/50">
                    {{ isLoading && status ? status : (locale === 'fr' ? 'Assistant IA' : 'AI Assistant') }}
                  </p>
                </div>
              </div>
              <div class="flex items-center">
                <UButton
                  v-if="mode === 'docked'"
                  variant="ghost"
                  color="neutral"
                  icon="lucide:maximize-2"
                  :aria-label="locale === 'fr' ? 'Centrer' : 'Center'"
                  @click="setMode('open')"
                />
                <UButton
                  v-else-if="isDesktop"
                  variant="ghost"
                  color="neutral"
                  icon="lucide:panel-right"
                  :aria-label="locale === 'fr' ? 'Ancrer sur le côté' : 'Dock to the side'"
                  @click="setMode('docked')"
                />
                <UButton
                  variant="ghost"
                  color="neutral"
                  icon="lucide:minus"
                  :aria-label="locale === 'fr' ? 'Réduire' : 'Minimize'"
                  @click="setMode('minimized')"
                />
                <UButton
                  variant="ghost"
                  color="neutral"
                  icon="lucide:x"
                  :aria-label="locale === 'fr' ? 'Fermer' : 'Close'"
                  @click="setMode('closed')"
                />
              </div>
            </div>

            <!-- Messages Container -->
            <div
              id="chat-messages"
              class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
            >
              <!-- Preset Questions (Only show if no messages) -->
              <div
                v-if="messages.length === 0"
                class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4"
              >
                <div class="col-span-full text-center mb-4">
                  <ChatPetitOniAvatar
                    :variant="avatarVariant"
                    :state="avatarState"
                    class="mx-auto mb-3 w-24"
                  />
                  <p class="text-white/60 text-sm">
                    {{ locale === 'fr' ? 'Comment puis-je vous aider ?' : 'How can I help you today?' }}
                  </p>
                </div>
                <button
                  v-for="preset in presetQuestions"
                  :key="preset.id"
                  class="text-left p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 group flex flex-col gap-2"
                  @click="askPresetQuestion(preset.question)"
                >
                  <Icon
                    :name="preset.icon || 'lucide:help-circle'"
                    class="w-5 h-5 text-white/60 group-hover:text-white/90"
                  />
                  <span class="text-sm text-white/80 group-hover:text-white font-medium">{{ preset.question }}</span>
                </button>
              </div>

              <TransitionGroup
                name="message"
                tag="div"
                class="space-y-6"
              >
                <div
                  v-for="message in visibleMessages"
                  :key="message.id"
                  class="flex items-start gap-4 message-item"
                  :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
                >
                  <!-- Assistant Avatar -->
                  <div
                    v-if="message.role === 'assistant'"
                    class="flex items-center justify-center flex-shrink-0 w-9 h-9 rounded-full border border-white/15 bg-white/5 mt-1"
                  >
                    <ChatPetitOniAvatar
                      :variant="avatarVariant"
                      :animated="false"
                      class="w-8"
                    />
                  </div>

                  <!-- Message Content -->
                  <div
                    class="rounded-2xl px-5 py-3.5 message-bubble shadow-sm"
                    :class="message.role === 'user'
                      ? 'max-w-[85%] sm:max-w-[75%] bg-white text-black rounded-tr-sm'
                      : 'max-w-[90%] sm:max-w-[85%] bg-white/20 text-white/90 border border-white/10 rounded-tl-sm'"
                  >
                    <template v-if="message.role === 'assistant'">
                      <div class="flex flex-col gap-3">
                        <template
                          v-for="(part, index) in message.parts"
                          :key="index"
                        >
                          <!-- Rendered with marked + DOMPurify: LLM output is untrusted -->
                          <div
                            v-if="part.type === 'text'"
                            class="text-sm leading-relaxed markdown-content max-w-none"
                            v-html="renderMarkdown(part.text)"
                          />
                          <div
                            v-else-if="part.state === 'running'"
                            class="flex items-center gap-2 text-xs text-white/60"
                          >
                            <Icon
                              name="lucide:loader-circle"
                              class="size-3.5 animate-spin"
                            />
                            {{ toolLabel(part.name) }}
                          </div>
                          <ChatProjectCards
                            v-else-if="part.ui?.type === 'projects'"
                            :projects="part.ui.projects"
                          />
                          <ChatArticleCard
                            v-else-if="part.ui?.type === 'article'"
                            :article="part.ui.article"
                          />
                          <ChatContactCard v-else-if="part.ui?.type === 'contact'" />
                          <button
                            v-else-if="part.ui?.type === 'site-action'"
                            class="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70 transition-colors hover:border-white/30 hover:text-white"
                            :title="locale === 'fr' ? 'Rejouer' : 'Replay'"
                            @click="replay(part.ui.action)"
                          >
                            <Icon
                              name="lucide:navigation"
                              class="size-3.5"
                            />
                            {{ part.ui.action.label }}
                            <Icon
                              name="lucide:check"
                              class="size-3.5 text-emerald-400"
                            />
                          </button>
                        </template>
                      </div>
                    </template>
                    <p
                      v-else
                      class="text-sm leading-relaxed whitespace-pre-wrap font-medium"
                    >
                      {{ message.parts[0]?.type === 'text' ? message.parts[0].text : '' }}
                    </p>
                    <p class="text-[10px] mt-1.5 text-right opacity-50">
                      {{ message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}
                    </p>
                  </div>
                </div>
              </TransitionGroup>

              <!-- Loading indicator -->
              <div
                v-if="isLoading && !messages.at(-1)?.parts.length"
                class="flex items-start gap-4 justify-start"
              >
                <div class="flex-shrink-0 w-9 h-9 rounded-full border border-white/15 bg-white/5 mt-1 flex items-center justify-center">
                  <ChatPetitOniAvatar
                    :variant="avatarVariant"
                    state="thinking"
                    class="w-8"
                  />
                </div>
                <div class="bg-white/5 text-white/90 border border-white/10 rounded-2xl rounded-tl-sm px-5 py-4">
                  <div class="flex items-center gap-2">
                    <div class="flex space-x-1">
                      <div class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" />
                      <div
                        class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                        style="animation-delay: 0.1s"
                      />
                      <div
                        class="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"
                        style="animation-delay: 0.2s"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Input Area -->
            <div class="p-4 border-t border-white/10 bg-white/5">
              <div
                class="flex gap-3 items-center bg-black/20 rounded-full border border-white/10 px-2 py-2 focus-within:border-white/30 transition-colors"
              >
                <UInput
                  v-model="inputMessage"
                  :placeholder="locale === 'fr' ? 'Posez votre question...' : 'Ask your question...'"
                  class="flex-1 text-md"
                  variant="none"
                  :disabled="isLoading"
                  :ui="{ base: 'bg-transparent focus:ring-0 p-0 pl-2 placeholder:text-ui-bg' }"
                  @keypress="handleKeyPress"
                />
                <UButton
                  v-if="isLoading"
                  color="neutral"
                  variant="solid"
                  class="rounded-full w-8 h-8 flex items-center justify-center p-0"
                  :aria-label="locale === 'fr' ? 'Arrêter' : 'Stop'"
                  @click="stop"
                >
                  <Icon
                    name="lucide:square"
                    class="w-3.5 h-3.5 text-ui-bg"
                  />
                </UButton>
                <UButton
                  v-else
                  :disabled="!inputMessage.trim()"
                  color="neutral"
                  variant="solid"
                  class="rounded-full w-8 h-8 flex items-center justify-center p-0"
                  :aria-label="locale === 'fr' ? 'Envoyer' : 'Send'"
                  @click="sendMessage(inputMessage)"
                >
                  <Icon
                    name="lucide:arrow-up"
                    class="w-4 h-4 text-ui-bg"
                  />
                </UButton>
              </div>
            </div>
          </template>
        </Motion>
      </Transition>
    </Teleport>

    <!-- Bottom Bar (Always visible when chat is closed, hidden on mobile) -->
    <ClientOnly>
      <Transition
        enter-active-class="transition-all duration-500 ease-out delay-200"
        enter-from-class="opacity-0 translate-y-20"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-300 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-20"
      >
        <div
          v-if="mode === 'closed'"
          class="block fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-2 sm:px-"
        >
          <!-- Bubble Hint -->
          <Transition
            enter-active-class="transition-all duration-500 ease-out"
            enter-from-class="opacity-0 transform translate-y-4 scale-95"
            enter-to-class="opacity-100 transform translate-y-0 scale-100"
            leave-active-class="transition-all duration-300 ease-in"
            leave-from-class="opacity-100 transform translate-y-0 scale-100"
            leave-to-class="opacity-0 transform translate-y-4 scale-95"
          >
            <div
              v-if="showBubble"
              class="absolute bottom-full z-99 left-1/2 -translate-x-1/2 mb-4 w-64 bg-white text-black p-4 rounded-2xl rounded-b-sm shadow-xl text-center cursor-pointer"
              @click="toggleChat"
            >
              <div class="text-sm font-medium leading-snug">
                {{ welcomeBubbleMessage }}
              </div>
              <div class="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45" />
            </div>
          </Transition>

          <!-- Input Bar -->
          <div class="relative group ">
            <div
              class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rainbow-border"
            />
            <div
              class="relative bg-muted/70 backdrop-blur-xl border border-white/10 group-hover:border-transparent rounded-full p-1.5 pl-5 pr-1.5 flex items-center gap-3 shadow-2xl transition-all duration-300 hover:shadow-white/5 hover:scale-[1.02] cursor-text z-10"
              @click.stop="bottomInput?.focus()"
            >
              <ChatPetitOniAvatar
                :variant="avatarVariant"
                :state="avatarState"
                class="w-9 shrink-0"
              />
              <input
                ref="bottomInput"
                v-model="inputMessage"
                type="text"
                :placeholder="locale === 'fr' ? 'Demandez-moi quelque chose...' : 'Ask me anything...'"
                class="flex-1 bg-transparent border-none outline-none text-white text-md placeholder-inverted/40 h-10 group-hover:placeholder-white"
                @keydown.enter="sendMessage(inputMessage)"
              >

              <button
                class="flex items-center justify-center w-10 h-10 rounded-full bg-white text-black hover:bg-gray-200 transition-colors"
                @click.stop="inputMessage.trim() ? sendMessage(inputMessage) : toggleChat()"
              >
                <Icon
                  v-if="inputMessage.trim()"
                  name="lucide:arrow-up"
                  class="w-5 h-5"
                />
                <Icon
                  v-else
                  name="lucide:maximize-2"
                  class="w-4 h-4"
                />
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
  avatarState,
  mode,
  status,
  isDesktop,
  showBubble,
  presetQuestions,
  welcomeBubbleMessage,
  renderMarkdown,
  initBubble,
  sendMessage,
  stop,
  askPresetQuestion,
  toggleChat,
  setMode,
  handleKeyPress,
  cleanup,
} = useAiChat()

const { locale } = useI18n()
const bottomInput = ref<HTMLInputElement | null>(null)

const { run: replay } = useSitePilot()
const avatarVariant = useAppConfig().petitOni.variant

const windowClass = computed(() => {
  switch (mode.value) {
    case 'docked':
      return isDesktop.value
        ? 'top-20 bottom-4 right-4 left-[calc(100%-25rem-1rem)] rounded-2xl'
        : 'top-[52vh] bottom-2 left-2 right-2 rounded-2xl'
    case 'minimized':
      return isDesktop.value
        ? 'bottom-4 right-4 left-[calc(100%-20rem-1rem)] rounded-2xl'
        : 'bottom-2 left-2 right-2 rounded-2xl'
    default:
      return 'top-[8vh] bottom-[8vh] left-4 right-4 sm:left-[max(1rem,calc(50%-21rem))] sm:right-[max(1rem,calc(50%-21rem))] rounded-3xl'
  }
})

// Last thing the assistant did or said, for the minimized card.
const minimizedPreview = computed(() => {
  if (isLoading.value && status.value) return status.value
  const last = [...messages.value].reverse().find(m => m.role === 'assistant')
  const text = last?.parts.filter(p => p.type === 'text').map(p => p.text).join(' ') ?? ''
  return text.replace(/[*_#>`[\]]/g, '').replace(/\s+/g, ' ').trim() || (locale.value === 'fr' ? 'Je suis là si besoin 👹' : 'I\'m here if you need me 👹')
})

// Docked on desktop: push the page left so nothing hides behind the panel.
watchEffect(() => {
  if (!import.meta.client) return
  document.documentElement.toggleAttribute('data-chat-docked', mode.value === 'docked' && isDesktop.value)
})

// The assistant placeholder stays hidden until its first token arrives.
const visibleMessages = computed(() => messages.value.filter(m => m.parts.length > 0))

const toolLabels: Record<string, [string, string]> = {
  get_project_details: ['Ouverture du projet…', 'Opening the project…'],
  list_projects: ['Recherche des projets…', 'Looking up projects…'],
  get_article: ['Lecture de l\'article…', 'Reading the article…'],
  search_portfolio: ['Recherche dans le portfolio…', 'Searching the portfolio…'],
  show_contact_options: ['Préparation des contacts…', 'Getting contact options…'],
  show_on_site: ['Navigation sur le site…', 'Navigating the site…'],
  open_project_on_site: ['Ouverture du projet sur le site…', 'Opening the project on the site…'],
}
const toolLabel = (name: string) => {
  const [fr, en] = toolLabels[name] ?? ['Recherche…', 'Searching…']
  return locale.value === 'fr' ? fr : en
}

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
