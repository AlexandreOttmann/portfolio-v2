<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()
const localePath = useLocalePath()

const { data: projects } = await useAsyncData('projects', async () => {
  const collection = ('projects_' + locale.value) as keyof Collections
  return await queryCollection(collection).all() as Collections['projects_en'][] | Collections['projects_fr'][]
}, {
  watch: [locale],
})

const projectItems = computed(() => {
  return projects.value?.filter(work => work.featured).map((project) => {
    return {
      label: project.name,
      link: project.link,
      release: project.release,
      content: project.content,
    }
  })
})
</script>

<template>
  <div class="flex w-full flex-col gap-6">
    <h3 class="font-newsreader italic text-white-shadow text-xl">
      {{ $t("navigation.works") }}
    </h3>
    <div class="flex w-full flex-col gap-4">
      <UAccordion :items="projectItems" />
      <!-- <NuxtLink
        v-for="project in projects?.filter((work) => work.featured)"
        :key="project.name"
        role="link"
        class="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 hover:bg-neutral-900"
        :to="project.release === 'soon' ? localePath('/') : project.link"
        :aria-label="'go to ' + project.name + ' project website'"
        :target="project.release === 'soon' ? '_self' : '_blank'"
      >
        <span class="whitespace-nowrap font-medium">
          {{ project.name }}
        </span>
        <div class="mx-2 h-[0.1px] w-full bg-muted" />
        <span class="whitespace-nowrap">
          {{ project.release === "soon" ? $t("global.soon") + "..." : project.release }}
        </span>
      </NuxtLink> -->
    </div>
    <NuxtLinkLocale to="/works" class="flex items-center justify-center">
      <span class="font-newsreader italic text-white-shadow cursor-pointer hover:bg-neutral-900 p-2 rounded">
        {{ $t("global.see_more") }}
      </span>
    </NuxtLinkLocale>
  </div>
</template>
