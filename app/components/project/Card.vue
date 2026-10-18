<script setup lang="ts">
import type { ProjectTransitionPart } from '~/composables/useProjectTransition'

const props = defineProps<{
  project: {
    name: string
    release: string
    image: string
    link: string
  }
  /** Project page: /works/<slug>. */
  slug: string
}>()
const img = useImage()
const color = useColorMode()
const isDark = computed(() => color.value === 'dark')
const localePath = useLocalePath()

// A real link (crawlable, middle-click opens a tab); a plain click morphs the card into the page.
const { openProject, lastProject } = useProjectTransition()
const root = ref<HTMLElement | null>(null)
const open = (event: MouseEvent) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
  event.preventDefault()
  openProject(props.slug, root.value)
}
// Back from its page: this card takes the names again, so the header morphs back into it.
const morphBack = (part: ProjectTransitionPart) => lastProject.value === props.slug
  ? { viewTransitionName: projectTransitionName(props.slug, part) }
  : undefined
</script>

<template>
  <a
    ref="root"
    :href="localePath(`/works/${slug}`)"
    :aria-label="project.name + ' project details'"
    data-oni-curious
    class="group relative flex cursor-pointer flex-col gap-1 rounded-lg border bg-muted p-1 shadow-2xl shadow-zinc-950/50 backdrop-blur-sm"
    :class="isDark ? 'border-white/10' : 'border-inverted/10'"
    @click="open"
  >
    <div class="flex gap-1 px-1 py-[2px]">
      <div
        class="size-2 rounded-full bg-red-500/90 transition-all duration-300 group-hover:bg-red-500/90 sm:bg-inverted/10" />
      <div
        class="size-2 rounded-full bg-yellow-500/90 transition-all duration-300 group-hover:bg-yellow-500/90 sm:bg-inverted/10" />
      <div
        class="size-2 rounded-full bg-green-500/90 transition-all duration-300 group-hover:bg-green-500/90 sm:bg-inverted/10" />
    </div>
    <div
      data-vt="image"
      class="project-vt-image flex h-56 justify-center overflow-hidden rounded-lg border border-primary/10"
      :style="morphBack('image')"
    >
      <NuxtImg :placeholder="img(`${project.image}`)" width="1536" :alt="project.name + ' project image'"
        class="h-full w-full rounded-lg object-cover transition-all duration-300 hover:scale-105" :src="project.image"
        :aria-label="project.name + ' project image'" />
    </div>
    <div class="absolute bottom-0 flex w-full justify-center">
      <div
        class="rounded-t-lg border-x border-t border-white/10 border-b-transparent px-4 py-[5px] shadow-md backdrop-blur-md sm:w-2/3 bg-zinc-900/40">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2">
              <span
                data-vt="title"
                class="whitespace-nowrap text-sm font-semibold text-white/90"
                :style="morphBack('title')"
              >
                {{ project.name }}
              </span>
              <span class="whitespace-nowrap text-xs text-white/60 text-shadow">
                {{ project.release === "soon" ? $t("global.soon") + "..." : project.release }}
              </span>
            </div>
          </div>
          <div
            class="flex items-center justify-center rounded-full border border-transparent p-1 shadow-md backdrop-blur-md transition-all duration-500 group-hover:-rotate-45 group-hover:border-white/10">
            <UIcon name="heroicons:arrow-right" class="size-3 text-white" />
          </div>
        </div>
      </div>
    </div>
  </a>
</template>
<style scoped>
.text-shadow {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, .3) !important;
}
</style>
