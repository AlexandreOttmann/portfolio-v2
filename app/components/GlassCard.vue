<script setup lang="ts">
/**
 * A UCard rendered as a GlassSurface: same slots (header, default, footer), the card's
 * own background and ring dropped so the glass shows, the rim lit by the spectrum on
 * hover. Attributes such as `variant` or `frost` fall through.
 */
defineOptions({ inheritAttrs: false })

const GlassSurface = resolveComponent('GlassSurface')
</script>

<template>
  <UCard
    :as="GlassSurface"
    interactive
    v-bind="$attrs"
    :ui="{ root: 'bg-transparent ring-0 rounded-2xl divide-white/10' }"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps || {}"
      />
    </template>
  </UCard>
</template>
