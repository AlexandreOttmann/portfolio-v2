<script setup lang="ts">
const appConfig = useAppConfig().global

const currentAvailability = computed(() => {
  return [
    {
      status: 'available',
      message: 'Available for hire',
      color: 'rainbow-gradient',
      bgColor: 'rainbow-gradient',
      textColor: 'rainbow-gradient-text',
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
  <div class="flex items-center rounded-full"
    :class="{ 'border border-muted/50 bg-secondary/80 px-5 py-2 backdrop-blur-3xl': background }">
    <span class="relative flex size-3">
      <span class="absolute inline-flex size-full animate-ping rounded-full opacity-75"
        :class="currentAvailability!.color" />
      <span class="relative inline-flex size-3 scale-90 rounded-full" :class="currentAvailability!.bgColor" />
    </span>
    <span class="ml-2 text-sm font-medium" :class="currentAvailability!.textColor">
      {{ $t("global." + currentAvailability!.status) }}
    </span>
  </div>
</template>

<style scoped>
/* Rainbow gradient animation */
@keyframes rainbow-slide {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.rainbow-gradient {
  background: linear-gradient(90deg,
      #ff0080,
      #ff8c00,
      #40e0d0,
      #4169e1,
      #9370db,
      #ff1493,
      #ff0080);
  background-size: 200% 100%;
  animation: rainbow-slide 3s linear infinite;
}

.rainbow-gradient-text {
  background: linear-gradient(90deg,
      #ff0080,
      #ff8c00,
      #40e0d0,
      #4169e1,
      #9370db,
      #ff1493,
      #ff0080);
  background-size: 200% 100%;
  animation: rainbow-slide 3s linear infinite;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
</style>
