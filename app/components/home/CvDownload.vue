<script setup lang="ts">
const { locale } = useI18n()

const cvFiles = {
  en: '/CV ALEXANDRE OTTMANN - ENG.pdf',
  fr: '/CV ALEXANDRE OTTMANN - FR.pdf',
}

const downloadCv = () => {
  const cvPath = cvFiles[locale.value as keyof typeof cvFiles] || cvFiles.en
  const link = document.createElement('a')
  link.href = cvPath
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="flex flex-col items-center gap-6 w-full max-w-2xl">
    <div class="flex flex-col items-center gap-2">
      <h3 class="font-newsreader italic text-white-shadow text-3xl">
        {{ locale === 'fr' ? 'Téléchargez mon CV' : 'Download my CV' }}
      </h3>
      <p class="text-center text-sm font-medium text-muted">
        {{ locale === 'fr'
          ? 'Obtenez une version PDF de mon CV pour en savoir plus sur mon parcours professionnel'
          : 'Get a PDF version of my CV to learn more about my professional background'
        }}
      </p>
    </div>

    <GlassButton as="button" type="button" class="cursor-pointer py-4!" @click="downloadCv">
      <div class="flex items-center gap-4">
        <Icon name="lucide:file-text" class="w-6 h-6" />
        <div class="flex flex-col items-start">
          <span class="font-medium text-base">
            {{ locale === 'fr' ? 'CV Alexandre Ottmann' : 'Alexandre Ottmann CV' }}
          </span>
          <span class="text-xs text-muted">
            {{ locale === 'fr' ? 'Format PDF' : 'PDF Format' }}
          </span>
        </div>
        <Icon name="lucide:download" class="w-5 h-5" />
      </div>
    </GlassButton>
  </div>
</template>
