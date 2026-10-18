<script setup lang="ts">
import type { Collections } from '@nuxt/content'
import { projectSlugs } from '~~/shared/utils/projects'

/**
 * A project's page. Its header image and title share their view-transition
 * names with the project card, so the card morphs into this page (and back).
 */
const route = useRoute()
const { locale } = useI18n()
const { seo, profile } = useAppConfig()

const slug = computed(() => String(route.params.slug ?? '').toLowerCase())

const { data } = await useAsyncData(`project-page-${locale.value}-${slug.value}`, async () => {
  const projects = await queryCollection(`projects_${locale.value}` as 'projects_fr').all()
  const index = projectSlugs(projects.map(p => p.stem)).indexOf(slug.value)
  const project = projects[index]
  if (!project) return null
  const content = await queryCollection(`project_content_${locale.value}` as keyof Collections)
    .where('stem', '=', project.stem.replace(/\/data$/, '/content'))
    .first()
  return { project, content }
}, { watch: [locale] })

if (!data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })
}

const project = computed(() => data.value!.project)
const imageName = computed(() => projectTransitionName(slug.value, 'image'))
const titleName = computed(() => projectTransitionName(slug.value, 'title'))

const imageUrl = computed(() => project.value.image.startsWith('http') ? project.value.image : `${seo.url ?? 'https://alexottmann.com'}${project.value.image}`)
// Same title format as the other pages (FolioMeta): "Name | Portfolio…".
useHead({ title: () => project.value.name, titleTemplate: `%s | ${seo.title}` })
useSeoMeta({
  description: () => project.value.content,
  ogTitle: () => project.value.name,
  ogDescription: () => project.value.content,
  ogImage: imageUrl,
  twitterCard: 'summary_large_image',
  twitterImage: imageUrl,
  author: profile.name,
})
</script>

<template>
  <article class="mx-auto mt-8 flex max-w-4xl flex-col gap-6 px-4 pb-40 sm:mt-20 sm:px-7">
    <NuxtLinkLocale
      to="/works"
      class="project-page__fade inline-flex w-fit items-center gap-2 text-muted transition-colors duration-200 hover:text-primary group"
    >
      <UIcon
        name="lucide:arrow-left"
        class="size-4 transition-transform duration-200 group-hover:-translate-x-1"
      />
      <span class="text-sm font-extralight">{{ locale === 'fr' ? 'Projets' : 'Projects' }}</span>
    </NuxtLinkLocale>

    <!-- Morph target of the card's image -->
    <div
      class="project-vt-image relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-zinc-950/50"
      :style="{ viewTransitionName: imageName }"
    >
      <NuxtImg
        :src="project.image"
        width="1536"
        :alt="project.name"
        class="size-full object-cover"
      />
    </div>

    <header class="flex flex-col gap-3">
      <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1
          class="w-fit text-4xl font-semibold text-primary"
          :style="{ viewTransitionName: titleName }"
        >
          {{ project.name }}
        </h1>
        <span class="project-page__fade font-newsreader text-lg italic text-muted">{{ project.release }}</span>
      </div>
      <p
        v-if="project.content"
        class="project-page__fade max-w-2xl text-muted"
      >
        {{ project.content }}
      </p>
      <div class="project-page__fade flex flex-wrap items-center gap-2">
        <UBadge
          v-for="tech in project.stack ?? []"
          :key="tech"
          color="neutral"
          variant="outline"
        >
          {{ tech }}
        </UBadge>
        <UButton
          :to="project.link"
          target="_blank"
          icon="heroicons:arrow-top-right-on-square"
          color="neutral"
          variant="solid"
          size="sm"
          class="ml-auto"
        >
          {{ locale === 'fr' ? 'Visiter le site' : 'Visit website' }}
        </UButton>
      </div>
    </header>

    <Divider />

    <div
      v-if="data?.content"
      class="project-page__fade prose prose-invert max-w-none"
    >
      <ContentRenderer :value="data.content" />
    </div>
  </article>
</template>

<style scoped>
/* What isn't part of the morph eases in once the card has become the header. */
.project-page__fade {
  animation: project-page-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both;
}

@keyframes project-page-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .project-page__fade {
    animation: none;
  }
}
</style>
