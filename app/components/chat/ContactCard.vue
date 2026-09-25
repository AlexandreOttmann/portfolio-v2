<script setup lang="ts">
const { locale } = useI18n()
const localePath = useLocalePath()
const appConfig = useAppConfig()

const t = (fr: string, en: string) => locale.value === 'fr' ? fr : en

const cvPath = computed(() => locale.value === 'fr' ? '/CV ALEXANDRE OTTMANN - FR.pdf' : '/CV ALEXANDRE OTTMANN - ENG.pdf')

const actions = computed(() => [
  { label: t('Formulaire de contact', 'Contact form'), icon: 'lucide:mail', to: localePath('/contact'), external: false },
  { label: t('Réserver un appel', 'Book a call'), icon: 'lucide:calendar', to: appConfig.global.meetingLink, external: true },
  { label: 'LinkedIn', icon: 'custom:linkedin', to: appConfig.socials.linkedin, external: true },
  { label: t('Télécharger le CV', 'Download CV'), icon: 'lucide:file-text', to: encodeURI(cvPath.value), external: true },
])
</script>

<template>
  <div class="grid grid-cols-2 gap-2">
    <UButton
      v-for="action in actions"
      :key="action.label"
      :to="action.to"
      :target="action.external ? '_blank' : undefined"
      :external="action.external"
      :icon="action.icon"
      color="neutral"
      variant="outline"
      size="sm"
      class="justify-start border-white/10 hover:border-white/30"
    >
      {{ action.label }}
    </UButton>
  </div>
</template>
