# 0001 — SVY21 + mBGL as the internal coordinate system

**Status**: Accepted

## Context

The viewer is built on CesiumJS, which internally represents all geometry in WGS84 geographic coordinates (lat / lon / height above the WGS84 ellipsoid). The temptation is therefore to use WGS84 everywhere — in storage, in the in-memory app model, and at the renderer — to avoid conversion boundaries.

However, Singapore-specific factors push the other way:

1. **Authoritative local data is in SVY21.** OneMap, URA, LTA, SLA and any future agency feed deliver geometry in SVY21 (EPSG:3414, Singapore Transverse Mercator). Depths are quoted in metres below ground level (mBGL) or relative to the Singapore Height Datum (SHD), never as ellipsoidal heights.

2. **Clash detection needs a flat metric CRS.** The tool's central computation is "is this proposed work within X metres of an existing asset?". In WGS84 geographic coordinates, "1 degree" is not a constant distance, so every distance test would need projection or great-circle maths. Doing this on the hot path is both slow and a rich source of subtle bugs (degree-vs-metre, equatorial-vs-polar). SVY21 is a projected CRS where 1 unit = 1 metre across Singapore, so distance maths is `sqrt(dx² + dy² + dz²)` — fast and obviously correct.

3. **Depth confusion is a known failure mode.** Ellipsoidal height, orthometric height, and depth-below-ground all look like "a vertical number" but are not interchangeable. Mixing them silently produces clashes that are wrong by tens of metres. Standardising on mBGL throughout the model — with ground elevation looked up from terrain only at the rendering edge — removes the entire class.

## Decision

- **Authoritative storage and exchange**: SVY21 horizontal, mBGL vertical.
- **In-memory application model** (proposed works, assets, clash results, buffers): same — SVY21 + mBGL.
- **Renderer (CesiumJS)**: WGS84 ellipsoidal, as forced by Cesium.
- **Conversion**: happens at exactly one edge — the boundary between the app model and Cesium — using `proj4js` for the horizontal projection and a terrain-height lookup for the vertical (mBGL → ellipsoidal height = terrain_ellipsoidal_height − depth).

Cesium is treated as a rendering sink, not a source of truth. Round-tripping geometry through Cesium back into the app model is not permitted; the app model is canonical.

## Consequences

**Positive**
- Distance, buffer, and clash maths are flat metric — fast, obviously correct, no projection inside the hot path.
- Depths cannot be silently confused with heights because the model only carries one (mBGL) and the conversion is explicit at the edge.
- Real agency data drops in without reprojection.
- Planners using the tool see numbers (depths, distances) in the units they already think in.

**Negative**
- One conversion boundary exists and must be respected. Geometry crossing into Cesium must go through the converter; geometry coming back must not.
- `proj4js` is a runtime dependency.
- Cesium picking (click → world coordinate) returns WGS84 and must be converted back to SVY21 before being put into the app model.

## Alternatives considered

- **WGS84 everywhere.** Rejected: forces every distance computation to handle non-metric coordinates, makes depth-vs-height confusion easy, and would require reprojecting all incoming agency data.
- **SVY21 in the renderer too.** Rejected: would require either abandoning Cesium or hacking around its WGS84-native assumptions in ways that fight the engine on every frame.
