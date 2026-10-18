<script setup lang="ts">
/**
 * Dark curtain over the page (above the language switch and the chat bar, z-99
 * and z-60) during the arrival intro, Petit-Oni lighting up
 * in front of it (OniCompanion). Rendered on the server so the page never
 * flashes before it; hidden before the first paint by the head script when the
 * intro won't play. Click, key, wheel or touch skips it. It also lifts on its
 * own if the 3D oni is slow to show up, and with a pure-CSS timeout if JS fails.
 */
const { intro, ready } = useOniCompanion()
const { locale } = useI18n()

const mounted = ref(false)
const gone = ref(false)
/** Without a first 3D frame by then, give up on the intro. */
const NOT_READY_MS = 3500
/** Whatever happens, the page shows by then. */
const MAX_MS = 7000

const skip = () => {
  if (intro.value === 'playing') intro.value = 'done'
}

onMounted(() => {
  mounted.value = true
  setTimeout(() => !ready.value && skip(), NOT_READY_MS)
  setTimeout(skip, MAX_MS)
})

// Once the intro is decided against, or over, fade out (or vanish if it never played).
watch(intro, (value, previous) => {
  if (value === 'done' && previous === 'pending') gone.value = true
}, { flush: 'sync' })

useEventListener(window, 'keydown', skip)
useEventListener(window, 'wheel', skip, { passive: true })
useEventListener(window, 'touchmove', skip, { passive: true })
</script>

<template>
  <div
    v-if="!gone"
    class="oni-curtain fixed inset-0 z-[105] flex items-end justify-center bg-[var(--ui-bg)] pb-10"
    :class="{ 'oni-curtain--js': mounted, 'oni-curtain--leaving': intro === 'done' }"
    aria-hidden="true"
    @click="skip"
    @transitionend.self="intro === 'done' && (gone = true)"
  >
    <p
      v-if="intro === 'playing'"
      class="oni-curtain__hint text-xs text-muted"
    >
      {{ locale === 'fr' ? 'Cliquez pour passer' : 'Click to skip' }}
    </p>
  </div>
</template>

<style scoped>
/* The head script decided the intro won't play: never paint the curtain. */
:global(html[data-oni-intro='skip']) .oni-curtain {
  display: none;
}

/* Safety net if JavaScript never takes over. */
.oni-curtain {
  animation: oni-curtain-failsafe 0.6s ease 7s forwards;
  transition: opacity 0.8s ease;
}

.oni-curtain--js {
  animation: none;
}

.oni-curtain--leaving {
  opacity: 0;
  pointer-events: none;
}

.oni-curtain__hint {
  opacity: 0;
  animation: oni-curtain-hint 0.6s ease 1.2s forwards;
}

@keyframes oni-curtain-failsafe {
  to {
    opacity: 0;
    visibility: hidden;
  }
}

@keyframes oni-curtain-hint {
  to {
    opacity: 0.7;
  }
}
</style>
