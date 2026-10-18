<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { PMREMGenerator, type Mesh, type WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { OniState } from '~~/shared/types/chat'
import { createPetitOni, drawStroke, type OniMood, type OniPalette } from '~/lib/petitOni3d'

/**
 * Animates the 3D Petit-Oni from the chat agent's state, mirroring the SVG
 * avatar's moods (ChatPetitOniAvatar), plus head and eyes following the pointer.
 */
const props = defineProps<{
  state: OniState
  palette: OniPalette
  /**
   * Where it looks, from -1 to 1 on each axis (y up), and `lean`, its horizontal
   * speed from -1 to 1 (it leans into its moves). Read every frame, so the
   * companion can mutate it without re-rendering.
   */
  pointer: { x: number, y: number, lean?: number }
  hovered: boolean
  /** Off-screen: stop rendering. */
  active: boolean
  reducedMotion: boolean
  /** Companion moods, only shown while the agent is idle. */
  mood?: OniMood | null
  /** Play the arrival intro from the first frame; set back to false to skip it. */
  intro?: boolean
}>()

const emit = defineEmits<{
  ready: []
  /** Intro: the neon is on for good (the CSS glow can come in). */
  powered: []
  /** Intro over (played or skipped). */
  introDone: []
}>()

const oni = createPetitOni(props.palette)
watch(() => props.palette, palette => oni.setPalette(palette))
// Rest positions, offset by the animations.
const browRestY = oni.brow.position.y
const earRestX = oni.ears.map(ear => ear.position.x)

const { scene, renderer } = useTres()
// TresCanvas creates a WebGLRenderer unless given a custom (WebGPU) one.
const pmrem = new PMREMGenerator(renderer as WebGLRenderer)
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.value.environment = environment

const { onBeforeRender, onRender, start, stop } = useLoop()
watch(() => props.active, active => (active ? start() : stop()))

/** Frame-rate independent easing toward a target. */
const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt))

// Animated values, eased toward their targets every frame.
const v = { rx: 0, ry: 0, rz: 0, eyeX: 0, eyeY: 0, eyeScale: 1, eyeOpen: 1, browY: 0, ear: 1, mouth: 1, hornTilt: 0, glow: 1, sparkle: 0, orb: 0, wave: 0 }

let time = 0
let stateAt = 0
let nextBlink = 2
let blinkUntil = -1
let rendered = false
watch(() => props.state, () => (stateAt = time))

/*
 * Intro, "Petit-Oni s'allume" (seconds from its first frame): the strokes are
 * drawn like a pen on an unlit glass tube, the eyes pop in, the neon flickers
 * on, then it blinks, looks at the visitor and hops.
 */
const INTRO_STROKES: [Mesh, number, number][] = [
  [oni.brow, 0.1, 0.55],
  [oni.horns[0], 0.35, 0.85],
  [oni.horns[1], 0.35, 0.85],
  [oni.ears[0], 0.6, 0.95],
  [oni.ears[1], 0.6, 0.95],
  [oni.mouth, 0.75, 1.3],
]
const INTRO_EYES = [1.15, 1.45] as const
const INTRO_POWERED = 1.86
const INTRO_AWAKE = 2.15
const INTRO_BLINK = [2.3, 2.43] as const
const INTRO_HOP = [2.42, 2.8] as const
const INTRO_END = 2.8

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
const easeOutBack = (n: number) => 1 + 2.7 * (n - 1) ** 3 + 1.7 * (n - 1) ** 2

/** Neon tube powering on: a few stutters, then a small surge that settles. */
function flicker(at: number) {
  if (at < 1.55) return 0
  if (at < 1.62) return 0.9
  if (at < 1.7) return 0.1
  if (at < 1.74) return 0.8
  if (at < INTRO_POWERED) return 0.15
  const settle = clamp01((at - INTRO_POWERED) / 0.3)
  return 1 + 0.4 * Math.sin(settle * Math.PI)
}

let introAt: number | null = null
let introFinished = !props.intro
let poweredSent = false
if (props.intro) for (const [mesh] of INTRO_STROKES) drawStroke(mesh, 0)

function finishIntro() {
  if (introFinished) return
  introFinished = true
  for (const [mesh] of INTRO_STROKES) drawStroke(mesh, 1)
  oni.setPalette(props.palette)
  if (!poweredSent) emit('powered')
  emit('introDone')
}
watch(() => props.intro, (playing) => {
  if (!playing) finishIntro()
})

onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.1)
  time += dt
  // Reduced motion: poses still change with the state, but nothing loops.
  const t = props.reducedMotion ? 0 : time
  const since = time - stateAt
  const { state, pointer, hovered } = props
  const lean = pointer.lean ?? 0
  const mood = state === 'idle' ? props.mood : null

  // Targets: pointer tracking, then the current mood on top.
  let rx = -pointer.y * 0.28
  let ry = pointer.x * 0.4 + lean * 0.3
  let rz = Math.sin(t * 1.1) * 0.05 - lean * 0.35
  let float = Math.sin(t * 1.5) * 0.08
  let eyeX = pointer.x * 0.07 + Math.sin(t * 0.45) * Math.sin(t * 1.3) * 0.05
  let eyeY = pointer.y * 0.05
  let eyeScale = hovered ? 1.1 : 1
  let eyeOpen = 1
  let browY = hovered ? 0.06 : 0
  let ear = 1
  let mouth = 1
  let hornTilt = 0
  let glow = hovered ? 1.4 : 1
  let sparkle = 0
  let orb = 0
  let wave = 0
  let hop = 0
  let shake = 0

  switch (state) {
    case 'listening':
      eyeY = -0.12
      ear = 1.14
      wave = 1
      break
    case 'thinking':
      browY = 0.1
      eyeX = Math.sin(t * 2.6) * 0.13
      eyeY = 0.12
      rz = Math.sin(t * 0.8) * 0.06
      glow = 1.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 4))
      hornTilt = 0.08 * Math.sin(t * 4)
      orb = 1
      break
    case 'speaking':
      mouth = 1 + 0.2 * Math.sin(t * 26)
      rx += Math.sin(t * 13) * 0.04
      glow = 1.2
      break
    case 'showing':
      eyeScale = 1.2
      eyeY = -0.1
      browY = 0.15
      sparkle = 1
      hop = Math.max(0, Math.sin(Math.min(since / 0.5, 1) * Math.PI)) * 0.3
      glow = 1.4
      break
    case 'navigating':
      rz = -0.14
      eyeX = -0.22
      hornTilt = -0.1
      break
    case 'idle':
      if (mood === 'sleeping') {
        // Eyes shut, head down, slow breathing.
        rx = 0.32
        ry = 0
        rz = 0.12
        eyeOpen = 0.08
        eyeX = 0
        eyeY = -0.05
        browY = -0.04
        glow = 0.55 + 0.25 * Math.sin(t * 1.2)
        float = Math.sin(t * 0.9) * 0.05
      }
      else if (mood === 'curious') {
        // Leans in, wide eyes, ears up.
        eyeScale = 1.16
        browY = 0.12
        ear = 1.08
        rx -= 0.08
        glow = 1.3
      }
      break
    case 'error':
      eyeOpen = 0.4
      browY = -0.08
      mouth = 0.8
      glow = 0.5
      shake = Math.sin(since * 45) * 0.08 * Math.max(0, 1 - since / 0.5)
      break
  }

  // Random blinks, sometimes twice in a row (not while looking around or half-closed).
  if (!props.reducedMotion && time > nextBlink && state !== 'thinking' && state !== 'error' && mood !== 'sleeping') {
    blinkUntil = time + 0.13
    nextBlink = time + (Math.random() < 0.3 ? 0.3 : 1.2 + Math.random() * 2.3)
  }
  if (time < blinkUntil) eyeOpen = 0.1

  v.rx = damp(v.rx, rx, 6, dt)
  v.ry = damp(v.ry, ry, 6, dt)
  v.rz = damp(v.rz, rz, 6, dt)
  v.eyeX = damp(v.eyeX, eyeX, 10, dt)
  v.eyeY = damp(v.eyeY, eyeY, 10, dt)
  v.eyeScale = damp(v.eyeScale, eyeScale, 12, dt)
  v.eyeOpen = damp(v.eyeOpen, eyeOpen, eyeOpen < 0.2 ? 60 : 25, dt)
  v.browY = damp(v.browY, browY, 10, dt)
  v.ear = damp(v.ear, ear, 10, dt)
  v.mouth = state === 'speaking' ? mouth : damp(v.mouth, mouth, 12, dt)
  v.hornTilt = damp(v.hornTilt, hornTilt, 8, dt)
  v.glow = damp(v.glow, glow, 5, dt)
  v.sparkle = damp(v.sparkle, sparkle, 8, dt)
  v.orb = damp(v.orb, orb, 5, dt)
  v.wave = damp(v.wave, wave, 6, dt)

  let power = 1
  if (!introFinished) {
    introAt ??= time
    const at = time - introAt
    if (at >= INTRO_END) {
      finishIntro()
    }
    else {
      for (const [mesh, from, to] of INTRO_STROKES) drawStroke(mesh, (at - from) / (to - from))
      // Faces the visitor while being drawn, then free to look at the pointer.
      if (at < INTRO_AWAKE) {
        v.rx = 0
        v.ry = Math.sin(at * 1.4) * 0.12
        v.rz = 0
        v.eyeX = 0
        v.eyeY = 0
      }
      v.eyeScale = easeOutBack(clamp01((at - INTRO_EYES[0]) / (INTRO_EYES[1] - INTRO_EYES[0])))
      v.eyeOpen = at > INTRO_BLINK[0] && at < INTRO_BLINK[1] ? 0.1 : 1
      v.browY = 0
      v.mouth = 1
      v.sparkle = at > INTRO_POWERED && at < 2.4 ? 1 : 0
      v.orb = 0
      v.wave = 0
      hop = at > INTRO_HOP[0] ? Math.sin(clamp01((at - INTRO_HOP[0]) / (INTRO_HOP[1] - INTRO_HOP[0])) * Math.PI) * 0.35 : 0
      float *= clamp01(at / INTRO_END)
      shake = 0
      power = flicker(at)
      v.glow = power
      // Unlit glass tube until the power comes in.
      const lit = 0.22 + 0.78 * Math.min(power, 1)
      oni.materials.line.color.set(props.palette.line).multiplyScalar(lit)
      oni.materials.eyes.color.set(props.palette.eyes).multiplyScalar(lit)
      oni.materials.eyes.emissiveIntensity = props.palette.glow * 0.6 * Math.min(power, 1)
      if (!poweredSent && at >= INTRO_POWERED) {
        poweredSent = true
        emit('powered')
      }
    }
  }

  oni.root.position.set(shake, float + hop, 0)
  oni.head.rotation.set(v.rx, v.ry, v.rz)

  oni.eyes.position.set(v.eyeX, v.eyeY, 0)
  for (const eye of oni.eye) eye.scale.set(v.eyeScale, v.eyeScale * v.eyeOpen, v.eyeScale)
  oni.brow.position.y = browRestY + v.browY
  // Ears perk up: bigger, and pushed outward.
  oni.ears.forEach((ear, k) => {
    ear.scale.setScalar(v.ear)
    ear.position.x = earRestX[k]! + (k ? 1 : -1) * (v.ear - 1) * 0.6
  })
  oni.mouth.scale.y = v.mouth
  oni.horns[0].rotation.z = v.hornTilt
  oni.horns[1].rotation.z = -v.hornTilt

  oni.materials.line.emissiveIntensity = props.palette.glow * v.glow

  // Sound waves ripple outward from the ears.
  oni.waves.forEach((mesh, k) => {
    const phase = (t * 0.8 + k * 0.35) % 1
    const fade = phase < 0.3 ? phase / 0.3 : 1 - (phase - 0.3) / 0.7
    oni.materials.waves[k]!.opacity = v.wave * fade
    mesh.scale.set(0.9 + 0.2 * phase, 1 + 0.1 * phase, 1)
  })

  oni.sparkles.forEach((mesh, k) => {
    mesh.scale.setScalar(v.sparkle * (0.85 + 0.25 * Math.sin(t * 6 + k * 2)))
    mesh.rotation.set(0, t * 2 + k, t * 0.8)
  })

  // Orbs circle the head on a tilted orbit while the agent works.
  oni.orbs.forEach((mesh, k) => {
    const angle = time * 2.2 + (k * Math.PI * 2) / 3
    mesh.position.set(Math.cos(angle) * 3.1, 0.4 + Math.sin(angle) * 0.5, Math.sin(angle) * 1.6)
    mesh.scale.setScalar(v.orb * (0.8 + 0.2 * Math.sin(time * 5 + k)))
  })
})

// Tell the hero to swap its flat SVG for this one once the first frame is drawn.
onRender(() => {
  if (rendered) return
  rendered = true
  emit('ready')
})

onBeforeUnmount(() => {
  oni.dispose()
  environment.dispose()
  pmrem.dispose()
})
</script>

<template>
  <TresPerspectiveCamera
    :position="[0, 0.1, 11]"
    :fov="38"
  />
  <TresAmbientLight :intensity="0.6" />
  <TresDirectionalLight
    :position="[3, 4, 6]"
    :intensity="1.6"
  />
  <TresDirectionalLight
    :position="[-4, 1, -4]"
    :intensity="1.2"
    :color="palette.line"
  />
  <primitive :object="oni.root" />
</template>
