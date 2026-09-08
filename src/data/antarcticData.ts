// ============================================================
// ANTARCTIC MARITIME DATA — Prototype / Simulated Data
// All values are scientifically plausible but SIMULATED.
// Not for real navigation use.
// ============================================================

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type RouteStatus = 'ACTIVE' | 'STANDBY' | 'CAUTION' | 'RESTRICTED';
export type VesselStatus = 'UNDERWAY' | 'RESEARCH' | 'STOPPED' | 'WARNING';
export type Heading = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

// Configurable thresholds
export const RISK_THRESHOLDS = {
  icebergWarningKm: 25,
  icebergHighRiskKm: 15,
  icebergCriticalKm: 5,
  // Route scoring weights (0–1, must sum to 1)
  weights: {
    safety: 0.35,
    iceRisk: 0.25,
    icebergRisk: 0.20,
    weatherRisk: 0.10,
    fuelEfficiency: 0.05,
    distance: 0.05,
  },
};

// ────────────────────────────────────────────────────────────
// Station positions (reference only)
// ────────────────────────────────────────────────────────────
export interface AntarcticStation {
  id: string;
  name: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  type: 'YEAR_ROUND' | 'SUMMER_ONLY' | 'PORT';
  iceShelfSector: string;
}

export const ANTARCTIC_STATIONS: AntarcticStation[] = [
  { id: 'MAWSON',   name: 'Mawson Station',            country: 'Australia',      flag: '🇦🇺', lat: -67.604, lon: 62.872,  type: 'YEAR_ROUND', iceShelfSector: 'Mac. Robertson Land' },
  { id: 'DAVIS',    name: 'Davis Station',             country: 'Australia',      flag: '🇦🇺', lat: -68.576, lon: 77.968,  type: 'YEAR_ROUND', iceShelfSector: 'Prydz Bay' },
  { id: 'CASEY',    name: 'Casey Station',             country: 'Australia',      flag: '🇦🇺', lat: -66.282, lon: 110.527, type: 'YEAR_ROUND', iceShelfSector: 'Wilkes Land' },
  { id: 'BHARATI',  name: 'Bharati Station',           country: 'India',          flag: '🇮🇳', lat: -69.407, lon: 76.191,  type: 'YEAR_ROUND', iceShelfSector: 'Larsemann Hills' },
  { id: 'MAITRI',   name: 'Maitri Station',            country: 'India',          flag: '🇮🇳', lat: -70.767, lon: 11.733,  type: 'YEAR_ROUND', iceShelfSector: 'Schirmacher Oasis' },
  { id: 'MCMURDO',  name: 'McMurdo Station',           country: 'United States',  flag: '🇺🇸', lat: -77.851, lon: 166.668, type: 'YEAR_ROUND', iceShelfSector: 'Ross Ice Shelf' },
  { id: 'PALMER',   name: 'Palmer Station',            country: 'United States',  flag: '🇺🇸', lat: -64.774, lon: -64.053, type: 'YEAR_ROUND', iceShelfSector: 'Antarctic Peninsula' },
  { id: 'ROTHERA',  name: 'Rothera Research Station',  country: 'United Kingdom', flag: '🇬🇧', lat: -67.570, lon: -68.125, type: 'YEAR_ROUND', iceShelfSector: 'Adelaide Island' },
  { id: 'HALLEY',   name: 'Halley VI Research Station',country: 'United Kingdom', flag: '🇬🇧', lat: -75.583, lon: -25.500, type: 'YEAR_ROUND', iceShelfSector: 'Brunt Ice Shelf' },
  { id: 'NEUMAYER', name: 'Neumayer Station III',      country: 'Germany',        flag: '🇩🇪', lat: -70.667, lon: -8.267,  type: 'YEAR_ROUND', iceShelfSector: 'Ekström Ice Shelf' },
  { id: 'MIRNY',    name: 'Mirny Station',             country: 'Russia',         flag: '🇷🇺', lat: -66.553, lon: 93.017,  type: 'YEAR_ROUND', iceShelfSector: 'Davis Sea' },
  { id: 'DDU',      name: "Dumont d'Urville Station",  country: 'France',         flag: '🇫🇷', lat: -66.663, lon: 140.002, type: 'YEAR_ROUND', iceShelfSector: 'Adélie Land' },
  { id: 'HOBART',   name: 'Hobart Polar Port',         country: 'Australia',      flag: '🇦🇺', lat: -42.883, lon: 147.328, type: 'PORT',       iceShelfSector: 'Tasman Sea Gateway' },
  { id: 'USHUAIA',  name: 'Ushuaia Port',              country: 'Argentina',      flag: '🇦🇷', lat: -54.801, lon: -68.303, type: 'PORT',       iceShelfSector: 'Drake Passage Gateway' },
  { id: 'CAPETOWN', name: 'Cape Town Port',            country: 'South Africa',   flag: '🇿🇦', lat: -33.924, lon: 18.424,  type: 'PORT',       iceShelfSector: 'Southern Atlantic Gateway' },
];

export const STATIONS = Object.fromEntries(ANTARCTIC_STATIONS.map(s => [s.id, s]));


// ────────────────────────────────────────────────────────────
// Routes
// ────────────────────────────────────────────────────────────
export interface AntarcticRoute {
  id: string;
  name: string;
  start: string;
  destination: string;
  startCoord: [number, number];
  destCoord: [number, number];
  waypoints: [number, number][];
  distanceKm: number;
  estimatedTimeH: number;
  fuelLitres: number;
  fuelPerKm: number;
  fuelCostUSD: number;
  fuelEfficiencyLabel: string;
  riskLevel: RiskLevel;
  seaIceRisk: RiskLevel;
  icebergRisk: RiskLevel;
  weatherRisk: RiskLevel;
  oceanRisk: RiskLevel;
  status: RouteStatus;
  assignedVesselId: string | null;
  description: string;
  seaIceNotes: string;
  weatherNotes: string;
  // computed dynamically by riskService:
  computedIcebergRisk?: RiskLevel;
  computedScore?: number;
}

// Fuel constants (Antarctic polar research vessel, HFO diesel blend)
const BASE_FUEL_L_PER_KM = 52; // L/km for ~8,000 DWT polar vessel
const FUEL_COST_USD_PER_L = 0.52;

function routeFuel(distKm: number, iceFactor: number, wxFactor: number) {
  const totalFuel = Math.round(distKm * BASE_FUEL_L_PER_KM * iceFactor * wxFactor);
  const perKm = Math.round(BASE_FUEL_L_PER_KM * iceFactor * wxFactor);
  const costUSD = Math.round(totalFuel * FUEL_COST_USD_PER_L);
  return { fuelLitres: totalFuel, fuelPerKm: perKm, fuelCostUSD: costUSD };
}

export const ROUTES: AntarcticRoute[] = [
  {
    id: 'ANT-R01',
    name: 'Mawson–Davis Express',
    start: 'Mawson Station',
    destination: 'Davis Station',
    startCoord: [-67.604, 62.872],
    destCoord: [-68.576, 77.968],
    waypoints: [
      [-67.604, 62.872],
      [-67.7, 66.5],
      [-68.0, 71.0],
      [-68.2, 74.5],
      [-68.576, 77.968],
    ],
    distanceKm: 548,
    estimatedTimeH: 24.9,
    ...routeFuel(548, 1.08, 1.05),
    fuelEfficiencyLabel: 'GOOD',
    riskLevel: 'LOW',
    seaIceRisk: 'LOW',
    icebergRisk: 'HIGH',
    weatherRisk: 'LOW',
    oceanRisk: 'LOW',
    status: 'ACTIVE',
    assignedVesselId: 'V001',
    description: 'Primary resupply route between Mawson and Davis stations along the East Antarctic coast.',
    seaIceNotes: 'Prydz Bay sector. Current SIC 22–38% — within vessel operating limits.',
    weatherNotes: 'Moderate westerly winds forecast. Swell 2.1 m. Conditions acceptable.',
  },
  {
    id: 'ANT-R02',
    name: 'East Coast Passage',
    start: 'Davis Station',
    destination: 'Casey Station',
    startCoord: [-68.576, 77.968],
    destCoord: [-66.282, 110.527],
    waypoints: [
      [-68.576, 77.968],
      [-67.8, 82.5],
      [-67.0, 88.0],
      [-66.7, 94.5],
      [-66.5, 101.0],
      [-66.3, 106.5],
      [-66.282, 110.527],
    ],
    distanceKm: 742,
    estimatedTimeH: 33.7,
    ...routeFuel(742, 1.12, 1.08),
    fuelEfficiencyLabel: 'MODERATE',
    riskLevel: 'MODERATE',
    seaIceRisk: 'MODERATE',
    icebergRisk: 'MODERATE',
    weatherRisk: 'MODERATE',
    oceanRisk: 'LOW',
    status: 'ACTIVE',
    assignedVesselId: null,
    description: 'East Antarctic coastal passage through the Cooperation Sea and Vincennes Bay.',
    seaIceNotes: 'Variable sea-ice. Vincennes Bay sector may require ice routing. Monitoring B47 iceberg.',
    weatherNotes: 'Southern Ocean swell 3.2 m. Gale warning possible within 48h.',
  },
  {
    id: 'ANT-R03',
    name: 'Casey–DDU Coastal Link',
    start: 'Casey Station',
    destination: "Dumont d'Urville",
    startCoord: [-66.282, 110.527],
    destCoord: [-66.663, 140.002],
    waypoints: [
      [-66.282, 110.527],
      [-65.8, 116.5],
      [-65.4, 123.0],
      [-65.7, 130.0],
      [-66.1, 136.0],
      [-66.663, 140.002],
    ],
    distanceKm: 618,
    estimatedTimeH: 28.1,
    ...routeFuel(618, 1.10, 1.06),
    fuelEfficiencyLabel: 'GOOD',
    riskLevel: 'MODERATE',
    seaIceRisk: 'LOW',
    icebergRisk: 'MODERATE',
    weatherRisk: 'MODERATE',
    oceanRisk: 'LOW',
    status: 'STANDBY',
    assignedVesselId: null,
    description: 'Seasonal coastal link between Casey and Dumont d\'Urville along the Wilkes Land coast.',
    seaIceNotes: 'George V Land sector. Seasonal ice variability. Current SIC 18–30%.',
    weatherNotes: 'Strong katabatic winds possible near DDU. Sea state 2.8 m.',
  },
  {
    id: 'ANT-R04',
    name: 'Mirny–Mawson Connector',
    start: 'Mirny Station',
    destination: 'Mawson Station',
    startCoord: [-66.553, 93.017],
    destCoord: [-67.604, 62.872],
    waypoints: [
      [-66.553, 93.017],
      [-67.0, 88.0],
      [-67.3, 82.5],
      [-67.4, 77.0],
      [-67.5, 71.5],
      [-67.6, 67.0],
      [-67.604, 62.872],
    ],
    distanceKm: 502,
    estimatedTimeH: 22.8,
    ...routeFuel(502, 1.06, 1.04),
    fuelEfficiencyLabel: 'EXCELLENT',
    riskLevel: 'LOW',
    seaIceRisk: 'LOW',
    icebergRisk: 'LOW',
    weatherRisk: 'LOW',
    oceanRisk: 'LOW',
    status: 'STANDBY',
    assignedVesselId: null,
    description: 'Short logistics route connecting Mirny and Mawson stations in the Indian Ocean sector.',
    seaIceNotes: 'Davis Sea sector. Relatively open water. SIC 10–22%.',
    weatherNotes: 'Favorable conditions. Light SE wind. Swell 1.8 m.',
  },
  {
    id: 'ANT-R05',
    name: 'Hobart–Casey Resupply',
    start: 'Hobart, Tasmania',
    destination: 'Casey Station',
    startCoord: [-42.883, 147.328],
    destCoord: [-66.282, 110.527],
    waypoints: [
      [-42.883, 147.328],
      [-48.5, 143.0],
      [-54.0, 136.5],
      [-58.5, 128.5],
      [-62.0, 120.5],
      [-64.5, 115.0],
      [-66.282, 110.527],
    ],
    distanceKm: 3240,
    estimatedTimeH: 147.3,
    ...routeFuel(3240, 1.18, 1.12),
    fuelEfficiencyLabel: 'MODERATE',
    riskLevel: 'HIGH',
    seaIceRisk: 'MODERATE',
    icebergRisk: 'LOW',
    weatherRisk: 'HIGH',
    oceanRisk: 'HIGH',
    status: 'CAUTION',
    assignedVesselId: 'V002',
    description: 'Annual resupply voyage from Hobart, Tasmania to Casey Station across the Southern Ocean.',
    seaIceNotes: 'Southern Ocean transit. Ice encountered south of 62°S. Pack ice entry expected near destination.',
    weatherNotes: 'Active Southern Ocean. Multiple storm systems. Roaring Forties/Furious Fifties transit. Swell 5.2 m.',
  },
];

// ────────────────────────────────────────────────────────────
// Vessels
// ────────────────────────────────────────────────────────────
export interface AntarcticVessel {
  id: string;
  name: string;
  type: string;
  flag: string;
  iceClass: string;
  lat: number;
  lon: number;
  speedKnots: number;
  heading: number;
  headingLabel: Heading;
  status: VesselStatus;
  currentRouteId: string | null;
  progress: number;  // 0–1 along route waypoints
  fuelRemainingL: number;
  fuelCapacityL: number;
  draught: number;
  notes: string;
}

export const VESSELS: AntarcticVessel[] = [
  {
    id: 'V001',
    name: 'RV Bharti',
    type: 'Polar Research Vessel',
    flag: 'India',
    iceClass: 'PC-5',
    lat: -67.604,
    lon: 62.872,
    speedKnots: 12.5,
    heading: 102,
    headingLabel: 'E',
    status: 'UNDERWAY',
    currentRouteId: 'ANT-R01',
    progress: 0.05,
    fuelRemainingL: 1_840_000,
    fuelCapacityL: 2_800_000,
    draught: 6.8,
    notes: 'Deployed on ANT-R01 resupply mission. Research operations at Davis Station upon arrival.',
  },
  {
    id: 'V002',
    name: 'MV Nuyina',
    type: 'Icebreaker/Supply Vessel',
    flag: 'Australia',
    iceClass: 'PC-3',
    lat: -55.8,
    lon: 131.2,
    speedKnots: 14.0,
    heading: 210,
    headingLabel: 'SW',
    status: 'UNDERWAY',
    currentRouteId: 'ANT-R05',
    progress: 0.42,
    fuelRemainingL: 3_200_000,
    fuelCapacityL: 4_500_000,
    draught: 7.5,
    notes: 'Annual resupply voyage to Casey Station. Currently in Southern Ocean transit phase.',
  },
  {
    id: 'V003',
    name: 'RV Investigator',
    type: 'Marine Research Vessel',
    flag: 'Australia',
    iceClass: 'PC-6',
    lat: -68.576,
    lon: 77.968,
    speedKnots: 0,
    heading: 0,
    headingLabel: 'N',
    status: 'RESEARCH',
    currentRouteId: null,
    progress: 0,
    fuelRemainingL: 920_000,
    fuelCapacityL: 1_200_000,
    draught: 5.8,
    notes: 'Docked at Davis Station. Conducting oceanographic sampling program in Prydz Bay.',
  },
];

// ────────────────────────────────────────────────────────────
// Icebergs
// ────────────────────────────────────────────────────────────
export interface AntarcticIceberg {
  id: string;
  name: string;
  lat: number;
  lon: number;
  sizeKm2: number;
  lengthKm: number;
  widthKm: number;
  category: string;
  speedKnots: number;
  headingDeg: number;
  headingLabel: Heading;
  riskLevel: RiskLevel;
  nearestRouteId: string | null;
  nearestRouteDistKm: number;
  lastUpdated: string;
  notes: string;
}

export const ICEBERGS: AntarcticIceberg[] = [
  {
    id: 'ICE-042',
    name: 'B42-A',
    lat: -69.2,
    lon: 68.9,
    sizeKm2: 84.4,
    lengthKm: 12.4,
    widthKm: 6.8,
    category: 'LG (Large)',
    speedKnots: 0.42,
    headingDeg: 315,
    headingLabel: 'NW',
    riskLevel: 'HIGH',
    nearestRouteId: 'ANT-R01',
    nearestRouteDistKm: 11.2,
    lastUpdated: '2024-01-15T05:30:00Z',
    notes: 'Tracking northwest. Trajectory intersects ANT-R01 corridor within 18h.',
  },
  {
    id: 'ICE-B47',
    name: 'B47-C',
    lat: -68.1,
    lon: 85.6,
    sizeKm2: 17.6,
    lengthKm: 5.3,
    widthKm: 3.3,
    category: 'BB (Bergy Bit)',
    speedKnots: 0.38,
    headingDeg: 290,
    headingLabel: 'W',
    riskLevel: 'MODERATE',
    nearestRouteId: 'ANT-R02',
    nearestRouteDistKm: 18.4,
    lastUpdated: '2024-01-15T04:00:00Z',
    notes: 'Moving westward. Approaching ANT-R02 corridor. Continue monitoring.',
  },
  {
    id: 'ICE-C19',
    name: 'C19-D',
    lat: -67.5,
    lon: 97.3,
    sizeKm2: 48.2,
    lengthKm: 8.6,
    widthKm: 5.6,
    category: 'LG (Large)',
    speedKnots: 0.29,
    headingDeg: 305,
    headingLabel: 'NW',
    riskLevel: 'MODERATE',
    nearestRouteId: 'ANT-R02',
    nearestRouteDistKm: 22.1,
    lastUpdated: '2024-01-15T06:00:00Z',
    notes: 'Large iceberg drifting NW. Trajectory suggests convergence with ANT-R02 at T+36h.',
  },
  {
    id: 'ICE-D15',
    name: 'D15-A',
    lat: -65.9,
    lon: 119.8,
    sizeKm2: 9.8,
    lengthKm: 3.4,
    widthKm: 2.9,
    category: 'MED (Medium)',
    speedKnots: 0.55,
    headingDeg: 270,
    headingLabel: 'W',
    riskLevel: 'LOW',
    nearestRouteId: 'ANT-R03',
    nearestRouteDistKm: 28.7,
    lastUpdated: '2024-01-15T05:00:00Z',
    notes: 'Moving west. At current trajectory, distance from ANT-R03 will increase.',
  },
  {
    id: 'ICE-E22',
    name: 'E22-B',
    lat: -62.8,
    lon: 105.4,
    sizeKm2: 312.0,
    lengthKm: 24.8,
    widthKm: 12.6,
    category: 'VLG (Very Large)',
    speedKnots: 0.18,
    headingDeg: 280,
    headingLabel: 'W',
    riskLevel: 'LOW',
    nearestRouteId: 'ANT-R05',
    nearestRouteDistKm: 41.3,
    lastUpdated: '2024-01-15T03:00:00Z',
    notes: 'Very large iceberg in open Southern Ocean. Slow-moving. Low risk to current routes.',
  },
  {
    id: 'ICE-F31',
    name: 'F31-G',
    lat: -70.8,
    lon: 78.2,
    sizeKm2: 5.2,
    lengthKm: 2.6,
    widthKm: 2.0,
    category: 'SM (Small)',
    speedKnots: 0.22,
    headingDeg: 330,
    headingLabel: 'NW',
    riskLevel: 'MODERATE',
    nearestRouteId: 'ANT-R01',
    nearestRouteDistKm: 14.8,
    lastUpdated: '2024-01-15T06:00:00Z',
    notes: 'Small iceberg south of ANT-R01 corridor. Moving NNW — increasing proximity risk.',
  },
];

// ────────────────────────────────────────────────────────────
// Sea-ice zones — GeoJSON FeatureCollection
// ────────────────────────────────────────────────────────────
export interface SeaIceZone {
  id: string;
  name: string;
  concentration: RiskLevel;
  sicPercent: number;
  coords: [number, number][]; // [lat, lon] pairs
}

export const SEA_ICE_ZONES: SeaIceZone[] = [
  {
    id: 'SIZ-01',
    name: 'Prydz Bay Heavy Ice',
    concentration: 'HIGH',
    sicPercent: 72,
    coords: [
      [-68.5, 62.0], [-68.8, 68.0], [-70.0, 72.0],
      [-70.5, 68.0], [-70.2, 63.0], [-69.0, 61.0],
    ],
  },
  {
    id: 'SIZ-02',
    name: 'Davis Sea Moderate',
    concentration: 'MODERATE',
    sicPercent: 48,
    coords: [
      [-68.0, 76.0], [-68.5, 83.0], [-69.5, 85.0],
      [-70.0, 80.0], [-69.5, 75.0], [-68.5, 74.0],
    ],
  },
  {
    id: 'SIZ-03',
    name: 'Cooperation Sea Light',
    concentration: 'LOW',
    sicPercent: 24,
    coords: [
      [-66.5, 88.0], [-66.8, 96.0], [-68.0, 98.0],
      [-68.5, 92.0], [-67.8, 87.0],
    ],
  },
  {
    id: 'SIZ-04',
    name: 'Vincennes Bay Ice',
    concentration: 'MODERATE',
    sicPercent: 55,
    coords: [
      [-65.8, 108.5], [-66.5, 112.0], [-67.5, 113.5],
      [-68.0, 110.0], [-67.5, 107.0], [-66.5, 106.5],
    ],
  },
  {
    id: 'SIZ-05',
    name: 'George V Land Coastal',
    concentration: 'LOW',
    sicPercent: 32,
    coords: [
      [-65.5, 128.0], [-66.0, 134.0], [-66.8, 136.0],
      [-67.2, 132.0], [-67.0, 128.0], [-66.2, 127.5],
    ],
  },
  {
    id: 'SIZ-06',
    name: 'Indian Ocean Critical Pack',
    concentration: 'CRITICAL',
    sicPercent: 88,
    coords: [
      [-70.5, 64.0], [-71.2, 70.0], [-72.0, 74.0],
      [-72.5, 68.0], [-71.8, 63.0], [-71.0, 62.5],
    ],
  },
];

// ────────────────────────────────────────────────────────────
// Simulation config
// ────────────────────────────────────────────────────────────
export const SIM_CONFIG = {
  tickIntervalMs: 20_000,        // 20 real seconds per tick
  simMinutesPerTick: 30,         // 30 simulated minutes per tick
  fuelCostPerL: FUEL_COST_USD_PER_L,
};
