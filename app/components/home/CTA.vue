<script setup lang="ts">
const { t } = useI18n()
const color = useColorMode()
const isDark = computed(() => color.value === 'dark')
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 sm:gap-2">
    <div class="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-2">
      <UTooltip :text="$t('global.email')" :shortcuts="['⌘', 'O']">
        <SpotlightButton>
          <NuxtLinkLocale
            class="font-mona relative flex items-center justify-center gap-2  text-lg font-medium  transition-all duration-200"
            :class="isDark ? 'bg-gradient-to-b from-white/25 to-white bg-clip-text text-transparent' : 'bg-gradient-to-b from-muted/25 to-muted bg-clip-text text-muted'"
            to="/contact">
            {{ t("global.contact") }}
            <UIcon name="heroicons-envelope" class="size-5 text-muted" />
          </NuxtLinkLocale>
        </SpotlightButton>
      </UTooltip>
      <MeetingButton />
    </div>
  </div>
</template>
