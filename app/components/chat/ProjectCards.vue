<script setup lang="ts">
import type { ChatProjectCard } from '~~/shared/types/chat'

defineProps<{ projects: ChatProjectCard[] }>()

const { locale } = useI18n()
const { run } = useSitePilot()

const showOnSite = (project: ChatProjectCard) => run({
  kind: 'open-project',
  stem: project.stem,
  label: (locale.value === 'fr' ? 'Ouverture de ' : 'Opening ') + project.name,
})
</script>

<template>
  <div
    class="grid gap-3"
    :class="projects.length > 1 ? 'sm:grid-cols-2' : ''"
  >
    <div
      v-for="project in projects"
      :key="project.slug"
      class="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30 transition-colors hover:border-white/30"
    >
      <button
        class="block text-left"
        :aria-label="(locale === 'fr' ? 'Voir ' : 'Show ') + project.name"
        @click="showOnSite(project)"
      >
        <img
          v-if="project.image"
          :src="project.image"
          :alt="project.name"
          loading="lazy"
          class="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
        >
      </button>
      <div class="flex flex-1 flex-col gap-2 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-white">{{ project.name }}</span>
          <span class="text-[11px] text-white/50">{{ project.release }}</span>
        </div>
        <p class="line-clamp-2 text-xs leading-relaxed text-white/60">
          {{ project.summary }}
        </p>
        <div
          v-if="project.stack.length"
          class="flex flex-wrap gap-1"
        >
          <span
            v-for="tech in project.stack.slice(0, 5)"
            :key="tech"
            class="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/70"
          >{{ tech }}</span>
        </div>
        <div class="mt-auto flex gap-2 pt-1">
          <UButton
            size="xs"
            color="neutral"
            variant="soft"
            icon="lucide:panel-right-open"
            @click="showOnSite(project)"
          >
            {{ locale === 'fr' ? 'Voir sur le site' : 'Show on site' }}
          </UButton>
          <UButton
            v-if="project.link"
            size="xs"
            color="neutral"
            variant="ghost"
            trailing-icon="lucide:arrow-up-right"
            :to="project.link"
            target="_blank"
            external
          >
            {{ locale === 'fr' ? 'Lien' : 'Link' }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
