// ============================================================
// DIGITAL TWIN PHYSICS ENGINE
// Calculates hydrodynamic drift, ice resistance, wind drag,
// and iceberg trajectory vectors for Antarctic maritime ops.
// ============================================================

export interface EnvironmentalConditions {
  windSpeedKnots: number;        // 0 to 60 knots
  windDirectionDeg: number;      // 0 to 360 degrees
  currentSpeedKnots: number;     // 0 to 4.0 knots
  currentDirectionDeg: number;   // 0 to 360 degrees
  waveHeightMeters: number;      // 0 to 10.0 meters
  seaIceConcentrationPct: number;// 0 to 100%
  iceThicknessMeters: number;    // 0.2 to 4.0 meters
  airTempCelsius: number;        // -40 to +5 C
  waterTempCelsius: number;      // -2 to +4 C
}

export interface PhysicsReadout {
  icebergDriftSpeedKnots: number;
  icebergDriftHeadingDeg: number;
  vesselHydrodynamicDragKN: number;
  vesselIceResistanceKN: number;
  vesselWindDragKN: number;
  totalResistanceKN: number;
  effectiveSpeedKnots: number;
  fuelBurnRateKgPerHr: number;
  polarRiskLevel: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export const DEFAULT_ENVIRONMENT: EnvironmentalConditions = {
  windSpeedKnots: 22,
  windDirectionDeg: 245,
  currentSpeedKnots: 1.2,
  currentDirectionDeg: 275,
  waveHeightMeters: 2.8,
  seaIceConcentrationPct: 55,
  iceThicknessMeters: 1.4,
  airTempCelsius: -14,
  waterTempCelsius: -1.6,
};

/**
 * Calculates iceberg drift velocity from wind drag and ocean current forces
 * (Physics model based on Leppäranta and Smith & Donaldson iceberg drift dynamics)
 */
export function calculateIcebergDrift(env: EnvironmentalConditions) {
  const windRad = (env.windDirectionDeg * Math.PI) / 180;
  const currentRad = (env.currentDirectionDeg * Math.PI) / 180;

  // Wind factor ~2.5% of 10m wind speed (with ~25 deg Coriolis deflection in Southern Hemisphere)
  const windFactor = 0.025;
  const coriolisAngleRad = (-25 * Math.PI) / 180; // Deflected to the left in Southern Ocean

  const windVx = env.windSpeedKnots * windFactor * Math.sin(windRad + coriolisAngleRad);
  const windVy = env.windSpeedKnots * windFactor * Math.cos(windRad + coriolisAngleRad);

  // Ocean current factor ~90% direct drag
  const currentVx = env.currentSpeedKnots * 0.9 * Math.sin(currentRad);
  const currentVy = env.currentSpeedKnots * 0.9 * Math.cos(currentRad);

  const totalVx = windVx + currentVx;
  const totalVy = windVy + currentVy;

  const driftSpeed = Math.sqrt(totalVx * totalVx + totalVy * totalVy);
  let driftHeading = (Math.atan2(totalVx, totalVy) * 180) / Math.PI;
  if (driftHeading < 0) driftHeading += 360;

  return {
    driftSpeedKnots: parseFloat(driftSpeed.toFixed(2)),
    driftHeadingDeg: Math.round(driftHeading),
  };
}

/**
 * Calculates vessel ice resistance (Lindqvist empirical formulation) and propulsion limits
 */
export function calculateVesselPhysics(
  env: EnvironmentalConditions,
  baseCruisingSpeed: number = 14.5,
  iceClassRating: string = 'PC-3'
): PhysicsReadout {
  const berg = calculateIcebergDrift(env);

  // Hydrodynamic open-water drag (proportional to V^2)
  const hydroDrag = 120 + 2.2 * Math.pow(baseCruisingSpeed, 2) + (env.waveHeightMeters * 18);

  // Ice crushing & submersion resistance (Lindqvist model)
  // Higher SIC and thicker ice dramatically increase resistance
  const sicNorm = env.seaIceConcentrationPct / 100;
  const iceResistance = sicNorm > 0.1
    ? (380 * Math.pow(env.iceThicknessMeters, 1.4) * Math.pow(sicNorm, 1.8) * (1 + 0.15 * baseCruisingSpeed))
    : 10;

  // Wind resistance against superstructure
  const headwindAngle = Math.abs(env.windDirectionDeg - 90); // approximate heading east
  const headwindComponent = env.windSpeedKnots * Math.cos((headwindAngle * Math.PI) / 180);
  const windDrag = Math.max(15, 25 + headwindComponent * 4.5);

  const totalResistance = hydroDrag + iceResistance + windDrag;

  // Speed reduction based on ice pack and sea state
  let speedPenalty = 0;
  if (sicNorm > 0.15) {
    speedPenalty += sicNorm * 6.5 * (env.iceThicknessMeters / 1.5);
  }
  if (env.waveHeightMeters > 3.0) {
    speedPenalty += (env.waveHeightMeters - 3.0) * 0.9;
  }
  const effectiveSpeed = Math.max(3.5, baseCruisingSpeed - speedPenalty);

  // Fuel burn rate in kg/hr (HFO/MGO diesel marine engines)
  // Normal cruising: ~1,100 kg/hr; heavy ice ramming: up to 2,400 kg/hr
  const fuelBurnRate = 850 + (totalResistance * 1.85);

  // Determine POLARIS Risk Level
  let polarRiskLevel: 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'SAFE';
  if (env.seaIceConcentrationPct > 80 || env.iceThicknessMeters > 2.2 || env.waveHeightMeters > 6.0) {
    polarRiskLevel = 'CRITICAL';
  } else if (env.seaIceConcentrationPct > 65 || env.windSpeedKnots > 38 || env.waveHeightMeters > 4.5) {
    polarRiskLevel = 'HIGH';
  } else if (env.seaIceConcentrationPct > 40 || env.windSpeedKnots > 25) {
    polarRiskLevel = 'MODERATE';
  } else if (env.seaIceConcentrationPct > 15) {
    polarRiskLevel = 'LOW';
  }

  return {
    icebergDriftSpeedKnots: berg.driftSpeedKnots,
    icebergDriftHeadingDeg: berg.driftHeadingDeg,
    vesselHydrodynamicDragKN: Math.round(hydroDrag),
    vesselIceResistanceKN: Math.round(iceResistance),
    vesselWindDragKN: Math.round(windDrag),
    totalResistanceKN: Math.round(totalResistance),
    effectiveSpeedKnots: parseFloat(effectiveSpeed.toFixed(1)),
    fuelBurnRateKgPerHr: Math.round(fuelBurnRate),
    polarRiskLevel,
  };
}
