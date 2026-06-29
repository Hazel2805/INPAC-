# CLAUDE.md

Working instructions for Claude Code on this project. Read [`CONTEXT.md`](./CONTEXT.md) first for the domain model and glossary — terms in **bold** below are defined there. ADRs live in [`docs/adr/`](./docs/adr/).

## What this project is

A 3D viewer of underground infrastructure in Singapore for urban planners. Built on **public data only**, framed as a demonstration-grade clash-detection viewer with a clean ingestion seam for future agency data. CesiumJS + React + Vite, deployed as a static SPA on Cloudflare Pages.

Single developer, single repo, no backend in v1.

## Load-bearing invariants — do not break these

These rules come from real trade-offs documented in `CONTEXT.md` and the ADRs. Violating them silently produces wrong output or breaks the v2 upgrade path.

1. **The internal CRS is SVY21 + mBGL.** All geometry storage, app model, and computation is in SVY21 horizontal and metres-below-ground vertical. Conversion to WGS84 + ellipsoidal height happens only at the edge handed to Cesium. Cesium picking results (WGS84) must be converted back to SVY21 before entering the app model. See [ADR 0001](docs/adr/0001-svy21-mbgl-as-internal-crs.md). **Never compute distances or buffers in WGS84.**

2. **Honesty about confidence is non-negotiable.** Every asset carries a confidence tier (`real`, `real-plan`, `inferred`). The clash report, the 3D viewer, and any exported document must distinguish them visually and textually. Never display an inferred clash with the same weight as a real-plan clash.

3. **The clash interface is async request/response.** Even though v1 runs the worker in-browser, the API must look like an HTTP call so v2's move to a backend is a swap, not a rewrite.

4. **State lives in the URL in v1.** No localStorage hacks for study-area or proposal state. The URL is the persistence layer until v2 introduces accounts.

5. **Cesium is a rendering sink, not a source of truth.** Don't round-trip geometry through Cesium back into the app model.

6. **Baked tiles are ODbL.** Do not relabel them MIT, do not strip the OSM attribution from tile metadata. See [ADR 0002](docs/adr/0002-odbl-inheritance-for-baked-tiles.md).

7. **Real assets and inferred assets share the same data shape, different `confidenceTier`.** This is what makes future per-asset upgrades surgical. Don't fork the schema.

## Tech stack — at a glance

- **Rendering**: CesiumJS (no `resium`; mount Cesium directly inside React `useEffect` unless `resium` clearly earns its weight later).
- **App shell**: React + Vite. 100% client-side SPA.
- **Basemap**: OneMap raster tiles (Grey style) + Cesium World Terrain + toggleable extruded OSM buildings.
- **Compute**: Web Worker for clash detection. Async request/response protocol.
- **Reprojection**: `proj4js`.
- **Geometry**: hand-rolled in JS for v1 (clash maths is simple in flat metric CRS). If complexity grows, the upgrade is WebAssembly (CGAL/Manifold), not a backend.
- **Tests**: Vitest for units, Playwright for one E2E smoke test.
- **Deployment**: Cloudflare Pages, default URL.
- **Data versioning**: Git LFS for `data/tiles/`.

## Repo shape

```
/
├── CLAUDE.md                    ← this file
├── CONTEXT.md                   ← domain model + glossary
├── ATTRIBUTION.md               ← per-source licence breakdown
├── LICENSE                      ← MIT for code; ODbL applies to data/tiles/
├── docs/adr/                    ← architectural decisions
├── src/                         ← React app
│   ├── viewer/                  ← Cesium mount + scene management
│   ├── model/                   ← SVY21+mBGL app model (assets, proposals, clashes)
│   ├── clash/                   ← worker + clash maths (pure functions)
│   ├── crs/                     ← SVY21↔WGS84, mBGL↔ellipsoidal (pure)
│   ├── tiles/                   ← study-area → tile-set selection, fetching
│   ├── url/                     ← URL ↔ app state (study area, proposals)
│   ├── panels/                  ← React UI: layers, proposals, clash report
│   └── export/                  ← Markdown clash report
├── scripts/                     ← build-time bake pipeline (Overpass → tiles)
├── data/
│   ├── sources/                 ← cached Overpass / DataMall snapshots (LFS)
│   └── tiles/                   ← baked tile output (LFS, ODbL)
└── test/
    └── fixtures/                ← committed fixture study area (~1 km² of Bishan)
```

## Working conventions

- **New geometry code lives under `src/model`, `src/clash`, `src/crs`, or `src/tiles` — never in `src/viewer` or `src/panels`.** Viewer and panels are presentation; they consume the model, they don't compute on it.
- **All clash-related distances surface as plan distance + vertical distance separately** in any output (report, sidebar, tooltip). Engineers think in plan vs. depth, not 3D Euclidean.
- **Asset class defaults (especially assumed depths)** live in one place — `src/model/assetClasses.ts` — and every `real-plan` asset records `depthSource: "assumed-class-default"` so future real-depth ingestion is surgical.
- **Use `proj4js` only at the rendering edge and at the picking edge.** If you find yourself reaching for it inside `src/clash` or `src/model`, something is wrong.
- **The fixture study area is the substrate for both bake-pipeline tests and the E2E.** When adding test cases, prefer extending the fixture over inventing new ad-hoc data.

## What's in v1 vs deferred

**In v1**: viewer, study-area selection (rectangle + address search, URL-persisted), the asset classes listed in `CONTEXT.md`, three-tier confidence, box & corridor proposed works (multiple per study area), hybrid clash detection with a single global buffer in a Web Worker, sidebar list + Markdown export, the visual-encoding scheme, SVY21+mBGL internal CRS, tile-based bake from OSM, React+Vite, Cloudflare Pages, fixture-driven tests + one Playwright smoke.

**Designed-for but not built**: real agency data ingestion; accounts / saved study areas / collaboration; server-side clash compute; polygon or Planning Area selection; DXF/IFC/glTF upload; per-class clearance buffers; PDF reports; screenshot annotations; two-axis confidence; CST and individual utility lines; building basements; Singapore-specific DEM; custom domain.

When a task lands in the "deferred" column, push back before building. The seams are designed; pulling features forward without revisiting the design tree risks breaking the v1 cut.

## When in doubt

- A question about *what something means* → check `CONTEXT.md`. If the answer isn't there and the term matters, add it.
- A question about *why a structural choice was made* → check `docs/adr/`. If you're about to overturn a decision documented there, write a new ADR superseding it; don't quietly contradict it.
- A question about *whether something is in scope* → check the "In v1" list above. If it's deferred and the user is asking for it, surface the trade-off before building.
