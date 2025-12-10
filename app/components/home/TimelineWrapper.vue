<template>
    <HomeTimeline v-if="events" :events="events.meta.body" />
</template>

<script setup lang="ts">

import type { Collections } from '@nuxt/content'

const { locale } = useI18n()

const { data: events } = await useAsyncData('timeline_' + locale.value, async () => {
    const collection = ('timeline_' + locale.value) as keyof Collections
    const timeline = await queryCollection(collection).first() as Collections['timeline_en'][] | Collections['timeline_fr'][]
    return timeline
}, {
    watch: [locale],
})

</script>