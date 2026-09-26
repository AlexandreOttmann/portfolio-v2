<script setup lang="ts">
/**
 * Liquid-glass button: a GlassSurface control whose rim runs the spectrum on hover, and a
 * click sends a ripple through the glass. `rounded` is for round frames (the profile
 * picture); buttons keep the control corners.
 */
withDefaults(defineProps<{
  as?: string | Component
  rounded?: boolean
}>(), {
  as: 'div',
  rounded: false,
})

const { pulse } = usePlasmaRuntime()
const onClick = (e: MouseEvent) => pulse(e.clientX, e.clientY, 0.6)
</script>

<template>
  <GlassSurface
    :as="as"
    :variant="rounded ? 'round' : 'control'"
    interactive
    class="group relative inline-flex items-center"
    :class="rounded ? 'p-1.5' : 'px-8 py-1'"
    @click="onClick"
  >
    <slot />
  </GlassSurface>
</template>
