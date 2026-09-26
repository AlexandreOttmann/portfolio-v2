<template>
  <div class="flex w-full flex-col gap-6">
    <h3 class="font-newsreader italic text-white-shadow text-xl">
      {{ $t("navigation.works") }}
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Motion v-for="(project, index) in projectItems" :key="project.link" :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.5, delay: index * 0.1 }" class="group relative"
        :style="{ animationDelay: `${index * 1}s` }">
        <!-- spectrum halo on hover, echoing the rim -->
        <div
          class="spectrum-bg absolute -inset-1 rounded-2xl opacity-0 blur-lg transition duration-500 group-hover:opacity-25" />

        <!-- Motion animates the wrapper: the glass element's transform belongs to plasma-ui -->
        <GlassSurface :as="NuxtLink" :to="project.link" target="_blank" interactive
          class="relative flex h-full flex-col justify-between gap-4 p-6">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h4 class="font-newsreader text-lg font-medium text-highlighted">
                {{ project.label }}
              </h4>
              <UIcon name="i-heroicons-arrow-up-right-20-solid"
                class="size-5 text-muted transition-transform duration-300 group-hover:rotate-45" />
            </div>

            <p class="text-sm text-muted">
              {{ project.summary }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="tag-mono">{{ project.release }}</span>
            <span v-for="tech in project.stack" :key="tech" class="tag-mono">{{ tech }}</span>
          </div>
        </GlassSurface>
      </Motion>
    </div>

    <NuxtLinkLocale to="/works" class="flex items-center justify-center mt-2">
      <span
        class="font-newsreader italic text-white-shadow cursor-pointer hover:bg-white/5 transition-colors p-2 rounded px-4">
        {{ $t("global.see_more") }}
      </span>
    </NuxtLinkLocale>
  </div>
</template>

<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const { locale } = useI18n()
const NuxtLink = resolveComponent('NuxtLink')

const { data: projects } = await useAsyncData('projects_home_' + locale.value, async () => {
  const collection = ('projects_' + locale.value) as keyof Collections
  return await queryCollection(collection).all() as Collections['projects_en'][] | Collections['projects_fr'][]
}, {
  watch: [locale],
})
const projectItems = computed(() => {
  return projects.value?.filter(p => p.home).map((project) => {
    return {
      label: project.name,
      link: project.link,
      release: project.release,
      // one short, complete sentence; the longer description is for the works page
      summary: project.summary ?? project.content,
      stack: project.stack?.slice(0, 3) ?? [],
    }
  }) || []
})
</script>
