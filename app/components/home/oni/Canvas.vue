<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { NeutralToneMapping } from 'three'
import type { OniState } from '~~/shared/types/chat'
import { ONI_PALETTES } from '~/lib/petitOni3d'

/**
 * The 3D Petit-Oni of the hero: mirrors the chat agent's state, follows the
 * pointer, and opens the chat when clicked. Loaded lazily, client side only.
 */
const props = defineProps<{
  /** Forces a state (the /oni-lab gallery). Defaults to the chat agent's. */
  state?: OniState
}>()
const emit = defineEmits<{ ready: [] }>()

const { avatarState, setMode } = useAiChat()
const state = computed(() => props.state ?? avatarState.value)
const { locale } = useI18n()
const color = useColorMode()

// Always pink and blue: the white (mono) chat variant looks flat in 3D.
const palette = computed(() => color.value === 'dark' ? ONI_PALETTES.dark : ONI_PALETTES.light)
const glowColor = computed(() => color.value === 'dark' ? 'rgb(247 84 116 / 0.55)' : 'rgb(247 84 116 / 0.3)')

const wrapper = ref<HTMLElement | null>(null)
const visible = useElementVisibility(wrapper)
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const hovered = ref(false)

// Pointer relative to the oni, so it looks at the cursor wherever it is on the page.
const pointer = reactive({ x: 0, y: 0 })
useEventListener(window, 'pointermove', (event: PointerEvent) => {
  const rect = wrapper.value?.getBoundingClientRect()
  if (!rect) return
  const clamp = (n: number) => Math.max(-1, Math.min(1, n))
  pointer.x = clamp((event.clientX - (rect.left + rect.width / 2)) / (window.innerWidth / 2))
  pointer.y = clamp(-(event.clientY - (rect.top + rect.height / 2)) / (window.innerHeight / 2))
}, { passive: true })
</script>

<template>
  <button
    ref="wrapper"
    type="button"
    class="oni3d"
    :class="`oni3d--${state}`"
    :style="{ '--oni-glow': glowColor }"
    :aria-label="locale === 'fr' ? 'Discuter avec Petit-Oni, l\'assistant IA' : 'Chat with Petit-Oni, the AI assistant'"
    @pointerenter="hovered = true"
    @pointerleave="hovered = false"
    @click="setMode('open')"
  >
    <TresCanvas
      alpha
      :clear-alpha="0"
      :dpr="[1, 2]"
      :tone-mapping="NeutralToneMapping"
      power-preference="low-power"
    >
      <HomeOniScene
        :state="state"
        :palette="palette"
        :pointer="pointer"
        :hovered="hovered"
        :active="visible"
        :reduced-motion="reducedMotion"
        @ready="emit('ready')"
      />
    </TresCanvas>
  </button>
</template>

<style scoped>
.oni3d {
  display: block;
  cursor: pointer;
  border-radius: 9999px;
  outline-offset: -12px;
}

/* Neon glow: a CSS drop-shadow follows the drawn pixels of the transparent canvas. */
.oni3d :deep(canvas) {
  filter: drop-shadow(0 0 6px var(--oni-glow)) drop-shadow(0 0 18px var(--oni-glow));
  transition: filter 0.6s ease;
}

.oni3d--thinking :deep(canvas),
.oni3d--showing :deep(canvas),
.oni3d:hover :deep(canvas) {
  filter: drop-shadow(0 0 8px var(--oni-glow)) drop-shadow(0 0 28px var(--oni-glow)) drop-shadow(0 0 48px var(--oni-glow));
}
</style>
