<template>
  <div class="flex w-full flex-col gap-6">
    <h3 class="font-newsreader italic text-white-shadow text-xl">
      {{ $t("navigation.works") }}
    </h3>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Motion v-for="(project, index) in projectItems" :key="project.link" :initial="{ opacity: 0, y: 20 }"
        :animate="{ opacity: 1, y: 0 }" :transition="{ duration: 0.5, delay: index * 0.1 }" class="group relative"
        :style="{ animationDelay: `${index * 1}s` }">
        <!-- Rainbow border effect on hover -->
        <div
          class="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[#ff0080] via-[#ff8c00] to-[#40e0d0] opacity-0 blur transition duration-500 group-hover:opacity-45" />

        <NuxtLink :to="project.link" target="_blank"
          class="relative flex h-full flex-col justify-between rounded-xl bg-black/5 dark:bg-white/5 p-6 backdrop-blur-xl border border-black/10 dark:border-white/10 transition-all duration-300 hover:bg-black/10 dark:hover:bg-white/10 animate-float"
          :style="{ animationDelay: `${index * 0.5}s` }">
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h4
                class="font-newsreader text-lg font-medium text-black dark:text-white transition-colors duration-300 group-hover:text-white">
                {{ project.label }}
              </h4>
              <UIcon name="i-heroicons-arrow-up-right-20-solid"
                class="h-5 w-5 text-black/50 dark:text-white/50 transition-transform duration-300 group-hover:rotate-45 group-hover:text-white" />
            </div>

            <p class="text-sm text-muted line-clamp-3 transition-colors duration-300 group-hover:text-white/90">
              {{ project.content }}
            </p>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <span
              class="text-xs font-mono text-black/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-1 rounded transition-colors duration-300 group-hover:text-white/60 group-hover:bg-white/10">
              {{ project.release }}
            </span>
          </div>
        </NuxtLink>
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
      content: project.content,
    }
  }) || []
})
</script>

<style scoped>
@keyframes float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-15px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
</style>