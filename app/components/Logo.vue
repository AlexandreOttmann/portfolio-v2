<script setup lang="ts">
const { appName } = useAppConfig()

defineProps({
  isText: {
    type: Boolean,
    default: false,
  },
  to: {
    type: String,
    default: '/',
  },
})
</script>

<template>
  <NuxtLinkLocale :to="to" class="flex shrink-0 items-center" aria-label="Go back to home page">
    <img src="/onicon-dark.png" alt="Petit-Oni" class="size-6">
    <span v-if="isText" class="ml-1 text-xs font-semibold">
      {{ appName }}
    </span>
  </NuxtLinkLocale>
</template>
