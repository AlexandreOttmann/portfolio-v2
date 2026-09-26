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
  // Glass finish - neutral: no colored sheen or halo, barely any color splitting. The rim
  // takes each surface's tint (opacity 0 keeps the body clear): cool white at rest, the
  // spectrum while hovered - see GlassSurface.
  material: 'plasma',
  radius: 16,
  frost: 0.25,
  // a touch more lens, so even the quiet dot grid visibly bends at the edges
  refraction: 1.3,
  dispersion: 0.25,
  rim: 0.5,
  rimColor: 'tint',
  tint: '#e8ecf2',
  opacity: 0,
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

/**
 * The design system around the glass, in one place:
 * - surfaces are neutral glass, in four corner sizes;
 * - the spectrum (the rainbow) is the one accent, and it means "live": what is active,
 *   hovered or current lights up in it - a card's rim, the timeline, availability, the
 *   active nav item. Everything at rest stays neutral.
 */
export const RADIUS = {
  /** big reading surfaces: an article, the contact form */
  pane: 24,
  /** cards */
  card: 16,
  /** small square tiles: the stack icons */
  tile: 12,
  /** buttons, pills, back links */
  control: 8,
  /** round frames: the profile picture */
  round: 999,
} as const
export type GlassVariant = keyof typeof RADIUS

/** The spectrum, left to right. Mirrored in main.css as --spectrum. */
export const SPECTRUM = ['#ff0080', '#ff8c00', '#40e0d0', '#4169e1', '#9370db', '#ff1493', '#ff0080'] as const
/** One full sweep of the spectrum, for everything that cycles through it. */
export const SPECTRUM_PERIOD = 6000
/** A surface's rim at rest: a cool white. */
export const REST_TINT = '#e8ecf2'

/** The spectrum color at u in [0, 1), as #rrggbb. */
export function spectrumAt(u: number): string {
  const n = SPECTRUM.length - 1
  const x = (((u % 1) + 1) % 1) * n
  const i = Math.floor(x)
  const f = x - i
  const a = parseInt(SPECTRUM[i]!.slice(1), 16)
  const b = parseInt(SPECTRUM[Math.min(i + 1, n)]!.slice(1), 16)
  const mix = (s: number) => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f)
  return `#${[16, 8, 0].map(s => mix(s).toString(16).padStart(2, '0')).join('')}`
}
