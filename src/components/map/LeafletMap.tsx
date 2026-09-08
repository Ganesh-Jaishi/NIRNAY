import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, Polygon, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { AntarcticRoute, AntarcticVessel, AntarcticIceberg, SeaIceZone, RiskLevel, AntarcticStation } from '../../data/antarcticData';
import { ANTARCTIC_STATIONS } from '../../data/antarcticData';
import { routeColor } from '../../services/riskService';

// Fix Leaflet default icon issues
delete (L.Icon.Default.prototype as any)._getIconUrl;

// Custom divIcon factories
function makeVesselIcon(vessel: AntarcticVessel) {
  const statusClass = vessel.status === 'WARNING' ? 'WARNING' : vessel.status === 'STOPPED' ? 'STOPPED' : '';
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-2 rounded-full ${vessel.status === 'WARNING' ? 'bg-red-500/20 animate-ping' : 'bg-cyan-500/10'}"></div>
        <div class="vessel-marker ${statusClass} flex items-center justify-center text-xs shadow-lg shadow-cyan-500/20" title="${vessel.name}">
          🚢
        </div>
      </div>
    `,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function makeIcebergIcon(risk: RiskLevel, bergId: string) {
  const color = risk === 'CRITICAL' ? '#dc2626' : risk === 'HIGH' ? '#ef4444' : risk === 'MODERATE' ? '#f59e0b' : '#22c55e';
  return L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="iceberg-marker ${risk} flex items-center justify-center font-bold text-[10px] text-white shadow-lg" style="background:${color};border:2px solid #ffffffaa;border-radius:4px;width:24px;height:24px;">
          ▲
        </div>
        <span class="text-[9px] font-mono font-bold px-1 rounded mt-0.5 bg-[#050d1a]/90 text-cyan-300 border border-[#142840] whitespace-nowrap shadow">
          ${bergId}
        </span>
      </div>
    `,
    className: '',
    iconSize: [28, 38],
    iconAnchor: [14, 19],
    popupAnchor: [0, -20],
  });
}

function makeStationIcon(station: AntarcticStation) {
  const isPort = station.type === 'PORT';
  return L.divIcon({
    html: `
      <div class="relative flex items-center gap-1 group cursor-pointer">
        <div class="w-3.5 h-3.5 rounded-full ${isPort ? 'bg-amber-400' : 'bg-cyan-400'} border-2 border-[#050d1a] shadow-md flex items-center justify-center ring-2 ring-cyan-500/30">
          <div class="w-1 h-1 rounded-full bg-black"></div>
        </div>
        <span class="text-[9px] font-mono px-1 py-0.5 rounded bg-[#050d1a]/95 text-slate-200 border border-[#1e3a5f] shadow whitespace-nowrap">
          ${station.flag} ${station.name.split(' ')[0]}
        </span>
      </div>
    `,
    className: '',
    iconSize: [32, 20],
    iconAnchor: [7, 10],
    popupAnchor: [0, -12],
  });
}

// Sea-ice style by concentration
function seaIceStyle(level: RiskLevel) {
  const styles: Record<RiskLevel, { color: string; fillColor: string; fillOpacity: number }> = {
    LOW:      { color: '#00c4e8', fillColor: '#00c4e8', fillOpacity: 0.14 },
    MODERATE: { color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.22 },
    HIGH:     { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.28 },
    CRITICAL: { color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.38 },
  };
  return styles[level];
}

// Component to imperatively fly to a position
function MapController({ flyTo }: { flyTo: { lat: number; lon: number; zoom?: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) {
      map.flyTo([flyTo.lat, flyTo.lon], flyTo.zoom ?? 5, { duration: 1.5 });
    }
  }, [flyTo, map]);
  return null;
}

// Mouse coordinates tracker
function MouseTracker({ onMouseMove }: { onMouseMove: (coords: { lat: number; lon: number }) => void }) {
  useMapEvents({
    mousemove(e) {
      onMouseMove({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return null;
}

export type BasemapType = 'dark' | 'satellite' | 'ocean' | 'osm';

const BASEMAP_TILES: Record<BasemapType, { url: string; attribution: string; maxZoom: number }> = {
  dark: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
  ocean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Ocean Basemap & Bathymetry, GEBCO, NOAA',
    maxZoom: 16,
  },
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
};

interface LayerVisibility {
  routes: boolean;
  vessels: boolean;
  icebergs: boolean;
  seaIce: boolean;
  riskZones: boolean;
  stations?: boolean;
  trajectories?: boolean;
}

interface Props {
  routes: AntarcticRoute[];
  vessels: AntarcticVessel[];
  icebergs: AntarcticIceberg[];
  seaIceZones: SeaIceZone[];
  layers: LayerVisibility;
  selectedRouteId: string | null;
  onRouteClick: (routeId: string) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  forecastHours?: number;
}

export default function LeafletMap({
  routes,
  vessels,
  icebergs,
  seaIceZones,
  layers,
  selectedRouteId,
  onRouteClick,
  flyTo,
  forecastHours = 0,
}: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const [basemap, setBasemap] = useState<BasemapType>('dark');
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);

  const activeBasemap = BASEMAP_TILES[basemap];

  function routeStyle(route: AntarcticRoute, isSelected: boolean) {
    const color = routeColor(route.riskLevel);
    return {
      color: isSelected ? '#00e5a0' : color,
      weight: isSelected ? 5 : 3.5,
      opacity: isSelected ? 1 : 0.75,
      dashArray: route.status === 'STANDBY' ? '8 6' : undefined,
    };
  }

  // Quick sector jump
  const handleJumpToSector = (lat: number, lon: number, zoom: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lon], zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#010810]">
      {/* Basemap & Sector Selector Toolbar */}
      <div className="absolute top-3 left-14 z-[1000] flex items-center gap-2 bg-[#040b16]/95 backdrop-blur-md border border-[#142840] rounded-lg p-1.5 shadow-xl text-xs">
        {/* Basemap selector */}
        <div className="flex items-center gap-1 pr-2 border-r border-[#142840]">
          <span className="text-[10px] font-mono text-[#5878a0] uppercase px-1">Map:</span>
          {(['dark', 'satellite', 'ocean'] as BasemapType[]).map((type) => (
            <button
              key={type}
              onClick={() => setBasemap(type)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                basemap === type
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {type === 'dark' ? 'Tactical Dark' : type === 'satellite' ? 'Sentinel/ESRI' : 'Bathymetry'}
            </button>
          ))}
        </div>

        {/* Quick Sectors */}
        <div className="hidden sm:flex items-center gap-1 pl-1">
          <span className="text-[10px] font-mono text-[#5878a0] uppercase px-1">Focus:</span>
          <button
            onClick={() => handleJumpToSector(-68, 75, 5)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 hover:bg-white/10 hover:text-cyan-300"
          >
            Prydz Bay
          </button>
          <button
            onClick={() => handleJumpToSector(-65, -64, 5)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 hover:bg-white/10 hover:text-cyan-300"
          >
            Peninsula
          </button>
          <button
            onClick={() => handleJumpToSector(-75, 170, 4)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 hover:bg-white/10 hover:text-cyan-300"
          >
            Ross Sea
          </button>
          <button
            onClick={() => handleJumpToSector(-62, 95, 3.5)}
            className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300 hover:bg-white/10 hover:text-cyan-300"
          >
            All Antarctica
          </button>
        </div>
      </div>

      {/* Cursor coordinates HUD */}
      {cursorCoords && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-[#040b16]/90 border border-[#142840] px-2 py-1 rounded text-[10px] font-mono text-cyan-300 backdrop-blur-sm pointer-events-none">
          LAT: {Math.abs(cursorCoords.lat).toFixed(3)}°{cursorCoords.lat < 0 ? 'S' : 'N'} │ LON: {Math.abs(cursorCoords.lon).toFixed(3)}°{cursorCoords.lon < 0 ? 'W' : 'E'}
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={[-64, 85]}
        zoom={4}
        style={{ height: '100%', width: '100%', background: '#010810' }}
        maxBounds={[[-88, -180], [-25, 180]]}
        maxBoundsViscosity={0.7}
        minZoom={3}
        maxZoom={12}
        ref={mapRef}
        zoomControl={true}
      >
        <TileLayer
          key={basemap}
          url={activeBasemap.url}
          attribution={activeBasemap.attribution}
          maxZoom={activeBasemap.maxZoom}
        />

        <MapController flyTo={flyTo ?? null} />
        <MouseTracker onMouseMove={setCursorCoords} />

        {/* Sea-Ice Concentration Zones */}
        {layers.seaIce &&
          seaIceZones.map((zone) => (
            <Polygon
              key={zone.id}
              positions={zone.coords}
              pathOptions={seaIceStyle(zone.concentration)}
            >
              <Tooltip sticky className="route-tooltip">
                <div className="p-1 font-mono text-[11px]">
                  <strong className="text-cyan-300">{zone.name}</strong><br />
                  <span>Sea-Ice Concentration: </span>
                  <span className="font-bold text-amber-300">{zone.sicPercent}%</span><br />
                  <span>Ice Stage: First-Year & Nilas (0.8m avg)</span><br />
                  <span>Polar Class Limit: PC-4 or higher</span>
                </div>
              </Tooltip>
            </Polygon>
          ))}

        {/* Antarctic Research Stations & Ports */}
        {ANTARCTIC_STATIONS.map((st) => (
          <Marker
            key={st.id}
            position={[st.lat, st.lon]}
            icon={makeStationIcon(st)}
          >
            <Popup>
              <div style={{ fontFamily: 'Source Sans 3, sans-serif', minWidth: 200, padding: '4px', color: '#dde8f5' }}>
                <div className="font-bold text-sm text-cyan-400 flex items-center gap-1.5 mb-1">
                  <span>{st.flag}</span>
                  <span>{st.name}</span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">{st.country} · {st.type === 'PORT' ? 'Expedition Port' : 'Research Station'}</div>
                <div className="text-[10px] font-mono space-y-1 text-slate-300">
                  <div>Coordinates: {Math.abs(st.lat).toFixed(3)}°S, {Math.abs(st.lon).toFixed(3)}°E</div>
                  <div>Sector: {st.iceShelfSector}</div>
                  <div>Status: Operational & Telemetry Active</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Routes */}
        {layers.routes &&
          routes.map((route) => {
            const isSelected = route.id === selectedRouteId;
            const style = routeStyle(route, isSelected);
            return (
              <Polyline
                key={route.id}
                positions={route.waypoints}
                pathOptions={style}
                eventHandlers={{
                  click: () => onRouteClick(route.id),
                  mouseover: (e) => {
                    e.target.setStyle({ ...style, weight: style.weight + 2, opacity: 1 });
                  },
                  mouseout: (e) => {
                    if (route.id !== selectedRouteId) {
                      e.target.setStyle(style);
                    }
                  },
                }}
              >
                <Tooltip sticky className="route-tooltip">
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: routeColor(route.riskLevel) }}>{route.id}</span>
                    {' — '}{route.name}<br />
                    <span>Risk Level: </span>
                    <span style={{ color: routeColor(route.riskLevel), fontWeight: 700 }}>{route.riskLevel}</span>
                    <span> · {route.distanceKm} km ({Math.round(route.distanceKm * 0.539957)} nm)</span><br />
                    <span>Est. Transit: {route.estimatedTimeH}h · Bunker Fuel: {Math.round(route.fuelLitres / 1000)}k L</span><br />
                    <span style={{ color: '#00e5a0', fontSize: 10 }}>▶ Click to inspect full waypoint analysis</span>
                  </div>
                </Tooltip>
              </Polyline>
            );
          })}

        {/* Icebergs & Projected Drift Trajectories */}
        {layers.icebergs &&
          icebergs.map((berg) => {
            // Compute projected drift point for +24h/+48h based on speed & heading
            const headingRad = (berg.headingDeg * Math.PI) / 180;
            const driftDistKm24 = berg.speedKnots * 1.852 * 24;
            const driftDistKm48 = berg.speedKnots * 1.852 * 48;
            
            // Approximate lat/lon drift
            const dLat24 = (driftDistKm24 * Math.cos(headingRad)) / 111.32;
            const dLon24 = (driftDistKm24 * Math.sin(headingRad)) / (111.32 * Math.cos((berg.lat * Math.PI) / 180));
            const p24: [number, number] = [berg.lat + dLat24, berg.lon + dLon24];

            const dLat48 = (driftDistKm48 * Math.cos(headingRad)) / 111.32;
            const dLon48 = (driftDistKm48 * Math.sin(headingRad)) / (111.32 * Math.cos((berg.lat * Math.PI) / 180));
            const p48: [number, number] = [berg.lat + dLat48, berg.lon + dLon48];

            return (
              <div key={berg.id}>
                {/* Iceberg Marker */}
                <Marker position={[berg.lat, berg.lon]} icon={makeIcebergIcon(berg.riskLevel, berg.id)}>
                  <Popup>
                    <div style={{ fontFamily: 'Source Sans 3, sans-serif', minWidth: 240, padding: '6px', color: '#dde8f5' }}>
                      <div className="font-bold text-sm text-cyan-400 mb-1 flex items-center justify-between">
                        <span>Iceberg {berg.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                          {berg.riskLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">US National Ice Center ID: {berg.id}</div>
                      <div className="text-[11px] font-mono space-y-1 text-slate-300">
                        <div>Dimensions: {berg.sizeKm2} km² ({berg.lengthKm}×{berg.widthKm} km)</div>
                        <div>Drift Velocity: {berg.speedKnots} kts @ {berg.headingDeg}° ({berg.headingLabel})</div>
                        <div>Estimated Mass: ~{(berg.sizeKm2 * 180 * 0.92).toFixed(1)} Mt</div>
                        <div>Nearest Route: {berg.nearestRouteId ?? 'Clear'} ({berg.nearestRouteDistKm} km)</div>
                        {berg.nearestRouteDistKm < 25 && (
                          <div className="p-1.5 bg-red-950/60 border border-red-500/40 rounded text-red-300 text-[10px] mt-2">
                            ⚠ High collision hazard for {berg.nearestRouteId} within 18 hours
                          </div>
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>

                {/* Projected Drift Line (+48h Forecast) */}
                <Polyline
                  positions={[[berg.lat, berg.lon], p24, p48]}
                  pathOptions={{
                    color: '#00c4e8',
                    weight: 1.5,
                    dashArray: '4 4',
                    opacity: 0.7,
                  }}
                />
                <Circle
                  center={p48}
                  radius={12000}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.12,
                    weight: 1,
                    dashArray: '3 3',
                  }}
                />
              </div>
            );
          })}

        {/* Research Vessels */}
        {layers.vessels &&
          vessels.map((vessel) => (
            <Marker key={vessel.id} position={[vessel.lat, vessel.lon]} icon={makeVesselIcon(vessel)}>
              <Popup>
                <div style={{ fontFamily: 'Source Sans 3, sans-serif', minWidth: 230, padding: '6px', color: '#dde8f5' }}>
                  <div className="font-bold text-sm text-cyan-400 mb-0.5">{vessel.name}</div>
                  <div className="text-[11px] text-slate-400 mb-2">{vessel.type} · {vessel.flag}</div>
                  <div className="text-[11px] font-mono space-y-1 text-slate-300">
                    <div>Polar Class: <span className="text-cyan-300 font-bold">{vessel.iceClass}</span></div>
                    <div>Speed / Heading: {vessel.speedKnots} kts / {vessel.heading}°</div>
                    <div>Current Route: {vessel.currentRouteId ?? 'At Station'}</div>
                    <div>Fuel State: {((vessel.fuelRemainingL / vessel.fuelCapacityL) * 100).toFixed(0)}% ({Math.round(vessel.fuelRemainingL / 1000)}k L)</div>
                    <div>Hull Ice Resistance: 320 kN (Safe margin)</div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
