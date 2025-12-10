<template>
    <div class="fixed bottom-0 top-100 left-0 w-full h-full overflow-hidden bg-red-500/20">
        <UMarquee reverse orientation="vertical" :overlay="false" :ui="{
            root: '[--duration:40s] fixed w-[460px] -left-[400px] -top-[200px] h-[2540px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
        }">
            <LazyNuxtImg v-for="i in 4" :key="i" :src="`/blocks/images${i}.jpg`" width="460" height="258"
                :alt="`Nuxt UI Screenshot ${i}`" class="aspect-video border border-default rounded-lg bg-transparent"
                placeholder placeholder-class="bg-grey-200 blur-md" />
        </UMarquee>
        <UMarquee orientation="vertical" :overlay="false" :ui="{
            root: '[--duration:40s] fixed w-[460px] -top-[360px] left-[550px] h-[2160px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
        }">
            <LazyNuxtImg v-for="i in [5, 6, 7, 8]" :key="i" :src="`/blocks/images${i}.jpg`" width="460" height="258"
                :alt="`Nuxt UI Screenshot ${i}`" class="aspect-video border border-default rounded-lg bg-transparent"
                placeholder placeholder-class="bg-grey-200 blur-md" />
        </UMarquee>
        <UMarquee reverse orientation="vertical" :overlay="false" :ui="{
            root: 'hidden md:flex [--duration:40s] fixed w-[460px] -top-[300px] left-[1080px] h-[2160px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
        }">
            <LazyNuxtImg v-for="i in [9, 10, 11, 12]" :key="i" :src="`/blocks/images${i}.jpg`" width="460" height="258"
                :alt="`Nuxt UI Screenshot ${i}`" class="aspect-video border border-default rounded-lg bg-transparent"
                placeholder placeholder-class="bg-grey-200 blur-md" />
        </UMarquee>
        <UMarquee orientation="vertical" :overlay="false" :ui="{
            root: 'hidden md:flex [--duration:40s] fixed w-[460px] -top-[300px] left-[1680px] h-[2160px] transform-3d rotate-x-55 rotate-y-0 rotate-z-30'
        }">
            <LazyNuxtImg v-for="i in 4" :key="i" :src="`/blocks/images${i}.jpg`" width="460" height="258"
                :alt="`Nuxt UI Screenshot ${i}`" class="aspect-video border border-default rounded-lg bg-transparent"
                placeholder placeholder-class="bg-grey-200 blur-md" />
        </UMarquee>
    </div>
</template>