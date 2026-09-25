<script setup lang="ts">
/**
 * A UCard rendered as a plasma surface: same slots (header, default, footer), the card's
 * own background and ring dropped so the glass shows. Attributes such as `radius` or
 * `frost` fall through to <Plasma>.
 */
defineOptions({ inheritAttrs: false })

const Plasma = resolveComponent('Plasma')
</script>

<template>
  <UCard
    :as="Plasma"
    :radius="16"
    :lean="0"
    :fuse="false"
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
