<script setup lang="ts">
import type { ChatProjectCard } from '~~/shared/types/chat'

defineProps<{ projects: ChatProjectCard[] }>()
</script>

<template>
  <div
    class="grid gap-3"
    :class="projects.length > 1 ? 'sm:grid-cols-2' : ''"
  >
    <a
      v-for="project in projects"
      :key="project.slug"
      :href="project.link"
      target="_blank"
      rel="noopener noreferrer"
      class="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-black/30 transition-colors hover:border-white/30"
    >
      <img
        v-if="project.image"
        :src="project.image"
        :alt="project.name"
        loading="lazy"
        class="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
      >
      <div class="flex flex-1 flex-col gap-2 p-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-medium text-white">{{ project.name }}</span>
          <span class="flex items-center gap-1 text-[11px] text-white/50">
            {{ project.release }}
            <Icon
              name="lucide:arrow-up-right"
              class="size-3.5"
            />
          </span>
        </div>
        <p class="line-clamp-2 text-xs leading-relaxed text-white/60">
          {{ project.summary }}
        </p>
        <div
          v-if="project.stack.length"
          class="mt-auto flex flex-wrap gap-1"
        >
          <span
            v-for="tech in project.stack.slice(0, 5)"
            :key="tech"
            class="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/70"
          >{{ tech }}</span>
        </div>
      </div>
    </a>
  </div>
</template>
