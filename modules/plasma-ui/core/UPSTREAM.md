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
