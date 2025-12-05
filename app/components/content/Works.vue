<template>
  <section :class="isCanvasView ? '' : 'mx-auto flex max-w-4xl flex-col p-7 mt-4  sm:mt-20'">
    <h1 class="font-newsreader italic text-white-shadow text-center text-4xl"
      :class="isCanvasView ? 'fixed left-1/2 -translate-x-1/2 z-50 top-20 ' : ''">
      <slot name="title" mdc-unwrap="p" />
    </h1>
    <h2 class="text-center text-lg font-extralight italic text-muted"
      :class="isCanvasView ? 'fixed left-1/2 -translate-x-1/2 z-50 top-30 ' : ''">
      <slot name="subtitle" mdc-unwrap="p" />
    </h2>
    <Divider v-if="!isCanvasView" class="mb-8 mt-2" />
    <div :class="isCanvasView ? 'fixed left-1/2 -translate-x-1/2 z-50 top-40' : 'flex justify-center mb-8'">
      <UiViewToggle v-model="isCanvasView" />
    </div>
    <ProjectCanvasContainer v-if="isCanvasView" @select="openProject" :projects="projects" />
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2" v-else>
      <Motion v-for="project, index in projects" :key="project.name" as="div" :initial="{
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
        <ProjectCard :project="project" @select="openProject" />
      </Motion>
    </div>
    <ProjectDialog v-if="selectedProject" v-model:open="isDialogOpen" :project="selectedProject" />
  </section>
</template>
<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()

const { data: projects } = await useAsyncData('projects_home_' + locale.value, async () => {
  const collection = ('projects_' + locale.value) as keyof Collections
  console.log('collection', collection)
  return await queryCollection(collection).where('name', '<>', "Aujourd'hui").where('name', '<>', "Today").all() as Collections['projects_en'][] | Collections['projects_fr'][]
}, {
  watch: [locale],
})

const selectedProject = ref<Collections['projects_en'] | Collections['projects_fr'] | null>(null)
const isDialogOpen = ref(false)

function openProject(project: any) {
  selectedProject.value = project
  isDialogOpen.value = true
}

const isCanvasView = ref(true)
</script>
