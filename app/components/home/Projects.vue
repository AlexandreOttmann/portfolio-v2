<template>
  <div class="flex w-full flex-col gap-6">
    <h3 class="font-newsreader italic text-white-shadow text-xl">
      {{ $t("navigation.works") }}
    </h3>
    <div class="flex w-full flex-col gap-4">
      <UAccordion :items="projectItems" />
    </div>
    <NuxtLinkLocale to="/works" class="flex items-center justify-center">
      <span class="font-newsreader italic text-white-shadow cursor-pointer hover:bg-neutral-900 p-2 rounded">
        {{ $t("global.see_more") }}
      </span>
    </NuxtLinkLocale>
  </div>
</template>
<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()

const { data: projects } = await useAsyncData('projects-' + locale.value, async () => {
  const collection = ('projects_' + locale.value) as keyof Collections
  console.log('collection', collection)
  console.log('locale', locale.value)
  return await queryCollection(collection).all() as Collections['projects_en'][] | Collections['projects_fr'][]
}, {
  watch: [locale],
})

watch(locale, () => {
  console.log('locale changed', locale.value)
  console.log('projects in watch', projects.value)
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