// Hand-curated assets inside BISHAN_BBOX_SVY21. Coverage: one or two
// representatives of every v1 in-scope asset class so the fixture is a real
// substrate for both bake-pipeline tests and the Playwright E2E.
//
// Coordinates are SVY21 (x,y) in metres, depths are mBGL (positive
// downward). NEVER express fixture coordinates in WGS84 — the internal CRS
// is SVY21+mBGL by ADR 0001, and the fixture must match the model.
//
// Asset depths are class defaults per CONTEXT.md (MRT ~15 m shallow / ~30 m
// deep, road tunnel ~10 m, pedestrian underpass ~5 m, DTSS deep ~40 m,
// utility bundle ~2 m). Every real-plan asset records
// `depthSource: 'assumed-class-default'` so a future ingestion of real
// depth values is surgical per-asset.
//
// Shape is by convention, not by import — the canonical `Asset` type does
// not exist yet (it lands with src/model). When it does, the only change
// here should be replacing the inline tuple types with that import.

export type AssetClass =
  | 'mrt-tunnel'
  | 'road-tunnel'
  | 'pedestrian-underpass'
  | 'dtss'
  | 'utility-bundle';

export type ConfidenceTier = 'real' | 'real-plan' | 'inferred';

export type DepthSource = 'authoritative' | 'assumed-class-default';

export type LineGeometry = {
  readonly kind: 'polyline';
  readonly points: readonly (readonly [number, number])[];
  readonly width: number; // metres, full-width
};

export type FixtureAsset = {
  readonly id: string;
  readonly name: string;
  readonly class: AssetClass;
  readonly confidenceTier: ConfidenceTier;
  readonly depthTop: number; // mBGL
  readonly depthBottom: number; // mBGL, depthBottom > depthTop
  readonly depthSource: DepthSource;
  readonly geometry: LineGeometry;
};

// Two shallow-MRT segments (e.g. NSL passing through Bishan).
const MRT_TUNNELS: readonly FixtureAsset[] = [
  {
    id: 'mrt-bishan-ns-1',
    name: 'NSL — Bishan north approach (fixture)',
    class: 'mrt-tunnel',
    confidenceTier: 'real-plan',
    depthTop: 12,
    depthBottom: 18,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_200, 37_400],
        [29_500, 37_200],
        [29_800, 37_000],
      ],
      width: 6,
    },
  },
  {
    id: 'mrt-bishan-ns-2',
    name: 'NSL — Bishan south departure (fixture)',
    class: 'mrt-tunnel',
    confidenceTier: 'real-plan',
    depthTop: 12,
    depthBottom: 18,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_800, 37_000],
        [30_000, 36_700],
      ],
      width: 6,
    },
  },
];

const ROAD_TUNNELS: readonly FixtureAsset[] = [
  {
    id: 'road-tunnel-1',
    name: 'Fixture road tunnel under arterial',
    class: 'road-tunnel',
    confidenceTier: 'real-plan',
    depthTop: 8,
    depthBottom: 14,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_300, 36_800],
        [29_700, 36_900],
      ],
      width: 10,
    },
  },
];

const PEDESTRIAN_UNDERPASSES: readonly FixtureAsset[] = [
  {
    id: 'underpass-1',
    name: 'Fixture underpass across MRT station forecourt',
    class: 'pedestrian-underpass',
    confidenceTier: 'real-plan',
    depthTop: 3,
    depthBottom: 7,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_750, 37_050],
        [29_850, 37_050],
      ],
      width: 4,
    },
  },
];

const DTSS: readonly FixtureAsset[] = [
  {
    id: 'dtss-1',
    name: 'DTSS deep trunk sewer (fixture segment)',
    class: 'dtss',
    confidenceTier: 'real-plan',
    depthTop: 38,
    depthBottom: 44,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_150, 36_550],
        [29_600, 36_600],
        [30_050, 36_700],
      ],
      width: 5,
    },
  },
];

const UTILITY_BUNDLES: readonly FixtureAsset[] = [
  {
    id: 'utility-bundle-arterial-1',
    name: 'Inferred utility bundle — arterial road',
    class: 'utility-bundle',
    confidenceTier: 'inferred',
    depthTop: 1,
    depthBottom: 3,
    depthSource: 'assumed-class-default',
    geometry: {
      kind: 'polyline',
      points: [
        [29_200, 37_100],
        [29_600, 37_000],
        [30_000, 36_950],
      ],
      width: 3,
    },
  },
];

export const BISHAN_FIXTURE_ASSETS: readonly FixtureAsset[] = [
  ...MRT_TUNNELS,
  ...ROAD_TUNNELS,
  ...PEDESTRIAN_UNDERPASSES,
  ...DTSS,
  ...UTILITY_BUNDLES,
];
