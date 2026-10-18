import type { Ref } from 'vue'

/**
 * Shared state of the Petit-Oni companion, which lives in app.vue and follows
 * the visitor across pages, and of its perch in the home hero.
 */

/** Where it sits when visible (next to the profile picture on the home page). */
const perch = shallowRef<HTMLElement | null>(null)
/** The 3D oni has drawn its first frame: the perch can drop its flat SVG. */
const ready = ref(false)
/** The companion is on screen (it can say something, see PresenceLive). */
const visible = ref(false)
let stowed: Ref<boolean> | undefined

/**
 * Arrival intro ("Petit-Oni s'allume"): `pending` until app.vue is mounted,
 * then `playing` (first visit of the session, on the home page) or `done`.
 */
export type OniIntro = 'pending' | 'playing' | 'done'
const intro = ref<OniIntro>('pending')
const INTRO_SEEN_KEY = 'oni-intro-seen'

/**
 * Runs in <head> before the first paint: hides the intro curtain (rendered on
 * the server) when the intro won't play, so returning visitors never see it.
 */
export const INTRO_HEAD_SCRIPT = `try{var p=location.pathname.replace(/\\/$/,'');if(sessionStorage.getItem('${INTRO_SEEN_KEY}')||matchMedia('(prefers-reduced-motion: reduce)').matches||navigator.webdriver||!/^(\\/(fr|en))?$/.test(p))document.documentElement.dataset.oniIntro='skip'}catch(e){document.documentElement.dataset.oniIntro='skip'}`

/** Decides, once mounted, whether the intro plays (the head script already ruled out most cases). */
export function startOniIntro(webgl: boolean) {
  const play = webgl && document.documentElement.dataset.oniIntro !== 'skip'
  intro.value = play ? 'playing' : 'done'
  if (play) {
    try {
      sessionStorage.setItem(INTRO_SEEN_KEY, '1')
    }
    catch {
      // Storage unavailable: it will play again on reload, no harm.
    }
  }
}

/** The 3D oni needs WebGL 2; without it the perch keeps the SVG and there is no companion. */
export function supportsWebGL() {
  try {
    return !!document.createElement('canvas').getContext('webgl2')
  }
  catch {
    return false
  }
}

export function useOniCompanion() {
  // Put away by the visitor: it only peeks from the edge of the screen. Remembered across visits.
  stowed ??= useLocalStorage('petit-oni-stowed', false)
  return { perch, ready, stowed, visible, intro }
}
