<script setup lang="ts">
import { Toaster } from 'vue-sonner'
import * as locales from '@nuxt/ui/locale'

const color = useColorMode()
const isDark = computed(() => color.value === 'dark')
const { locale } = useI18n()
const route = useRoute()

// WebGL glass on desktop only: phones get the CSS fallback (GPU cost, and no hover to lean to).
const finePointer = useMediaQuery('(hover: hover) and (pointer: fine)')
const plasmaEnabled = computed(() =>
  finePointer.value && !PLASMA_EXCLUDED_ROUTES.some(r => route.path.includes(r)),
)
const ground = ref<{ canvas: HTMLCanvasElement | null }>()
const plasmaGround = computed(() => ground.value?.canvas ?? null)
</script>

<template>
  <Html
    :lang="locale"
    class="font-geist text-[var(--ui-text)] transition-colors duration-300 selection:bg-white/60 selection:text-zinc-800"
  >
    <Body>
      <LayoutScrollToTop />
      <UApp
        :locale="locales[locale]"
        :tooltip="{ delayDuration: 0 }"
        class="relative"
      >
        <PlasmaProvider
          v-bind="PLASMA_SOLID"
          :enabled="plasmaEnabled"
          :theme="isDark ? 'dark' : 'light'"
          ground="clear"
          :background="plasmaGround"
          quiet-pointer-on-scroll
        >
          <NuxtLayout>
            <NuxtPage />
            <HomeAiChat />
          </NuxtLayout>
        </PlasmaProvider>
      </UApp>
      <Toaster close-button />

      <!-- Page color, image marquee and dot grid: one canvas, also what the glass refracts -->
      <PageGround
        ref="ground"
        :is-dark="isDark"
        :marquee="!route.path.includes('works')"
      />
      <div
        v-if="!route.path.includes('works')"
        class="pointer-events-none fixed inset-0 -z-10 size-full overflow-hidden"
      >
        <div
          class="noise pointer-events-none absolute inset-[-200%] z-50 size-[400%] bg-[url('/noise.png')] opacity-[3%]"
        />
      </div>
    </Body>
  </Html>
</template>
