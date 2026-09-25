import { inject, ref, type InjectionKey, type Ref, type ShallowRef, shallowRef, computed, type ComputedRef } from 'vue'
import type { PlasmaRenderer } from '../core/renderer'

export interface PlasmaRuntime {
  renderer: ShallowRef<PlasmaRenderer | null>
  /** False until the WebGL renderer exists, and for good when it never will (disabled, no WebGL2). Surfaces draw as the CSS fallback meanwhile. */
  supported: Ref<boolean>
  reducedMotion: Ref<boolean>
  pulse: (x: number, y: number, strength?: number) => void
  bump: (energy: number) => void
}

export interface PlasmaDefaults {
  tint: string
  opacity: number
  frost: number
  radius: number
  grid: number
  magnet: number
  spring: { stiffness: number, damping: number }
}

export const PLASMA_RUNTIME: InjectionKey<PlasmaRuntime> = Symbol('plasma-runtime')
export const PLASMA_DEFAULTS: InjectionKey<ComputedRef<PlasmaDefaults>> = Symbol('plasma-defaults')

const noop = () => {}

/** Renderer, support flag and commands (`pulse`, `bump`). Outside a provider: unsupported, no-ops. */
export function usePlasmaRuntime(): PlasmaRuntime {
  return inject(PLASMA_RUNTIME, () => ({
    renderer: shallowRef(null),
    supported: ref(false),
    reducedMotion: ref(false),
    pulse: noop,
    bump: noop,
  }), true)
}

/** Provider-level tint, opacity, frost, radius, grid, magnet and spring. */
export function usePlasmaDefaults(): ComputedRef<PlasmaDefaults> {
  return inject(PLASMA_DEFAULTS, () => computed(() => ({
    tint: '#ffffff', opacity: 0, frost: 0, radius: 26, grid: 24, magnet: 40,
    spring: { stiffness: 170, damping: 16 },
  })), true)
}
