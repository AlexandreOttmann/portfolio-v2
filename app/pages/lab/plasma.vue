<script setup lang="ts">
/**
 * Playground for the plasma-ui Vue port. Not linked, not indexed.
 * Mirrors the upstream docs playground with the "Solid" motion preset.
 */
useSeoMeta({ robots: 'noindex, nofollow', title: 'Plasma lab' })

const color = useColorMode()

const MOTION = {
  Solid: { viscosity: 0.6, stretch: 0, flow: 0 },
  Gel: { viscosity: 0.5, stretch: 1, flow: 0 },
  Water: { viscosity: 0.1, stretch: 1.3, flow: 0.6 },
  Honey: { viscosity: 0.85, stretch: 1.8, flow: 0.3 },
} as const
type MotionName = keyof typeof MOTION

const motion = ref<MotionName>('Solid')
const frost = ref(0.3)
const rim = ref(0.8)
const elevation = ref(0.35)
const refraction = ref(1)
const radius = ref(20)
const ground = ref<'field' | 'color'>('field')
const fused = ref(true)

// The provider lives in this template, so its runtime is reached through the exposed ref.
const provider = ref<{ pulse: (x: number, y: number, s?: number) => void }>()
const onPulse = (e: MouseEvent) => provider.value?.pulse(e.clientX, e.clientY, 1)
const NuxtLink = resolveComponent('NuxtLink')

const background = computed(() => ground.value === 'color' ? (color.value === 'dark' ? '#0a0a0a' : '#f4f4f5') : null)

const cards = [
  { title: 'Inbox', body: '4 unread, 2 flagged.' },
  { title: 'Tasks', body: 'Ship the release notes.' },
  { title: 'Metrics', body: 'Up 12% this week.' },
]
</script>

<template>
  <PlasmaProvider
    ref="provider"
    mood="tidal"
    :theme="color.value === 'dark' ? 'dark' : 'light'"
    :background="background"
    v-bind="MOTION[motion]"
    :frost="frost"
    :rim="rim"
    :elevation="elevation"
    :refraction="refraction"
    :radius="radius"
    :grain="0"
    :z-index="-1"
  >
    <div class="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-4 pb-40 pt-28">
      <header class="flex flex-col gap-2">
        <h1 class="font-newsreader text-5xl italic">
          Plasma lab
        </h1>
        <p class="text-muted">
          Vue port of plasma-ui. One WebGL canvas, every surface is the same liquid.
        </p>
      </header>

      <Plasma
        class="flex flex-wrap items-center gap-4 p-4 text-sm"
        :lean="false"
        :radius="16"
      >
        <label class="flex items-center gap-2">
          Motion
          <select
            v-model="motion"
            class="rounded bg-black/20 px-2 py-1"
          >
            <option
              v-for="(_, name) in MOTION"
              :key="name"
              :value="name"
            >{{ name }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2">Frost <input
          v-model.number="frost"
          type="range"
          min="0"
          max="1"
          step="0.05"
        ></label>
        <label class="flex items-center gap-2">Rim <input
          v-model.number="rim"
          type="range"
          min="0"
          max="2"
          step="0.1"
        ></label>
        <label class="flex items-center gap-2">Elevation <input
          v-model.number="elevation"
          type="range"
          min="0"
          max="1"
          step="0.05"
        ></label>
        <label class="flex items-center gap-2">Refraction <input
          v-model.number="refraction"
          type="range"
          min="0"
          max="2"
          step="0.1"
        ></label>
        <label class="flex items-center gap-2">Radius <input
          v-model.number="radius"
          type="range"
          min="0"
          max="40"
          step="1"
        ></label>
        <label class="flex items-center gap-2">
          Ground
          <select
            v-model="ground"
            class="rounded bg-black/20 px-2 py-1"
          >
            <option value="field">Mood field</option>
            <option value="color">Flat color</option>
          </select>
        </label>
      </Plasma>

      <section class="grid gap-6 sm:grid-cols-3">
        <Plasma
          v-for="card in cards"
          :key="card.title"
          as="article"
          class="flex h-40 flex-col justify-end gap-1 p-6"
        >
          <h2 class="text-lg font-semibold">
            {{ card.title }}
          </h2>
          <p class="text-sm text-muted">
            {{ card.body }}
          </p>
        </Plasma>
      </section>

      <section class="flex flex-wrap items-center gap-4">
        <Plasma
          as="button"
          class="px-6 py-2 font-medium"
          :radius="999"
          :lean="4"
          @click="onPulse"
        >
          Send a pulse
        </Plasma>
        <Plasma
          as="button"
          class="px-6 py-2 font-medium"
          :radius="999"
          :lean="4"
          tint="#6a5acd"
          :opacity="0.5"
          @click="onPulse"
        >
          Tinted
        </Plasma>
        <Plasma
          :as="NuxtLink"
          to="/"
          class="px-6 py-2 font-medium"
          :radius="999"
          :lean="4"
        >
          NuxtLink
        </Plasma>
        <button
          class="text-sm text-muted underline"
          @click="fused = !fused"
        >
          {{ fused ? 'Separate' : 'Fuse' }} the pair
        </button>
      </section>

      <section
        class="flex transition-all duration-500"
        :class="fused ? 'gap-0' : 'gap-10'"
      >
        <Plasma
          class="flex-1"
          :padding="24"
        >
          Left panel - joined edges halve their padding.
        </Plasma>
        <Plasma
          class="flex-1"
          :padding="24"
        >
          Right panel - move them apart and the liquid pulls.
        </Plasma>
      </section>

      <section class="grid gap-6 sm:grid-cols-2">
        <Plasma
          v-for="i in 6"
          :key="i"
          class="h-56 p-6"
          :frost="i % 2 ? 0 : 0.6"
        >
          Scroll surface #{{ i }} (frost {{ i % 2 ? 0 : 0.6 }})
        </Plasma>
      </section>
    </div>
  </PlasmaProvider>
</template>
