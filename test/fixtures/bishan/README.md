# Bishan fixture study area

A ~1 km² window in **SVY21 + mBGL** centred near Bishan MRT
(WGS84 ≈ 103.8480°E, 1.3510°N). The substrate for bake-pipeline tests, the
clash-detection tests, and the single Playwright E2E. See `CLAUDE.md`:

> The fixture study area is the substrate for both bake-pipeline tests and
> the E2E. When adding test cases, prefer extending the fixture over
> inventing new ad-hoc data.

## What's in it

Hand-curated representatives of **every v1 in-scope asset class**:

| Class                 | Count | Confidence  | Depth (mBGL) | Notes                                |
|-----------------------|-------|-------------|--------------|--------------------------------------|
| MRT tunnel            | 2     | `real-plan` | 12–18        | Shallow NSL-style passage            |
| Road tunnel           | 1     | `real-plan` | 8–14         |                                      |
| Pedestrian underpass  | 1     | `real-plan` | 3–7          |                                      |
| DTSS                  | 1     | `real-plan` | 38–44        | Deep trunk sewer                     |
| Utility bundle        | 1     | `inferred`  | 1–3          | Inferred from a road centerline      |

All depths are class defaults per `CONTEXT.md` and ADR 0001. Every
`real-plan` asset records `depthSource: "assumed-class-default"` so a
future real-depth value swaps in surgically per asset.

The coordinates are illustrative — the geometry is curated to live inside
the bbox and to span the realistic depth band for each class, not to match
the actual real-world alignments of any one piece of infrastructure.

## Why these choices

- **All five in-scope classes** rather than just MRT + utility bundle.
  Having every class present means later tests (clash maths against deep
  vs. shallow, plan-vs-vertical decomposition, visual-encoding) can
  extend the fixture instead of inventing parallel ones.
- **SVY21+mBGL, not WGS84.** The fixture is meant to feed the app model
  directly, which is canonically SVY21+mBGL (ADR 0001). The WGS84 corners
  in `bbox.ts` are documentation only.
- **Shape by convention, not by schema import.** The canonical `Asset`
  type doesn't exist yet (it lands with `src/model`). When it does, the
  only change here should be replacing the inline tuple types with that
  import — see TODO comments in `assets.ts`.

## How to extend

1. Add the asset to the appropriate group in `assets.ts`.
2. Make sure its plan coordinates fall inside `BISHAN_BBOX_SVY21` and that
   real-plan assets carry `depthSource: 'assumed-class-default'`.
3. `fixture.test.ts` will catch the easy mistakes (off-bbox, wrong tier
   wiring) without you needing to wire up the test yourself.
