<template>
  <section :class="isCanvasView ? '' : 'mx-auto flex max-w-4xl flex-col p-7 mt-4  sm:mt-20'">
    <div v-if="isCanvasView"
      class="fixed left-1/2 -translate-x-1/2 z-50 top-0 sm:top-16 backdrop-blur-xs bg-gradient-to-b from-black/10 via-black/5 to-transparent rounded-3xl px-10 py-4 shadow-lg">
      <h1 class="font-newsreader italic text-white-shadow text-center text-4xl">
        <slot name="title" mdc-unwrap="p" />
      </h1>
      <div class="flex justify-center mt-6">
        <UiViewToggle v-model="isCanvasView" />
      </div>
    </div>
    <template v-else>
      <h1 class="font-newsreader italic text-white-shadow text-center text-4xl">
        <slot name="title" mdc-unwrap="p" />
      </h1>
      <h2 class="text-center text-lg font-extralight italic text-muted">
        <slot name="subtitle" mdc-unwrap="p" />
      </h2>
      <Divider class="mb-8 mt-2" />
      <div class="flex justify-center mb-8">
        <UiViewToggle v-model="isCanvasView" />
      </div>
    </template>
    <ProjectCanvasContainer v-if="isCanvasView" data-pilot="projects" :projects="worksProjects" @select="openFromCanvas" />
    <div v-else data-pilot="projects" class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Motion v-for="project, index in worksProjects" :key="project.name" as="div" :initial="{
        scale: 1.1,
        opacity: 0,
        filter: 'blur(20px)',
      }" :animate="{
          scale: 1,
          opacity: 1,
          filter: 'blur(0px)',
        }" :transition="{
          duration: 0.6,
          delay: (0.1) * (index),
        }">
        <ProjectCard :project="project" :slug="slugOf(project)" />
      </Motion>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content'
import { projectSlugs } from '~~/shared/utils/projects'

const { locale } = useI18n()

const { data: projects } = await useAsyncData('projects_home_' + locale.value, async () => {
  const collection = ('projects_' + locale.value) as keyof Collections
  console.log('collection', collection)
  return await queryCollection(collection).all() as Collections['projects_en'][] | Collections['projects_fr'][]
}, {
  watch: [locale],
})
console.log('projects', projects.value)
const worksProjects = computed(() => (projects.value ?? []).filter(p => !p.homeOnly))

// Project pages live at /works/<slug> (same slugs as the assistant's tools).
const slugByStem = computed(() => {
  const list = projects.value ?? []
  const slugs = projectSlugs(list.map(p => p.stem))
  return new Map(list.map((p, k) => [p.stem, slugs[k]!]))
})
const slugOf = (project: { stem: string }) => slugByStem.value.get(project.stem) ?? ''

// Canvas item clicked: a project morphs into its page, an article opens its own page.
const { openProject } = useProjectTransition()
function openFromCanvas(item: { src: string }, element?: HTMLElement | null) {
  if (item.src.includes('/articles/')) return navigateTo(`/${item.src}`)
  const slug = slugByStem.value.get(item.src)
  if (slug) openProject(slug, element)
}

// Kept across visits of the page, so coming back from a project lands on the same view.
const isCanvasView = useState('works-canvas-view', () => true)
</script>
