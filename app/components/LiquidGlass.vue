<script setup lang="ts">
/**
 * Liquid glass for fixed chrome - navbar, toggles, the chat, dialogs.
 *
 * plasma-ui cannot do these: its surfaces live on one canvas behind the page, so a fixed
 * bar would fuse with the panels scrolling under it, and the page's own text would stay
 * sharp through it. This is the CSS counterpart, tuned to match the plasma look:
 *
 * - Chromium: a real lens. `backdrop-filter` runs an SVG filter whose displacement map is
 *   computed for this element's size and radius (a bevel that bends the backdrop inward
 *   near the edge), after a blur - so what scrolls underneath is refracted.
 * - Elsewhere (Safari, Firefox cannot use SVG filters in backdrop-filter): a frosted blur.
 * - Everywhere: the neutral rim, sheen and shadow of the plasma surfaces.
 */
import { useResizeObserver, useDebounceFn } from '@vueuse/core'

const props = withDefaults(defineProps<{
  as?: string | Component
  /** Corner radius in px. */
  radius?: number
  /** Width of the refracting bevel along the edge, in px. */
  bezel?: number
  /** Displacement strength, in px at the very edge. */
  refraction?: number
  /** Backdrop blur, in px. */
  blur?: number
}>(), {
  as: 'div',
  radius: 24,
  bezel: 18,
  refraction: 36,
  blur: 10,
})

const id = `lg-${useId()}`
const target = ref()
const size = reactive({ w: 0, h: 0 })
const map = ref('')

// Chromium only: other engines drop the whole backdrop-filter declaration on a url().
const refract = ref(false)
onMounted(() => {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands
  refract.value = !!brands?.some(b => b.brand === 'Chromium')
})

/**
 * Displacement map: R/G = 128 +- 127 along the inward normal of the rounded box, scaled by
 * a convex profile that is 1 at the edge and falls to 0 across the bezel. Drawn at half
 * resolution; feImage stretches it back over the element.
 */
function buildMap() {
  const { w, h } = size
  if (!w || !h) return
  const s = 0.5
  const W = Math.max(1, Math.round(w * s))
  const H = Math.max(1, Math.round(h * s))
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  const data = ctx.createImageData(W, H)
  const r = Math.min(props.radius, w / 2, h / 2)
  const hx = w / 2 - r
  const hy = h / 2 - r
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const px = (i + 0.5) / s - w / 2
      const py = (j + 0.5) / s - h / 2
      const qx = Math.abs(px) - hx
      const qy = Math.abs(py) - hy
      let nx = 0
      let ny = 0
      let dist: number
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy)
        dist = r - l
        nx = qx / (l || 1)
        ny = qy / (l || 1)
      }
      else if (qx > qy) {
        dist = r - qx
        nx = 1
      }
      else {
        dist = r - qy
        ny = 1
      }
      nx *= -Math.sign(px) || 0
      ny *= -Math.sign(py) || 0
      const t = Math.min(Math.max(1 - dist / props.bezel, 0), 1)
      const m = t * t
      const k = (j * W + i) * 4
      data.data[k] = 128 + nx * m * 127
      data.data[k + 1] = 128 + ny * m * 127
      data.data[k + 2] = 128
      data.data[k + 3] = 255
    }
  }
  ctx.putImageData(data, 0, 0)
  map.value = c.toDataURL()
}

const rebuild = useDebounceFn(buildMap, 60)
useResizeObserver(target, (entries) => {
  const box = entries[0]?.borderBoxSize?.[0]
  const w = box?.inlineSize ?? entries[0]!.contentRect.width
  const h = box?.blockSize ?? entries[0]!.contentRect.height
  if (Math.round(w) === size.w && Math.round(h) === size.h) return
  size.w = Math.round(w)
  size.h = Math.round(h)
  if (refract.value) rebuild()
})
watch(refract, on => on && buildMap())
watch(() => [props.radius, props.bezel], () => refract.value && buildMap())

const style = computed(() => ({
  '--lg-radius': `${props.radius}px`,
  '--lg-blur': `${props.blur}px`,
  ...(refract.value && map.value ? { '--lg-filter': `url(#${id})` } : {}),
}))
</script>

<template>
  <component
    :is="as"
    ref="target"
    class="liquid-glass"
    :class="{ 'liquid-glass--refract': refract && map }"
    :style="style"
  >
    <svg
      v-if="refract && map"
      aria-hidden="true"
      width="0"
      height="0"
      class="absolute size-0 overflow-hidden"
    >
      <filter
        :id="id"
        x="0"
        y="0"
        :width="size.w"
        :height="size.h"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feGaussianBlur
          in="SourceGraphic"
          :stdDeviation="blur"
          result="blurred"
        />
        <feImage
          :href="map"
          x="0"
          y="0"
          :width="size.w"
          :height="size.h"
          preserveAspectRatio="none"
          result="map"
        />
        <feDisplacementMap
          in="blurred"
          in2="map"
          :scale="refraction * 2"
          xChannelSelector="R"
          yChannelSelector="G"
          result="lens"
        />
        <feColorMatrix
          in="lens"
          type="saturate"
          values="1.6"
        />
      </filter>
    </svg>
    <slot />
  </component>
</template>
