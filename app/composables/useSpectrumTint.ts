import { useMediaQuery } from '@vueuse/core'

/**
 * A surface tint that rests at REST_TINT and, while `active`, sweeps through the spectrum.
 * Fed to <Plasma :tint> with rimColor "tint", it lights the rim alone. Under reduced
 * motion it holds one spectrum color instead of cycling.
 */
export function useSpectrumTint(active: Ref<boolean>) {
  const tint = ref<string>(REST_TINT)
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  let raf = 0
  let start = 0
  let last = 0

  function frame(t: number) {
    raf = requestAnimationFrame(frame)
    if (t - last < 50) return // 20 updates a second is plenty for a hue drift
    last = t
    tint.value = spectrumAt((t - start) / SPECTRUM_PERIOD)
  }

  watch(active, (on) => {
    cancelAnimationFrame(raf)
    raf = 0
    if (!on) {
      tint.value = REST_TINT
      return
    }
    if (reduced.value) {
      tint.value = SPECTRUM[3]
      return
    }
    // start mid-spectrum on a random hue, so neighbouring cards do not light up in step
    start = performance.now() - Math.random() * SPECTRUM_PERIOD
    raf = requestAnimationFrame(frame)
  })

  onBeforeUnmount(() => cancelAnimationFrame(raf))
  return tint
}
