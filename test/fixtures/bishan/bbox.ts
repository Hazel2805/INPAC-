// Bishan fixture study area.
//
// A 1 km × 1 km window centered on round-100m SVY21 coordinates near Bishan
// MRT (real-world anchor: WGS84 ≈ 103.8480°E, 1.3510°N). Snapped to round
// metres so it reads cleanly in test output and in any diffs that touch
// hand-curated assets that live inside it.
//
// SVY21 is the authoritative form per ADR 0001. The WGS84 derivative below
// is documentation only — never read it for computation; recompute via
// src/crs at the rendering edge when needed.

export type Bbox2D = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

export const BISHAN_BBOX_SVY21: Bbox2D = {
  minX: 29_100,
  minY: 36_500,
  maxX: 30_100,
  maxY: 37_500,
};

// Derivative — computed once from BISHAN_BBOX_SVY21 via proj4 for human
// reference (e.g. dropping a pin in OneMap to sanity-check the area).
// Do not import from app code.
export const BISHAN_BBOX_WGS84_REFERENCE = {
  southWest: { lon: 103.8432028, lat: 1.3463675 },
  northEast: { lon: 103.8521884, lat: 1.3554111 },
} as const;
