<template>
    <UModal v-model:open="isOpen" :ui="{ content: 'max-w-4xl sm:max-w-4xl' }">
        <template #content>
            <div v-if="project"
                class="relative flex flex-col overflow-hidden rounded-lg bg-dialog-bg shadow-xl max-h-[90vh]">
                <!-- Header Image -->
                <div class="relative h-64 w-full shrink-0 overflow-hidden sm:h-80">
                    <NuxtImg :src="project.image" :alt="project.name" class="h-full w-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    <div class="absolute bottom-4 left-4 right-4">
                        <h2 class="text-3xl font-bold text-white">{{ project.name }}</h2>
                        <p class="text-zinc-300">{{ project.release }}</p>
                    </div>
                    <UButton icon="heroicons:x-mark" color="neutral" variant="ghost" class="absolute right-4 top-4 z-10"
                        @click="isOpen = false" />
                </div>

                <div class="flex-1 overflow-y-auto p-6">
                    <!-- Stack -->
                    <div v-if="project.stack && project.stack.length" class="mb-6 flex flex-wrap gap-2">
                        <UBadge v-for="tech in project.stack" :key="tech" color="neutral" variant="outline">
                            {{ tech }}
                        </UBadge>
                    </div>

                    <!-- Content -->
                    <div class="prose prose-invert max-w-none">
                        <div v-if="status === 'pending'" class="py-10 text-center">
                            <UIcon name="heroicons:arrow-path" class="animate-spin text-2xl" />
                        </div>
                        <ContentRenderer v-else-if="content" :value="content" />
                        <div v-else class="text-zinc-500">
                            <p>{{ project.content }}</p> <!-- Fallback to short description if no MD -->
                        </div>
                    </div>
                </div>

                <!-- Footer Link -->
                <div class="shrink-0 border-t border-white/10 p-4 flex justify-end bg-zinc-900">
                    <UButton :to="project.link" target="_blank" icon="heroicons:arrow-top-right-on-square"
                        color="neutral" variant="solid">
                        {{ locale === 'fr' ? 'Visiter le site' : 'Visit Website' }}
                    </UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>
<script setup lang="ts">
import type { Collections } from '@nuxt/content'

const props = defineProps<{
    open: boolean
    project: Collections['projects_en'] | Collections['projects_fr']
}>()

const emit = defineEmits(['update:open'])

const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value),
})

const { locale } = useI18n()
console.log('collection', props.project)
const { data: content, status } = await useAsyncData(
    `project-content-${props.project.name}-${locale.value}`,
    async () => {
        console.log('In AsyncData', props, locale.value)
        if (!props.project) return null
        // project.stem is like 'fr/projects/1.quantedsquare/data'
        // we need 'fr/projects/1.quantedsquare/content'
        const contentPath = props.project.stem.replace('/data', '/content')
        console.log('contentPath', contentPath)
        const collection = ('project_content_' + locale.value) as keyof Collections
        console.log('collection', collection)
        const content = await queryCollection(collection).where('stem', '=', contentPath).first()
        console.log('content fetched', content)
        return content
    },
    {
        watch: [() => props.project, locale],
    }
)
watch(() => props.project, () => {
    console.log('project changed', props.project, 'CONTENT', content.value)
})
</script>
