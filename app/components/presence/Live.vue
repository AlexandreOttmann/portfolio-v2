<script setup lang="ts">
import { GHOST_COLORS, REACTION_EMOJI, decodePoint } from '~/composables/usePresence'

/**
 * The portfolio in multiplayer (see usePresence): the other visitors' cursors
 * as little ghost onis, a counter, and 👹 reactions that float up on everyone's
 * screen. Mounted once in app.vue, client only.
 */
const { connected, peers, count, page, hidden, cursors, notice, onReaction, start, react } = usePresence()
const { visible: companionVisible } = useOniCompanion()
const { locale } = useI18n()
const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

start()

const IDLE_MS = 6000
const GONE_MS = 30_000
const NOTICE_MS = 7000
const MAX_REACTIONS = 24

const t = (fr: string, en: string) => (locale.value === 'fr' ? fr : en)

// Ghosts of the visitors on the same page.
const ghosts = computed(() => (hidden.value ? [] : peers.value.filter(peer => peer.page === page.value)))
const elements = new Map<string, HTMLElement>()
const setElement = (key: string) => (ref: unknown) => {
  const el = (ref as { $el?: unknown } | null)?.$el
  if (el instanceof HTMLElement) elements.set(key, el)
  else {
    elements.delete(key)
    motion.delete(key)
  }
}
/** Smoothed position of each ghost, in page coordinates. */
const motion = new Map<string, { x: number, y: number, vx: number, opacity: number, placed: boolean }>()

useRafFn(({ delta }) => {
  const dt = Math.min(delta / 1000, 1 / 30)
  const now = Date.now()
  for (const peer of ghosts.value) {
    const el = elements.get(peer.id)
    if (!el) continue
    const cursor = cursors.get(peer.id)
    const target = cursor?.page === page.value ? decodePoint(cursor.point) : null
    let m = motion.get(peer.id)
    if (!m) motion.set(peer.id, m = { x: 0, y: 0, vx: 0, opacity: 0, placed: false })
    const idle = cursor ? now - cursor.at : Infinity
    const opacity = !target || idle > GONE_MS ? 0 : idle > IDLE_MS ? 0.2 : 0.65
    if (target) {
      if (!m.placed || reducedMotion.value) {
        m.x = target.x
        m.y = target.y
        m.placed = true
      }
      else {
        // Messages come every 50 ms or more: ease toward the latest one.
        const k = 1 - Math.exp(-14 * dt)
        const dx = (target.x - m.x) * k
        m.vx = dt ? dx / dt : 0
        m.x += dx
        m.y += (target.y - m.y) * k
      }
    }
    m.opacity += (opacity - m.opacity) * (1 - Math.exp(-6 * dt))
    const tilt = Math.max(-18, Math.min(18, m.vx / 60))
    el.style.transform = `translate3d(${m.x - window.scrollX}px, ${m.y - window.scrollY}px, 0) rotate(${tilt}deg)`
    el.style.opacity = String(m.opacity)
  }
})

// Reactions: from the sender's ghost when they are on this page, otherwise from the counter.
const pill = ref<HTMLElement | null>(null)
const reactions = ref<Array<{ key: number, x: number, y: number, drift: number, rise: number, color: string }>>([])
let reactionKey = 0

onReaction((message) => {
  const sender = peers.value.find(peer => peer.id === message.id)
  let from: { x: number, y: number } | null = null
  if (message.point && message.page === page.value) {
    const point = decodePoint(message.point)
    if (point) from = { x: point.x - window.scrollX, y: point.y - window.scrollY }
  }
  if (!from) {
    const rect = pill.value?.getBoundingClientRect()
    if (!rect) return
    from = { x: rect.left + rect.width - 40, y: rect.top + rect.height / 2 }
  }
  const key = ++reactionKey
  reactions.value = [...reactions.value.slice(-MAX_REACTIONS + 1), {
    key,
    ...from,
    drift: (Math.random() - 0.5) * 60,
    // Near the top of the screen (the counter), it floats down instead.
    rise: from.y < 160 ? 140 : -140,
    color: GHOST_COLORS[sender?.color ?? 0]!,
  }]
  setTimeout(() => (reactions.value = reactions.value.filter(r => r.key !== key)), 2000)
})

// Petit-Oni's remark, said by the companion when it is on screen, by the counter otherwise.
let noticeTimer: ReturnType<typeof setTimeout> | undefined
watch(notice, (value) => {
  clearTimeout(noticeTimer)
  if (value) noticeTimer = setTimeout(() => (notice.value = null), NOTICE_MS)
})

const others = computed(() => count.value - 1)
const label = computed(() => others.value
  ? t(`${count.value} personnes regardent ce portfolio`, `${count.value} people are viewing this portfolio`)
  : t('Personne d\'autre ici pour l\'instant', 'Just you here for now'))
const reactLabel = computed(() => t('Envoyer un 👹 aux autres visiteurs', 'Send a 👹 to the other visitors'))
const hideLabel = computed(() => hidden.value
  ? t('Afficher les autres visiteurs', 'Show the other visitors')
  : t('Masquer les autres visiteurs (et mon curseur)', 'Hide the other visitors (and my cursor)'))
const toggleHidden = () => {
  hidden.value = !hidden.value
}
</script>

<template>
  <div
    v-if="connected"
    class="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    aria-hidden="true"
  >
    <PresenceGhost
      v-for="peer in ghosts"
      :key="peer.id"
      :ref="setElement(peer.id)"
      class="absolute left-0 top-0 opacity-0 will-change-transform"
      :color="GHOST_COLORS[peer.color] ?? GHOST_COLORS[0]!"
    />
    <span
      v-for="reaction in reactions"
      :key="reaction.key"
      class="presence-reaction absolute text-2xl"
      :style="{ 'left': `${reaction.x}px`, 'top': `${reaction.y}px`, '--drift': `${reaction.drift}px`, '--rise': `${reaction.rise}px`, '--glow': reaction.color }"
    >{{ REACTION_EMOJI }}</span>
  </div>

  <Transition
    enter-active-class="transition duration-500 ease-out"
    enter-from-class="opacity-0 translate-y-2"
  >
    <div
      v-if="connected"
      ref="pill"
      class="fixed left-3 top-3 z-50 sm:left-5 sm:top-4"
    >
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 scale-95"
        leave-active-class="transition duration-200 ease-in"
        leave-to-class="opacity-0"
      >
        <p
          v-if="notice && !companionVisible"
          class="absolute left-0 top-full mt-2 flex w-64 items-start gap-2 rounded-2xl border border-default bg-elevated/90 p-3 text-xs text-highlighted shadow-xl backdrop-blur"
          role="status"
        >
          <UIcon
            name="custom:petit-oni"
            class="mt-0.5 size-5 shrink-0 text-[#F75474]"
          />
          <span>{{ notice.text }}</span>
        </p>
      </Transition>

      <div class="flex items-center gap-1 rounded-full border border-default bg-elevated/70 py-1 pl-3 pr-1 text-xs text-muted shadow-lg backdrop-blur">
        <span class="relative mr-1 flex size-2">
          <span
            v-if="others"
            class="absolute inset-0 animate-ping rounded-full bg-[#3CD3C2]/70 motion-reduce:hidden"
          />
          <span
            class="relative size-2 rounded-full"
            :class="others ? 'bg-[#3CD3C2]' : 'bg-neutral-500'"
          />
        </span>
        <span
          class="hidden lg:inline"
          aria-live="polite"
        >{{ label }}</span>
        <span
          class="tabular-nums lg:hidden"
          :aria-label="label"
        >{{ count }}</span>
        <UTooltip :text="reactLabel">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            class="ml-1 rounded-full text-base leading-none"
            :aria-label="reactLabel"
            @click="react()"
          >
            {{ REACTION_EMOJI }}
          </UButton>
        </UTooltip>
        <UTooltip :text="hideLabel">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :icon="hidden ? 'lucide:eye-off' : 'lucide:eye'"
            :aria-label="hideLabel"
            :aria-pressed="hidden"
            @click="toggleHidden"
          />
        </UTooltip>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.presence-reaction {
  filter: drop-shadow(0 0 8px var(--glow));
  animation: reaction-float 1.9s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
  translate: -50% -50%;
}

@keyframes reaction-float {
  0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
  15% { opacity: 1; transform: translate(calc(var(--drift) * 0.2), calc(var(--rise) * 0.15)) scale(1.15); }
  100% { opacity: 0; transform: translate(var(--drift), var(--rise)) scale(0.9) rotate(12deg); }
}

@media (prefers-reduced-motion: reduce) {
  .presence-reaction {
    animation: reaction-fade 1.6s ease-out forwards;
  }

  @keyframes reaction-fade {
    0%, 70% { opacity: 1; }
    100% { opacity: 0; }
  }
}
</style>
