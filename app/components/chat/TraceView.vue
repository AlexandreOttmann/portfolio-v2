<script setup lang="ts">
import type { MessageTrace, TraceStep } from '~/composables/useAiChat'

/**
 * "Glass box" under an answer: which model answered and why, each model round
 * trip and tool call on a timeline, tokens (and prompt cache), latency and cost.
 * Folded by default to a one-line summary.
 */
const props = defineProps<{
  trace: MessageTrace
  /** The answer is still streaming: bars grow live. */
  live: boolean
}>()
const open = defineModel<boolean>('open', { default: false })

const { locale } = useI18n()
const t = (fr: string, en: string) => locale.value === 'fr' ? fr : en

// Live bars: re-render ~10 times a second while the answer streams and the panel is open.
const now = useNow({ interval: 100, controls: true })
watchEffect(() => (props.live && open.value ? now.resume() : now.pause()))
const elapsed = computed(() => {
  void now.now.value
  return props.trace.totalMs ?? Math.round(performance.now() - props.trace.startedAt)
})

/** "claude-haiku-4-5" → "Claude Haiku 4.5" */
const modelName = computed(() => {
  const model = props.trace.model
  if (!model) return null
  const [family, ...version] = model.replace(/^claude-/, '').split('-')
  return `Claude ${family!.charAt(0).toUpperCase()}${family!.slice(1)} ${version.join('.')}`.trim()
})

const reasonLabel = computed(() => {
  switch (props.trace.reason) {
    case 'job-offer': return t('offre d\'emploi : modèle d\'analyse', 'job offer: analysis model')
    case 'link': return t('lien à lire : modèle d\'analyse', 'link to read: analysis model')
    case 'long-message': return t('long message : modèle d\'analyse', 'long message: analysis model')
    case 'question': return t('question courante : modèle rapide et économique', 'everyday question: fast, cheap model')
    default: return null
  }
})

const numberFormat = computed(() => new Intl.NumberFormat(locale.value))
const seconds = (ms: number) => ms < 1000 ? `${ms} ms` : `${new Intl.NumberFormat(locale.value, { maximumFractionDigits: 1 }).format(ms / 1000)} s`
const cost = computed(() => {
  const value = props.trace.cost
  if (value === undefined) return null
  if (value === 0) return '0 $'
  return `${new Intl.NumberFormat(locale.value, { maximumSignificantDigits: 2 }).format(value)} $`
})

const usage = computed(() => {
  const u = props.trace.usage
  if (!u) return null
  const input = u.input + u.cacheWrite + u.cacheRead
  return { input, output: u.output, cachedShare: input ? Math.round((u.cacheRead / input) * 100) : 0 }
})

const stepLabel = (step: TraceStep) => {
  if (step.kind === 'tool') return step.name
  return step.step === 'follow-ups' ? t('modèle · suggestions', 'model · suggestions') : t(`modèle · tour ${step.step}`, `model · round ${step.step}`)
}

const bars = computed(() => {
  const total = Math.max(elapsed.value, 1)
  return props.trace.steps.map((step) => {
    const end = step.endMs ?? elapsed.value
    return {
      step,
      left: (step.startMs / total) * 100,
      // At least a sliver, so instant steps stay visible.
      width: Math.max(((end - step.startMs) / total) * 100, 1.2),
      duration: step.endMs === undefined ? null : step.endMs - step.startMs,
      failed: step.kind === 'tool' && step.ok === false,
    }
  })
})

const expanded = ref<string | null>(null)

const summary = computed(() => [
  modelName.value,
  props.trace.cached ? t('réponse en cache', 'cached answer') : null,
  props.live ? t('en cours…', 'running…') : seconds(elapsed.value),
  cost.value,
].filter(Boolean).join(' · '))
</script>

<template>
  <div class="mt-3 border-t border-white/10 pt-2">
    <button
      type="button"
      class="flex w-full items-center gap-2 text-left text-[11px] text-white/45 transition-colors hover:text-white/80"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Icon
        name="lucide:scan-eye"
        class="size-3.5 shrink-0"
      />
      <span class="shrink-0 whitespace-nowrap font-medium">{{ t('Dans les coulisses', 'Behind the scenes') }}</span>
      <span
        v-if="!open && summary"
        class="truncate font-mono text-white/35"
      >{{ summary }}</span>
      <Icon
        name="lucide:chevron-down"
        class="ml-auto size-3.5 shrink-0 transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      class="mt-3 flex flex-col gap-3 text-xs text-white/70"
    >
      <!-- Routing -->
      <div
        v-if="modelName"
        class="flex flex-wrap items-center gap-2"
      >
        <span class="rounded-full border border-[#F75474]/40 bg-[#F75474]/10 px-2 py-0.5 font-mono text-[11px] text-[#ff8ea4]">{{ modelName }}</span>
        <span class="text-white/50">{{ reasonLabel }}</span>
        <span
          v-if="trace.cached"
          class="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] text-emerald-300"
        >{{ t('déjà posée : rejouée depuis le cache', 'asked before: replayed from cache') }}</span>
      </div>

      <!-- Timeline: model round trips (pink) and tool calls (blue) -->
      <ol
        v-if="bars.length"
        class="flex flex-col gap-1.5"
        :aria-label="t('Chronologie de la réponse', 'Answer timeline')"
      >
        <li
          v-for="bar in bars"
          :key="bar.step.id"
        >
          <button
            type="button"
            class="grid w-full grid-cols-[8.5rem_1fr_3.25rem] items-center gap-2 text-left"
            :class="bar.step.kind === 'tool' && bar.step.input !== undefined ? 'cursor-pointer' : 'cursor-default'"
            :disabled="!(bar.step.kind === 'tool' && bar.step.input !== undefined)"
            @click="expanded = expanded === bar.step.id ? null : bar.step.id"
          >
            <span
              class="truncate font-mono text-[11px]"
              :class="bar.failed ? 'text-red-300' : bar.step.kind === 'model' ? 'text-white/60' : 'text-sky-200'"
            >{{ stepLabel(bar.step) }}</span>
            <span class="relative h-2 rounded-full bg-white/5">
              <span
                class="absolute inset-y-0 rounded-full transition-[width] duration-100"
                :class="[
                  bar.failed ? 'bg-red-400/80' : bar.step.kind === 'model' ? 'bg-[#F75474]/80' : 'bg-sky-400/80',
                  { 'animate-pulse': bar.duration === null },
                ]"
                :style="{ left: `${bar.left}%`, width: `${bar.width}%` }"
              />
            </span>
            <span class="text-right font-mono text-[11px] text-white/45">{{ bar.duration === null ? '…' : seconds(bar.duration) }}</span>
          </button>
          <!-- What the tool received and returned -->
          <div
            v-if="expanded === bar.step.id && bar.step.kind === 'tool'"
            class="mt-1.5 mb-1 flex flex-col gap-1 rounded-lg border border-white/10 bg-black/30 p-2 font-mono text-[10.5px] leading-relaxed"
          >
            <p class="break-all">
              <span class="text-white/40">in </span>{{ bar.step.input }}
            </p>
            <p class="break-all text-white/55">
              <span class="text-white/40">out </span>{{ bar.step.output }}
            </p>
          </div>
        </li>
      </ol>

      <!-- Counters -->
      <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
        <div v-if="trace.firstTokenMs !== undefined">
          <dt class="text-[10px] uppercase tracking-wide text-white/35">
            {{ t('1er mot', 'First token') }}
          </dt>
          <dd class="font-mono">
            {{ seconds(trace.firstTokenMs) }}
          </dd>
        </div>
        <div>
          <dt class="text-[10px] uppercase tracking-wide text-white/35">
            {{ t('Total', 'Total') }}
          </dt>
          <dd class="font-mono">
            {{ live ? '…' : seconds(elapsed) }}
          </dd>
        </div>
        <div v-if="usage">
          <dt class="text-[10px] uppercase tracking-wide text-white/35">
            {{ t('Tokens', 'Tokens') }}
          </dt>
          <dd class="font-mono">
            {{ numberFormat.format(usage.input) }} → {{ numberFormat.format(usage.output) }}
          </dd>
        </div>
        <div v-if="cost">
          <dt class="text-[10px] uppercase tracking-wide text-white/35">
            {{ t('Coût estimé', 'Estimated cost') }}
          </dt>
          <dd class="font-mono">
            {{ cost }}
          </dd>
        </div>
      </dl>
      <p
        v-if="usage && usage.input"
        class="text-[10.5px] text-white/40"
      >
        {{ t(
          `${usage.cachedShare} % du contexte (prompt système, outils) relu depuis le cache de prompt, facturé 10 % du prix. Coût estimé d'après le tarif public de l'API.`,
          `${usage.cachedShare}% of the context (system prompt, tools) read from the prompt cache, billed at 10% of the price. Cost estimated from public API pricing.`,
        ) }}
      </p>
    </div>
  </div>
</template>
