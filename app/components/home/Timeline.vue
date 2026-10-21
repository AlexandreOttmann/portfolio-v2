<script setup lang="ts">
import type { TimelineProp } from '~/lib/timelineProps3d'

/**
 * The journey as a frise of little 3D objects (HomeTimelineStage), one per
 * event, with the current chapter told underneath. It never takes over the
 * page scroll: the first time it comes into view it plays a time-lapse from
 * the first event to today, then the visitor scrubs it by dragging or swiping
 * (with momentum), with a horizontal wheel, the arrow keys, or by clicking a
 * tick. It rests on today.
 */
interface TimelineEvent {
  year: number
  icon: string
  title: string
  description: string
  prop?: TimelineProp
}

const props = defineProps<{ events: TimelineEvent[] }>()

/** Space between two ticks on the frise, in CSS pixels. */
const ITEM_WIDTH = 76
const INTERMEDIATE_TICKS = 5
const INTRO_MS = 3800
const INTRO_SEEN_KEY = 'timeline-intro-seen'
/** Share of the frise in view that starts the intro. */
const INTRO_THRESHOLD = 0.6
/** Pointer travel before a press becomes a drag (and not a click on a tick). */
const DRAG_THRESHOLD_PX = 5
/** How many events a flick can carry the frise past the release point. */
const MAX_THROW = 3
/** Spring that settles the frise on an event. */
const STIFFNESS = 90
const DAMPING = 2 * Math.sqrt(STIFFNESS) * 0.85

const { locale } = useI18n()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const t = (fr: string, en: string) => (locale.value === 'fr' ? fr : en)

const section = ref<HTMLElement | null>(null)
const frise = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

const count = computed(() => props.events.length)
const last = computed(() => Math.max(count.value - 1, 0))
const clampIndex = (n: number) => Math.min(last.value, Math.max(0, n))

/**
 * Where the frise is and how fast it moves, in events. Read every frame by the
 * 3D stage, so it is a plain object; `current` is the only reactive part.
 * It starts on today (also what the server renders).
 */
const position = { progress: last.value, velocity: 0, itemWidth: ITEM_WIDTH }
const current = ref(last.value)
const event = computed(() => props.events[current.value])
const items = computed(() => props.events.flatMap((e, index) => (e.prop ? [{ index, prop: e.prop }] : [])))

/**
 * - `intro`: the time-lapse plays,
 * - `drag` / `wheel`: the visitor moves the frise,
 * - `settle`: a spring takes it to `target` (after a drag, or to a chosen event),
 * - `idle`: at rest on an event.
 */
let mode: 'idle' | 'intro' | 'drag' | 'wheel' | 'settle' = 'idle'
let target = last.value
let introStartedAt = 0
/** The intro waits for the frise to come into view. */
let introArmed = false
const playingIntro = ref(false)
/** The visitor moved it once: the "drag" hint goes away. */
const interacted = ref(false)

const webgl = ref(false)
const stageReady = ref(false)
const onScreen = useElementVisibility(section)

onMounted(() => {
  webgl.value = supportsWebGL()
  let seen = true
  try {
    seen = !!sessionStorage.getItem(INTRO_SEEN_KEY)
  }
  catch {
    // No storage: no intro, it would replay on every page.
  }
  // Already in view (reload mid-page): no rewind under the visitor's eyes.
  // Only peeking at the bottom of the first screen does not count.
  const rect = frise.value?.getBoundingClientRect()
  const shown = rect ? Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0) : 0
  const inView = !!rect && rect.height > 0 && shown / rect.height >= INTRO_THRESHOLD
  if (!seen && !reducedMotion.value && !inView) {
    introArmed = true
    position.progress = 0
    current.value = 0
  }
})

useIntersectionObserver(frise, ([entry]) => {
  if (!introArmed || !entry?.isIntersecting) return
  introArmed = false
  mode = 'intro'
  introStartedAt = performance.now()
  playingIntro.value = true
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  }
  catch {
    // Ignored: see onMounted.
  }
}, { threshold: INTRO_THRESHOLD })

/** The visitor takes over: stops the intro where it is. */
function takeOver() {
  introArmed = false
  playingIntro.value = false
  interacted.value = true
}

/** Settles on `index`, with the spring (or at once with reduced motion). */
function goTo(index: number) {
  takeOver()
  target = clampIndex(index)
  if (reducedMotion.value) {
    position.progress = target
    position.velocity = 0
    mode = 'idle'
  }
  else {
    mode = 'settle'
  }
}

/** Past the first or last event, the frise resists like a rubber band. */
function moveBy(events: number) {
  const outside = position.progress < 0 || position.progress > last.value
  position.progress += outside ? events * 0.35 : events
}

const smootherstep = (x: number) => x * x * x * (x * (x * 6 - 15) + 10)

useRafFn(({ delta }) => {
  if (!onScreen.value && mode === 'idle') return
  const dt = Math.min(delta / 1000, 1 / 30)

  if (mode === 'intro') {
    const p = Math.min(1, (performance.now() - introStartedAt) / INTRO_MS)
    const next = smootherstep(p) * last.value
    position.velocity = dt ? (next - position.progress) / dt : 0
    position.progress = next
    if (p >= 1) {
      mode = 'idle'
      position.velocity = 0
      playingIntro.value = false
    }
  }
  else if (mode === 'settle') {
    position.velocity += (STIFFNESS * (target - position.progress) - DAMPING * position.velocity) * dt
    position.progress += position.velocity * dt
    if (Math.abs(target - position.progress) < 0.001 && Math.abs(position.velocity) < 0.01) {
      position.progress = target
      position.velocity = 0
      mode = 'idle'
    }
  }
  else if (mode === 'idle') {
    position.velocity = 0
  }

  current.value = clampIndex(Math.round(position.progress))
  if (track.value && frise.value) {
    // The current point of the frise stays at the center.
    const x = frise.value.clientWidth / 2 - position.progress * ITEM_WIDTH
    track.value.style.transform = `translate3d(${x}px, 0, 0)`
  }
})

// Drag or swipe, with momentum. touch-action: pan-y keeps the page's vertical scroll.
let press: { id: number, x: number, at: number, travel: number } | null = null
let dragged = false

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  press = { id: e.pointerId, x: e.clientX, at: performance.now(), travel: 0 }
  dragged = false
}

function onPointerMove(e: PointerEvent) {
  if (!press || e.pointerId !== press.id) return
  const dx = e.clientX - press.x
  const now = performance.now()
  press.travel += Math.abs(dx)
  if (mode !== 'drag') {
    if (press.travel < DRAG_THRESHOLD_PX) return
    takeOver()
    mode = 'drag'
    dragged = true
    frise.value?.setPointerCapture(e.pointerId)
  }
  const events = -dx / ITEM_WIDTH
  moveBy(events)
  const dt = Math.max((now - press.at) / 1000, 1 / 240)
  // Smoothed speed, for the momentum and the objects' spin.
  position.velocity = position.velocity * 0.6 + (events / dt) * 0.4
  press.x = e.clientX
  press.at = now
}

function onPointerUp(e: PointerEvent) {
  if (!press || e.pointerId !== press.id) return
  press = null
  if (mode !== 'drag') return
  // Thrown: lands where the momentum takes it, at most a few events further.
  const throwBy = Math.max(-MAX_THROW, Math.min(MAX_THROW, position.velocity * 0.3))
  const projected = position.progress + throwBy
  goTo(Math.round(projected))
}

/** A click on a tick, unless it ended a drag. */
function onTick(index: number) {
  if (dragged) return
  goTo(index)
}

// Horizontal wheel (trackpads, shift + wheel); vertical wheel scrolls the page as usual.
let wheelTimer: ReturnType<typeof setTimeout> | undefined
useEventListener(frise, 'wheel', (e: WheelEvent) => {
  const dx = e.deltaX || (e.shiftKey ? e.deltaY : 0)
  if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return
  e.preventDefault()
  takeOver()
  mode = 'wheel'
  const events = dx / ITEM_WIDTH
  moveBy(events)
  position.velocity = events * 60
  clearTimeout(wheelTimer)
  wheelTimer = setTimeout(() => goTo(Math.round(position.progress)), 140)
}, { passive: false })

/** The event the frise is at, or heading to. */
const aimed = () => (mode === 'settle' ? target : current.value)
const step = (delta: number) => goTo(aimed() + delta)

function onKeydown(e: KeyboardEvent) {
  const moves: Record<string, number> = { ArrowLeft: aimed() - 1, ArrowRight: aimed() + 1, Home: 0, End: last.value }
  const next = moves[e.key]
  if (next === undefined) return
  e.preventDefault()
  goTo(next)
}

const showIcon = (e: TimelineEvent) => !e.prop || !webgl.value || !stageReady.value
const showYear = (index: number) => index === 0 || props.events[index]!.year !== props.events[index - 1]!.year
const pad = (n: number) => String(n).padStart(2, '0')
</script>

<template>
  <section
    ref="section"
    class="relative"
    :aria-label="t('Parcours', 'Journey')"
  >
    <header class="flex items-center justify-between px-2 text-xs text-muted">
      <span class="font-serif text-sm italic">{{ t('Parcours', 'Journey') }}</span>
      <div class="flex items-center gap-1">
        <UButton
          icon="lucide:chevron-left"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="current === 0"
          :aria-label="t('Événement précédent', 'Previous event')"
          @click="step(-1)"
        />
        <span class="tabular-nums tracking-widest">{{ pad(current + 1) }} / {{ pad(count) }}</span>
        <UButton
          icon="lucide:chevron-right"
          size="xs"
          color="neutral"
          variant="ghost"
          :disabled="current === last"
          :aria-label="t('Événement suivant', 'Next event')"
          @click="step(1)"
        />
      </div>
    </header>

    <div
      ref="frise"
      class="frise relative cursor-grab touch-pan-y select-none rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:cursor-grabbing"
      tabindex="0"
      role="slider"
      :aria-label="t('Frise du parcours, glissez ou utilisez les flèches', 'Journey timeline, drag or use the arrow keys')"
      aria-valuemin="1"
      :aria-valuemax="count"
      :aria-valuenow="current + 1"
      :aria-valuetext="event ? `${event.year}, ${event.title}` : undefined"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <!-- 3D objects, over their ticks -->
      <div class="pointer-events-none relative h-32">
        <ClientOnly>
          <LazyHomeTimelineStage
            v-if="webgl && items.length"
            class="absolute inset-0 transition-opacity duration-700"
            :class="stageReady ? 'opacity-100' : 'opacity-0'"
            :items="items"
            :track="position"
            :active="onScreen"
            @ready="stageReady = true"
          />
        </ClientOnly>
      </div>

      <div
        ref="track"
        class="relative h-16 will-change-transform"
        :style="{ transform: `translateX(calc(50% - ${last * ITEM_WIDTH}px))` }"
        aria-hidden="true"
      >
        <div
          class="absolute left-0 top-0 h-px bg-accented"
          :style="{ width: `${last * ITEM_WIDTH}px` }"
        />
        <div
          v-for="(e, index) in events"
          :key="index"
          class="absolute top-0"
          :style="{ left: `${index * ITEM_WIDTH}px` }"
        >
          <UIcon
            v-if="showIcon(e)"
            :name="e.icon"
            class="absolute -top-9 left-0 size-5 -translate-x-1/2 transition-all duration-300"
            :class="index === current ? 'scale-150 text-highlighted' : index < current ? 'text-muted' : 'text-muted/50'"
          />
          <button
            type="button"
            tabindex="-1"
            class="absolute -left-4 -top-2 h-16 w-8 cursor-pointer"
            @click="onTick(index)"
          />
          <div
            class="pointer-events-none absolute left-0 top-0 w-0.5 -translate-x-1/2 transition-all duration-300"
            :class="[
              index === current ? 'h-9' : 'h-5',
              index <= current ? 'rainbow-gradient' : 'bg-accented',
            ]"
          />
          <template v-if="index < last">
            <div
              v-for="tick in INTERMEDIATE_TICKS"
              :key="tick"
              class="pointer-events-none absolute top-0 h-2 w-px"
              :class="index < current ? 'rainbow-gradient' : 'bg-accented'"
              :style="{ left: `${(tick * ITEM_WIDTH) / (INTERMEDIATE_TICKS + 1)}px` }"
            />
          </template>
          <span
            v-if="showYear(index)"
            class="pointer-events-none absolute left-0 top-10 -translate-x-1/2 font-serif text-xs italic transition-colors duration-300"
            :class="index === current ? 'text-highlighted' : 'text-muted'"
          >
            {{ e.year }}
          </span>
        </div>
      </div>
    </div>

    <p
      class="flex h-5 items-center justify-center gap-1.5 text-[11px] text-muted/70 transition-opacity duration-500"
      :class="interacted || playingIntro ? 'opacity-0' : 'opacity-100'"
      aria-hidden="true"
    >
      <UIcon
        name="lucide:move-horizontal"
        class="size-3.5"
      />
      {{ t('Glissez pour remonter le temps', 'Drag to travel back in time') }}
    </p>

    <!-- The current chapter -->
    <div
      class="relative mx-auto mt-1 min-h-36 w-full max-w-xl px-4 text-center"
      data-oni-curious
      :aria-live="playingIntro ? 'off' : 'polite'"
    >
      <Transition
        mode="out-in"
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 blur-sm"
        leave-active-class="transition duration-100 ease-in"
        leave-to-class="opacity-0 -translate-y-1 blur-sm"
      >
        <div
          v-if="event"
          :key="current"
        >
          <p class="font-serif text-4xl italic text-highlighted/90">
            {{ event.year }}
          </p>
          <h3 class="mt-2 text-base font-semibold text-highlighted">
            {{ event.title }}
          </h3>
          <p class="mt-1 text-sm leading-relaxed text-muted text-pretty">
            {{ event.description }}
          </p>
        </div>
      </Transition>
    </div>

    <!-- The whole journey, for screen readers -->
    <ol class="sr-only">
      <li
        v-for="(e, index) in events"
        :key="index"
      >
        {{ e.year }}, {{ e.title }}: {{ e.description }}
      </li>
    </ol>
  </section>
</template>

<style scoped>
/* The frise fades out on both sides. */
.frise {
  mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
}

@keyframes rainbow-slide {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.rainbow-gradient {
  background: linear-gradient(90deg, #ff0080, #ff8c00, #40e0d0, #4169e1, #9370db, #ff1493, #ff0080);
  background-size: 200% 100%;
  animation: rainbow-slide 3s linear infinite;
}
</style>
