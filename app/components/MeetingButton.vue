<script setup lang="ts">
const meetingLink = useAppConfig().global.meetingLink
const color = useColorMode()

const isDark = computed(() => color.value === 'dark')
</script>

<template>
  <div class="flex gap-4 sm:gap-2">
    <SpotlightButton>
      <NuxtLink
        class="font-mona relative flex items-center justify-center gap-2  text-lg font-medium  transition-all duration-200"
        :class="isDark ? 'bg-gradient-to-b from-white/25 to-white bg-clip-text text-transparent' : 'bg-gradient-to-b from-muted/25 to-muted bg-clip-text text-muted'"
        :to="meetingLink">
        {{ $t("global.meeting") }}
        <UIcon name="heroicons:calendar-days" :class="isDark ? 'text-white/80' : 'text-muted'" />
      </NuxtLink>
    </SpotlightButton>
  </div>
</template>
