<script setup lang="ts">
import type { OniState } from '~~/shared/types/chat'

/**
 * Animated Petit-Oni. Same geometry as app/assets/icons/petit-oni.svg, split
 * into parts that each state animates (eyes, brow, ears, mouth, horns).
 */
const props = withDefaults(defineProps<{
  state?: OniState
  /** Loops (float, blink, talk…). Off for small static copies, e.g. in the message list. */
  animated?: boolean
  /** `color`: pink lines, blue eyes. `mono`: all white, dark eye shine. */
  variant?: 'color' | 'mono'
  label?: string
}>(), {
  state: 'idle',
  animated: true,
  variant: 'color',
  label: 'Petit-Oni',
})

const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const live = computed(() => props.animated && !reducedMotion.value)

// Blink often and at random, sometimes twice in a row, like a living creature
// (not while thinking, when the eyes look around, nor when half-closed on error).
const blinking = ref(false)
let blinkTimer: ReturnType<typeof setTimeout> | undefined
const blink = (then?: () => void) => {
  blinking.value = true
  setTimeout(() => {
    blinking.value = false
    then?.()
  }, 130)
}
const scheduleBlink = () => {
  blinkTimer = setTimeout(() => {
    if (live.value && props.state !== 'thinking' && props.state !== 'error') {
      blink(Math.random() < 0.3 ? () => setTimeout(() => blink(), 160) : undefined)
    }
    scheduleBlink()
  }, 1200 + Math.random() * 2300)
}
onMounted(scheduleBlink)
onBeforeUnmount(() => clearTimeout(blinkTimer))
</script>

<template>
  <svg
    class="oni"
    :class="[`oni--${state}`, `oni--${variant}`, { 'oni--live': live, 'oni--blink': blinking }]"
    viewBox="0 0 120 100"
    overflow="visible"
    fill="none"
    stroke="var(--oni-line, #F75474)"
    stroke-width="5"
    stroke-linecap="round"
    stroke-linejoin="round"
    role="img"
    :aria-label="label"
  >
    <g class="oni__float">
      <g class="oni__head">
        <!-- Sound waves around the ears: "listening" (a nod to Alex's audio background) -->
        <g
          class="oni__waves"
          stroke-width="3"
        >
          <path
            class="oni__wave oni__wave--1"
            d="M10 48 Q4 55 10 62"
          />
          <path
            class="oni__wave oni__wave--2"
            d="M3 44 Q-5 55 3 66"
          />
          <path
            class="oni__wave oni__wave--1"
            d="M110 48 Q116 55 110 62"
          />
          <path
            class="oni__wave oni__wave--2"
            d="M117 44 Q125 55 117 66"
          />
        </g>

        <g class="oni__horns">
          <path
            class="oni__horn oni__horn--left"
            d="M38.5 25.5 L19.5 18 Q14.5 16.5 15.5 21.5 Q17.5 30.5 25 37"
          />
          <path
            class="oni__horn oni__horn--right"
            d="M81.5 25.5 L100.5 18 Q105.5 16.5 104.5 21.5 Q102.5 30.5 95 37"
          />
        </g>

        <path
          class="oni__brow"
          d="M41.5 18.5 Q60 8 78.5 18.5"
        />

        <path
          class="oni__ear oni__ear--left"
          d="M22.5 46 Q8 55 22.5 63.5"
        />
        <path
          class="oni__ear oni__ear--right"
          d="M97.5 46 Q112 55 97.5 63.5"
        />

        <g class="oni__eyes">
          <g class="oni__eye">
            <rect
              x="38"
              y="44"
              width="10.5"
              height="19"
              rx="5.25"
              fill="var(--oni-eyes, #2626A0)"
              stroke="none"
            />
            <circle
              class="oni__shine"
              cx="42"
              cy="49.5"
              r="2.6"
              fill="var(--oni-shine, #fff)"
              stroke="none"
            />
          </g>
          <g class="oni__eye">
            <rect
              x="71.5"
              y="44"
              width="10.5"
              height="19"
              rx="5.25"
              fill="var(--oni-eyes, #2626A0)"
              stroke="none"
            />
            <circle
              class="oni__shine"
              cx="75.5"
              cy="49.5"
              r="2.6"
              fill="var(--oni-shine, #fff)"
              stroke="none"
            />
          </g>
        </g>

        <g class="oni__mouth">
          <path d="M34.5 75.5 Q60 101.5 85.5 75.5" />
          <path
            d="M41.5 80.5 L47 70.5 L52 83.5 Z"
            stroke-width="4"
          />
          <path
            d="M78.5 80.5 L73 70.5 L68 83.5 Z"
            stroke-width="4"
          />
        </g>

        <!-- Sparkles: "showing" a card -->
        <path
          class="oni__sparkle oni__sparkle--small"
          d="M6 2 L7.1 5 L10 6 L7.1 7 L6 10 L4.9 7 L2 6 L4.9 5 Z"
          fill="var(--oni-line, #F75474)"
          stroke="none"
        />
        <path
          class="oni__sparkle"
          d="M112 4 L113.6 8.4 L118 10 L113.6 11.6 L112 16 L110.4 11.6 L106 10 L110.4 8.4 Z"
          fill="var(--oni-line, #F75474)"
          stroke="none"
        />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.oni {
  display: block;
  overflow: visible;
}

.oni--mono {
  --oni-line: #fff;
  --oni-eyes: #fff;
  --oni-shine: #0b0b0f;
}

.oni g,
.oni path {
  transform-box: fill-box;
  transform-origin: center;
}

.oni__head,
.oni__eyes,
.oni__eye,
.oni__brow,
.oni__ear,
.oni__mouth,
.oni__horn {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}

.oni__mouth {
  transform-origin: 50% 0%;
}

.oni__waves,
.oni__sparkle {
  opacity: 0;
}

.oni__horn {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), filter 0.4s ease;
}

/* ---------- Always (when live) ---------- */
.oni--live .oni__float {
  animation: oni-float 4s ease-in-out infinite;
}

.oni--blink .oni__eye {
  transform: scaleY(0.1);
  transition-duration: 0.07s;
}

/* ---------- Idle: small head movements, eyes wander ---------- */
.oni--idle.oni--live .oni__head {
  animation: oni-sway 5.5s ease-in-out infinite;
}

.oni--idle.oni--live .oni__eyes {
  animation: oni-wander 7s ease-in-out infinite;
}

/* ---------- Listening: ears perk up, sound waves, eyes look down at the input ---------- */
.oni--listening .oni__eyes {
  transform: translate(0, 2.5px);
}

.oni--listening .oni__ear--left {
  transform: translateX(-1.5px) scale(1.08);
}

.oni--listening .oni__ear--right {
  transform: translateX(1.5px) scale(1.08);
}

.oni--listening .oni__waves {
  opacity: 1;
}

.oni--listening.oni--live .oni__wave {
  animation: oni-wave 1.4s ease-out infinite;
}

.oni--listening.oni--live .oni__wave--2 {
  animation-delay: 0.35s;
}

/* ---------- Thinking: eyes look around, brow up, horns glow ---------- */
.oni--thinking .oni__brow {
  transform: translateY(-2px);
}

.oni--thinking .oni__eyes {
  transform: translate(2px, -3px);
}

.oni--thinking.oni--live .oni__eyes {
  animation: oni-look-around 2.4s ease-in-out infinite;
}

.oni--thinking.oni--live .oni__horn {
  animation: oni-glow 1.6s ease-in-out infinite;
}

.oni--thinking.oni--live .oni__horn--right {
  animation-delay: 0.8s;
}

/* ---------- Speaking: mouth follows the stream, little head bob ---------- */
.oni--speaking.oni--live .oni__mouth {
  animation: oni-talk 0.24s ease-in-out infinite alternate;
}

.oni--speaking.oni--live .oni__head {
  animation: oni-bob 0.48s ease-in-out infinite alternate;
}

/* ---------- Showing a card: wide eyes looking at it, sparkle ---------- */
.oni--showing .oni__eye {
  transform: scale(1.18);
}

.oni--showing .oni__eyes {
  transform: translate(1.5px, 3px);
}

.oni--showing .oni__brow {
  transform: translateY(-3px);
}

.oni--showing .oni__sparkle {
  opacity: 1;
}

.oni--showing.oni--live .oni__sparkle {
  animation: oni-sparkle 1.2s ease-out infinite;
}

.oni--showing.oni--live .oni__sparkle--small {
  animation-delay: 0.45s;
}

.oni--showing.oni--live .oni__head {
  animation: oni-hop 0.5s ease-out;
}

/* ---------- Navigating: head tilts and eyes follow the page (on the left of the docked chat) ---------- */
.oni--navigating .oni__head {
  transform: rotate(-8deg);
}

.oni--navigating .oni__eyes {
  transform: translate(-4px, 0);
}

.oni--navigating .oni__horn--left {
  transform: rotate(-6deg);
}

/* ---------- Error: half-closed eyes, small shake ---------- */
.oni--error .oni__eye {
  transform: scaleY(0.4);
}

.oni--error .oni__brow {
  transform: translateY(2px) scaleX(0.92);
}

.oni--error .oni__mouth {
  transform: scaleY(0.8);
}

.oni--error.oni--live .oni__head {
  animation: oni-shake 0.45s ease-in-out;
}

@keyframes oni-sway {
  0%, 100% { transform: rotate(0) translateX(0); }
  20% { transform: rotate(-4deg) translateX(-1px); }
  45% { transform: rotate(0.5deg) translateX(0); }
  70% { transform: rotate(4deg) translateX(1px); }
  85% { transform: rotate(1deg) translateX(0); }
}

@keyframes oni-wander {
  0%, 18%, 100% { transform: translate(0, 0); }
  24%, 40% { transform: translate(-2.5px, 0.5px); }
  48%, 62% { transform: translate(0, 0); }
  68%, 82% { transform: translate(2.5px, -1px); }
}

@keyframes oni-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes oni-wave {
  0% { opacity: 0; transform: scale(0.85); }
  30% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.15); }
}

@keyframes oni-look-around {
  0%, 100% { transform: translate(-2.5px, -3px); }
  50% { transform: translate(2.5px, -3px); }
}

@keyframes oni-glow {
  0%, 100% { filter: drop-shadow(0 0 0 transparent); }
  50% { filter: drop-shadow(0 0 3px var(--oni-line, #F75474)); }
}

@keyframes oni-talk {
  from { transform: scaleY(0.85); }
  to { transform: scaleY(1.2); }
}

@keyframes oni-bob {
  from { transform: translateY(0) rotate(0); }
  to { transform: translateY(-1px) rotate(1.5deg); }
}

@keyframes oni-sparkle {
  0% { opacity: 0; transform: scale(0.3) rotate(0); }
  40% { opacity: 1; transform: scale(1.1) rotate(45deg); }
  100% { opacity: 0; transform: scale(0.6) rotate(90deg); }
}

@keyframes oni-hop {
  0% { transform: translateY(0); }
  40% { transform: translateY(-4px) scale(1.04); }
  100% { transform: translateY(0); }
}

@keyframes oni-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-3px) rotate(-3deg); }
  75% { transform: translateX(3px) rotate(3deg); }
}
</style>
