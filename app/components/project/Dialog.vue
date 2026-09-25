<template>
    <!-- With the assistant docked beside it: no overlay nor focus trap, so the chat stays usable, and shifted left to make room. -->
    <UModal v-model:open="isOpen" :modal="!chatDocked" :overlay="!chatDocked" :dismissible="!chatDocked"
        :ui="{ content: 'max-w-4xl sm:max-w-4xl bg-muted/80 backdrop-blur-xs lg:left-[calc(50%-var(--chat-dock-offset,0px)/2)] lg:max-w-[min(56rem,calc(100vw-var(--chat-dock-offset,0px)-3rem))]' }">
        <template #content>
            <div v-if="project"
                class="relative flex flex-col overflow-hidden rounded-lg bg-card-bg/50 shadow-xl max-h-[100vh]">
                <!-- Noise -->
                <div class="pointer-events-none fixed inset-0 z-40 size-full overflow-hidden">
                    <div
                        class="noise pointer-events-none absolute inset-[-200%] z-50 size-[400%] bg-[url('/noise.png')] opacity-[4%]" />
                </div>
                <!-- Header Image -->
                <div class="relative h-64 w-full shrink-0 overflow-hidden sm:h-50 ">
                    <NuxtImg :src="project.image" :alt="project.name" class="h-full w-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent" />
                    <div class="absolute bottom-4 left-4 right-4">
                        <h2 class="text-3xl font-bold text-white">{{ project.name }}</h2>
                        <p class="text-zinc-300">{{ project.release }}</p>
                    </div>
                    <UButton icon="heroicons:x-mark" color="neutral" variant="ghost" class="absolute right-4 top-4 z-10"
                        @click="isOpen = false" />
                </div>

                <div class="flex-1 overflow-y-auto p-6 bg-card-bg/50">
                    <!-- Stack -->
                    <div v-if="project.stack && project.stack.length" class="mb-6 flex flex-wrap gap-2">
                        <UBadge v-for="tech in project.stack" :key="tech" color="neutral" variant="outline">
                            {{ tech }}
                        </UBadge>
                    </div>

                    <!-- Content -->
                    <div class="prose prose-invert max-w-none mb-10">
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
                <div
                    class="fixed left-0 right-0 shrink-0 border-t border-white/10 p-4 flex justify-end bg-card/50 backdrop-blur-xs"
                    :class="chatMinimizedOnMobile ? 'bottom-16' : 'bottom-0'">
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
const { isDocked: chatDocked, mode: chatMode, isDesktop } = useSitePilot()
// Keep the footer above the minimized chat card on small screens.
const chatMinimizedOnMobile = computed(() => chatMode.value === 'minimized' && !isDesktop.value)
console.log('collection', props.project)
const { data: content, status } = await useAsyncData(
    `project-content-${props.project.name}-${locale.value}`,
    async () => {
        console.log('In AsyncData', props, locale.value)
        if (!props.project) return null
        // project.stem is like 'fr/projects/1.quantedsquare/data'
        // we need 'fr/projects/1.quantedsquare/content'
        if (props.project?.src?.includes('/articles/')) {
            console.log('In articles', props.project.src)
            const collection = 'articles_' + locale.value
            const article = await queryCollection(collection).where('stem', '=', props.project.src).first()
            console.log('article fetched', article)
            return article

        } else {

            const contentPath = props.project.stem.replace('/data', '/content')
            console.log('props.project', props.project)
            console.log('contentPath', contentPath)
            const collection = ('project_content_' + locale.value) as keyof Collections
            console.log('collection', collection)
            const content = await queryCollection(collection).where('stem', '=', contentPath).first()
            console.log('content fetched', content)
            return content
        }
    },
    {
        watch: [() => props.project, locale],
    }
)
watch(() => props.project, () => {
    console.log('project changed', props.project, 'CONTENT', content.value)
})
</script>
