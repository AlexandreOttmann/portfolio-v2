<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { NeutralToneMapping } from 'three'
import type { OniState } from '~~/shared/types/chat'
import { ONI_PALETTES, type OniMood } from '~/lib/petitOni3d'

/**
 * Transparent WebGL canvas with the 3D Petit-Oni and its neon glow. Purely
 * visual: the companion (or /oni-lab) decides what it does and where it looks.
 */
const props = withDefaults(defineProps<{
  state: OniState
  /** Where it looks (-1 to 1, y up) and how it leans; see OniScene. */
  pointer?: { x: number, y: number, lean?: number }
  mood?: OniMood | null
  hovered?: boolean
  /** Stop rendering (hidden, off-screen). */
  active?: boolean
}>(), {
  pointer: () => ({ x: 0, y: 0 }),
  mood: null,
  hovered: false,
  active: true,
})
const emit = defineEmits<{ ready: [] }>()

const color = useColorMode()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Always pink and blue: the white (mono) chat variant looks flat in 3D.
const palette = computed(() => color.value === 'dark' ? ONI_PALETTES.dark : ONI_PALETTES.light)
const glowColor = computed(() => color.value === 'dark' ? 'rgb(247 84 116 / 0.55)' : 'rgb(247 84 116 / 0.3)')
const bright = computed(() => props.hovered || props.mood === 'curious' || ['thinking', 'showing'].includes(props.state))
</script>

<template>
  <div
    class="oni3d"
    :class="{ 'oni3d--bright': bright, 'oni3d--dim': mood === 'sleeping' }"
    :style="{ '--oni-glow': glowColor }"
  >
    <TresCanvas
      alpha
      :clear-alpha="0"
      :dpr="[1, 2]"
      :tone-mapping="NeutralToneMapping"
      power-preference="low-power"
    >
      <OniScene
        :state="state"
        :palette="palette"
        :pointer="pointer"
        :hovered="hovered"
        :active="active"
        :reduced-motion="reducedMotion"
        :mood="mood"
        @ready="emit('ready')"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
/* Neon glow: a CSS drop-shadow follows the drawn pixels of the transparent canvas. */
.oni3d :deep(canvas) {
  filter: drop-shadow(0 0 6px var(--oni-glow)) drop-shadow(0 0 18px var(--oni-glow));
  transition: filter 0.6s ease;
}

.oni3d--bright :deep(canvas) {
  filter: drop-shadow(0 0 8px var(--oni-glow)) drop-shadow(0 0 28px var(--oni-glow)) drop-shadow(0 0 48px var(--oni-glow));
}

.oni3d--dim :deep(canvas) {
  filter: drop-shadow(0 0 4px var(--oni-glow));
}
</style>
