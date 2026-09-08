// ============================================================
// LOGISTICS INTELLIGENCE ENGINE
// "What Does This Route Cost?" — Connects physical events to
// operational consequences (Time, Delay, Fuel, Cost, Emissions).
// ============================================================

import type { EnvironmentalConditions, PhysicsReadout } from './physicsEngine';

export interface RouteLogistics {
  routeId: string;
  routeName: string;
  totalDistanceKm: number;
  totalDistanceNm: number;
  distanceRemainingKm: number;
  nominalDurationHours: number;
  actualDurationHours: number;
  delayHours: number;
  delayMinutes: number;
  fuelConsumedMetricTons: number;
  fuelRemainingMetricTons: number;
  fuelCapacityMetricTons: number;
  fuelSavedVsBaselineTons: number;
  fuelSavedPct: number;
  fuelCostUSD: number;
  costSavedUSD: number;
  co2EmissionsTons: number;
  averageSpeedKnots: number;
  currentSpeedKnots: number;
  routeEfficiencyPct: number;
  onTimeProbabilityPct: number;
  causeEffectChain: Array<{
    trigger: string;
    physicalEffect: string;
    logisticsImpact: string;
    severity: 'NORMAL' | 'CAUTION' | 'CRITICAL';
  }>;
  timeline: {
    departureTime: string;
    plannedETA: string;
    currentETA: string;
    delayString: string;
    newAIETA: string;
  };
}

const FUEL_PRICE_USD_PER_TON = 780; // Marine Gas Oil (MGO) polar blend
const CO2_FACTOR = 3.16; // Tons CO2 per Ton MGO burned

export function computeRouteLogistics(
  env: EnvironmentalConditions,
  physics: PhysicsReadout,
  routeType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF' = 'AI_OPTIMIZED',
  progressPct: number = 35 // vessel progress along route
): RouteLogistics {
  let baseDistKm = 548; // Mawson to Davis
  let nominalSpeedKnots = 14.5;
  let nominalHours = baseDistKm / (nominalSpeedKnots * 1.852); // ~20.4 hrs

  let actualDistKm = baseDistKm;
  let delayMinutes = 0;
  let fuelMultiplier = 1.0;

  const causes: RouteLogistics['causeEffectChain'] = [];

  if (routeType === 'ORIGINAL_BLOCKED') {
    // Heavy ice forcing vessel to ram ice, severe slowdown + iceberg hazard
    actualDistKm = 548;
    const iceSlowdownFactor = Math.max(1.3, 1 + (env.seaIceConcentrationPct / 100) * 0.9);
    const waveDelay = env.waveHeightMeters > 3.5 ? (env.waveHeightMeters - 3.5) * 40 : 0;
    delayMinutes = Math.round((nominalHours * (iceSlowdownFactor - 1) * 60) + waveDelay + 180); // +3 hrs near berg
    fuelMultiplier = 1.38 + (env.seaIceConcentrationPct / 100) * 0.35;

    causes.push({
      trigger: `Iceberg D-28 (1,636 Mt) in path`,
      physicalEffect: `Closest Point of Approach: 4.2 km (Collision risk 82%)`,
      logisticsImpact: `Forces safety deceleration & evasive drift watch (+180 min delay)`,
      severity: 'CRITICAL',
    });
    causes.push({
      trigger: `Heavy Sea-Ice Pack (SIC ${env.seaIceConcentrationPct}%)`,
      physicalEffect: `Ice resistance rises to ${physics.vesselIceResistanceKN} kN (Hull overload)`,
      logisticsImpact: `Speed drops to ${physics.effectiveSpeedKnots} kts; fuel burn +${Math.round((fuelMultiplier - 1) * 100)}%`,
      severity: 'CRITICAL',
    });
  } else if (routeType === 'AI_OPTIMIZED') {
    // 22 nm North through Sentinel-1 SAR open-water lead channel
    actualDistKm = 586; // 38 km detour around pack ice
    const leadSIC = Math.min(22, env.seaIceConcentrationPct * 0.3);
    const speedInLead = Math.max(12.5, nominalSpeedKnots - (leadSIC / 100) * 2.0);
    const transitHoursInLead = actualDistKm / (speedInLead * 1.852);
    delayMinutes = Math.max(0, Math.round((transitHoursInLead - nominalHours) * 60));
    fuelMultiplier = 0.84; // 16% fuel savings due to open lead channel

    causes.push({
      trigger: `Sentinel-1 SAR detected open lead channel`,
      physicalEffect: `Path rerouted 22 nm North (SIC drops from ${env.seaIceConcentrationPct}% to ${Math.round(leadSIC)}%)`,
      logisticsImpact: `Vessel cruises at ${speedInLead.toFixed(1)} kts with minimal ice resistance (${Math.round(physics.vesselIceResistanceKN * 0.18)} kN)`,
      severity: 'NORMAL',
    });
    causes.push({
      trigger: `Iceberg D-28 Avoidance Buffer`,
      physicalEffect: `Safe clearance expanded from 4.2 km to 38.4 km`,
      logisticsImpact: `Zero collision risk (0.0%); eliminates emergency icebreaker escort fee ($45,000 saved)`,
      severity: 'NORMAL',
    });
  } else {
    // What-If Scenario dynamic computation based on user slider adjustments
    const windPenalty = Math.max(0, (env.windSpeedKnots - 20) * 4);
    const icePenalty = Math.max(0, (env.seaIceConcentrationPct - 40) * 2.5);
    const wavePenalty = Math.max(0, (env.waveHeightMeters - 2.5) * 18);
    delayMinutes = Math.round(windPenalty + icePenalty + wavePenalty);

    actualDistKm = 586 + (env.windSpeedKnots > 35 ? 26 : 0);
    fuelMultiplier = 0.88 + (env.windSpeedKnots / 100) * 0.4 + (env.seaIceConcentrationPct / 100) * 0.3;

    if (env.windSpeedKnots > 30) {
      causes.push({
        trigger: `Wind speed increased to ${env.windSpeedKnots} kts (${env.windDirectionDeg}°)`,
        physicalEffect: `Wind drag reaches ${physics.vesselWindDragKN} kN; iceberg drift speeds up to ${physics.icebergDriftSpeedKnots} kts`,
        logisticsImpact: `Adds +${Math.round(windPenalty)} min transit delay & increases bunker burn by +${Math.round((env.windSpeedKnots / 60) * 12)}%`,
        severity: env.windSpeedKnots > 42 ? 'CRITICAL' : 'CAUTION',
      });
    }
    if (env.seaIceConcentrationPct > 60) {
      causes.push({
        trigger: `Sea-ice pack density reaches ${env.seaIceConcentrationPct}%`,
        physicalEffect: `Ice crushing force: ${physics.vesselIceResistanceKN} kN on PC-3 bow`,
        logisticsImpact: `Speed drops to ${physics.effectiveSpeedKnots} kts (+${Math.round(icePenalty)} min delay)`,
        severity: 'CRITICAL',
      });
    }
  }

  const actualHours = nominalHours + (delayMinutes / 60);
  const remainingDistKm = Math.round(actualDistKm * (1 - progressPct / 100));

  // Fuel calculations
  const baselineFuelTons = 114.2;
  const actualFuelTons = parseFloat((baselineFuelTons * fuelMultiplier).toFixed(1));
  const fuelSavedTons = parseFloat((baselineFuelTons - actualFuelTons).toFixed(1));
  const fuelSavedPct = parseFloat(((fuelSavedTons / baselineFuelTons) * 100).toFixed(1));

  const fuelCostUSD = Math.round(actualFuelTons * FUEL_PRICE_USD_PER_TON);
  const costSavedUSD = Math.round(fuelSavedTons * FUEL_PRICE_USD_PER_TON);
  const co2Tons = parseFloat((actualFuelTons * CO2_FACTOR).toFixed(1));

  const fuelCapacityTons = 480;
  const fuelConsumed = parseFloat((actualFuelTons * (progressPct / 100)).toFixed(1));
  const fuelRemaining = parseFloat((fuelCapacityTons - fuelConsumed).toFixed(1));

  const routeEfficiency = Math.min(99, Math.max(45, Math.round(100 - (delayMinutes / nominalHours / 60) * 100)));
  const onTimeProb = Math.min(99, Math.max(20, Math.round(100 - (delayMinutes / 3.5))));

  return {
    routeId: routeType === 'AI_OPTIMIZED' ? 'AI-LEAD-01' : routeType === 'ORIGINAL_BLOCKED' ? 'DIR-01' : 'WHATIF-SIM',
    routeName: routeType === 'AI_OPTIMIZED' ? 'Sentinel SAR Lead Corridor' : routeType === 'ORIGINAL_BLOCKED' ? 'Direct Great Circle Route' : 'What-If Simulation Route',
    totalDistanceKm: actualDistKm,
    totalDistanceNm: Math.round(actualDistKm * 0.539957),
    distanceRemainingKm: remainingDistKm,
    nominalDurationHours: parseFloat(nominalHours.toFixed(1)),
    actualDurationHours: parseFloat(actualHours.toFixed(1)),
    delayHours: parseFloat((delayMinutes / 60).toFixed(1)),
    delayMinutes,
    fuelConsumedMetricTons: actualFuelTons,
    fuelRemainingMetricTons: fuelRemaining,
    fuelCapacityMetricTons: fuelCapacityTons,
    fuelSavedVsBaselineTons: fuelSavedTons,
    fuelSavedPct,
    fuelCostUSD,
    costSavedUSD,
    co2EmissionsTons: co2Tons,
    averageSpeedKnots: parseFloat((actualDistKm / (actualHours * 1.852)).toFixed(1)),
    currentSpeedKnots: physics.effectiveSpeedKnots,
    routeEfficiencyPct: routeEfficiency,
    onTimeProbabilityPct: onTimeProb,
    causeEffectChain: causes,
    timeline: {
      departureTime: '06:00 UTC',
      plannedETA: '02:24 UTC (+1d)',
      currentETA: delayMinutes > 0 ? `0${Math.floor(2 + delayMinutes / 60)}:${Math.round(24 + (delayMinutes % 60)) % 60} UTC (+1d)` : '02:24 UTC (+1d)',
      delayString: delayMinutes > 0 ? `+${Math.floor(delayMinutes / 60)}h ${delayMinutes % 60}m` : 'On Schedule',
      newAIETA: '22:00 UTC (Today)',
    },
  };
}
