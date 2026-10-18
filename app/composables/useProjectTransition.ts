/**
 * Card → project page morph (View Transitions API, enabled in nuxt.config):
 * the clicked card's image and title get the same `view-transition-name` as
 * the project page header, so the browser animates one into the other. Names
 * are only set on the clicked card (the infinite canvas repeats its items, and
 * duplicate names would cancel the transition).
 */

export type ProjectTransitionPart = 'image' | 'title'

/** Project last opened from a card: on the way back, its card morphs back in place. */
const lastProject = ref<string | null>(null)

export const projectTransitionName = (slug: string, part: ProjectTransitionPart) => `project-${part}-${slug}`

export function useProjectTransition() {
  const localePath = useLocalePath()

  /** Opens a project's page; `card` holds `[data-vt=image]` / `[data-vt=title]` elements to morph. */
  const openProject = (slug: string, card?: HTMLElement | null) => {
    for (const part of ['image', 'title'] as const) {
      const element = card?.dataset.vt === part ? card : card?.querySelector<HTMLElement>(`[data-vt="${part}"]`)
      element?.style.setProperty('view-transition-name', projectTransitionName(slug, part))
    }
    lastProject.value = slug
    return navigateTo(localePath(`/works/${slug}`))
  }

  return { openProject, lastProject }
}
