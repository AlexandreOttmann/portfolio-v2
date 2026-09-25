import { useDebounceFn, useEventListener } from '@vueuse/core'

/**
 * What the liquid glass refracts. The plasma canvas runs with `ground: "clear"`: outside
 * the surfaces it is transparent and the page's own DOM background shows through, and
 * inside them it samples this bitmap exactly - so it has to be a pixel copy of that
 * background: the page color plus the fixed `DotPattern` grid from app.vue.
 *
 * A static ImageBitmap is uploaded to the GPU once (a canvas would be re-uploaded every
 * frame); it is redrawn on resize and on theme change.
 */
export function usePlasmaGround(isDark: Ref<boolean>) {
  const bitmap = shallowRef<ImageBitmap | null>(null)

  // Mirrors <DotPattern> defaults: 16px cells, r=1 dot in the middle.
  const CELL = 16
  const DOT = 1

  async function draw() {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)

    const root = getComputedStyle(document.documentElement)
    ctx.fillStyle = root.getPropertyValue('--ui-bg').trim() || (isDark.value ? '#0a0a0a' : '#ffffff')
    ctx.fillRect(0, 0, w, h)

    // The DotPattern layer, drawn apart so its radial mask does not eat the page color.
    const layer = document.createElement('canvas')
    layer.width = canvas.width
    layer.height = canvas.height
    const l = layer.getContext('2d')
    if (!l) return
    l.scale(dpr, dpr)

    if (!isDark.value) {
      // .rainbow-spotlight at background-position 0 (its animation is not worth re-uploading).
      const g = l.createLinearGradient(0, 0, w * 2, 0)
      const stops = ['#ff0080', '#ff8c00', '#40e0d0', '#4169e1', '#9370db', '#ff1493', '#ff0080']
      stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c))
      l.fillStyle = g
      l.fillRect(0, 0, w, h)
    }

    l.fillStyle = isDark.value ? 'rgb(255 255 255 / 0.1)' : '#000000'
    l.beginPath()
    for (let y = CELL / 2; y < h + CELL; y += CELL) {
      for (let x = CELL / 2; x < w + CELL; x += CELL) {
        l.moveTo(x + DOT, y)
        l.arc(x, y, DOT, 0, Math.PI * 2)
      }
    }
    l.fill()

    // mask-image: radial-gradient(white, transparent 85%) - an ellipse to the farthest corner.
    l.globalCompositeOperation = 'destination-in'
    l.save()
    l.translate(w / 2, h / 2)
    l.scale(w / 2, h / 2)
    const m = l.createRadialGradient(0, 0, 0, 0, 0, Math.SQRT2)
    m.addColorStop(0, 'rgb(0 0 0 / 1)')
    m.addColorStop(0.85, 'rgb(0 0 0 / 0)')
    l.fillStyle = m
    l.fillRect(-1, -1, 2, 2)
    l.restore()

    ctx.globalAlpha = isDark.value ? 1 : 0.3
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.drawImage(layer, 0, 0)

    const next = await createImageBitmap(canvas)
    bitmap.value?.close()
    bitmap.value = next
  }

  const redraw = useDebounceFn(draw, 150)

  onMounted(() => {
    draw()
    useEventListener(window, 'resize', redraw)
  })
  // The CSS variables flip with the `dark` class, which lands after the color-mode value.
  watch(isDark, () => nextTick(draw))

  onBeforeUnmount(() => bitmap.value?.close())

  return bitmap
}
