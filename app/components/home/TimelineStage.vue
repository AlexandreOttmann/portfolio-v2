<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'
import { NeutralToneMapping } from 'three'
import { ONI_PALETTES } from '~/lib/petitOni3d'
import type { TimelineProp } from '~/lib/timelineProps3d'

/** Transparent WebGL canvas over the timeline's frise, with its 3D objects and their neon glow. */
defineProps<{
  items: Array<{ index: number, prop: TimelineProp }>
  track: { progress: number, velocity: number, itemWidth: number }
  active: boolean
}>()
const emit = defineEmits<{ ready: [] }>()

const color = useColorMode()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const palette = computed(() => color.value === 'dark' ? ONI_PALETTES.dark : ONI_PALETTES.light)
const glowColor = computed(() => color.value === 'dark' ? 'rgb(247 84 116 / 0.35)' : 'rgb(247 84 116 / 0.18)')
</script>

<template>
  <div
    class="timeline-stage"
    :style="{ '--stage-glow': glowColor }"
  >
    <TresCanvas
      alpha
      :clear-alpha="0"
      :dpr="[1, 2]"
      :tone-mapping="NeutralToneMapping"
      power-preference="low-power"
    >
      <HomeTimelineScene
        :items="items"
        :track="track"
        :palette="palette"
        :active="active"
        :reduced-motion="reducedMotion"
        @ready="emit('ready')"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.timeline-stage :deep(canvas) {
  filter: drop-shadow(0 0 10px var(--stage-glow));
}
</style>
