import { describe, expect, it } from 'vitest';
import {
  depthToEllipsoidalHeight,
  ellipsoidalHeightToDepth,
  svy21ToWgs84,
  wgs84ToSvy21,
} from './svy21.js';

// Goldens for the one conversion boundary mandated by ADR 0001. A wrong
// projection string here would silently corrupt every distance, buffer, and
// clash check in the app. The three classes of test below are designed so
// that a typo in any single proj4 parameter fails at least one of them:
//   1. Origin identity     — pins the false easting/northing and the
//                            longitude/latitude of natural origin.
//   2. Published landmark  — pins the ellipsoid and the scale factor
//                            against an independent source.
//   3. Round-trip grid     — pins inverse-consistency across the island.

describe('svy21 — projection origin identity', () => {
  // From the EPSG:3414 definition (https://epsg.io/3414): the projection's
  // natural origin is (lon 103.833333…°, lat 1.366666…°) and at that point
  // the SVY21 grid coordinate is exactly (false easting, false northing) =
  // (28001.642, 38744.572). Pure mathematical identity — tolerance is tight.
  it('maps (103.8333…, 1.3666…) → (28001.642, 38744.572)', () => {
    const [x, y] = wgs84ToSvy21([103.8333333333333, 1.3666666666666667]);
    expect(x).toBeCloseTo(28001.642, 3);
    expect(y).toBeCloseTo(38744.572, 3);
  });

  it('maps (28001.642, 38744.572) → (103.8333…, 1.3666…)', () => {
    const [lon, lat] = svy21ToWgs84([28001.642, 38744.572]);
    expect(lon).toBeCloseTo(103.8333333333333, 9);
    expect(lat).toBeCloseTo(1.3666666666666667, 9);
  });
});

describe('svy21 — published reference landmarks', () => {
  // Independent published WGS84 ⇄ SVY21 pair — not produced by proj4. If a
  // future proj string drifts the projection silently, this fails first.
  //
  // Source: dominoc925, "SVY21 Coordinates Conversion Calculator"
  // https://dominoc925-pages.appspot.com/webapp/calc_svy21/default.html
  // City Hall MRT Station:
  //   WGS84  = (103.852542627029,   1.29298990999197)
  //   SVY21  = (30139.470,         30597.782)
  type Landmark = {
    name: string;
    wgs84: readonly [number, number]; // [lon, lat]
    svy21: readonly [number, number]; // [x, y] in metres
  };
  const landmarks: readonly Landmark[] = [
    {
      name: 'City Hall MRT Station (dominoc925)',
      wgs84: [103.852542627029, 1.29298990999197],
      svy21: [30139.47, 30597.782],
    },
  ];

  // 1 cm tolerance is well inside the published 3-decimal precision of the
  // SVY21 values, and ~1e-7° (≈ 1 cm at Singapore's latitude) on WGS84.
  const PLANAR_TOL_M = 0.01;
  const ANGULAR_TOL_DEG = 1e-7;

  for (const { name, wgs84, svy21 } of landmarks) {
    it(`forward: WGS84 → SVY21 — ${name}`, () => {
      const [x, y] = wgs84ToSvy21(wgs84);
      expect(Math.abs(x - svy21[0])).toBeLessThan(PLANAR_TOL_M);
      expect(Math.abs(y - svy21[1])).toBeLessThan(PLANAR_TOL_M);
    });

    it(`inverse: SVY21 → WGS84 — ${name}`, () => {
      const [lon, lat] = svy21ToWgs84(svy21);
      expect(Math.abs(lon - wgs84[0])).toBeLessThan(ANGULAR_TOL_DEG);
      expect(Math.abs(lat - wgs84[1])).toBeLessThan(ANGULAR_TOL_DEG);
    });
  }
});

describe('svy21 — round-trip stability across Singapore extent', () => {
  // 10×10 grid over a generous SVY21 envelope covering all of Singapore
  // (approx 5,000–50,000 E by 15,000–50,000 N). Catches inverse-asymmetry
  // bugs that the origin identity test misses by symmetry.
  it('SVY21 → WGS84 → SVY21 returns to input within proj4 numerical noise', () => {
    const ROUND_TRIP_TOL_M = 1e-6;
    for (let i = 0; i <= 9; i += 1) {
      for (let j = 0; j <= 9; j += 1) {
        const x = 5_000 + (i * (50_000 - 5_000)) / 9;
        const y = 15_000 + (j * (50_000 - 15_000)) / 9;
        const [lon, lat] = svy21ToWgs84([x, y]);
        const [x2, y2] = wgs84ToSvy21([lon, lat]);
        expect(Math.abs(x2 - x)).toBeLessThan(ROUND_TRIP_TOL_M);
        expect(Math.abs(y2 - y)).toBeLessThan(ROUND_TRIP_TOL_M);
      }
    }
  });
});

describe('depth ↔ ellipsoidal height', () => {
  // Pins the sign convention. mBGL is positive downward, ellipsoidal height
  // is positive upward, ground is at terrainEllipsoidalHeight.
  it('depth 10 m below ground (terrain at 50 m) → height 40 m', () => {
    expect(depthToEllipsoidalHeight(10, 50)).toBe(40);
  });

  it('height 40 m (terrain at 50 m) → depth 10 m', () => {
    expect(ellipsoidalHeightToDepth(40, 50)).toBe(10);
  });

  it('zero depth → ground (height = terrain)', () => {
    expect(depthToEllipsoidalHeight(0, 50)).toBe(50);
    expect(ellipsoidalHeightToDepth(50, 50)).toBe(0);
  });

  it('round-trips for an arbitrary depth and terrain', () => {
    const depth = 17.5;
    const terrain = 23.8;
    const h = depthToEllipsoidalHeight(depth, terrain);
    expect(ellipsoidalHeightToDepth(h, terrain)).toBeCloseTo(depth, 10);
  });
});
