<script setup lang="ts">
import type { TimelineProp } from '~/lib/timelineProps3d'

/**
 * The journey as a scrollytelling frise. The section is as tall as the
 * journey; its frame sticks to the screen while the page scrolls through it,
 * the frise slides from the first event to today, and the current event is
 * told underneath. Turning points carry a little 3D object (HomeTimelineStage)
 * instead of an icon.
 */
interface TimelineEvent {
  year: number
  icon: string
  title: string
  description: string
  prop?: TimelineProp
}

const props = defineProps<{ events: TimelineEvent[] }>()

/** Scroll distance per event, in % of the screen height. */
const STEP_VH = 22
/** Space between two ticks on the frise, in CSS pixels. */
const ITEM_WIDTH = 76
const INTERMEDIATE_TICKS = 5

const { locale } = useI18n()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const section = ref<HTMLElement | null>(null)
const frise = ref<HTMLElement | null>(null)
const track = ref<HTMLElement | null>(null)

const count = computed(() => props.events.length)
const last = computed(() => Math.max(count.value - 1, 0))

/**
 * Where the frise is, in events (0 = first event). Read every frame by the 3D
 * stage, so it is a plain object; `current` is the only reactive part.
 */
const position = { progress: 0, itemWidth: ITEM_WIDTH }
const current = ref(0)
const event = computed(() => props.events[current.value])
const items = computed(() => props.events.flatMap((e, index) => (e.prop ? [{ index, prop: e.prop }] : [])))

const webgl = ref(false)
const stageReady = ref(false)
const onScreen = useElementVisibility(section)
onMounted(() => (webgl.value = supportsWebGL()))

/** Scroll progress through the section, from 0 (top reaches the top of the screen) to 1. */
function target() {
  const rect = section.value?.getBoundingClientRect()
  if (!rect) return 0
  const distance = rect.height - window.innerHeight
  if (distance <= 0) return 0
  return Math.min(1, Math.max(0, -rect.top / distance)) * last.value
}

let placed = false
useRafFn(({ delta }) => {
  if (!onScreen.value && placed) return
  const goal = target()
  const dt = Math.min(delta / 1000, 1 / 30)
  position.progress = !placed || reducedMotion.value
    ? goal
    : position.progress + (goal - position.progress) * (1 - Math.exp(-10 * dt))
  placed = true
  current.value = Math.round(position.progress)
  if (track.value && frise.value) {
    // The current point of the frise stays at the center.
    const x = frise.value.clientWidth / 2 - position.progress * ITEM_WIDTH
    track.value.style.transform = `translate3d(${x}px, 0, 0)`
  }
})

/** Scrolls the page to the moment of the journey where `index` is current. */
function goTo(index: number) {
  if (!section.value) return
  const top = section.value.getBoundingClientRect().top + window.scrollY
  const distance = section.value.offsetHeight - window.innerHeight
  window.scrollTo({ top: top + (distance * index) / Math.max(last.value, 1), behavior: reducedMotion.value ? 'auto' : 'smooth' })
}

const isTurningPoint = (e: TimelineEvent) => !!e.prop && webgl.value && stageReady.value
const showYear = (index: number) => index === 0 || props.events[index]!.year !== props.events[index - 1]!.year
const pad = (n: number) => String(n).padStart(2, '0')
const label = computed(() => locale.value === 'fr' ? 'Parcours' : 'Journey')
</script>

<template>
  <section
    ref="section"
    class="relative"
    :style="{ height: `calc(100svh + ${last * STEP_VH}svh)` }"
  >
    <div class="sticky top-0 flex h-svh flex-col justify-center">
      <header class="mb-2 flex items-baseline justify-between px-2 text-xs text-muted">
        <span class="font-serif italic text-sm">{{ label }}</span>
        <span class="tabular-nums tracking-widest">{{ pad(current + 1) }} / {{ pad(count) }}</span>
      </header>

      <div
        ref="frise"
        class="frise relative select-none"
        aria-hidden="true"
      >
        <!-- 3D objects of the turning points, over their ticks -->
        <div class="relative h-36">
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
          class="relative h-20 will-change-transform"
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
              v-if="!isTurningPoint(e)"
              :name="e.icon"
              class="absolute -top-9 left-0 size-5 -translate-x-1/2 transition-all duration-300"
              :class="index === current ? 'scale-150 text-highlighted' : index < current ? 'text-muted' : 'text-muted/50'"
            />
            <button
              type="button"
              tabindex="-1"
              class="absolute -left-3 top-0 h-14 w-6 cursor-pointer"
              @click="goTo(index)"
            />
            <div
              class="pointer-events-none absolute left-0 top-0 w-0.5 -translate-x-1/2 transition-all duration-300"
              :class="[
                index === current ? 'h-10' : 'h-5',
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
              class="absolute left-0 top-12 -translate-x-1/2 font-serif text-xs italic transition-colors duration-300"
              :class="index === current ? 'text-highlighted' : 'text-muted'"
            >
              {{ e.year }}
            </span>
          </div>
        </div>
      </div>

      <!-- The current chapter -->
      <div
        class="relative mx-auto min-h-48 w-full max-w-xl px-4 text-center"
        data-oni-curious
        aria-live="polite"
      >
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3 blur-sm"
          leave-active-class="transition duration-150 ease-in"
          leave-to-class="opacity-0 -translate-y-2 blur-sm"
        >
          <div
            v-if="event"
            :key="current"
          >
            <p class="font-serif text-5xl italic text-highlighted/90 sm:text-6xl">
              {{ event.year }}
            </p>
            <h3 class="mt-3 text-base font-semibold text-highlighted">
              {{ event.title }}
            </h3>
            <p class="mt-1 text-sm leading-relaxed text-muted text-pretty">
              {{ event.description }}
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- The whole journey, for screen readers and keyboard users -->
    <ol class="sr-only">
      <li
        v-for="(e, index) in events"
        :key="index"
      >
        <button
          type="button"
          @click="goTo(index)"
        >
          {{ e.year }}, {{ e.title }}
        </button>
        <p>{{ e.description }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
/* The frise fades out on both sides. */
.frise {
  mask-image: linear-gradient(to right, transparent, black 18%, black 82%, transparent);
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
