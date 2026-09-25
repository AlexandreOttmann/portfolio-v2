<script setup lang="ts">
/**
 * Liquid-glass pill. Replaces SpotlightButton wherever the button scrolls with the page;
 * fixed chrome (navbar, scroll-to-top) keeps SpotlightButton, since plasma cannot sit
 * fixed above scrolling plasma. A click sends a ripple through the glass. `rounded` is for
 * round frames (the profile picture), buttons keep squarer 8px corners.
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
  <Plasma
    :as="as"
    :radius="rounded ? 999 : 8"
    :lean="false"
    class="group relative inline-flex items-center"
    :class="rounded ? 'p-1.5' : 'px-8 py-1'"
    @click="onClick"
  >
    <slot />
  </Plasma>
</template>
