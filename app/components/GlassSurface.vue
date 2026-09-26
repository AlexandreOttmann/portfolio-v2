<script setup lang="ts">
/**
 * The site's one glass surface: a <Plasma> with the shared corner sizes (RADIUS), no
 * lean, and - when `interactive` - the spectrum running through its rim while hovered.
 * Cards, panes, tiles and buttons all go through here so they read as one family.
 */
const props = withDefaults(defineProps<{
  as?: string | Component
  variant?: GlassVariant
  /** Hover lights the rim in the spectrum and lifts the surface. */
  interactive?: boolean
  frost?: number
  /** Default false: cards and tiles in a grid stay separate panes (drops still merge in). */
  fuse?: boolean
  padding?: number
}>(), {
  as: 'div',
  variant: 'card',
  interactive: false,
  frost: undefined,
  fuse: false,
  padding: undefined,
})

const hovered = ref(false)
const lit = computed(() => props.interactive && hovered.value)
const tint = useSpectrumTint(lit)
</script>

<template>
  <Plasma
    :as="as"
    :radius="RADIUS[variant]"
    :lean="false"
    :tint="tint"
    :frost="frost"
    :fuse="fuse"
    :padding="padding"
    :elevation="lit ? 0.55 : undefined"
    :class="{ 'cursor-pointer': interactive }"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <slot />
  </Plasma>
</template>
