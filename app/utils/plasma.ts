/**
 * The portfolio's liquid-glass look: plasma-ui's "Solid" motion preset (rigid, no trailing,
 * still edges - right for a page that scrolls) with a quiet, neutral glass finish.
 * Tune it live on /lab/plasma.
 */
export const PLASMA_SOLID = {
  // Solid motion preset
  viscosity: 0.6,
  stretch: 0,
  flow: 0,
  // Blocks read as static slabs: no depth to light, and (in the components) no lean
  // toward the pointer, which is what made panels drift as they scrolled under it.
  thickness: 0,
  // Glass finish - neutral: a plain cool-white rim instead of the iridescent one, no
  // colored sheen or halo, and barely any color splitting.
  material: 'plasma',
  radius: 16,
  frost: 0.25,
  // a touch more lens, so even the quiet dot grid visibly bends at the edges
  refraction: 1.3,
  dispersion: 0.25,
  rim: 0.45,
  rimColor: '#e8ecf2',
  rimWidth: 0.8,
  highlight: 0.5,
  edgeLine: 0.6,
  shimmer: 0,
  glow: 0,
  wash: 0.3,
  grain: 0,
  elevation: 0.3,
  // Below the 16px grid gaps, so neighbouring cards stay separate panes of glass.
  blend: 12,
  // A liquid drop follows the cursor (faded out while scrolling, see app.vue), a few
  // ambient drops orbit bottom right.
  pointerDrop: true,
  pointerPull: true,
  ambientDrops: true,
  // the About stack shows 15 tiles, a zoomed-out /works canvas a couple dozen
  maxSurfaces: 32,
} as const

/** Routes that keep the CSS fallback: /lab mounts its own provider. */
export const PLASMA_EXCLUDED_ROUTES = ['/lab/']
