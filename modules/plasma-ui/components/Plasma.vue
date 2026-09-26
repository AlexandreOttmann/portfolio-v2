<script setup lang="ts">
/**
 * Vue port of plasma-ui's <Plasma>: marks an element as a liquid-glass surface.
 * The element stays ordinary HTML (text, focus, a11y); the shared canvas behind the
 * page draws the material under it.
 *
 * Visual props only: the drag / snap / offset system of the React version is not
 * ported. The renderer writes CSS `translate` and `scale` on the element for lean and
 * pulse, so nothing else may animate transform/translate/scale on it - put motion on
 * a wrapper.
 */
import { computed, ref, shallowRef, watch, type Component, type CSSProperties } from 'vue'
import { unrefElement } from '@vueuse/core'
import { FORMED_EVENT, FORMING_EVENT, type JoinedSides, type ShapeHandle, type ShapeOptions } from '../core/renderer'
import { usePlasmaDefaults, usePlasmaRuntime } from '../composables/usePlasma'

const props = withDefaults(defineProps<{
  /** Element or component to render. */
  as?: string | Component
  /** Corner radius in px. Defaults to the provider's radius. */
  radius?: number
  /** How far (px) the surface leans toward the pointer while standalone. 0 or false disables. */
  lean?: number | false
  /** Tint color (hex). Defaults to the provider's tint. */
  tint?: string
  /** Tint strength, 0 (clear) to 1 (solid color). */
  opacity?: number
  /** Translucency, 0 (clear) to 1 (frosted). */
  frost?: number
  /** Elevation, 0 (flat) to 1 (floating). */
  elevation?: number
  /** False: never blends, bridges, or joins with other surfaces. */
  fuse?: boolean
  /** Inner padding in px; halves on edges joined to a neighbor. */
  padding?: number
  formIn?: boolean | null
  formOut?: boolean | null
}>(), {
  as: 'div',
  radius: undefined,
  lean: 10,
  tint: undefined,
  opacity: undefined,
  frost: undefined,
  elevation: undefined,
  fuse: true,
  padding: undefined,
  formIn: null,
  formOut: null,
})

const emit = defineEmits<{
  joinChange: [joined: boolean]
  forming: []
  formed: []
}>()

const runtime = usePlasmaRuntime()
const defaults = usePlasmaDefaults()

const target = ref()
const handle = shallowRef<ShapeHandle | null>(null)
const NO_SIDES: JoinedSides = { top: false, right: false, bottom: false, left: false }
const sides = shallowRef<JoinedSides>(NO_SIDES)

const r = computed(() => props.radius ?? defaults.value.radius)

const opts = computed<ShapeOptions>(() => ({
  radius: r.value,
  lean: props.lean || 0,
  tint: props.tint ?? null,
  opacity: props.opacity ?? null,
  frost: props.frost ?? null,
  elevation: props.elevation ?? null,
  fuse: props.fuse,
  group: null,
  formIn: props.formIn,
  formOut: props.formOut,
}))

const onForming = () => emit('forming')
const onFormed = () => emit('formed')

// Registers once both the element and the renderer exist. The provider mounts after its
// children, so the renderer usually arrives second.
watch(
  [() => runtime.renderer.value, () => unrefElement(target) as HTMLElement | undefined],
  ([ren, node], _, onCleanup) => {
    if (!ren || !node) return
    node.addEventListener(FORMING_EVENT, onForming)
    node.addEventListener(FORMED_EVENT, onFormed)
    const h = ren.register(node, opts.value, j => emit('joinChange', j), (s) => {
      sides.value = s
    })
    handle.value = h
    onCleanup(() => {
      h.remove()
      handle.value = null
      sides.value = NO_SIDES
      node.removeEventListener(FORMING_EVENT, onForming)
      node.removeEventListener(FORMED_EVENT, onFormed)
    })
  },
  { immediate: true, flush: 'post' },
)

// Pre-flush so a radius change reaches the renderer in the same frame as the CSS border-radius.
watch(opts, o => handle.value?.update(o))

function fallbackTint(hex: string, a: number): CSSProperties | null {
  if (!(a > 0) || !/^#([0-9a-f]{6})$/i.test(hex)) return null
  const n = parseInt(hex.slice(1), 16)
  return { backgroundColor: `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / ${Math.min(a, 1) * 0.85})` }
}

const style = computed<CSSProperties>(() => {
  const s: CSSProperties = { borderRadius: `${r.value}px` }
  const p = props.padding
  if (p != null) {
    const side = (joined: boolean) => `${joined ? p / 2 : p}px`
    s.padding = `${side(sides.value.top)} ${side(sides.value.right)} ${side(sides.value.bottom)} ${side(sides.value.left)}`
  }
  if (!runtime.supported.value) {
    Object.assign(s, fallbackTint(props.tint ?? defaults.value.tint, props.opacity ?? defaults.value.opacity))
  }
  return s
})
</script>

<template>
  <component
    :is="as"
    ref="target"
    class="plasma-panel"
    :class="{ 'plasma-fallback': !runtime.supported.value }"
    :style="style"
  >
    <slot />
  </component>
</template>
