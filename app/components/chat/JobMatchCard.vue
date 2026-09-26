<script setup lang="ts">
import type { ChatJobMatch, JobMatchVerdict } from '~~/shared/types/chat'

const props = defineProps<{ match: ChatJobMatch }>()

const { locale } = useI18n()
const localePath = useLocalePath()
const appConfig = useAppConfig()
const { run } = useSitePilot()

const t = (fr: string, en: string) => locale.value === 'fr' ? fr : en

const VERDICTS: Record<JobMatchVerdict, { fr: string, en: string, class: string }> = {
  excellent: { fr: 'Très bonne adéquation', en: 'Excellent fit', class: 'bg-emerald-400/15 text-emerald-300 ring-emerald-400/30' },
  good: { fr: 'Bonne adéquation', en: 'Good fit', class: 'bg-sky-400/15 text-sky-300 ring-sky-400/30' },
  partial: { fr: 'Adéquation partielle', en: 'Partial fit', class: 'bg-amber-400/15 text-amber-300 ring-amber-400/30' },
  low: { fr: 'Adéquation faible', en: 'Low fit', class: 'bg-rose-400/15 text-rose-300 ring-rose-400/30' },
}

const verdict = computed(() => VERDICTS[props.match.verdict])
const coverage = computed(() => props.match.total ? Math.round(((props.match.met + props.match.partial / 2) / props.match.total) * 100) : 0)

const STATUS = {
  met: { icon: 'lucide:circle-check', class: 'text-emerald-400' },
  partial: { icon: 'lucide:circle-dot', class: 'text-amber-400' },
  gap: { icon: 'lucide:circle-x', class: 'text-rose-400' },
} as const

const openProject = (project: ChatJobMatch['requirements'][number]['projects'][number]) => run({
  kind: 'open-project',
  stem: project.stem,
  label: t('Ouverture de ', 'Opening ') + project.name,
})
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
    <!-- Header: role, verdict, coverage -->
    <div class="flex flex-col gap-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="text-xs uppercase tracking-wide text-white/40">
            {{ t('Adéquation avec l\'offre', 'Fit with the offer') }}
          </p>
          <p class="text-sm font-medium text-white">
            {{ match.role }}<span
              v-if="match.company"
              class="text-white/50"
            > · {{ match.company }}</span>
          </p>
        </div>
        <span
          class="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1"
          :class="verdict.class"
        >
          {{ locale === 'fr' ? verdict.fr : verdict.en }}
        </span>
      </div>
      <div class="flex items-center gap-3">
        <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            class="h-full rounded-full bg-white/70 transition-[width] duration-700"
            :style="{ width: `${coverage}%` }"
          />
        </div>
        <span class="shrink-0 text-xs text-white/60">
          {{ t(`${match.met} / ${match.total} exigence${match.total > 1 ? 's' : ''} couverte${match.met > 1 ? 's' : ''}`, `${match.met} / ${match.total} requirements met`) }}<template v-if="match.partial">{{ t(`, ${match.partial} partielle${match.partial > 1 ? 's' : ''}`, `, ${match.partial} partial`) }}</template>
        </span>
      </div>
      <p class="text-sm leading-relaxed text-white/75">
        {{ match.summary }}
      </p>
    </div>

    <!-- Requirements -->
    <ul class="flex flex-col gap-2.5">
      <li
        v-for="item in match.requirements"
        :key="item.requirement"
        class="flex gap-2.5"
      >
        <Icon
          :name="STATUS[item.status].icon"
          class="mt-0.5 size-4 shrink-0"
          :class="STATUS[item.status].class"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-white/90">
            {{ item.requirement }}
          </p>
          <p class="text-xs leading-relaxed text-white/60">
            {{ item.evidence }}
          </p>
          <div
            v-if="item.projects.length"
            class="mt-1.5 flex flex-wrap gap-1.5"
          >
            <button
              v-for="project in item.projects"
              :key="project.slug"
              class="flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/70 transition-colors hover:border-white/30 hover:text-white"
              :title="t('Voir le projet sur le site', 'Show the project on the site')"
              @click="openProject(project)"
            >
              <Icon
                name="lucide:panel-right-open"
                class="size-3"
              />
              {{ project.name }}
            </button>
          </div>
        </div>
      </li>
    </ul>

    <!-- Next step -->
    <div class="flex flex-wrap gap-2 border-t border-white/10 pt-3">
      <UButton
        size="sm"
        color="neutral"
        variant="solid"
        icon="lucide:calendar"
        :to="appConfig.global.meetingLink"
        target="_blank"
        external
      >
        {{ t('Échanger avec Alex sur ce poste', 'Talk to Alex about this role') }}
      </UButton>
      <UButton
        size="sm"
        color="neutral"
        variant="ghost"
        icon="lucide:mail"
        :to="localePath('/contact')"
      >
        {{ t('Formulaire de contact', 'Contact form') }}
      </UButton>
    </div>
  </div>
</template>
