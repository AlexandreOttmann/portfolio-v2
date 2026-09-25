<script setup lang="ts">
/**
 * Vue port of plasma-ui's PlasmaProvider: owns the WebGL renderer and the shared
 * settings, renders the fixed canvas behind the page. Every renderer setting is a
 * prop and is applied live through `renderer.configure()`.
 */
import { computed, onBeforeUnmount, onMounted, provide, ref, shallowRef, watch } from 'vue'
import { PlasmaRenderer, type BackgroundSource, type MaterialName, type RendererSettings } from '../core/renderer'
import { resolveMood, type Mood, type MoodName } from '../core/moods'
import { PLASMA_DEFAULTS, PLASMA_RUNTIME, type PlasmaRuntime } from '../composables/usePlasma'

const props = withDefaults(defineProps<{
  /** False keeps every surface on the CSS fallback and never creates a WebGL context (mobile, reduced motion). */
  enabled?: boolean
  /** Fade the pointer drop and pull out while the page scrolls, so panels passing under a still cursor do not bulge. */
  quietPointerOnScroll?: boolean
  mood?: MoodName | Mood
  theme?: 'auto' | 'light' | 'dark'
  blend?: number
  refraction?: number
  dispersion?: number
  rim?: number
  rimColor?: 'iridescent' | 'tint' | (string & {})
  rimWidth?: number
  highlight?: number
  edgeLine?: number
  shimmer?: number
  shimmerSpeed?: number
  glow?: number
  wash?: number
  grain?: number
  material?: MaterialName
  lightDir?: [number, number, number]
  roughness?: number
  anisotropy?: number
  edge?: number
  edgeScale?: number
  edgeSharpness?: number
  thickness?: number
  tension?: number
  backgroundBlur?: number
  formIn?: boolean
  formSpeed?: number
  formOut?: boolean
  ground?: 'field' | 'clear'
  preserveDrawingBuffer?: boolean
  viscosity?: number
  stretch?: number
  flow?: number
  /** CSS color, image URL, or an img/canvas/video element (canvas and video update live). Omit for the mood field. */
  background?: BackgroundSource | null
  radius?: number
  tint?: string
  opacity?: number
  frost?: number
  elevation?: number
  smoothness?: number
  pointerDrop?: boolean
  pointerPull?: boolean
  ambientDrops?: boolean
  grid?: number
  magnet?: number
  quality?: number
  freezeOnScroll?: boolean
  maxSurfaces?: number
  zIndex?: number
}>(), {
  enabled: true,
  quietPointerOnScroll: false,
  mood: 'tidal',
  theme: 'auto',
  blend: undefined,
  refraction: 1,
  dispersion: 1,
  rim: 1,
  rimColor: 'iridescent',
  rimWidth: 1,
  highlight: 1,
  edgeLine: 1,
  shimmer: 1,
  shimmerSpeed: 1,
  glow: 1,
  wash: 1,
  grain: 1,
  material: 'plasma',
  lightDir: () => [-0.42, -0.62, 0.66],
  roughness: 0.28,
  anisotropy: 0,
  edge: 0,
  edgeScale: 0.01,
  edgeSharpness: 0,
  thickness: 18,
  tension: 0,
  backgroundBlur: 0,
  formIn: true,
  formSpeed: 1,
  formOut: false,
  ground: 'field',
  preserveDrawingBuffer: false,
  viscosity: 0.5,
  stretch: 1,
  flow: 0,
  background: null,
  radius: 26,
  tint: '#ffffff',
  opacity: 0,
  frost: 0,
  elevation: 0.35,
  smoothness: 1,
  pointerDrop: true,
  pointerPull: true,
  ambientDrops: false,
  grid: 24,
  magnet: 40,
  quality: 1.25,
  freezeOnScroll: false,
  maxSurfaces: 16,
  zIndex: -1,
})

const canvasEl = ref<HTMLCanvasElement | null>(null)
const renderer = shallowRef<PlasmaRenderer | null>(null)
// Starts false so SSR and the first client paint show the CSS fallback; flips once the renderer exists.
const supported = ref(false)
const reducedMotion = ref(false)

const mood = computed(() => resolveMood(props.mood))

// A fresh object whenever any prop changes: a shallow watch on it is enough, and never
// traverses `background` when it is a DOM element.
const settings = computed<RendererSettings>(() => ({
  colors: mood.value.colors,
  blend: props.blend ?? mood.value.blend,
  refraction: props.refraction,
  dispersion: props.dispersion,
  rim: props.rim,
  smoothness: props.smoothness,
  pointerDrop: props.pointerDrop && !reducedMotion.value,
  pointerPull: props.pointerPull,
  ambientDrops: props.ambientDrops,
  theme: props.theme,
  quality: props.quality,
  reducedMotion: reducedMotion.value,
  freezeOnScroll: props.freezeOnScroll,
  tint: props.tint,
  opacity: props.opacity,
  rimColor: props.rimColor,
  rimWidth: props.rimWidth,
  highlight: props.highlight,
  edgeLine: props.edgeLine,
  shimmer: props.shimmer,
  shimmerSpeed: props.shimmerSpeed,
  glow: props.glow,
  wash: props.wash,
  grain: props.grain,
  backgroundBlur: props.backgroundBlur,
  ground: props.ground,
  preserveDrawingBuffer: props.preserveDrawingBuffer,
  formIn: props.formIn,
  formSpeed: props.formSpeed,
  formOut: props.formOut,
  material: props.material,
  lightDir: props.lightDir,
  roughness: props.roughness,
  anisotropy: props.anisotropy,
  edge: props.edge,
  edgeScale: props.edgeScale,
  edgeSharpness: props.edgeSharpness,
  thickness: props.thickness,
  tension: props.tension,
  viscosity: props.viscosity,
  stretch: props.stretch,
  flow: props.flow,
  frost: props.frost,
  elevation: props.elevation,
  maxSurfaces: props.maxSurfaces,
  background: props.background ?? null,
}))

function create() {
  if (renderer.value || !canvasEl.value || !props.enabled) return
  const r = PlasmaRenderer.create(canvasEl.value, settings.value)
  if (!r) {
    supported.value = false
    return
  }
  renderer.value = r
  supported.value = true
}

function destroy() {
  renderer.value?.destroy()
  renderer.value = null
  supported.value = false
}

let scrollIdle: ReturnType<typeof setTimeout> | undefined
const onScroll = () => {
  if (!props.quietPointerOnScroll || !renderer.value) return
  renderer.value.setPointerActive(false)
  clearTimeout(scrollIdle)
  scrollIdle = setTimeout(() => renderer.value?.setPointerActive(true), 220)
}

let motionQuery: MediaQueryList | null = null
const onMotion = () => {
  reducedMotion.value = !!motionQuery?.matches
}

onMounted(() => {
  motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  onMotion()
  motionQuery.addEventListener('change', onMotion)
  addEventListener('scroll', onScroll, { passive: true })
  create()
})

onBeforeUnmount(() => {
  motionQuery?.removeEventListener('change', onMotion)
  removeEventListener('scroll', onScroll)
  clearTimeout(scrollIdle)
  destroy()
})

watch(() => props.enabled, (on) => {
  if (on) create()
  else destroy()
})

watch(settings, s => renderer.value?.configure(s))

// Viscosity scales the UI springs too (same curve as the React provider).
const defaults = computed(() => {
  const vis = Math.min(Math.max(props.viscosity, 0), 1)
  const stiffK = vis < 0.5 ? 1.6 - 1.2 * vis : 1 - 1.1 * (vis - 0.5)
  const dampK = vis < 0.5 ? 0.6 + 0.8 * vis : 1 + 1.6 * (vis - 0.5)
  return {
    tint: props.tint,
    opacity: props.opacity,
    frost: props.frost,
    radius: props.radius,
    grid: props.grid,
    magnet: props.magnet,
    spring: {
      stiffness: mood.value.spring.stiffness * stiffK,
      damping: mood.value.spring.damping * dampK * Math.sqrt(stiffK),
    },
  }
})

const runtime: PlasmaRuntime = {
  renderer,
  supported,
  reducedMotion,
  pulse: (x, y, s) => renderer.value?.pulse(x, y, s),
  bump: e => renderer.value?.bump(e),
}

provide(PLASMA_RUNTIME, runtime)
provide(PLASMA_DEFAULTS, defaults)

defineExpose({ renderer, supported, pulse: runtime.pulse, bump: runtime.bump })
</script>

<template>
  <canvas
    ref="canvasEl"
    aria-hidden="true"
    :style="{
      position: 'fixed',
      inset: 0,
      width: '100%',
      height: '100%',
      zIndex,
      pointerEvents: 'none',
      display: supported ? 'block' : 'none',
    }"
  />
  <slot />
</template>
