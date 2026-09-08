import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Tooltip, Polygon, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// ── Custom High-Contrast Leaflet Icons ───────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;

const vesselIcon = (isDanger: boolean) =>
  L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="absolute -inset-2 rounded-full ${isDanger ? 'bg-red-500/50 animate-ping' : 'bg-emerald-500/40'}"></div>
        <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl border-2 ${
          isDanger ? 'bg-red-600 border-white text-white' : 'bg-emerald-500 border-white text-black'
        } font-black text-2xl">
          🚢
        </div>
        <div class="mt-1 bg-[#0c182b] border-2 border-cyan-400 text-white font-mono text-xs font-black px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap">
          RV POLARSTERN (PC-3)
        </div>
      </div>
    `,
    className: '',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });

const icebergIcon = (name: string, size: string) =>
  L.divIcon({
    html: `
      <div class="relative flex flex-col items-center">
        <div class="w-12 h-12 rounded-xl bg-red-600 border-2 border-white flex items-center justify-center text-white font-black text-xl shadow-2xl animate-pulse">
          ▲
        </div>
        <div class="mt-1 bg-red-950 border-2 border-red-500 text-white font-mono text-xs font-black px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap text-center">
          ${name}<br/><span class="text-[10px] text-red-300 font-bold">${size} Mt (CPA 4.2 km)</span>
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

// Waypoints & Coordinates
const MAWSON_POS: [number, number] = [-67.604, 62.872];
const DAVIS_POS: [number, number] = [-68.576, 77.968];
const VESSEL_POS: [number, number] = [-67.8, 67.2];
const ICEBERG_POS: [number, number] = [-68.05, 71.8]; // Blocking the old route

// Blocked direct route (cuts right through Iceberg D-28 & 88% thick pack ice)
const BLOCKED_ROUTE: [number, number][] = [
  MAWSON_POS,
  VESSEL_POS,
  [-67.95, 70.0],
  ICEBERG_POS, // COLLISION POINT
  [-68.25, 74.8],
  DAVIS_POS,
];

// AI-Optimized Route (Diverts 22 nm North through Sentinel-1 SAR open-water lead channel, 38 km safe buffer)
const AI_SAFE_ROUTE: [number, number][] = [
  MAWSON_POS,
  VESSEL_POS,
  [-67.2, 69.5],  // Enter Lead Channel
  [-66.9, 72.8],  // Open water corridor
  [-67.3, 75.5],  // Clear of iceberg hazard cone
  DAVIS_POS,
];

// Heavy Pack Ice Zone (SIC 88%)
const PACK_ICE_ZONE: [number, number][] = [
  [-67.5, 69.0],
  [-67.5, 75.0],
  [-68.8, 77.0],
  [-68.8, 68.0],
];

// Open Lead Channel discovered by SAR (SIC 16%)
const OPEN_LEAD_CHANNEL: [number, number][] = [
  [-66.7, 69.0],
  [-66.6, 75.5],
  [-67.3, 75.5],
  [-67.3, 69.0],
];

// 100% FREE REAL MAP BASEMAPS (NO API KEY REQUIRED, NO WATERMARKS)
type BasemapType = 'satellite' | 'ocean' | 'osm' | 'topo';

const BASEMAP_URLS: Record<BasemapType, { name: string; url: string; attribution: string; icon: string }> = {
  satellite: {
    name: 'Real Satellite (ESRI)',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery, Maxar, Earthstar Geographics',
  },
  ocean: {
    name: 'Ocean Bathymetry',
    icon: '🌊',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri Ocean Basemap, GEBCO, NOAA',
  },
  osm: {
    name: 'OpenStreetMap',
    icon: '🌍',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  topo: {
    name: 'Polar Topographic',
    icon: '🗺️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Topo Map',
  },
};

function MapController({ isSolved }: { isSolved: boolean }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([-67.8, 72.0], 6, { duration: 1.2 });
  }, [isSolved, map]);
  return null;
}

export type DemoStep = 'THREAT' | 'INSIGHT' | 'ACTION' | 'OUTCOME';

export default function BridgeCommand() {
  const [currentStep, setCurrentStep] = useState<DemoStep>('THREAT');
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapType>('satellite');
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlayTime, setAutoPlayTime] = useState(0);

  const isSolved = currentStep === 'ACTION' || currentStep === 'OUTCOME';

  // 45-Second Demo Auto-Player
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setInterval(() => {
        setAutoPlayTime((prev) => {
          const next = prev + 1;
          if (next >= 45) {
            setIsAutoPlaying(false);
            return 0;
          }
          if (next === 1) setCurrentStep('THREAT');
          if (next === 12) setCurrentStep('INSIGHT');
          if (next === 24) setCurrentStep('ACTION');
          if (next === 35) setCurrentStep('OUTCOME');
          return next;
        });
      }, 1000);
    } else {
      setAutoPlayTime(0);
    }
    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleApplyAIRoute = () => {
    setCurrentStep('OUTCOME');
  };

  const handleReset = () => {
    setCurrentStep('THREAT');
    setIsAutoPlaying(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#060d19] text-white overflow-hidden select-none font-sans">
      {/* ── TOP HEADER: HIGH-VIS DEMO STEP NAVIGATOR ── */}
      <header className="px-6 py-3.5 bg-[#0c182b] border-b-2 border-[#1e3559] flex items-center justify-between flex-shrink-0 flex-wrap gap-4 shadow-xl">
        {/* Left: Vessel Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-lg">
            ⚓
          </div>
          <div>
            <div className="text-xl font-black font-heading tracking-wide text-white leading-tight">
              ANTARCTIC DECISION SUPPORT SYSTEM
            </div>
            <div className="text-xs font-mono font-semibold text-cyan-400">
              VOYAGE: MAWSON ➔ DAVIS STATION · SOUTHERN OCEAN SECTOR
            </div>
          </div>
        </div>

        {/* Center: 4 Big Story Workflow Buttons */}
        <div className="flex items-center bg-[#060d19] p-1.5 rounded-xl border-2 border-[#1e3559] gap-1.5">
          <button
            onClick={() => { setCurrentStep('THREAT'); setIsAutoPlaying(false); }}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 'THREAT'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 ring-2 ring-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>1. 🚨 HAZARD DETECTED</span>
          </button>

          <button
            onClick={() => { setCurrentStep('INSIGHT'); setIsAutoPlaying(false); }}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 'INSIGHT'
                ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/40 ring-2 ring-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>2. 🛰️ SATELLITE INSIGHT</span>
          </button>

          <button
            onClick={() => { setCurrentStep('ACTION'); setIsAutoPlaying(false); }}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 'ACTION'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/40 ring-2 ring-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>3. ⚡ CAPTAIN ACTION</span>
          </button>

          <button
            onClick={() => { setCurrentStep('OUTCOME'); setIsAutoPlaying(false); }}
            className={`px-4 py-2.5 rounded-lg font-mono text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
              currentStep === 'OUTCOME'
                ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/40 ring-2 ring-white'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>4. 🛡️ VERIFIED OUTCOME</span>
          </button>
        </div>

        {/* Right: 45s Auto-Demo Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs font-black border-2 transition-all flex items-center gap-2 cursor-pointer ${
              isAutoPlaying
                ? 'bg-red-600 text-white border-white animate-pulse shadow-xl'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 border-white shadow-xl hover:scale-105'
            }`}
          >
            <span className="text-base">{isAutoPlaying ? '⏹' : '▶'}</span>
            <span>{isAutoPlaying ? `STOP DEMO (${45 - autoPlayTime}s)` : 'AUTO-PLAY 45s DEMO'}</span>
          </button>

          <button
            onClick={handleReset}
            className="px-3.5 py-2.5 bg-[#060d19] hover:bg-[#12233f] text-slate-300 hover:text-white border border-[#1e3559] rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
            title="Reset to initial hazard state"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── MAIN WORKSPACE: REAL MAP (LEFT) & CAPTAIN ACTION PANEL (RIGHT) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: REAL LEAFLET SATELLITE MAP ── */}
        <div className="flex-1 relative bg-[#040914] border-r-2 border-[#1e3559]">
          {/* Basemap Switcher Toolbar (Zero API Key, 100% Real Maps) */}
          <div className="absolute top-4 left-4 z-[1000] flex items-center bg-[#0c182b]/95 border-2 border-[#1e3559] p-1.5 rounded-xl shadow-2xl backdrop-blur-md gap-1">
            <span className="text-[11px] font-mono font-bold text-slate-400 px-2 uppercase">Real Map:</span>
            {(['satellite', 'ocean', 'osm', 'topo'] as BasemapType[]).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedBasemap(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedBasemap === type
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{BASEMAP_URLS[type].icon}</span>
                <span>{BASEMAP_URLS[type].name}</span>
              </button>
            ))}
          </div>

          <MapContainer
            center={[-67.8, 72.0]}
            zoom={6}
            style={{ height: '100%', width: '100%', background: '#040914' }}
            zoomControl={false}
          >
            {/* Real Free Basemap (No API Key Required) */}
            <TileLayer
              key={selectedBasemap}
              url={BASEMAP_URLS[selectedBasemap].url}
              attribution={BASEMAP_URLS[selectedBasemap].attribution}
              maxZoom={18}
            />

            <MapController isSolved={isSolved} />

            {/* Heavy Sea-Ice Pack (SIC 88%) */}
            <Polygon
              positions={PACK_ICE_ZONE}
              pathOptions={{
                color: '#ff334b',
                fillColor: '#ff334b',
                fillOpacity: isSolved ? 0.15 : 0.45,
                weight: 3,
                dashArray: '5 5',
              }}
            >
              <Tooltip sticky>
                <div className="font-sans text-sm p-1 leading-snug">
                  <strong className="text-red-400 font-bold">🔴 HEAVY PACK ICE (SIC 88%)</strong><br />
                  <span>Thickness: 2.4m Multi-Year Ice</span><br />
                  <span className="text-red-300 font-bold">Exceeds PC-3 Safe Hull Limits</span>
                </div>
              </Tooltip>
            </Polygon>

            {/* Sentinel-1 SAR Open Lead Channel (SIC 16%) */}
            {(currentStep === 'INSIGHT' || isSolved) && (
              <Polygon
                positions={OPEN_LEAD_CHANNEL}
                pathOptions={{
                  color: '#00e699',
                  fillColor: '#00e699',
                  fillOpacity: 0.35,
                  weight: 3,
                }}
              >
                <Tooltip sticky>
                  <div className="font-sans text-sm p-1 leading-snug">
                    <strong className="text-emerald-400 font-bold">🟢 SAR OPEN LEAD CHANNEL (SIC 16%)</strong><br />
                    <span>Sentinel-1 SAR Verified Path</span><br />
                    <span className="text-emerald-300 font-bold">Open Water Corridor · Safe Hull Passage</span>
                  </div>
                </Tooltip>
              </Polygon>
            )}

            {/* Blocked Direct Route (Red Dashed) */}
            <Polyline
              positions={BLOCKED_ROUTE}
              pathOptions={{
                color: isSolved ? '#ff334b66' : '#ff334b',
                weight: isSolved ? 4 : 8,
                dashArray: '8 8',
              }}
            />

            {/* AI-Optimized Safe Route (Solid Emerald Glow) */}
            {isSolved && (
              <Polyline
                positions={AI_SAFE_ROUTE}
                pathOptions={{
                  color: '#00e699',
                  weight: 8,
                  opacity: 1,
                }}
              />
            )}

            {/* Stations */}
            <Marker position={MAWSON_POS} icon={stationIcon('MAWSON STATION', '🇦🇺', 'START PORT')} />
            <Marker position={DAVIS_POS} icon={stationIcon('DAVIS STATION', '🇦🇺', 'DEST PORT')} />

            {/* Vessel Position */}
            <Marker position={VESSEL_POS} icon={vesselIcon(!isSolved)} />

            {/* Iceberg D-28 Marker & Danger Buffer Cone */}
            <Marker position={ICEBERG_POS} icon={icebergIcon('ICEBERG D-28', '1,636')} />
            <Circle
              center={ICEBERG_POS}
              radius={28000} // 28 km collision buffer
              pathOptions={{
                color: '#ff334b',
                fillColor: '#ff334b',
                fillOpacity: isSolved ? 0.08 : 0.3,
                weight: 2,
                dashArray: '6 6',
              }}
            />
          </MapContainer>

          {/* High-Vis Map Legend */}
          <div className="absolute bottom-5 left-5 z-[1000] bg-[#0c182b]/95 border-2 border-[#1e3559] rounded-xl p-4 text-xs font-mono space-y-2 shadow-2xl backdrop-blur-md">
            <div className="text-sm font-black text-white pb-1.5 border-b border-[#1e3559] uppercase tracking-wider">
              Radar Map Symbols
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 bg-red-600 rounded-sm"></span>
              <span className="text-slate-200">Iceberg D-28 Hazard Zone (CPA 4.2 km)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-3.5 h-3.5 bg-red-500/50 border-2 border-red-500 rounded-sm"></span>
              <span className="text-slate-200">Heavy Sea-Ice Pack (SIC 88%)</span>
            </div>
            {isSolved && (
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 bg-emerald-500 rounded-sm"></span>
                <span className="text-emerald-300 font-bold">AI Safe Route (Cleared via SAR Lead)</span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: CAPTAIN DECISION & EXPECTED OUTCOME HUD ── */}
        <div className="w-[500px] bg-[#0c182b] flex flex-col justify-between p-6 overflow-y-auto space-y-5 border-l-2 border-[#1e3559]">
          {/* 1. SITUATION BANNER (LARGE & BOLD) */}
          <div className="space-y-4">
            {!isSolved ? (
              <div className="p-5 rounded-2xl bg-red-950/90 border-2 border-red-500 shadow-2xl shadow-red-950/50">
                <div className="flex items-center gap-2.5 text-red-400 font-black text-sm tracking-wider font-mono">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 animate-ping"></span>
                  CRITICAL COLLISION INTERCEPT
                </div>
                <div className="text-2xl font-black font-heading text-white mt-2 leading-snug">
                  Route Blocked by Pack Ice & Iceberg
                </div>
                <p className="text-sm text-red-100 mt-2 leading-relaxed">
                  Direct heading intersects <strong className="text-white font-bold">Iceberg D-28 in 4.2 km (ETA 18 min)</strong> and thick 88% sea-ice pack. Severe risk of hull structural breach.
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 shadow-2xl shadow-emerald-950/50 animate-fade-in">
                <div className="flex items-center gap-2.5 text-emerald-400 font-black text-sm tracking-wider font-mono">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400"></span>
                  IMO POLARIS CLEARANCE VERIFIED
                </div>
                <div className="text-2xl font-black font-heading text-white mt-2 leading-snug">
                  Safe Lead Corridor Engaged
                </div>
                <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
                  Steering 22 nm North through Sentinel-1 SAR fracture lead. Iceberg buffer increased to <strong className="text-white font-bold">38.4 km</strong>. Fuel burn minimized.
                </p>
              </div>
            )}

            {/* 2. SATELLITE & DRIFT SENSOR BADGES */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#060d19] p-3.5 rounded-xl border border-[#1e3559]">
                <div className="text-slate-400 text-xs font-mono uppercase">SENTINEL-1 SAR PASS</div>
                <div className="text-base font-black text-cyan-300 mt-0.5">Lead Open (SIC 16%)</div>
              </div>
              <div className="bg-[#060d19] p-3.5 rounded-xl border border-[#1e3559]">
                <div className="text-slate-400 text-xs font-mono uppercase">COPERNICUS DRIFT</div>
                <div className="text-base font-black text-cyan-300 mt-0.5">Berg Drift 1.4 kts W</div>
              </div>
            </div>
          </div>

          {/* 3. BIG CAPTAIN ACTION BUTTON */}
          <div className="py-2">
            {!isSolved ? (
              <button
                onClick={handleApplyAIRoute}
                className="w-full py-5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-heading font-black text-xl tracking-wide shadow-2xl shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 border-2 border-white cursor-pointer"
              >
                <span className="text-2xl">⚡</span>
                <span>EXECUTE AI OPTIMIZED SAFE ROUTE</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => alert('Waypoints successfully transmitted to Ship Bridge ECDIS!')}
                  className="w-full py-4 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-heading font-black text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white"
                >
                  <span className="text-lg">📡</span>
                  <span>TRANSMIT WAYPOINTS TO BRIDGE ECDIS</span>
                </button>
                <button
                  onClick={() => alert('IMO Polar Code Clearance Certificate (PDF) Downloaded!')}
                  className="w-full py-3 px-4 rounded-lg bg-[#060d19] hover:bg-[#12233f] border border-[#1e3559] text-slate-200 font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>📄 Download IMO Polar Code Certificate (PDF)</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. EXPECTED OUTCOME SCORECARD (LARGE BOLD NUMBERS) */}
          <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e3559] pb-2.5">
              <span className="font-black text-sm text-white font-mono tracking-wider">EXPECTED VOYAGE OUTCOME</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">BEFORE VS AFTER</span>
            </div>

            <div className="space-y-2.5 font-mono text-sm">
              {/* Collision Hazard */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c182b] border border-[#1e3559]">
                <span className="text-slate-300 font-bold">Collision Risk</span>
                <div className="flex items-center gap-3">
                  <span className="line-through text-red-400 font-bold">82% (Critical)</span>
                  <span className="text-lg font-black text-emerald-400">0.0% (Zero Hazard)</span>
                </div>
              </div>

              {/* Fuel Consumption */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c182b] border border-[#1e3559]">
                <span className="text-slate-300 font-bold">Bunker Fuel Burn</span>
                <div className="flex items-center gap-3">
                  <span className="line-through text-red-400 font-bold">114.2 T</span>
                  <span className="text-lg font-black text-emerald-400">95.8 T (-18.4 T Saved)</span>
                </div>
              </div>

              {/* Transit Time */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c182b] border border-[#1e3559]">
                <span className="text-slate-300 font-bold">Transit Duration</span>
                <div className="flex items-center gap-3">
                  <span className="line-through text-red-400 font-bold">38.5 hrs</span>
                  <span className="text-lg font-black text-emerald-400">30.0 hrs (-8.5 hrs)</span>
                </div>
              </div>

              {/* Hull Ice Resistance */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0c182b] border border-[#1e3559]">
                <span className="text-slate-300 font-bold">Hull Resistance</span>
                <div className="flex items-center gap-3">
                  <span className="line-through text-red-400 font-bold">1,420 kN</span>
                  <span className="text-lg font-black text-emerald-400">240 kN (Safe Margin)</span>
                </div>
              </div>
            </div>

            {/* Green Bottom Summary */}
            {isSolved && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/60 text-emerald-300 font-mono text-xs text-center font-black">
                ✓ SAVES $14,200 FUEL COST & 58.2 TONNES CO₂ EMISSIONS
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
