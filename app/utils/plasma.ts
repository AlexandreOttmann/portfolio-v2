/**
 * The portfolio's liquid-glass look: plasma-ui's "Solid" motion preset (rigid, no trailing,
 * still edges - right for a page that scrolls) with a quiet glass finish.
 * Tune it live on /lab/plasma.
 */
export const PLASMA_SOLID = {
  // Solid motion preset
  viscosity: 0.6,
  stretch: 0,
  flow: 0,
  // Glass finish
  material: 'plasma',
  radius: 16,
  frost: 0.25,
  refraction: 1,
  dispersion: 0.8,
  rim: 0.6,
  rimWidth: 0.9,
  highlight: 0.6,
  edgeLine: 0.8,
  shimmer: 0.5,
  glow: 0.4,
  wash: 0.5,
  grain: 0,
  elevation: 0.3,
  // Below the 16px grid gaps, so neighbouring cards stay separate panes of glass.
  blend: 12,
  // A drop chasing the cursor over a whole site is too much; the pull at edges stays.
  pointerDrop: false,
  pointerPull: true,
  // the About stack shows 15 tiles, a zoomed-out /works canvas a couple dozen
  maxSurfaces: 32,
} as const

/** Routes that keep the CSS fallback: /lab mounts its own provider. */
export const PLASMA_EXCLUDED_ROUTES = ['/lab/']
