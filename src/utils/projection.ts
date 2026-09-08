// Polar stereographic projection for SVG map rendering
// Centers on South Pole, looking down from above

export const MAP_CENTER = { x: 300, y: 300 };
export const SCALE = 5.2; // pixels per degree from pole

export function polarProject(lat: number, lon: number): { x: number; y: number } {
  const distFromPole = 90 - Math.abs(lat);
  const r = distFromPole * SCALE;
  const lonRad = (lon * Math.PI) / 180;
  return {
    x: MAP_CENTER.x + r * Math.sin(lonRad),
    y: MAP_CENTER.y - r * Math.cos(lonRad),
  };
}

export function polarProjectRadius(degreesFromPole: number): number {
  return degreesFromPole * SCALE;
}

// Convert route waypoints to SVG polyline points string
export function waypointsToPolyline(waypoints: Array<{ lat: number; lon: number }>): string {
  return waypoints
    .map((wp) => {
      const p = polarProject(wp.lat, wp.lon);
      return `${p.x},${p.y}`;
    })
    .join(' ');
}

// Approximate Antarctica continent outline vertices (simplified polygon in lat/lon)
export const ANTARCTICA_OUTLINE: Array<{ lat: number; lon: number }> = [
  { lat: -70, lon: 0 },
  { lat: -72, lon: 30 },
  { lat: -68, lon: 60 },
  { lat: -67, lon: 90 },
  { lat: -66, lon: 110 },
  { lat: -69, lon: 140 },
  { lat: -71, lon: 160 },
  { lat: -78, lon: 170 },
  { lat: -78, lon: 180 },
  { lat: -76, lon: -170 },
  { lat: -72, lon: -150 },
  { lat: -72, lon: -130 },
  { lat: -74, lon: -110 },
  { lat: -72, lon: -90 },
  { lat: -72, lon: -70 },
  { lat: -75, lon: -60 },
  { lat: -76, lon: -50 },
  { lat: -74, lon: -40 },
  { lat: -72, lon: -20 },
  { lat: -70, lon: 0 },
];

// Inner continent (simplified — more poleward)
export const ANTARCTICA_INNER: Array<{ lat: number; lon: number }> = [
  { lat: -75, lon: 0 },
  { lat: -77, lon: 45 },
  { lat: -76, lon: 90 },
  { lat: -75, lon: 135 },
  { lat: -80, lon: 165 },
  { lat: -85, lon: 180 },
  { lat: -85, lon: -120 },
  { lat: -80, lon: -90 },
  { lat: -78, lon: -60 },
  { lat: -80, lon: -30 },
  { lat: -75, lon: 0 },
];

export function outlineToSVGPath(points: Array<{ lat: number; lon: number }>): string {
  return points
    .map((pt, i) => {
      const p = polarProject(pt.lat, pt.lon);
      return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}
