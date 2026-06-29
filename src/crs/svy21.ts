import proj4 from 'proj4';

// EPSG:3414 — SVY21 / Singapore TM. Transverse Mercator, origin at
// 1°22'N 103°50'E, false easting 28001.642 m, false northing 38744.572 m,
// scale 1.0, WGS84 ellipsoid.
// Source: EPSG registry (https://epsg.org/crs_3414) / SLA SVY21 spec.
const SVY21_PROJ4 =
  '+proj=tmerc +lat_0=1.366666666666667 +lon_0=103.8333333333333 ' +
  '+k=1 +x_0=28001.642 +y_0=38744.572 +ellps=WGS84 +units=m +no_defs';

const SVY21 = 'EPSG:3414';
const WGS84 = 'EPSG:4326';

proj4.defs(SVY21, SVY21_PROJ4);

// Inputs/outputs are plain tuples to keep the boundary obvious. Longitude
// first everywhere on the WGS84 side — matches GeoJSON and Cesium's
// Cartographic.longitude/latitude ordering.

export function svy21ToWgs84(xy: readonly [number, number]): [number, number] {
  const [lon, lat] = proj4(SVY21, WGS84, [xy[0], xy[1]]);
  return [lon, lat];
}

export function wgs84ToSvy21(lonlat: readonly [number, number]): [number, number] {
  const [x, y] = proj4(WGS84, SVY21, [lonlat[0], lonlat[1]]);
  return [x, y];
}

// Depth ↔ ellipsoidal height. Pure subtraction; the rendering edge owns the
// terrain lookup and passes terrainEllipsoidalHeight in. mBGL is positive
// downward, ellipsoidal height is positive upward, ground is at terrain.
export function depthToEllipsoidalHeight(
  mBGL: number,
  terrainEllipsoidalHeight: number,
): number {
  return terrainEllipsoidalHeight - mBGL;
}

export function ellipsoidalHeightToDepth(
  ellipsoidalHeight: number,
  terrainEllipsoidalHeight: number,
): number {
  return terrainEllipsoidalHeight - ellipsoidalHeight;
}
