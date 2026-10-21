<script setup lang="ts">
/** Another visitor's cursor: a small translucent Petit-Oni in their color, with a dot at the exact point. */
defineProps<{ color: string }>()
</script>

<template>
  <div
    class="presence-ghost"
    :style="{ '--ghost': color }"
  >
    <span class="absolute -left-1 -top-1 size-2 rounded-full bg-[var(--ghost)] opacity-80" />
    <svg
      class="presence-ghost__oni absolute left-2 top-2 h-6 w-7"
      viewBox="0 0 120 100"
      fill="none"
      stroke="currentColor"
      stroke-width="7"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M38.5 25.5 L19.5 18 Q14.5 16.5 15.5 21.5 Q17.5 30.5 25 37" />
      <path d="M81.5 25.5 L100.5 18 Q105.5 16.5 104.5 21.5 Q102.5 30.5 95 37" />
      <path d="M41.5 18.5 Q60 8 78.5 18.5" />
      <path d="M22.5 46 Q8 55 22.5 63.5" />
      <path d="M97.5 46 Q112 55 97.5 63.5" />
      <rect
        x="38"
        y="44"
        width="10.5"
        height="19"
        rx="5.25"
        fill="currentColor"
        stroke="none"
      />
      <rect
        x="71.5"
        y="44"
        width="10.5"
        height="19"
        rx="5.25"
        fill="currentColor"
        stroke="none"
      />
      <path d="M34.5 75.5 Q60 101.5 85.5 75.5" />
    </svg>
  </div>
</template>

<style scoped>
.presence-ghost {
  color: var(--ghost);
}

.presence-ghost__oni {
  filter: drop-shadow(0 0 6px var(--ghost));
  animation: ghost-float 2.6s ease-in-out infinite;
}

@keyframes ghost-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@media (prefers-reduced-motion: reduce) {
  .presence-ghost__oni {
    animation: none;
  }
}
</style>
