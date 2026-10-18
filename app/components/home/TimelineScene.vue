<script setup lang="ts">
import { useLoop, useTres } from '@tresjs/core'
import { PMREMGenerator, type WebGLRenderer } from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import type { OniPalette } from '~/lib/petitOni3d'
import { createTimelineProps, type TimelineProp } from '~/lib/timelineProps3d'

/**
 * The timeline's 3D objects, drawn in one canvas laid over the frise. Each
 * object sits above the tick of its event: the frise scrolls by `track.progress`
 * events, so the object is `(index - progress) * itemWidth` pixels from the
 * center. It grows and turns to face the visitor when its event is current.
 */
const props = defineProps<{
  items: Array<{ index: number, prop: TimelineProp }>
  /** Mutated every frame by the timeline (no re-render): position on the frise, in events. */
  track: { progress: number, itemWidth: number }
  palette: OniPalette
  active: boolean
  reducedMotion: boolean
}>()

const emit = defineEmits<{ ready: [] }>()

const CAMERA_Z = 12
const FOV = 24
/** On-screen height of an object, in CSS pixels: on the frise, and when current. */
const SMALL_PX = 34
const LARGE_PX = 118
/** Gap kept under the objects, above the ticks. */
const BOTTOM_PX = 6

const { props: objects, setPalette, dispose } = createTimelineProps(props.palette)
watch(() => props.palette, setPalette)

const { scene, renderer, sizes } = useTres()
const pmrem = new PMREMGenerator(renderer as WebGLRenderer)
const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.value.environment = environment

const { onBeforeRender, onRender, start, stop } = useLoop()
watch(() => props.active, active => (active ? start() : stop()))

const placed = computed(() => props.items.map(item => ({ ...item, object: objects[item.prop], spin: 0 })))

let time = 0
let rendered = false

onBeforeRender(({ delta }) => {
  const dt = Math.min(delta, 0.1)
  time += dt
  const t = props.reducedMotion ? 0 : time
  const height = sizes.height.value || 1
  // World units per CSS pixel on the plane z = 0.
  const unit = (2 * CAMERA_Z * Math.tan((FOV / 2) * Math.PI / 180)) / height

  for (const item of placed.value) {
    const { root } = item.object
    const distance = item.index - props.track.progress
    const focus = Math.max(0, 1 - Math.abs(distance) / 0.85) ** 2
    const px = SMALL_PX + (LARGE_PX - SMALL_PX) * focus
    // Objects are about 2 units tall.
    root.scale.setScalar((px * unit) / 2)
    root.position.set(
      distance * props.track.itemWidth * unit,
      (-height / 2 + BOTTOM_PX + px / 2) * unit,
      0,
    )
    // Slowly turning on the frise, facing the visitor (with a sway) when current.
    item.spin += dt * (props.reducedMotion ? 0 : 0.6 * (1 - focus))
    root.rotation.y = item.spin * (1 - focus) + Math.sin(t * 0.8) * 0.35 * focus
    root.rotation.x = 0.12 * focus
    root.visible = Math.abs(distance * props.track.itemWidth) < sizes.width.value / 2 + LARGE_PX
    item.object.animate(t, focus)
  }
})

onRender(() => {
  if (rendered) return
  rendered = true
  emit('ready')
})

onBeforeUnmount(() => {
  dispose()
  environment.dispose()
  pmrem.dispose()
})
</script>

<template>
  <TresPerspectiveCamera
    :position="[0, 0, CAMERA_Z]"
    :fov="FOV"
  />
  <TresAmbientLight :intensity="0.7" />
  <TresDirectionalLight
    :position="[3, 4, 6]"
    :intensity="1.6"
  />
  <TresDirectionalLight
    :position="[-4, 1, -4]"
    :intensity="1.2"
    :color="palette.line"
  />
  <primitive
    v-for="item in placed"
    :key="item.index"
    :object="item.object.root"
  />
</template>
