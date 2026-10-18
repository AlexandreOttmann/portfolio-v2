<script setup lang="ts">
import type { OniMood } from '~/lib/petitOni3d'

/**
 * Petit-Oni as a curious little companion. Mounted once in app.vue, it keeps
 * one WebGL canvas across pages and decides where to be, in this order:
 * - stowed by the visitor: peeks from the right edge of the screen,
 * - the assistant is showing a section (show_on_site): flies next to it,
 * - its perch (home hero) is on screen: sits there,
 * - otherwise: drifts in the empty margins beside the content, at the height
 *   of the cursor or of what the visitor hovers ([data-oni-curious]), and
 *   falls asleep when nothing happens. Hidden when the margins are too narrow.
 * It never covers the content column, and opens the chat when clicked.
 */

/** CSS size of the canvas; scaled down with a transform, so WebGL never resizes. */
const BASE = 288
/** Widest content column (max-w-4xl and padding): the oni stays out of it. */
const COLUMN = 900
const MIN_SIZE = 90
const MAX_SIZE = 150
/** Docked chat panel (25rem) and its margin, on desktop. */
const DOCKED_CHAT = 26 * 16 + 16
const SLEEP_AFTER_MS = 25_000
const INSPECT_AFTER_MS = 350
const INSPECT_LINGER_MS = 700
const CURIOUS_ON_NEW_PAGE_MS = 1600

const { avatarState, mode, setMode, isDesktop } = useAiChat()
const { pilotTarget } = useSitePilot()
const { perch, ready, stowed, visible, intro } = useOniCompanion()
const { notice } = usePresence()
const route = useRoute()
const { locale } = useI18n()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const root = ref<HTMLElement | null>(null)
const overlay = ref<HTMLElement | null>(null)
const hovered = ref(false)
const mood = ref<OniMood | null>(null)
const shown = ref(false)
const perched = ref(false)
/** Its speech bubble (what it notices about the other visitors). */
const bubble = ref<HTMLElement | null>(null)
/** Mutated every frame and read by the scene every frame: no re-render. */
const gaze = { x: 0, y: 0, lean: 0 }

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

// Spring state: center of the oni in the viewport, its size and opacity.
const body = { x: 0, y: 0, vx: 0, vy: 0, size: MAX_SIZE, vs: 0, opacity: 0 }
let placed = false
/** Just out of the intro: flies to its perch instead of snapping to it. */
const landing = ref(false)
watch(intro, (value, previous) => {
  if (value === 'done' && previous === 'playing') landing.value = true
})

const cursor = { x: 0, y: 0, seen: false }
let lastActivity = Date.now()
let side: -1 | 1 = 1
let candidate: Element | null = null
let candidateSince = 0
let inspected: Element | null = null
let inspectedUntil = 0
let curiousUntil = 0
let scrollLookUntil = 0
let scrollLookY = 0
let lastScrollY = 0

const wake = () => (lastActivity = Date.now())

useEventListener(window, 'pointermove', (event: PointerEvent) => {
  cursor.x = event.clientX
  cursor.y = event.clientY
  cursor.seen = true
  wake()
  const target = (event.target as Element | null)?.closest?.('[data-oni-curious]') ?? null
  if (target !== candidate) {
    candidate = target
    candidateSince = Date.now()
  }
}, { passive: true })

useEventListener(window, 'scroll', () => {
  const delta = window.scrollY - lastScrollY
  lastScrollY = window.scrollY
  wake()
  if (reducedMotion.value || perched.value) return
  // Dragged a little by the page, then catches up; looks where the page goes.
  body.vy -= clamp(delta * 5, -700, 700)
  scrollLookY = delta > 0 ? -0.7 : 0.7
  scrollLookUntil = Date.now() + 500
}, { passive: true })

useEventListener(window, 'keydown', wake)
useEventListener(window, 'touchstart', wake, { passive: true })

// A new page: ears up, looks around.
watch(() => route.path, () => {
  wake()
  curiousUntil = Date.now() + CURIOUS_ON_NEW_PAGE_MS
})

// It has something to say about the other visitors: wakes up, all ears.
watch(notice, (value) => {
  if (!value) return
  wake()
  curiousUntil = Date.now() + CURIOUS_ON_NEW_PAGE_MS * 2
})

interface Target { x: number, y: number, size: number, opacity: number, look: { x: number, y: number }, stiffness: number, perched?: boolean }

/** Center of the left or right margin, if it is wide enough. */
function margins(viewportRight: number) {
  const width = window.innerWidth
  const left = (width - COLUMN) / 2
  const right = viewportRight - (width + COLUMN) / 2
  return {
    left: left >= MIN_SIZE ? { x: left / 2, width: left } : null,
    right: right >= MIN_SIZE ? { x: (width + COLUMN) / 2 + right / 2, width: right } : null,
  }
}

function decide(now: number): Target {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const viewportRight = mode.value === 'docked' && isDesktop.value ? vw - DOCKED_CHAT : vw
  const here = { x: body.x, y: body.y }
  const lookAtCursor = cursor.seen ? { x: cursor.x, y: cursor.y } : { x: vw / 2, y: vh / 2 }
  const { left, right } = margins(viewportRight)

  /** A spot in the margin on `preferred` side (or the other one), at height `y`. */
  const inMargin = (preferred: -1 | 1, y: number) => {
    const spot = (preferred < 0 ? left : right) ?? (preferred < 0 ? right : left)
    if (!spot) return null
    const size = clamp(spot.width * 0.8, MIN_SIZE, MAX_SIZE)
    return { x: spot.x, y: clamp(y, 90 + size / 2, vh - 140 - size / 2), size }
  }

  // Intro: big, in the middle of the screen, in front of the curtain.
  if (intro.value === 'playing') {
    const size = Math.min(BASE, vw * 0.62)
    return { x: vw / 2, y: vh * 0.45, size, opacity: 1, look: { x: vw / 2, y: vh * 0.45 }, stiffness: 900 }
  }

  if (stowed.value) {
    const size = 96
    return { x: viewportRight - size * 0.18, y: vh * 0.62, size, opacity: 1, look: { x: -1e4, y: vh * 0.62 }, stiffness: 60 }
  }

  const guided = pilotTarget.value?.isConnected ? pilotTarget.value.getBoundingClientRect() : null
  if (guided) {
    const center = { x: guided.left + guided.width / 2, y: guided.top + guided.height / 2 }
    const spot = inMargin(center.x < vw / 2 ? -1 : 1, center.y)
      // No margin (small screens): just above the section's corner.
      ?? { x: clamp(guided.left + 50, 50, vw - 50), y: clamp(guided.top - 30, 80, vh - 80), size: MIN_SIZE }
    return { ...spot, opacity: 1, look: center, stiffness: 40 }
  }

  const perchRect = perch.value?.getBoundingClientRect()
  if (perchRect && perchRect.width && perchRect.bottom > 80 && perchRect.top < vh - 80) {
    return {
      x: perchRect.left + perchRect.width / 2,
      y: perchRect.top + perchRect.height / 2,
      size: perchRect.width,
      opacity: 1,
      look: lookAtCursor,
      // Glued to the perch while the page scrolls.
      // Glued while the page scrolls, but a gentle flight there after the intro.
      stiffness: landing.value ? 45 : 900,
      perched: true,
    }
  }

  // What the visitor hovers for a moment, kept a little after they leave it.
  if (candidate && now - candidateSince > INSPECT_AFTER_MS) {
    inspected = candidate
    inspectedUntil = now + INSPECT_LINGER_MS
  }
  if (inspected && (now > inspectedUntil || !inspected.isConnected)) inspected = null

  if (inspected) {
    const rect = inspected.getBoundingClientRect()
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const spot = inMargin(center.x < vw / 2 ? -1 : 1, center.y)
    if (spot) return { ...spot, opacity: 1, look: center, stiffness: 30 }
  }

  // Follows the cursor's side and height, with some hysteresis so it doesn't cross the page for nothing.
  if (cursor.seen && !reducedMotion.value) {
    if (cursor.x < vw / 2 - 150) side = -1
    else if (cursor.x > vw / 2 + 150) side = 1
  }
  const asleep = mood.value === 'sleeping'
  const followY = asleep || reducedMotion.value || !cursor.seen ? (placed ? body.y : vh * 0.6) : cursor.y
  const spot = inMargin(side, followY)
  if (spot) return { ...spot, opacity: 1, look: lookAtCursor, stiffness: 18 }

  // No room beside the content: fade out where it is.
  return { ...here, size: body.size, opacity: 0, look: lookAtCursor, stiffness: 18 }
}

useRafFn(({ delta }) => {
  if (!root.value) return
  const now = Date.now()
  const dt = Math.min(delta / 1000, 1 / 30)

  if (avatarState.value !== 'idle') wake()
  mood.value = avatarState.value !== 'idle'
    ? null
    : !reducedMotion.value && now - lastActivity > SLEEP_AFTER_MS
        ? 'sleeping'
        : (inspected || now < curiousUntil) ? 'curious' : null

  const target = decide(now)
  perched.value = !!target.perched
  // Landed (or off somewhere else): back to normal.
  if (landing.value && (!target.perched || (Math.hypot(target.x - body.x, target.y - body.y) < 3 && Math.abs(body.vx) + Math.abs(body.vy) < 30))) landing.value = false

  if (!placed || reducedMotion.value) {
    body.x = target.x
    body.y = target.y
    body.size = target.size
    body.vx = body.vy = body.vs = 0
    placed = true
  }
  else {
    // Slightly underdamped springs: it overshoots a little, like something alive.
    const k = target.stiffness
    const c = 2 * Math.sqrt(k) * 0.82
    body.vx += (k * (target.x - body.x) - c * body.vx) * dt
    body.vy += (k * (target.y - body.y) - c * body.vy) * dt
    body.x += body.vx * dt
    body.y += body.vy * dt
    const ks = 80
    body.vs += (ks * (target.size - body.size) - 2 * Math.sqrt(ks) * body.vs) * dt
    body.size += body.vs * dt
  }
  // Fades in only once the 3D oni has drawn a frame.
  const opacity = ready.value ? target.opacity : 0
  body.opacity += (opacity - body.opacity) * (1 - Math.exp(-8 * dt))
  shown.value = body.opacity > 0.02
  visible.value = shown.value && !stowed.value && intro.value !== 'playing' && body.opacity > 0.5

  const look = now < scrollLookUntil ? { x: target.look.x, y: body.y - scrollLookY * 400 } : target.look
  gaze.x = clamp((look.x - body.x) / 500, -1, 1)
  gaze.y = clamp(-(look.y - body.y) / 400, -1, 1)
  gaze.lean = clamp(body.vx / 1200, -1, 1)

  const scale = body.size / BASE
  root.value.style.transform = `translate3d(${body.x - BASE / 2}px, ${body.y - BASE / 2}px, 0) scale(${scale})`
  root.value.style.opacity = String(body.opacity)
  // The overlay (stow button, zzz) stays at its own size, by the oni's top-right.
  if (overlay.value) {
    overlay.value.style.transform = `translate3d(${body.x + body.size * 0.28}px, ${body.y - body.size * 0.42}px, 0)`
    overlay.value.style.opacity = String(body.opacity)
  }
  // The bubble: beside the oni, toward the middle of the screen; above it, or below when there is no room.
  if (bubble.value) {
    const { offsetWidth: w, offsetHeight: h } = bubble.value
    const vw = window.innerWidth
    const toRight = body.x < vw / 2
    const x = clamp(toRight ? body.x + body.size * 0.25 : body.x - body.size * 0.25 - w, 12, vw - w - 12)
    const above = body.y - body.size * 0.45 - h
    const y = above >= 12 ? above : body.y + body.size * 0.4
    bubble.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }
})

const stow = () => {
  stowed.value = true
}

const onClick = () => {
  if (stowed.value) stowed.value = false
  else setMode('open')
}

// Leaving the oni for its overlay button should not count as leaving.
let leaveTimer: ReturnType<typeof setTimeout> | undefined
const enter = () => {
  clearTimeout(leaveTimer)
  hovered.value = true
}
const leave = () => {
  leaveTimer = setTimeout(() => (hovered.value = false), 250)
}

const label = computed(() => {
  if (stowed.value) return locale.value === 'fr' ? 'Faire revenir Petit-Oni' : 'Bring Petit-Oni back'
  return locale.value === 'fr' ? 'Discuter avec Petit-Oni, l\'assistant IA' : 'Chat with Petit-Oni, the AI assistant'
})
</script>

<template>
  <div
    class="pointer-events-none fixed inset-0 overflow-hidden"
    :class="intro === 'playing' || landing ? 'z-[110]' : 'z-40'"
  >
    <div
      ref="root"
      class="absolute left-0 top-0 origin-center opacity-0 will-change-transform"
      :style="{ width: `${BASE}px`, height: `${BASE}px` }"
    >
      <OniCanvas
        class="size-full"
        :state="avatarState"
        :pointer="gaze"
        :mood="mood"
        :hovered="hovered"
        :active="shown || !ready"
        :intro="intro === 'playing'"
        @ready="ready = true"
        @intro-done="intro === 'playing' && (intro = 'done')"
      />
      <!-- Hit area: the face only, so the transparent corners don't block the page. -->
      <button
        type="button"
        class="absolute inset-[22%] cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4"
        :class="shown ? 'pointer-events-auto' : 'pointer-events-none'"
        :aria-label="label"
        :tabindex="shown ? 0 : -1"
        @click="onClick"
        @pointerenter="enter"
        @pointerleave="leave"
        @focus="enter"
        @blur="leave"
      />
    </div>

    <!-- What it notices about the other visitors (see usePresence) -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <p
        v-if="notice && visible"
        ref="bubble"
        :key="notice.at"
        class="pointer-events-none absolute left-0 top-0 w-56 rounded-2xl border border-default bg-elevated/90 p-3 text-xs text-highlighted shadow-xl backdrop-blur"
        role="status"
      >
        {{ notice.text }}
      </p>
    </Transition>

    <div
      ref="overlay"
      class="absolute left-0 top-0 opacity-0"
    >
      <span
        v-if="mood === 'sleeping'"
        class="oni-zzz pointer-events-none absolute -top-2 left-0 font-newsreader text-lg italic text-[#F75474]"
        aria-hidden="true"
      >
        <span>z</span><span>z</span><span>z</span>
      </span>
      <UButton
        v-else-if="hovered && !stowed && shown"
        size="xs"
        color="neutral"
        variant="soft"
        icon="lucide:eye-off"
        class="pointer-events-auto rounded-full"
        :aria-label="locale === 'fr' ? 'Ranger Petit-Oni' : 'Put Petit-Oni away'"
        @pointerenter="enter"
        @pointerleave="leave"
        @click="stow"
      />
    </div>
  </div>
</template>

<style scoped>
.oni-zzz span {
  display: inline-block;
  animation: oni-zzz 2.4s ease-in-out infinite;
  opacity: 0;
}

.oni-zzz span:nth-child(2) {
  animation-delay: 0.6s;
  font-size: 0.85em;
}

.oni-zzz span:nth-child(3) {
  animation-delay: 1.2s;
  font-size: 0.7em;
}

@keyframes oni-zzz {
  0% { opacity: 0; transform: translate(0, 4px); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: translate(6px, -14px); }
}

@media (prefers-reduced-motion: reduce) {
  .oni-zzz span {
    animation: none;
    opacity: 1;
  }
}
</style>
