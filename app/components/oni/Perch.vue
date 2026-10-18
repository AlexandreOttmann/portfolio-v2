<script setup lang="ts">
/**
 * Where the Petit-Oni companion sits (home hero). Shows the flat SVG until the
 * 3D one has drawn its first frame, and for good without WebGL.
 */
const { perch, ready } = useOniCompanion()
const element = ref<HTMLElement | null>(null)

onMounted(() => (perch.value = element.value))
onBeforeUnmount(() => {
  if (perch.value === element.value) perch.value = null
})
</script>

<template>
  <div ref="element">
    <ChatPetitOniAvatar
      v-if="!ready"
      variant="color"
      class="absolute inset-[22%] w-[56%]"
    />
  </div>
</template>
