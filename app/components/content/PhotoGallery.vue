<script setup lang="ts">
import type { PhotoGalleryGL } from '~/lib/photoGallery'

/**
 * Photo gallery for articles, usable in markdown:
 *
 *   ::photo-gallery
 *   ---
 *   images:
 *     - src: /articles_photo/DSCF9362.JPG
 *       alt: Tokyo at night
 *   ---
 *   ::
 *
 * A strip of photos you drag (with inertia, and a rubber band at both ends).
 * The <img> strip does the layout and stays the fallback (no WebGL, reduced
 * motion, keyboard); a WebGL layer on top redraws it with shaders (see
 * lib/photoGallery). Click a photo to see it large.
 */
const props = defineProps<{
  images: { src: string, alt?: string }[]
  title?: string
}>()

const { locale } = useI18n()
const img = useImage()
// Sources are camera JPEGs of up to 11 MB: always go through the image optimizer.
const photos = computed(() => props.images.map(image => ({
  ...image,
  alt: image.alt ?? '',
  url: img(image.src, { width: 1280, quality: 78 }),
  large: img(image.src, { width: 1536, quality: 85 }),
})))

const section = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const items = ref<HTMLElement[]>([])
const glReady = ref(false)
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const visible = useElementVisibility(section)

// Strip position (px, ≤ 0) and speed (px per frame).
let x = 0
let velocity = 0
let smoothedVelocity = 0
let dragging = false
let dragDistance = 0
let lastPointerX = 0
let lastPointerAt = 0
let pointer: { x: number, y: number } | null = null
const FRICTION = 0.94
/** Fastest fling, in px per frame. */
const MAX_VELOCITY = 60

function bounds() {
  const sectionWidth = section.value?.clientWidth ?? 0
  const trackWidth = track.value?.scrollWidth ?? 0
  return { min: Math.min(0, sectionWidth - trackWidth), max: 0 }
}

function onPointerDown(event: PointerEvent) {
  if (event.button !== 0) return
  dragging = true
  dragDistance = 0
  lastPointerX = event.clientX
  lastPointerAt = performance.now()
  velocity = 0
}

useEventListener(window, 'pointermove', (event: PointerEvent) => {
  pointer = { x: event.clientX, y: event.clientY }
  if (!dragging) return
  const dx = event.clientX - lastPointerX
  const now = performance.now()
  // Speed in px per 60 fps frame, whatever the rate of pointer events.
  const frames = Math.max(now - lastPointerAt, 8) / 16.7
  lastPointerX = event.clientX
  lastPointerAt = now
  dragDistance += Math.abs(dx)
  const { min, max } = bounds()
  // Resistance past the ends.
  x += x > max || x < min ? dx * 0.35 : dx
  velocity += (Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, dx / frames)) - velocity) * 0.5
}, { passive: true })

const stopDrag = () => {
  // Held still before letting go: no fling.
  if (dragging && performance.now() - lastPointerAt > 80) velocity = 0
  dragging = false
}
useEventListener(window, 'pointerup', stopDrag)
useEventListener(window, 'pointercancel', stopDrag)

// Horizontal trackpad swipes move the strip; vertical ones keep scrolling the page.
function onWheel(event: WheelEvent) {
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
  event.preventDefault()
  x -= event.deltaX
  velocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, -event.deltaX * 0.6))
}

// After a drag, the release must not open the photo under the pointer.
function onClickCapture(event: MouseEvent) {
  if (dragDistance > 6) {
    event.stopPropagation()
    event.preventDefault()
  }
}

// Keyboard: bring the focused photo into view.
function onFocus(index: number) {
  const element = items.value[index]
  if (!element || !section.value) return
  const left = element.offsetLeft
  const width = section.value.clientWidth
  if (left + x < 0 || left + element.offsetWidth + x > width) {
    const { min, max } = bounds()
    x = Math.max(min, Math.min(max, -(left - (width - element.offsetWidth) / 2)))
  }
}

let gl: PhotoGalleryGL | null = null

onMounted(async () => {
  if (!canvas.value || reducedMotion.value) return
  try {
    if (!document.createElement('canvas').getContext('webgl2')) return
    // Three.js only loads when a gallery is on the page.
    const { createPhotoGalleryGL } = await import('~/lib/photoGallery')
    gl = createPhotoGalleryGL(canvas.value, photos.value.map((photo, k) => ({ element: items.value[k]!, url: photo.url })), { reducedMotion: reducedMotion.value })
    glReady.value = true
  }
  catch (error) {
    console.warn('[PhotoGallery] WebGL unavailable, keeping the plain strip:', error)
  }
})

useResizeObserver(section, () => gl?.resize())

useRafFn(({ delta }) => {
  const dt = Math.min(delta / 1000, 1 / 30)
  if (!dragging) {
    const { min, max } = bounds()
    x += velocity
    velocity *= reducedMotion.value ? 0.8 : FRICTION
    if (Math.abs(velocity) < 0.05) velocity = 0
    // Rubber band back inside.
    if (x > max) {
      x += (max - x) * 0.15
      velocity *= 0.5
    }
    else if (x < min) {
      x += (min - x) * 0.15
      velocity *= 0.5
    }
  }
  if (track.value) track.value.style.transform = `translate3d(${x}px, 0, 0)`
  smoothedVelocity += (velocity - smoothedVelocity) * 0.2
  if (gl && visible.value) gl.render({ velocity: Math.max(-1, Math.min(1, smoothedVelocity / 40)), pointer: dragging ? null : pointer, dt })
})

onBeforeUnmount(() => gl?.dispose())

// Lightbox
const opened = ref<number | null>(null)
const open = (index: number) => {
  opened.value = index
}
const close = () => {
  opened.value = null
}
const step = (direction: number) => {
  if (opened.value === null) return
  opened.value = (opened.value + direction + photos.value.length) % photos.value.length
}
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if (opened.value === null) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
})
</script>

<template>
  <section
    ref="section"
    class="photo-gallery not-prose relative my-10 overflow-hidden py-2"
    :aria-label="title || (locale === 'fr' ? 'Galerie photo' : 'Photo gallery')"
    @pointerdown="onPointerDown"
    @wheel="onWheel"
    @click.capture="onClickCapture"
  >
    <div
      ref="track"
      class="photo-gallery__track flex w-max gap-4 will-change-transform sm:gap-6"
    >
      <button
        v-for="(photo, index) in photos"
        :key="photo.src"
        ref="items"
        type="button"
        class="photo-gallery__item relative h-[clamp(200px,38vh,440px)] shrink-0 overflow-hidden rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-4"
        :aria-label="(locale === 'fr' ? 'Agrandir la photo' : 'Enlarge photo') + (photo.alt ? ` : ${photo.alt}` : ` ${index + 1}`)"
        @click="open(index)"
        @focus="onFocus(index)"
      >
        <img
          :src="photo.url"
          :alt="photo.alt"
          class="photo-gallery__img select-none object-cover transition-opacity duration-700"
          :class="{ 'opacity-0': glReady }"
          draggable="false"
          decoding="async"
        >
      </button>
    </div>
    <canvas
      ref="canvas"
      class="pointer-events-none absolute inset-0 size-full"
      aria-hidden="true"
    />
    <p class="photo-gallery__hint mt-3 text-xs text-muted">
      {{ locale === 'fr' ? 'Glissez pour parcourir · cliquez pour agrandir' : 'Drag to browse · click to enlarge' }}
    </p>
  </section>

  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="opened !== null"
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-10"
        role="dialog"
        aria-modal="true"
        :aria-label="photos[opened]!.alt || (locale === 'fr' ? 'Photo' : 'Photo')"
        @click.self="close"
      >
        <img
          :src="photos[opened]!.large"
          :alt="photos[opened]!.alt"
          class="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        >
        <UButton
          icon="lucide:x"
          color="neutral"
          variant="ghost"
          class="absolute right-4 top-4"
          :aria-label="locale === 'fr' ? 'Fermer' : 'Close'"
          @click="close"
        />
        <UButton
          icon="lucide:chevron-left"
          color="neutral"
          variant="ghost"
          size="xl"
          class="absolute left-2 top-1/2 -translate-y-1/2"
          :aria-label="locale === 'fr' ? 'Photo précédente' : 'Previous photo'"
          @click="step(-1)"
        />
        <UButton
          icon="lucide:chevron-right"
          color="neutral"
          variant="ghost"
          size="xl"
          class="absolute right-2 top-1/2 -translate-y-1/2"
          :aria-label="locale === 'fr' ? 'Photo suivante' : 'Next photo'"
          @click="step(1)"
        />
        <p class="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/60">
          {{ opened + 1 }} / {{ photos.length }}
        </p>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.photo-gallery {
  /* Full bleed: out of the article column, edge to edge. */
  width: 100vw;
  margin-inline: calc(50% - 50vw);
  /* Vertical swipes keep scrolling the page; horizontal ones drag the strip. */
  touch-action: pan-y;
  cursor: grab;
}

/* The first photo and the hint line up with the article text. */
.photo-gallery__track,
.photo-gallery__hint {
  padding-inline: max(1rem, calc(50vw - 27rem));
}

.photo-gallery:active {
  cursor: grabbing;
}

/* Article styles size every <img> (full width, margins): the strip needs natural widths. */
.photo-gallery__img {
  height: 100%;
  width: auto;
  max-width: none;
  margin: 0;
  border-radius: 0;
}
</style>
