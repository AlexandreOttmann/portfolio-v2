import { PILOT_PAGES, type ChatSiteAction } from '~~/shared/types/chat'

/**
 * How the chat is displayed:
 * - `open`: centered dialog over a blurred page,
 * - `docked`: side panel (bottom sheet on mobile), page visible and usable,
 * - `minimized`: small floating card showing what the assistant is doing.
 */
export type ChatMode = 'closed' | 'open' | 'docked' | 'minimized'

// Shared across pages: the chat lives in app.vue, outside <NuxtPage>.
const mode = ref<ChatMode>('closed')
const status = ref('')
/** Project the works page should open (Nuxt Content stem). */
const pendingProjectStem = ref<string | null>(null)

const HIGHLIGHT_MS = 4000

/** Waits for `[data-pilot=target]` to be rendered after a navigation. */
async function waitForTarget(target: string, timeoutMs = 4000): Promise<HTMLElement | null> {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const element = document.querySelector<HTMLElement>(`[data-pilot="${target}"]`)
    if (element) return element
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return null
}

function highlight(element: HTMLElement) {
  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
  element.classList.remove('pilot-highlight')
  // Restart the animation when the same section is highlighted twice.
  void element.offsetWidth
  element.classList.add('pilot-highlight')
  setTimeout(() => element.classList.remove('pilot-highlight'), HIGHLIGHT_MS)
}

export function useSitePilot() {
  const localePath = useLocalePath()
  const route = useRoute()
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  /** Get out of the way so the visitor sees the page. */
  const reveal = () => {
    if (mode.value === 'open' || mode.value === 'closed') {
      mode.value = isDesktop.value ? 'docked' : 'minimized'
    }
  }

  const run = async (action: ChatSiteAction) => {
    status.value = action.label
    reveal()

    if (action.kind === 'navigate') {
      const path = localePath(PILOT_PAGES[action.page].path)
      if (route.path !== path) await navigateTo(path)
      if (action.target) {
        const element = await waitForTarget(action.target)
        if (element) highlight(element)
      }
      else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return
    }

    const worksPath = localePath(PILOT_PAGES.works.path)
    pendingProjectStem.value = action.stem
    if (route.path !== worksPath) await navigateTo(worksPath)
  }

  return {
    mode,
    status,
    isDesktop,
    pendingProjectStem,
    isDocked: computed(() => mode.value === 'docked' && isDesktop.value),
    run,
    reveal,
  }
}
