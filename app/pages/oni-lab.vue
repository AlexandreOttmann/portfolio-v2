<script setup lang="ts">
import type { OniState } from '~~/shared/types/chat'

// Animation gallery for Petit-Oni. Dev only, or NUXT_PUBLIC_ONI_LAB=true.
if (!import.meta.dev && !useRuntimeConfig().public.oniLab) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found' })
}

useSeoMeta({ title: 'Oni Lab', robots: 'noindex, nofollow' })

const states: { state: OniState, label: string, trigger: string }[] = [
  { state: 'idle', label: 'Repos', trigger: 'Rien ne se passe' },
  { state: 'listening', label: 'Écoute', trigger: 'Le visiteur tape' },
  { state: 'thinking', label: 'Réfléchit', trigger: 'Requête envoyée, tool en cours' },
  { state: 'speaking', label: 'Parle', trigger: 'Texte en streaming' },
  { state: 'showing', label: 'Montre une carte', trigger: 'Carte projet / article / contact' },
  { state: 'navigating', label: 'Navigue', trigger: 'Action sur le site' },
  { state: 'error', label: 'Erreur', trigger: 'Erreur ou refus' },
]

const current = ref<OniState>('idle')
const variant = ref<'color' | 'mono'>(useAppConfig().petitOni.variant)
</script>

<template>
  <section class="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-40 pt-28">
    <div class="flex flex-col items-center gap-6">
      <div class="flex items-center gap-12">
        <ChatPetitOniAvatar
          :state="current"
          class="w-56"
        />
        <ChatPetitOniAvatar
          :state="current"
          variant="mono"
          class="w-56"
        />
      </div>
      <div class="flex flex-wrap justify-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          icon="lucide:palette"
          @click="variant = variant === 'color' ? 'mono' : 'color'"
        >
          Grille : {{ variant === 'color' ? 'couleur' : 'blanc' }}
        </UButton>
        <UButton
          v-for="item in states"
          :key="item.state"
          :variant="current === item.state ? 'solid' : 'outline'"
          color="neutral"
          size="sm"
          @click="current = item.state"
        >
          {{ item.label }}
        </UButton>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div
        v-for="item in states"
        :key="item.state"
        :data-oni-state="item.state"
        class="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4"
      >
        <ChatPetitOniAvatar
          :state="item.state"
          :variant="variant"
          class="w-24"
        />
        <p class="text-sm font-medium">
          {{ item.label }}
        </p>
        <p class="text-center text-xs text-muted">
          {{ item.trigger }}
        </p>
      </div>
      <div class="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div class="flex items-end gap-3">
          <ChatPetitOniAvatar class="w-6" />
          <ChatPetitOniAvatar class="w-10" />
          <ChatPetitOniAvatar
            :animated="false"
            class="w-10"
          />
        </div>
        <p class="text-sm font-medium">
          Petites tailles
        </p>
        <p class="text-center text-xs text-muted">
          24 / 40 px, animé et statique
        </p>
      </div>
    </div>
  </section>
</template>
