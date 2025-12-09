<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import * as locales from '@nuxt/ui/locale'

const color = useColorMode()
const isDark = computed(() => color.value === 'dark')
const { locale } = useI18n()
const route = useRoute()
console.log(route)
</script>

<template>
  <Html :lang="locale"
    class="font-geist text-[var(--ui-text)] transition-colors duration-300 selection:bg-white/60 selection:text-zinc-800">

  <Body>
    <LayoutScrollToTop />
    <UApp :locale="locales[locale]" :tooltip="{ delayDuration: 0 }" class="relative">
      <NuxtLayout>
        <NuxtPage />
        <HomeAiChat />
      </NuxtLayout>
    </UApp>
    <Toaster close-button />

    <div class="fixed inset-0 -z-10 pointer-events-none">
      <div v-if="!route.path.includes('works')"
        class="pointer-events-none fixed inset-0 z-40 size-full overflow-hidden">
        <div
          class="noise pointer-events-none absolute inset-[-200%] z-50 size-[400%] bg-[url('/noise.png')] opacity-[3%]" />
      </div>
      <DotPattern class="absolute inset-0 size-full"
        :class="isDark ? 'fill-white/10 [mask-image:radial-gradient(white,transparent_85%)]' : 'rainbow-spotlight [mask-image:radial-gradient(white,transparent_85%)]'" />
      <MarqueeBg v-if="!route.path.includes('works')"
        class="absolute bottom-0 top-200 left-0 h-[50vh] w-full opacity-50 [mask-image:linear-gradient(to_bottom,transparent,black)]" />
    </div>
  </Body>

  </Html>
</template>
<style scoped>
@keyframes rainbow-rotate {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.rainbow-spotlight {
  background: linear-gradient(90deg,
      #ff0080,
      #ff8c00,
      #40e0d0,
      #4169e1,
      #9370db,
      #ff1493,
      #ff0080);
  background-size: 200% 100%;
  animation: rainbow-rotate 10s linear infinite;
  opacity: 0.3;
}
</style>