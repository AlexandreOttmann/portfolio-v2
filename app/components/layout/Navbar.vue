<script lang="ts" setup>
defineProps({
  isText: {
    type: Boolean,
    default: false,
  },
})

const navigation = getNavigation('home') as Record<string, Navigation>

const route = useRoute()
const localePath = useLocalePath()

// AI Chat integration
const {
  inputMessage,
  showChat,
  sendMessage,
  toggleChat,
} = useAiChat()

const { locale } = useI18n()
</script>

<template>
  <div class="mx-auto my-2 flex w-full flex items-center justify-center">
    <header class="rounded-full w-full flex items-center justify-center">
      <SpotlightButton rounded transparent :animate="false" class="border border-white/10">
        <nav
          class="z-10 flex flex-col sm:flex-row h-auto sm:h-[45px] justify-around gap-2  transition-all duration-300 ease-in-out sm:pb-0 pb-1 mx-8 mt-1 mb-1  sm:m-0">
          <!-- Navigation Icons Row -->
          <div
            class="flex h-[50px] sm:h-[45px] justify-around gap-2 sm:hover:gap-4 transition-all duration-300 ease-in-out">
            <NuxtLink v-for="item in navigation" :id="item.name.toLowerCase()" :key="item.name"
              :aria-label="item.name + ' navigation link'" :class="[
                localePath(item.to) === route.path
                  ? 'border border-white/5 bg-zinc-900/10 text-white/75 shadow-2xl shadow-white/50 backdrop-blur-3xl text-shadow-sm'
                  : 'text-muted',
              ]" :to="localePath(item.to)"
              class="flex items-center rounded-full border border-transparent px-4 py-1 transition-all duration-300 ease-in-out hover:border-white/5 hover:bg-zinc-900/50 hover:backdrop-blur-3xl sm:px-6">
              <UIcon :name="item.icon" class="size-7 font-light sm:size-6" />
            </NuxtLink>
            <ColorModeButton />
          </div>

          <!-- AI Chat Input (Mobile Only) -->
          <ClientOnly>
            <div v-if="!showChat" class="sm:hidden w-full px-2">
              <div class="relative group">
                <!-- Rainbow border wrapper -->
                <div
                  class="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 rainbow-border" />

                <div
                  class="relative bg-neutral-900/80 backdrop-blur-xl border border-white/10 group-hover:border-transparent rounded-full p-1.5 pl-4 pr-1.5 flex items-center gap-2 shadow-xl transition-all duration-300 cursor-text z-10"
                  @click="toggleChat">

                  <Icon name="lucide:sparkles"
                    class="w-4 h-4 text-white/40 group-hover:text-white/80 transition-colors flex-shrink-0" />

                  <input v-model="inputMessage" type="text"
                    :placeholder="locale === 'fr' ? 'Demandez-moi quelque chose...' : 'Ask me anything...'"
                    class="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-white/40 sm:h-8 h-4 "
                    @keydown.enter="sendMessage(inputMessage)" @click.stop />

                  <button
                    class="flex items-center justify-center w-8 h-8 rounded-full bg-white text-black hover:bg-gray-200 transition-colors flex-shrink-0"
                    @click.stop="inputMessage.trim() ? sendMessage(inputMessage) : toggleChat()">
                    <Icon v-if="inputMessage.trim()" name="lucide:arrow-up" class="w-4 h-4" />
                    <Icon v-else name="lucide:maximize-2" class="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </ClientOnly>
        </nav>
      </SpotlightButton>
    </header>
  </div>
</template>

<style scoped>
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
  /* -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); */
  /* -webkit-mask-composite: xor; */
  /* mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0); */
  mask-composite: exclude;
}
</style>
