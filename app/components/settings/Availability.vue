<script setup lang="ts">
const appConfig = useAppConfig().global
const GlassSurface = resolveComponent('GlassSurface')

const currentAvailability = computed(() => {
  return [
    {
      status: 'available',
      message: 'Available for hire',
      color: 'spectrum-bg',
      bgColor: 'spectrum-bg',
      textColor: 'spectrum-text',
    },
    {
      status: 'unavailable',
      message: 'Not available for hire',
      color: 'bg-red-500',
      bgColor: 'bg-red-400',
      textColor: 'text-red-400',
    },
  ][appConfig.available ? 0 : 1]
})

defineProps({
  background: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <component
    :is="background ? GlassSurface : 'div'"
    class="flex items-center"
    :class="{ 'px-5 py-2': background }"
    v-bind="background ? { variant: 'control' } : {}"
  >
    <span class="relative flex size-3">
      <span class="absolute inline-flex size-full animate-ping rounded-full opacity-75"
        :class="currentAvailability!.color" />
      <span class="relative inline-flex size-3 scale-90 rounded-full" :class="currentAvailability!.bgColor" />
    </span>
    <span class="ml-2 text-sm font-medium" :class="currentAvailability!.textColor">
      {{ $t("global." + currentAvailability!.status) }}
    </span>
  </component>
</template>
