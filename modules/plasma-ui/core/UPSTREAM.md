# Upstream

Vendored from [`@cruxgarden/plasma-ui`](https://github.com/cruxgarden/plasma-ui) (MIT, see `LICENSE`),
commit `91cd837` (v0.7.0).

Only the framework-agnostic engine is copied, **unchanged**:

- `renderer.ts` - WebGL2 pipeline and per-frame shape tracking
- `shaders.ts` - GLSL sources
- `spring.ts`, `snap.ts`, `moods.ts` - pure helpers

The React layer (`PlasmaProvider.tsx`, `Plasma.tsx`) is re-written in Vue in `../components`.
To update: copy the five files again from upstream `src/` and re-check the `RendererSettings`
and `ShapeOptions` interfaces against `../components/PlasmaProvider.vue` and `Plasma.vue`.

## Local patches

Each is marked `Local patch` in the source. Re-apply them when copying a new version;
the first two are upstream bugs worth reporting.

1. `renderer.ts` - viewport size from `document.documentElement.clientWidth/Height`
   instead of `innerWidth/Height` (which count a classic scrollbar the fixed canvas does
   not cover, stretching every frame), plus a `ResizeObserver` on the canvas so a
   scrollbar appearing reallocates.
2. `shaders.ts` - both image-background branches read the texture with `uv.y` flipped:
   the upload uses `UNPACK_FLIP_Y` while the fragment position runs top-down, so an image
   or canvas background was sampled upside down (refraction showed the bottom of the page
   at the top).
3. `renderer.ts` - `setPointerActive(on)`, a public way to fade the pointer drop and pull
   out and back in (used to quiet them while the page scrolls).
