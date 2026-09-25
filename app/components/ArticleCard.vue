<script setup lang="ts">
const NuxtLink = resolveComponent('NuxtLink')

defineProps({
  title: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <Plasma
    :as="NuxtLink"
    :to="path"
    :aria-label="title"
    :radius="16"
    :lean="6"
    :fuse="false"
    class="flex cursor-pointer flex-col gap-2 p-2 pb-3"
  >
    <div class="overflow-hidden rounded-xl">
      <NuxtImg
        width="1536"
        :alt="`${title} article image`"
        class="h-64 w-full object-cover transition-transform duration-200 hover:scale-105"
        :src="image"
        :aria-label="`${title} article image`"
      />
    </div>
    <div class="flex flex-col px-2">
      <h3 class="text-lg font-semibold">
        {{ title }}
      </h3>
      <span class="text-xs text-muted">{{ date }}</span>
    </div>
  </Plasma>
</template>
