<template>
  <section class="relative pt-12">
    <!-- grid -->
    <!-- <div class="pointer-events-none absolute inset-0 bg-center bg-grid-white/10 bg-grid-16 " /> -->

    <div class="relative mx-auto flex max-w-7xl flex-col justify-center gap-4 px-4 py-8 sm:px-6 lg:px-8 lg:py-16">
      <!-- spotlight -->
      <div
        class="rainbow-spotlight absolute -top-8 left-1/2 size-72 -translate-x-1/2 rounded-full blur-[120px] lg:-top-8 lg:size-[32rem] lg:blur-[200px]" />

      <!-- profile picture -->
      <HomeProfilePicture />
      <Motion :initial="{
        scale: 1.1,
        opacity: 0,
        filter: 'blur(20px)',
      }" :animate="{
        scale: 1,
        opacity: 1,
        filter: 'blur(0px)',
      }" :transition="{
        duration: 0.6,
      }">

        <div class="z-20 flex flex-col items-center justify-center">
          <!-- title -->
          <div class="font-geist" style="--stagger: 1; --delay: 10ms" data-animate>
            <h1 :class="isDark ? 'from-white/90 to-white/30' : 'from-black/80 to-black/50'"
              class="mx-auto font-medium text-center text-pretty bg-gradient-to-b bg-clip-text text-3xl text-transparent lg:max-w-3xl lg:text-4xl">
              <slot name="hero_title" mdc-unwrap="p" />
            </h1>

            <!-- subtitle -->
            <h2 class="mx-auto mt-4 max-w-xl text-center text-lg antialiased text-muted">
              <slot name="hero_subtitle" mdc-unwrap="p" />
            </h2>
          </div>

          <SettingsAvailability background class="mt-2" style="--stagger: 2" data-animate />

          <!-- social -->
          <HomeSocial style="--stagger: 3" data-animate />

          <!-- cta -->
          <HomeCTA style="--stagger: 4" data-animate />

          <div style="--stagger: 5" data-animate class="mt-12 flex w-full max-w-3xl flex-col gap-4 lg:mt-16">
            <!-- timeline -->
            <HomeTimelineWrapper />
            <!-- projects -->
            <HomeProjects />
          </div>

          <Divider class="my-9" />

          <HomeCvDownload style="--stagger: 7" data-animate />
        </div>
      </Motion>
    </div>
  </section>
</template>
<script setup>

const color = useColorMode()
const isDark = computed(() => color.value === 'dark')
</script>

<style scoped>
/* Rainbow spotlight animation for light mode */
@keyframes rainbow-rotate {
  0% {
    background-position: 0% 50%;
  }

  100% {
    background-position: 200% 50%;
  }
}

.rainbow-spotlight {
  background: linear-gradient(90deg,
      #ff0080,
      #ff8c00,
      #40e0d0,
      #4169e1,
      #9370db,
      #ff1493,
      #ff0080);
  background-size: 200% 100%;
  animation: rainbow-rotate 3s linear infinite;
  opacity: 0.3;
}
</style>