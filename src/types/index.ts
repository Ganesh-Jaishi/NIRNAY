export type RiskLevel = 'SAFE' | 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type DataStatus = 'LIVE_OBSERVATION' | 'HISTORICAL_DATA' | 'MODEL_FORECAST' | 'DEMO_SYNTHETIC' | 'FALLBACK_ESTIMATE';
export type PageId =
  | 'digital-twin'
  | 'bridge'
  | 'overview'
  | 'live-map'
  | 'sea-ice'
  | 'icebergs'
  | 'route-planner'
  | 'route-comparison'
  | 'analytics'
  | 'alerts'
  | 'data-sources'
  | 'model-center'
  | 'settings';

export interface Coordinate {
  lat: number;
  lon: number;
}

export interface Vessel {
  name: string;
  type: string;
  iceClass: string;
  position: Coordinate;
  destination: Coordinate;
  cruisingSpeedKnots: number;
  maxSpeedKnots: number;
  fuelCapacityL: number;
  fuelConsumptionRateL_per_km: number;
  maxSIC: number;
  minIcebergClearanceKm: number;
  maxWaveHeightM: number;
  maxWindSpeedKmh: number;
  heading: number;
}

export interface IcebergWaypoint {
  lat: number;
  lon: number;
  timeHours: number;
  confidence: number;
}

export interface Iceberg {
  id: string;
  name: string;
  position: Coordinate;
  lengthKm: number;
  widthKm: number;
  category: 'GR' | 'BB' | 'LG' | 'VLG' | 'GNT';
  speedKnots: number;
  directionDeg: number;
  trajectory: IcebergWaypoint[];
  collisionProbability: number;
  riskToRoute: string[];
}

export interface SeaIceForecastPoint {
  timeHours: number;
  sic: number;
  confidence: number;
  lower: number;
  upper: number;
}

export interface SeaIceCell {
  lat: number;
  lon: number;
  sic: number;
  risk: number;
  riskLevel: RiskLevel;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface Route {
  id: string;
  name: string;
  type: 'safest' | 'fastest' | 'fuel_efficient' | 'balanced';
  color: string;
  waypoints: Coordinate[];
  distanceKm: number;
  estimatedTimeH: number;
  estimatedFuelL: number;
  fuelUncertaintyPct: number;
  seaIceRisk: number;
  icebergRisk: number;
  weatherRisk: number;
  waveRisk: number;
  overallRisk: number;
  riskLevel: RiskLevel;
  confidence: number;
  explanation: Array<{ positive: boolean; text: string }>;
  isRecommended: boolean;
  algorithm: string;
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'DANGER' | 'CRITICAL';
  type: string;
  title: string;
  message: string;
  detail: string;
  timestamp: string;
  affectedRoutes: string[];
  acknowledged: boolean;
}

export interface ModelMetric {
  name: string;
  version: string;
  type: string;
  architecture: string;
  status: 'DEMO_MODEL' | 'TRAINED' | 'BASELINE' | 'EXPERIMENTAL';
  mae?: number;
  rmse?: number;
  r2?: number;
  accuracy?: number;
  trainingDate: string;
  datasetSize: string;
  description: string;
}

export interface DataSource {
  id: string;
  name: string;
  dataset: string;
  provider: string;
  status: DataStatus;
  lastUpdate: string;
  spatialResolution: string;
  temporalResolution: string;
  coverage: string;
  qualityFlag: 'GOOD' | 'ACCEPTABLE' | 'DEGRADED' | 'UNAVAILABLE';
  variables: string[];
}

export interface EnvironmentSnapshot {
  timestamp: string;
  windSpeedKmh: number;
  windDirectionDeg: number;
  waveHeightM: number;
  waveDirectionDeg: number;
  seaSurfaceTempC: number;
  airTempC: number;
  pressureHPa: number;
  visibility: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'POOR';
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  sicPercent: number;
  dataStatus: DataStatus;
}

export interface SicHistoryPoint {
  date: string;
  actual: number;
  predicted: number;
  persistence: number;
  upperBound: number;
  lowerBound: number;
}

export interface RouteComparisonPoint {
  label: string;
  safest: number;
  fastest: number;
  fuel: number;
  balanced: number;
}
