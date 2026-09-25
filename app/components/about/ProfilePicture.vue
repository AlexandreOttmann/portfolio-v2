<script setup lang="ts">
const { profile } = useAppConfig()
</script>

<template>
  <div class="flex justify-center">
    <Plasma :radius="20" :lean="8" class="group hidden w-64 p-2 pb-4 sm:flex">
      <div class="relative">
        <NuxtImg width="256" :src="profile.picture"
          class="absolute inset-0 size-64 scale-110 rounded-xl object-cover blur-xl grayscale saturate-200 transition-all duration-300 group-hover:blur-[32px] group-hover:grayscale-0"
          alt="Alexandre Ottmann Profile Picture" aria-label="Alexandre Ottmann Profile Picture" />
        <NuxtImg width="256" :src="profile.picture"
          class="relative size-64 rounded-xl object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
          alt="Alexandre Ottmann Profile Picture" aria-label="Alexandre Ottmann Profile Picture" />
      </div>
    </Plasma>
    <Plasma :radius="20" :lean="8" class="group w-64 p-2 pb-4 sm:hidden">
      <NuxtImg width="256" :src="profile.picture" class="size-64 rounded-xl object-cover transition-all duration-300"
        alt="Alexandre Ottmann Profile Picture" aria-label="Alexandre Ottmann Profile Picture" />
    </Plasma>
  </div>
</template>
