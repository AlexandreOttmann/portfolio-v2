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
  return { perch, ready, stowed, visible }
}
