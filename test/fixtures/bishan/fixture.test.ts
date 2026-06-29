import { describe, expect, it } from 'vitest';
import { BISHAN_BBOX_SVY21 } from './bbox.js';
import { BISHAN_FIXTURE_ASSETS, type AssetClass } from './assets.js';

// Sanity checks for the hand-curated fixture. Catches typos in coordinates,
// missing depth-source markers, and inadvertent gaps in class coverage —
// the things easy to fat-finger in a data file with no other tests yet.

describe('Bishan fixture — bbox invariants', () => {
  it('bbox is well-formed (min < max on both axes)', () => {
    expect(BISHAN_BBOX_SVY21.minX).toBeLessThan(BISHAN_BBOX_SVY21.maxX);
    expect(BISHAN_BBOX_SVY21.minY).toBeLessThan(BISHAN_BBOX_SVY21.maxY);
  });

  it('bbox is roughly 1 km × 1 km', () => {
    const width = BISHAN_BBOX_SVY21.maxX - BISHAN_BBOX_SVY21.minX;
    const height = BISHAN_BBOX_SVY21.maxY - BISHAN_BBOX_SVY21.minY;
    expect(width).toBeGreaterThanOrEqual(500);
    expect(width).toBeLessThanOrEqual(2000);
    expect(height).toBeGreaterThanOrEqual(500);
    expect(height).toBeLessThanOrEqual(2000);
  });
});

describe('Bishan fixture — asset invariants', () => {
  it('every asset has plan coordinates inside the bbox', () => {
    for (const asset of BISHAN_FIXTURE_ASSETS) {
      for (const [x, y] of asset.geometry.points) {
        expect(x, `${asset.id} x out of bbox`).toBeGreaterThanOrEqual(BISHAN_BBOX_SVY21.minX);
        expect(x, `${asset.id} x out of bbox`).toBeLessThanOrEqual(BISHAN_BBOX_SVY21.maxX);
        expect(y, `${asset.id} y out of bbox`).toBeGreaterThanOrEqual(BISHAN_BBOX_SVY21.minY);
        expect(y, `${asset.id} y out of bbox`).toBeLessThanOrEqual(BISHAN_BBOX_SVY21.maxY);
      }
    }
  });

  it('depthBottom > depthTop for every asset (positive-downward mBGL)', () => {
    for (const asset of BISHAN_FIXTURE_ASSETS) {
      expect(asset.depthBottom, asset.id).toBeGreaterThan(asset.depthTop);
    }
  });

  it('every real-plan asset records depthSource = "assumed-class-default"', () => {
    // Per ADR 0001: a future real-depth value must be able to swap in
    // surgically per-asset, which requires every assumed-default to be
    // marked as such. No exceptions in v1 — `real` is reserved for future
    // ingested agency data.
    for (const asset of BISHAN_FIXTURE_ASSETS) {
      if (asset.confidenceTier === 'real-plan') {
        expect(asset.depthSource, asset.id).toBe('assumed-class-default');
      }
    }
  });

  it('every inferred asset is the utility bundle class (v1 inference scope)', () => {
    // CONTEXT.md: utility bundle is the only inferred class in v1.
    for (const asset of BISHAN_FIXTURE_ASSETS) {
      if (asset.confidenceTier === 'inferred') {
        expect(asset.class, asset.id).toBe('utility-bundle');
      }
    }
  });

  it('all five v1 in-scope asset classes are represented', () => {
    const required: readonly AssetClass[] = [
      'mrt-tunnel',
      'road-tunnel',
      'pedestrian-underpass',
      'dtss',
      'utility-bundle',
    ];
    const present = new Set(BISHAN_FIXTURE_ASSETS.map((a) => a.class));
    for (const cls of required) {
      expect(present.has(cls), `missing class: ${cls}`).toBe(true);
    }
  });

  it('asset ids are unique', () => {
    const ids = BISHAN_FIXTURE_ASSETS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
