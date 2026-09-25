<script setup lang="ts">
import type { ChatArticleCard } from '~~/shared/types/chat'

defineProps<{ article: ChatArticleCard }>()
</script>

<template>
  <NuxtLink
    :to="article.path"
    class="group flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 transition-colors hover:border-white/30"
  >
    <img
      v-if="article.image"
      :src="article.image"
      :alt="article.title"
      loading="lazy"
      class="size-16 shrink-0 rounded-lg object-cover"
    >
    <div
      v-else
      class="flex size-16 shrink-0 items-center justify-center rounded-lg bg-white/5"
    >
      <Icon
        name="lucide:notebook-pen"
        class="size-6 text-white/60"
      />
    </div>
    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-white">
        {{ article.title }}
      </p>
      <p class="line-clamp-2 text-xs text-white/60">
        {{ article.description }}
      </p>
    </div>
    <Icon
      name="lucide:arrow-right"
      class="mr-1 size-4 shrink-0 text-white/40 transition-transform group-hover:translate-x-0.5"
    />
  </NuxtLink>
</template>
