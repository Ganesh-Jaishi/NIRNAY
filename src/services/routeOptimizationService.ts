import type { AntarcticRoute, AntarcticIceberg } from '../data/antarcticData';
import { RISK_THRESHOLDS } from '../data/antarcticData';
import { riskToNum, computeIcebergRiskForRoute, numToRisk } from './riskService';

// ── Normalize a value 0–1 given min/max across a set
function normalize(val: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (val - min) / (max - min)));
}

export interface RouteScore {
  routeId: string;
  score: number;      // 0–100, higher = better
  safetyScore: number;
  fuelScore: number;
  distanceScore: number;
  iceRiskPenalty: number;
  icebergRiskPenalty: number;
  weatherRiskPenalty: number;
  overallRisk: number;
  isRecommended: boolean;
  recommendationReason: string;
}

// ── Score all routes — returns scores sorted best→worst
export function scoreRoutes(
  routes: AntarcticRoute[],
  icebergs: AntarcticIceberg[]
): RouteScore[] {
  const w = RISK_THRESHOLDS.weights;

  // Pre-compute distances/fuel across all routes for normalization
  const dists    = routes.map((r) => r.distanceKm);
  const fuels    = routes.map((r) => r.fuelLitres);
  const minDist  = Math.min(...dists), maxDist = Math.max(...dists);
  const minFuel  = Math.min(...fuels), maxFuel = Math.max(...fuels);

  const scored: RouteScore[] = routes.map((route) => {
    // Live iceberg risk for this route
    const { risk: liveBergRisk } = computeIcebergRiskForRoute(route, icebergs);
    const bergRiskNum = riskToNum(liveBergRisk);

    const iceNum      = riskToNum(route.seaIceRisk);
    const weatherNum  = riskToNum(route.weatherRisk);
    const oceanNum    = riskToNum(route.oceanRisk);

    // Weighted composite risk (0–100, lower = safer)
    const compositeRisk =
      w.iceRisk     * iceNum +
      w.icebergRisk * bergRiskNum +
      w.weatherRisk * weatherNum +
      (1 - w.iceRisk - w.icebergRisk - w.weatherRisk) * oceanNum;

    // Fuel score: 1 = best fuel efficiency (lowest fuel)
    const fuelScore     = 1 - normalize(route.fuelLitres, minFuel, maxFuel);
    // Distance score: 1 = shortest
    const distScore     = 1 - normalize(route.distanceKm, minDist, maxDist);
    // Safety score: 1 = lowest risk
    const safetyScore   = 1 - compositeRisk / 100;

    // Final score 0–100
    const score = Math.round(
      (w.safety * safetyScore +
       w.fuelEfficiency * fuelScore +
       w.distance * distScore -
       (w.iceRisk * iceNum / 100) -
       (w.icebergRisk * bergRiskNum / 100) -
       (w.weatherRisk * weatherNum / 100)) * 100
    );

    return {
      routeId: route.id,
      score: Math.max(0, Math.min(100, score + 50)), // offset to 0–100 range
      safetyScore: Math.round(safetyScore * 100),
      fuelScore: Math.round(fuelScore * 100),
      distanceScore: Math.round(distScore * 100),
      iceRiskPenalty: iceNum,
      icebergRiskPenalty: bergRiskNum,
      weatherRiskPenalty: weatherNum,
      overallRisk: Math.round(compositeRisk),
      isRecommended: false,
      recommendationReason: '',
    };
  });

  // Sort best → worst
  scored.sort((a, b) => b.score - a.score);

  // Mark recommended and explain
  if (scored.length > 0) {
    const best = scored[0];
    const second = scored[1];
    best.isRecommended = true;
    const bestRoute = routes.find((r) => r.id === best.routeId)!;
    const reasons: string[] = [];

    if (best.safetyScore > (second?.safetyScore ?? 0))
      reasons.push(`${best.safetyScore - (second?.safetyScore ?? 0)}% higher safety score`);
    if (best.icebergRiskPenalty < (second?.icebergRiskPenalty ?? 100))
      reasons.push(`lower iceberg risk (${numToRisk(best.icebergRiskPenalty)} vs ${numToRisk(second?.icebergRiskPenalty ?? 100)})`);
    if (bestRoute.fuelLitres < (routes.find((r) => r.id === second?.routeId)?.fuelLitres ?? Infinity))
      reasons.push(`${Math.round((1 - bestRoute.fuelLitres / (routes.find((r) => r.id === second?.routeId)?.fuelLitres ?? bestRoute.fuelLitres)) * 100)}% lower fuel consumption`);

    best.recommendationReason =
      reasons.length > 0
        ? `Route ${best.routeId} recommended: ${reasons.join('; ')}.`
        : `Route ${best.routeId} provides the best overall balance of safety, fuel, and distance.`;
  }

  return scored;
}

// ── Get alternative routes for a given selected route
export function getAlternativeRoutes(
  selectedId: string,
  routes: AntarcticRoute[],
  scores: RouteScore[]
): Array<{ route: AntarcticRoute; score: RouteScore }> {
  return scores
    .filter((s) => s.routeId !== selectedId)
    .slice(0, 3)
    .map((s) => ({
      route: routes.find((r) => r.id === s.routeId)!,
      score: s,
    }))
    .filter((x) => x.route != null);
}
