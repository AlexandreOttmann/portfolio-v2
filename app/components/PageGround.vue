<script setup lang="ts">
/**
 * The page background, drawn in one fixed 2D canvas: page color, the tilted image
 * marquee (formerly the DOM MarqueeBg) and the DotPattern grid.
 *
 * The same element is the plasma provider's `background`: with `ground: "clear"` the
 * glass samples it exactly, so everything behind the page - marquee included - is what
 * the liquid glass refracts, in sync to the pixel. The canvas is re-uploaded to the GPU
 * every plasma frame, so the marquee is redrawn at 30fps and the static dot layer is
 * cached until a resize or a theme change.
 */
import { useDebounceFn, useMediaQuery, useResizeObserver } from '@vueuse/core'

const props = defineProps<{
  isDark: boolean
  /** Show the scrolling image columns (off on /works, like the old MarqueeBg). */
  marquee: boolean
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
defineExpose({ canvas })

const img = useImage()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// ── Geometry of the old MarqueeBg ────────────────────────────────────────────
// Each column was a fixed 460px wide UMarquee (vertical, 4 copies, 4rem gap, 40s loop),
// transformed with rotate-x-55 rotate-z-30 and no perspective - an orthographic tilt,
// which is exactly the 2D affine scaleY(cos 55deg) * rotate(30deg) about its center.
const COL_W = 460
const IMG_H = (COL_W * 9) / 16 // aspect-video
const GAP = 64
const COPIES = 4
const DURATION = 40_000
const TILT_Y = Math.cos((55 * Math.PI) / 180)
const TILT_Z = (30 * Math.PI) / 180

interface Column { left: number, top: number, h: number, images: number[], reverse: boolean, md: boolean }
const COLUMNS: Column[] = [
  { left: -400, top: -200, h: 2540, images: [1, 2, 3, 4], reverse: true, md: false },
  { left: 550, top: -360, h: 2160, images: [5, 6, 7, 8], reverse: false, md: false },
  { left: 1080, top: -300, h: 2160, images: [9, 10, 11, 12], reverse: true, md: true },
  { left: 1680, top: -300, h: 2160, images: [1, 2, 3, 4], reverse: false, md: true },
]
// The wrapper: fixed, top-100 (400px), full viewport height, bg-red-500/20, opacity-50,
// masked by linear-gradient(to bottom, transparent, black) over that box only.
const WRAP_TOP = 400
const WRAP_TINT = 'rgb(251 44 54 / 0.2)'
const WRAP_OPACITY = 0.5

// DotPattern defaults: 16px cells, r=1 dot in the middle.
const CELL = 16
const DOT = 1

const images = new Map<number, HTMLImageElement>()
function loadImages() {
  for (let i = 1; i <= 12; i++) {
    if (images.has(i)) continue
    const el = new Image()
    el.decoding = 'async'
    // A still ground (reduced motion) has no loop to pick a late image up.
    el.onload = () => {
      if (!raf) draw(performance.now())
    }
    el.src = img(`/blocks/images${i}.jpg`, { width: COL_W * 2, format: 'webp' })
    images.set(i, el)
  }
}

let w = 0
let h = 0
let dpr = 1
let layer: HTMLCanvasElement | null = null
let dotLayer: HTMLCanvasElement | null = null

function makeCanvas() {
  const c = document.createElement('canvas')
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  return c
}

function cssColor(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

let rawDots: HTMLCanvasElement | null = null
let radialMask: HTMLCanvasElement | null = null
let rainbow: CanvasPattern | null = null

/** Everything static about the DotPattern layer, rebuilt on resize and theme change. */
function buildDots() {
  rawDots = makeCanvas()
  const d = rawDots.getContext('2d')!
  d.scale(dpr, dpr)
  d.fillStyle = props.isDark ? 'rgb(255 255 255 / 0.1)' : '#000000'
  d.beginPath()
  for (let y = CELL / 2; y < h + CELL; y += CELL) {
    for (let x = CELL / 2; x < w + CELL; x += CELL) {
      d.moveTo(x + DOT, y)
      d.arc(x, y, DOT, 0, Math.PI * 2)
    }
  }
  d.fill()

  // mask-image: radial-gradient(white, transparent 85%) - an ellipse to the farthest corner
  radialMask = makeCanvas()
  const m = radialMask.getContext('2d')!
  m.scale(dpr, dpr)
  m.translate(w / 2, h / 2)
  m.scale(w / 2, h / 2)
  const g = m.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2)
  g.addColorStop(0, 'rgb(0 0 0 / 1)')
  g.addColorStop(0.85, 'rgb(0 0 0 / 0)')
  m.fillStyle = g
  m.fillRect(-1, -1, 2, 2)

  // .rainbow-spotlight (light theme): a 200%-wide gradient that repeats as it slides
  const strip = document.createElement('canvas')
  strip.width = Math.max(1, Math.round(w * 2 * dpr))
  strip.height = 1
  const s = strip.getContext('2d')!
  const lg = s.createLinearGradient(0, 0, strip.width, 0)
  const stops = ['#ff0080', '#ff8c00', '#40e0d0', '#4169e1', '#9370db', '#ff1493', '#ff0080']
  stops.forEach((c, i) => lg.addColorStop(i / (stops.length - 1), c))
  s.fillStyle = lg
  s.fillRect(0, 0, strip.width, 1)
  rainbow = s.createPattern(strip, 'repeat')

  // Dark theme has no moving part: mask once.
  if (props.isDark) {
    const md = rawDots.getContext('2d')!
    md.setTransform(1, 0, 0, 1, 0, 0)
    md.globalCompositeOperation = 'destination-in'
    md.drawImage(radialMask, 0, 0)
  }
}

/** The DotPattern svg: rainbow background (light) under the dots, both radially masked. */
function drawDots(ctx: CanvasRenderingContext2D, time: number) {
  if (!rawDots || !radialMask) return
  if (props.isDark) {
    ctx.drawImage(rawDots, 0, 0)
    return
  }
  const l = dotLayer!.getContext('2d')!
  l.setTransform(1, 0, 0, 1, 0, 0)
  l.globalCompositeOperation = 'source-over'
  l.clearRect(0, 0, dotLayer!.width, dotLayer!.height)
  if (rainbow) {
    // background-position 0% -> 200% over 10s on a 200%-wide image: slides 2 widths
    const slide = -((time % 10_000) / 10_000) * 2 * w * dpr
    rainbow.setTransform(new DOMMatrix().translate(slide, 0))
    l.fillStyle = rainbow
    l.fillRect(0, 0, dotLayer!.width, dotLayer!.height)
  }
  l.drawImage(rawDots, 0, 0)
  l.globalCompositeOperation = 'destination-in'
  l.drawImage(radialMask, 0, 0)
  ctx.globalAlpha = 0.3
  ctx.drawImage(dotLayer!, 0, 0)
  ctx.globalAlpha = 1
}

function drawMarquee(l: CanvasRenderingContext2D, time: number) {
  l.clearRect(0, 0, w, h)
  l.fillStyle = WRAP_TINT
  l.fillRect(0, WRAP_TOP, w, h)

  const copyH = COPIES * IMG_H + (COPIES - 1) * GAP
  const step = copyH + GAP
  const progress = (time % DURATION) / DURATION
  const border = cssColor('--ui-border', 'rgb(255 255 255 / 0.1)')

  for (const col of COLUMNS) {
    if (col.md && w < 768) continue
    const offset = col.reverse ? -step + progress * step : -progress * step
    l.save()
    l.translate(col.left + COL_W / 2, col.top + col.h / 2)
    l.scale(1, TILT_Y)
    l.rotate(TILT_Z)
    l.translate(-COL_W / 2, -col.h / 2)
    l.beginPath()
    l.rect(0, 0, COL_W, col.h)
    l.clip()
    for (let copy = 0; copy < COPIES; copy++) {
      col.images.forEach((n, i) => {
        const y = copy * step + i * (IMG_H + GAP) + offset
        if (y > col.h || y + IMG_H < 0) return
        const el = images.get(n)
        l.save()
        l.beginPath()
        l.roundRect(0, y, COL_W, IMG_H, 8)
        l.clip()
        if (el?.complete && el.naturalWidth) l.drawImage(el, 0, y, COL_W, IMG_H)
        l.restore()
        l.strokeStyle = border
        l.lineWidth = 1
        l.beginPath()
        l.roundRect(0.5, y + 0.5, COL_W - 1, IMG_H - 1, 8)
        l.stroke()
      })
    }
    l.restore()
  }

  // The wrapper's to-bottom mask over its own box (y 400 -> 400 + 100vh); mask-clip is
  // border-box, so nothing of the tilted columns shows above it.
  l.globalCompositeOperation = 'destination-in'
  const m = l.createLinearGradient(0, WRAP_TOP, 0, WRAP_TOP + h)
  m.addColorStop(0, 'rgb(0 0 0 / 0)')
  m.addColorStop(1, 'rgb(0 0 0 / 1)')
  l.fillStyle = m
  l.fillRect(0, 0, w, h)
  l.globalCompositeOperation = 'source-over'
}

function draw(time: number) {
  const c = canvas.value
  if (!c || !rawDots) return
  const ctx = c.getContext('2d')!
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = cssColor('--ui-bg', props.isDark ? '#0a0a0a' : '#ffffff')
  ctx.fillRect(0, 0, c.width, c.height)
  if (props.marquee && layer) {
    const l = layer.getContext('2d')!
    l.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawMarquee(l, time)
    ctx.globalAlpha = WRAP_OPACITY
    ctx.drawImage(layer, 0, 0)
  }
  ctx.globalAlpha = 1
  drawDots(ctx, time)
}

function resize() {
  const c = canvas.value
  if (!c) return
  // The canvas box, not innerWidth: a classic scrollbar is outside the fixed canvas, and the
  // plasma renderer measures the same box, so its sampling lines up with what is shown.
  w = c.clientWidth || document.documentElement.clientWidth
  h = c.clientHeight || document.documentElement.clientHeight
  // Every plasma frame uploads this canvas; 1.5x keeps that cheap and the dots crisp enough.
  dpr = Math.min(window.devicePixelRatio || 1, 1.5)
  c.width = Math.round(w * dpr)
  c.height = Math.round(h * dpr)
  layer = makeCanvas()
  dotLayer = makeCanvas()
  buildDots()
  draw(performance.now())
}

let raf = 0
let last = 0
function loop(t: number) {
  raf = requestAnimationFrame(loop)
  if (t - last < 1000 / 30) return
  last = t
  draw(t)
}
function syncLoop() {
  cancelAnimationFrame(raf)
  raf = 0
  const moving = props.marquee || !props.isDark
  if (moving && !reducedMotion.value) raf = requestAnimationFrame(loop)
  else draw(performance.now())
}

onMounted(() => {
  loadImages()
  resize()
  syncLoop()
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
// Also catches a scrollbar appearing when the page gets longer, which is no window resize.
useResizeObserver(canvas, useDebounceFn(resize, 100))

watch(() => props.marquee, syncLoop)
watch(reducedMotion, syncLoop)
// The CSS variables flip with the `dark` class, which lands after the color-mode value.
watch(() => props.isDark, () => nextTick(() => {
  resize()
  syncLoop()
}))
</script>

<template>
  <canvas
    ref="canvas"
    aria-hidden="true"
    class="pointer-events-none fixed inset-0 -z-10 size-full"
  />
</template>
