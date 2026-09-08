import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { ROUTES, VESSELS, ICEBERGS, SIM_CONFIG, type AntarcticRoute, type AntarcticVessel, type AntarcticIceberg } from '../data/antarcticData';
import { scoreRoutes, type RouteScore } from '../services/routeOptimizationService';
import { updateIcebergNearestRoute, haversineKm } from '../services/riskService';

// ── State ─────────────────────────────────────────────────
interface SimState {
  routes: AntarcticRoute[];
  vessels: AntarcticVessel[];
  icebergs: AntarcticIceberg[];
  scores: RouteScore[];
  lastUpdated: Date;
  tickCount: number;
  isRunning: boolean;
}

// ── Deep clone initial data (pure copies so mutations don't affect originals)
function initState(): SimState {
  const vessels = VESSELS.map((v) => ({ ...v }));
  const icebergs = ICEBERGS.map((b) => ({ ...b }));
  const routes = ROUTES.map((r) => ({ ...r, waypoints: r.waypoints.map((w) => [...w] as [number, number]) }));
  const scores = scoreRoutes(routes, icebergs);
  return { routes, vessels, icebergs, scores, lastUpdated: new Date(), tickCount: 0, isRunning: true };
}

// ── Simulation logic ───────────────────────────────────────

// Move a vessel along its route by simMinutesPerTick simulated minutes
function advanceVessel(vessel: AntarcticVessel, routes: AntarcticRoute[]): AntarcticVessel {
  if (!vessel.currentRouteId || vessel.status === 'STOPPED' || vessel.status === 'RESEARCH') {
    return vessel;
  }
  const route = routes.find((r) => r.id === vessel.currentRouteId);
  if (!route) return vessel;

  // Distance traveled this tick (km)
  const speedKmH = vessel.speedKnots * 1.852;
  const deltaKm = speedKmH * (SIM_CONFIG.simMinutesPerTick / 60);
  const totalKm = route.distanceKm;
  const deltaProgress = Math.min(deltaKm / totalKm, 1 - vessel.progress);
  const newProgress = vessel.progress + deltaProgress;

  // Interpolate position along waypoints
  const wps = route.waypoints;
  const pos = interpolateAlongWaypoints(wps, newProgress);
  const nextPos = interpolateAlongWaypoints(wps, Math.min(newProgress + 0.01, 1));

  // Compute heading toward next position
  const dLon = nextPos[1] - pos[1];
  const dLat = nextPos[0] - pos[0];
  const heading = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  const normalHeading = (heading + 360) % 360;

  // Fuel consumed
  const fuelUsed = deltaKm * vessel.fuelRemainingL > 0 ? 52 : 0;
  const newFuel = Math.max(0, vessel.fuelRemainingL - fuelUsed);

  return {
    ...vessel,
    lat: pos[0],
    lon: pos[1],
    progress: newProgress >= 0.98 ? 0 : newProgress, // loop back for demo
    heading: Math.round(normalHeading),
    fuelRemainingL: newFuel,
  };
}

function interpolateAlongWaypoints(
  waypoints: [number, number][],
  progress: number
): [number, number] {
  if (waypoints.length === 0) return [0, 0];
  if (waypoints.length === 1) return waypoints[0];
  if (progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];

  // Compute total path length and per-segment cumulative distances
  const dists: number[] = [];
  let total = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const d = haversineKm(waypoints[i][0], waypoints[i][1], waypoints[i + 1][0], waypoints[i + 1][1]);
    dists.push(d);
    total += d;
  }

  const targetDist = progress * total;
  let cumDist = 0;
  for (let i = 0; i < dists.length; i++) {
    if (cumDist + dists[i] >= targetDist) {
      const t = dists[i] > 0 ? (targetDist - cumDist) / dists[i] : 0;
      const lat = waypoints[i][0] + t * (waypoints[i + 1][0] - waypoints[i][0]);
      const lon = waypoints[i][1] + t * (waypoints[i + 1][1] - waypoints[i][1]);
      return [lat, lon];
    }
    cumDist += dists[i];
  }
  return waypoints[waypoints.length - 1];
}

// Move iceberg slightly in its heading direction
function advanceIceberg(berg: AntarcticIceberg): AntarcticIceberg {
  const speedKmH = berg.speedKnots * 1.852;
  const deltaKm = speedKmH * (SIM_CONFIG.simMinutesPerTick / 60);
  const headingRad = (berg.headingDeg * Math.PI) / 180;

  // Approximate movement in degrees
  const deltaLat = (deltaKm / 111) * Math.cos(headingRad);
  const deltaLon = (deltaKm / (111 * Math.cos((berg.lat * Math.PI) / 180))) * Math.sin(headingRad);

  return {
    ...berg,
    lat: berg.lat + deltaLat,
    lon: berg.lon + deltaLon,
    lastUpdated: new Date().toISOString(),
  };
}

// ── Reducer ────────────────────────────────────────────────
type Action = { type: 'TICK' } | { type: 'TOGGLE_SIM' };

function simReducer(state: SimState, action: Action): SimState {
  if (action.type === 'TOGGLE_SIM') {
    return { ...state, isRunning: !state.isRunning };
  }

  if (action.type === 'TICK') {
    if (!state.isRunning) return state;

    // Move vessels
    const vessels = state.vessels.map((v) => advanceVessel(v, state.routes));

    // Move icebergs
    let icebergs = state.icebergs.map((b) => advanceIceberg(b));

    // Recompute each iceberg's nearest route and risk
    icebergs = icebergs.map((berg) => {
      const { nearestRouteId, nearestRouteDistKm, riskLevel } = updateIcebergNearestRoute(berg, state.routes);
      return { ...berg, nearestRouteId, nearestRouteDistKm, riskLevel };
    });

    // Recompute route scores with updated iceberg positions
    const scores = scoreRoutes(state.routes, icebergs);

    return {
      ...state,
      vessels,
      icebergs,
      scores,
      lastUpdated: new Date(),
      tickCount: state.tickCount + 1,
    };
  }

  return state;
}

// ── Context ────────────────────────────────────────────────
interface SimContextValue extends SimState {
  toggleSimulation: () => void;
  highRiskRoutes: AntarcticRoute[];
  recommendedRouteId: string | null;
  alertCount: number;
}

const SimulationContext = createContext<SimContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simReducer, undefined, initState);

  useEffect(() => {
    const id = setInterval(() => dispatch({ type: 'TICK' }), SIM_CONFIG.tickIntervalMs);
    return () => clearInterval(id);
  }, []);

  const toggleSimulation = useCallback(() => dispatch({ type: 'TOGGLE_SIM' }), []);

  // Derived values
  const highRiskRoutes = state.routes.filter(
    (r) => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL'
  );
  const recommendedScore = state.scores.find((s) => s.isRecommended);
  const recommendedRouteId = recommendedScore?.routeId ?? null;

  // Alert count: high-risk icebergs + high-risk routes
  const highBergs = state.icebergs.filter((b) => b.riskLevel === 'HIGH' || b.riskLevel === 'CRITICAL').length;
  const alertCount = highBergs + highRiskRoutes.length;

  return (
    <SimulationContext.Provider
      value={{ ...state, toggleSimulation, highRiskRoutes, recommendedRouteId, alertCount }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used inside SimulationProvider');
  return ctx;
}
