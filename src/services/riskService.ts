import type { AntarcticRoute, AntarcticIceberg, RiskLevel } from '../data/antarcticData';
import { RISK_THRESHOLDS } from '../data/antarcticData';

// ── Great-circle distance (km) between two lat/lon points
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Minimum distance from a point to a polyline segment
function pointToSegmentKm(
  pLat: number, pLon: number,
  aLat: number, aLon: number,
  bLat: number, bLon: number
): number {
  const ab = haversineKm(aLat, aLon, bLat, bLon);
  if (ab < 0.001) return haversineKm(pLat, pLon, aLat, aLon);

  const ap = haversineKm(aLat, aLon, pLat, pLon);
  const bp = haversineKm(bLat, bLon, pLat, pLon);

  // Use simplified linear projection
  const t = Math.max(0, Math.min(1, (ap * ap - bp * bp + ab * ab) / (2 * ab * ab)));
  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);
  return haversineKm(pLat, pLon, projLat, projLon);
}

// ── Minimum distance from a point to a route's polyline
export function distanceToRouteKm(
  lat: number, lon: number,
  route: AntarcticRoute
): number {
  let minDist = Infinity;
  const wps = route.waypoints;
  for (let i = 0; i < wps.length - 1; i++) {
    const d = pointToSegmentKm(lat, lon, wps[i][0], wps[i][1], wps[i + 1][0], wps[i + 1][1]);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

// ── Risk level from iceberg proximity
export function icebergProximityRisk(distKm: number): RiskLevel {
  if (distKm < RISK_THRESHOLDS.icebergCriticalKm) return 'CRITICAL';
  if (distKm < RISK_THRESHOLDS.icebergHighRiskKm)  return 'HIGH';
  if (distKm < RISK_THRESHOLDS.icebergWarningKm)   return 'MODERATE';
  return 'LOW';
}

// ── Numeric risk value 0–100 from label
export function riskToNum(r: RiskLevel): number {
  return { LOW: 15, MODERATE: 45, HIGH: 72, CRITICAL: 92 }[r];
}

// ── Numeric to label
export function numToRisk(n: number): RiskLevel {
  if (n >= 80) return 'CRITICAL';
  if (n >= 55) return 'HIGH';
  if (n >= 30) return 'MODERATE';
  return 'LOW';
}

// ── Compute iceberg risk for a specific route given live iceberg state
export function computeIcebergRiskForRoute(
  route: AntarcticRoute,
  icebergs: AntarcticIceberg[]
): { risk: RiskLevel; closestKm: number; closestId: string | null } {
  let worst: RiskLevel = 'LOW';
  let closestKm = Infinity;
  let closestId: string | null = null;

  for (const berg of icebergs) {
    const d = distanceToRouteKm(berg.lat, berg.lon, route);
    const risk = icebergProximityRisk(d);
    if (d < closestKm) {
      closestKm = d;
      closestId = berg.id;
    }
    // Take worst risk
    if (riskToNum(risk) > riskToNum(worst)) worst = risk;
  }

  return { risk: worst, closestKm, closestId };
}

// ── Compute updated iceberg nearest-route info
export function updateIcebergNearestRoute(
  berg: AntarcticIceberg,
  routes: AntarcticRoute[]
): { nearestRouteId: string | null; nearestRouteDistKm: number; riskLevel: RiskLevel } {
  let nearest: string | null = null;
  let nearestDist = Infinity;

  for (const route of routes) {
    const d = distanceToRouteKm(berg.lat, berg.lon, route);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = route.id;
    }
  }

  return {
    nearestRouteId: nearest,
    nearestRouteDistKm: Math.round(nearestDist * 10) / 10,
    riskLevel: icebergProximityRisk(nearestDist),
  };
}

// ── Route colour from risk level
export function routeColor(risk: RiskLevel): string {
  return { LOW: '#22c55e', MODERATE: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#dc2626' }[risk];
}

// ── Risk level CSS classes
export function riskTextClass(risk: RiskLevel): string {
  return {
    LOW: 'text-emerald-400',
    MODERATE: 'text-amber-400',
    HIGH: 'text-red-400',
    CRITICAL: 'text-red-300',
  }[risk];
}

export function riskBgClass(risk: RiskLevel): string {
  return {
    LOW: 'bg-emerald-950/50 border-emerald-700/40',
    MODERATE: 'bg-amber-950/40 border-amber-700/40',
    HIGH: 'bg-red-950/50 border-red-700/50',
    CRITICAL: 'bg-red-950 border-red-500/80',
  }[risk];
}
