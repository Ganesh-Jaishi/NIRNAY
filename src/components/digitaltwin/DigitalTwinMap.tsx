import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { EnvironmentalConditions, PhysicsReadout } from '../../services/physicsEngine';

delete (L.Icon.Default.prototype as any)._getIconUrl;

// High-Vis Custom Leaflet Icons
const vesselIcon = (isDanger: boolean, heading: number) =>
  L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="absolute -inset-2 rounded-full ${isDanger ? 'bg-red-500/50 animate-ping' : 'bg-emerald-500/40'}"></div>
        <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 ${
          isDanger ? 'bg-red-600 border-white text-white' : 'bg-emerald-500 border-white text-black'
        } font-black text-2xl transition-transform duration-500" style="transform: rotate(${heading - 90}deg);">
          🚢
        </div>
        <div class="mt-1.5 bg-[#0c182b] border-2 border-cyan-400 text-white font-mono text-xs font-black px-2 py-0.5 rounded shadow-2xl whitespace-nowrap">
          RV POLARSTERN
        </div>
      </div>
    `,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const icebergIcon = (name: string, sizeMt: number, driftKts: number, driftDeg: number) =>
  L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-12 h-12 rounded-xl bg-red-600 border-2 border-white flex items-center justify-center text-white font-black text-xl shadow-2xl animate-pulse">
          ▲
        </div>
        <div class="mt-1 bg-red-950 border-2 border-red-500 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded shadow-2xl whitespace-nowrap text-center">
          ${name}<br/>
          <span class="text-[9px] text-red-300 font-bold">${sizeMt} Mt · ${driftKts} kts @ ${driftDeg}°</span>
        </div>
      </div>
    `,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const stationIcon = (name: string, flag: string, role: string) =>
  L.divIcon({
    html: `
      <div class="flex flex-col items-center">
        <div class="flex items-center gap-1.5 bg-[#0c182b] border-2 border-cyan-400 px-3 py-1.5 rounded-lg shadow-2xl text-white font-mono text-xs font-black whitespace-nowrap">
          <span class="text-base">${flag}</span>
          <span>${name}</span>
        </div>
        <span class="text-[10px] font-bold text-cyan-300 mt-0.5 uppercase tracking-wider bg-black/70 px-1.5 py-0.2 rounded">${role}</span>
      </div>
    `,
    className: '',
    iconSize: [120, 36],
    iconAnchor: [60, 18],
  });

const waypointIcon = (idx: number, name: string) =>
  L.divIcon({
    html: `
      <div class="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white text-black font-mono font-black text-[10px] flex items-center justify-center shadow-lg">
        ${idx}
      </div>
    `,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

// Waypoint coordinates
const MAWSON_POS: [number, number] = [-67.604, 62.872];
const DAVIS_POS: [number, number] = [-68.576, 77.968];

export const BLOCKED_ROUTE: [number, number][] = [
  MAWSON_POS,
  [-67.75, 66.5],
  [-67.95, 70.0],
  [-68.05, 71.8], // Intercepts Iceberg D-28
  [-68.25, 74.8],
  DAVIS_POS,
];

export const AI_SAFE_ROUTE: [number, number][] = [
  MAWSON_POS,
  [-67.4, 66.5],
  [-67.1, 69.8],  // Enter SAR lead channel
  [-66.85, 73.2], // Open water corridor
  [-67.35, 75.8], // Cleared iceberg hazard cone
  DAVIS_POS,
];

export const WHATIF_ROUTE: [number, number][] = [
  MAWSON_POS,
  [-67.2, 66.0],
  [-66.6, 70.0],  // Northern storm avoidance corridor
  [-66.5, 73.5],
  [-67.1, 76.2],
  DAVIS_POS,
];

// Heavy Pack Ice Zone
const PACK_ICE_ZONE: [number, number][] = [
  [-67.5, 68.5],
  [-67.5, 75.2],
  [-68.8, 77.0],
  [-68.8, 68.0],
];

// Open Lead Channel
const OPEN_LEAD_CHANNEL: [number, number][] = [
  [-66.7, 69.0],
  [-66.6, 75.5],
  [-67.3, 75.5],
  [-67.3, 69.0],
];

export type BasemapType = 'satellite' | 'ocean' | 'osm' | 'topo';

const BASEMAPS: Record<BasemapType, { name: string; url: string; icon: string }> = {
  satellite: {
    name: 'Real Satellite (ESRI)',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  },
  ocean: {
    name: 'Ocean Bathymetry',
    icon: '🌊',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean/MapServer/tile/{z}/{y}/{x}',
  },
  osm: {
    name: 'OpenStreetMap',
    icon: '🌍',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  },
  topo: {
    name: 'Polar Topographic',
    icon: '🗺️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  },
};

interface DigitalTwinMapProps {
  env: EnvironmentalConditions;
  physics: PhysicsReadout;
  activeRouteType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF';
  vesselProgressPct: number;
  onVesselProgressChange: (pct: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  showCurrentVectors: boolean;
  showWindVectors: boolean;
  showIceConcentration: boolean;
}

// Interpolate vessel position along active route
function getInterpolatedPosition(route: [number, number][], pct: number): { pos: [number, number]; heading: number } {
  if (route.length < 2) return { pos: route[0], heading: 90 };
  const totalSegments = route.length - 1;
  const progress = Math.min(0.999, Math.max(0, pct / 100));
  const segmentFloat = progress * totalSegments;
  const segIdx = Math.floor(segmentFloat);
  const segFrac = segmentFloat - segIdx;

  const p1 = route[segIdx];
  const p2 = route[segIdx + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segFrac;
  const lon = p1[1] + (p2[1] - p1[1]) * segFrac;

  // Heading
  const dLat = p2[0] - p1[0];
  const dLon = p2[1] - p1[1];
  let heading = (Math.atan2(dLon, dLat) * 180) / Math.PI;
  if (heading < 0) heading += 360;

  return { pos: [lat, lon], heading };
}

export default function DigitalTwinMap({
  env,
  physics,
  activeRouteType,
  vesselProgressPct,
  onVesselProgressChange,
  isPlaying,
  onTogglePlay,
  showCurrentVectors,
  showWindVectors,
  showIceConcentration,
}: DigitalTwinMapProps) {
  const [basemap, setBasemap] = useState<BasemapType>('satellite');
  const [icebergOffset, setIcebergOffset] = useState({ dLat: 0, dLon: 0 });

  const activeRoute =
    activeRouteType === 'AI_OPTIMIZED'
      ? AI_SAFE_ROUTE
      : activeRouteType === 'WHAT_IF'
      ? WHATIF_ROUTE
      : BLOCKED_ROUTE;

  const { pos: vesselPos, heading: vesselHeading } = getInterpolatedPosition(activeRoute, vesselProgressPct);

  // Dynamic Iceberg Position based on Physics Drift Engine
  useEffect(() => {
    const driftHeadingRad = (physics.icebergDriftHeadingDeg * Math.PI) / 180;
    const driftSpeedFactor = physics.icebergDriftSpeedKnots * 0.0003;
    setIcebergOffset({
      dLat: driftSpeedFactor * Math.cos(driftHeadingRad),
      dLon: driftSpeedFactor * Math.sin(driftHeadingRad),
    });
  }, [physics.icebergDriftHeadingDeg, physics.icebergDriftSpeedKnots]);

  const dynamicBergPos: [number, number] = [-68.05 + icebergOffset.dLat, 71.8 + icebergOffset.dLon];

  // Simulation playback loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        onVesselProgressChange(vesselProgressPct >= 100 ? 0 : vesselProgressPct + 0.5);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, vesselProgressPct, onVesselProgressChange]);

  const isDanger = activeRouteType === 'ORIGINAL_BLOCKED';

  return (
    <div className="relative w-full h-full bg-[#040914] overflow-hidden select-none">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center bg-[#0c182b]/95 border-2 border-[#1e3559] p-2 rounded-xl shadow-2xl backdrop-blur-md gap-2 flex-wrap">
        {/* Basemap Switcher */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#1e3559]">
          <span className="text-[11px] font-mono font-bold text-slate-400 uppercase">Map:</span>
          {(['satellite', 'ocean', 'osm'] as BasemapType[]).map((type) => (
            <button
              key={type}
              onClick={() => setBasemap(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                basemap === type
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
            >
              <span>{BASEMAPS[type].icon}</span>
              <span>{BASEMAPS[type].name.split(' ')[0]}</span>
            </button>
          ))}
        </div>

        {/* Voyage Playback Simulation */}
        <div className="flex items-center gap-2 pl-1">
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
                : 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30'
            }`}
          >
            <span>{isPlaying ? '⏸ PAUSE NAV' : '▶ SIMULATE VOYAGE'}</span>
          </button>

          <input
            type="range"
            min="0"
            max="100"
            value={vesselProgressPct}
            onChange={(e) => onVesselProgressChange(parseFloat(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer"
            title="Vessel route progression slider"
          />
          <span className="font-mono text-xs text-cyan-300 font-bold">{Math.round(vesselProgressPct)}%</span>
        </div>
      </div>

      {/* Dynamic Physics Vector HUD on Map */}
      <div className="absolute top-4 right-4 z-[1000] bg-[#0c182b]/95 border-2 border-[#1e3559] p-2.5 rounded-xl shadow-2xl backdrop-blur-md font-mono text-xs space-y-1">
        <div className="flex items-center justify-between gap-3 text-slate-300 border-b border-[#1e3559] pb-1">
          <span className="font-bold text-white">PHYSICS ENVIRONMENT</span>
          <span className="text-[10px] text-cyan-400 font-bold">DIGITAL TWIN LIVE</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Wind:</span>
          <span className="text-cyan-300 font-bold">{env.windSpeedKnots} kts @ {env.windDirectionDeg}°</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Current:</span>
          <span className="text-cyan-300 font-bold">{env.currentSpeedKnots} kts @ {env.currentDirectionDeg}°</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-slate-400">Berg Drift:</span>
          <span className="text-red-400 font-bold">{physics.icebergDriftSpeedKnots} kts @ {physics.icebergDriftHeadingDeg}°</span>
        </div>
      </div>

      {/* Main Leaflet Map */}
      <MapContainer
        center={[-67.8, 72.0]}
        zoom={6}
        style={{ height: '100%', width: '100%', background: '#040914' }}
        zoomControl={false}
      >
        <TileLayer
          key={basemap}
          url={BASEMAPS[basemap].url}
          attribution="&copy; OpenAccess Polar Basemap"
          maxZoom={18}
        />

        {/* Sea-Ice Pack Zone (SIC %) */}
        {showIceConcentration && (
          <Polygon
            positions={PACK_ICE_ZONE}
            pathOptions={{
              color: '#ff334b',
              fillColor: '#ff334b',
              fillOpacity: isDanger ? 0.42 : 0.15,
              weight: 3,
              dashArray: '6 6',
            }}
          >
            <Tooltip sticky>
              <div className="font-sans text-sm p-1">
                <strong className="text-red-400 font-bold">🔴 HEAVY PACK ICE (SIC {env.seaIceConcentrationPct}%)</strong><br />
                <span>Thickness: {env.iceThicknessMeters}m Multi-Year Ice</span><br />
                <span>Resistance: {physics.vesselIceResistanceKN} kN (High Drag)</span>
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* Sentinel-1 SAR Open Lead Channel */}
        <Polygon
          positions={OPEN_LEAD_CHANNEL}
          pathOptions={{
            color: '#00e699',
            fillColor: '#00e699',
            fillOpacity: 0.32,
            weight: 3,
          }}
        >
          <Tooltip sticky>
            <div className="font-sans text-sm p-1">
              <strong className="text-emerald-400 font-bold">🟢 SAR OPEN LEAD CHANNEL (SIC 16%)</strong><br />
              <span>Sentinel-1 SAR Verified Path</span><br />
              <span>Low Resistance: {Math.round(physics.vesselIceResistanceKN * 0.18)} kN</span>
            </div>
          </Tooltip>
        </Polygon>

        {/* Route Lines */}
        <Polyline
          positions={BLOCKED_ROUTE}
          pathOptions={{
            color: '#ff334b',
            weight: activeRouteType === 'ORIGINAL_BLOCKED' ? 8 : 3,
            opacity: activeRouteType === 'ORIGINAL_BLOCKED' ? 1 : 0.4,
            dashArray: '8 8',
          }}
        />

        <Polyline
          positions={AI_SAFE_ROUTE}
          pathOptions={{
            color: '#00e699',
            weight: activeRouteType === 'AI_OPTIMIZED' ? 8 : 3,
            opacity: activeRouteType === 'AI_OPTIMIZED' ? 1 : 0.4,
          }}
        />

        {activeRouteType === 'WHAT_IF' && (
          <Polyline
            positions={WHATIF_ROUTE}
            pathOptions={{
              color: '#38bdf8',
              weight: 8,
              opacity: 1,
              dashArray: '6 4',
            }}
          />
        )}

        {/* Waypoints for Active Route */}
        {activeRoute.map((pt, i) => (
          <Marker key={`wp-${i}`} position={pt} icon={waypointIcon(i + 1, `WP-${i + 1}`)}>
            <Tooltip>
              <div className="font-mono text-xs">
                <strong>WAYPOINT {i + 1}</strong><br />
                <span>Lat: {pt[0].toFixed(3)}°S · Lon: {pt[1].toFixed(3)}°E</span><br />
                <span>Leg Speed: {physics.effectiveSpeedKnots} kts</span>
              </div>
            </Tooltip>
          </Marker>
        ))}

        {/* Antarctic Stations */}
        <Marker position={MAWSON_POS} icon={stationIcon('MAWSON STATION', '🇦🇺', 'DEPARTURE')} />
        <Marker position={DAVIS_POS} icon={stationIcon('DAVIS STATION', '🇦🇺', 'DESTINATION')} />

        {/* Dynamically Moving Research Vessel */}
        <Marker position={vesselPos} icon={vesselIcon(isDanger, vesselHeading)}>
          <Tooltip permanent direction="top" offset={[0, -28]}>
            <div className="bg-[#0c182b] border-2 border-cyan-400 text-white font-mono text-[11px] font-black px-2 py-0.5 rounded shadow-xl">
              {physics.effectiveSpeedKnots} kts · {Math.round(vesselHeading)}°
            </div>
          </Tooltip>
        </Marker>

        {/* Physics-Drifting Iceberg D-28 with Hazard Cone */}
        <Marker
          position={dynamicBergPos}
          icon={icebergIcon('ICEBERG D-28', 1636, physics.icebergDriftSpeedKnots, physics.icebergDriftHeadingDeg)}
        />
        <Circle
          center={dynamicBergPos}
          radius={28000} // 28 km collision buffer
          pathOptions={{
            color: '#ff334b',
            fillColor: '#ff334b',
            fillOpacity: isDanger ? 0.35 : 0.08,
            weight: 2,
            dashArray: '6 6',
          }}
        />
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-5 left-5 z-[1000] bg-[#0c182b]/95 border-2 border-[#1e3559] rounded-xl p-3.5 text-xs font-mono space-y-1.5 shadow-2xl backdrop-blur-md">
        <div className="text-xs font-black text-white pb-1 border-b border-[#1e3559] uppercase">
          Digital Twin Environment
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-600 rounded-sm"></span>
          <span className="text-slate-200">Iceberg D-28 Hazard Buffer (CPA 4.2 km)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-red-500/40 border border-red-500 rounded-sm"></span>
          <span className="text-slate-200">Heavy Pack Ice (SIC {env.seaIceConcentrationPct}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-emerald-500 rounded-sm"></span>
          <span className="text-emerald-300 font-bold">AI Open-Water Lead Corridor</span>
        </div>
      </div>
    </div>
  );
}
