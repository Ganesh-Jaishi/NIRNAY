import { useState, useCallback } from 'react';
import LeafletMap from '../components/map/LeafletMap';
import RouteDetailsPanel from '../components/RouteDetailsPanel';
import { useSimulation } from '../context/SimulationContext';
import { SEA_ICE_ZONES } from '../data/antarcticData';
import { routeColor, riskTextClass } from '../services/riskService';

interface LayerVis {
  routes: boolean;
  vessels: boolean;
  icebergs: boolean;
  seaIce: boolean;
  riskZones: boolean;
  stations: boolean;
}

export default function LiveMap() {
  const sim = useSimulation();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [forecastHours, setForecastHours] = useState<number>(0);
  const [layers, setLayers] = useState<LayerVis>({
    routes: true,
    vessels: true,
    icebergs: true,
    seaIce: true,
    riskZones: false,
    stations: true,
  });
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  const selectedRoute = sim.routes.find((r) => r.id === selectedRouteId) ?? null;

  const handleRouteClick = useCallback((routeId: string) => {
    setSelectedRouteId(routeId);
    const route = sim.routes.find((r) => r.id === routeId);
    if (route) {
      const mid = route.waypoints[Math.floor(route.waypoints.length / 2)];
      setFlyTo({ lat: mid[0], lon: mid[1], zoom: 5 });
    }
  }, [sim.routes]);

  const handleBack = useCallback(() => {
    setSelectedRouteId(null);
    setFlyTo({ lat: -64, lon: 85, zoom: 4 });
  }, []);

  const toggleLayer = (key: keyof LayerVis) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // Export Polar Route Clearance JSON
  const handleExportJSON = () => {
    const reportData = {
      title: 'Antarctic Maritime Decision Support Clearance',
      generatedAt: new Date().toISOString(),
      activeVessels: sim.vessels.length,
      trackedIcebergs: sim.icebergs.length,
      criticalAlerts: sim.alertCount,
      routes: sim.routes.map(r => ({
        id: r.id,
        name: r.name,
        riskLevel: r.riskLevel,
        distanceKm: r.distanceKm,
        fuelLitres: r.fuelLitres,
        estimatedTimeH: r.estimatedTimeH,
      })),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `antarctic_nav_clearance_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (selectedRoute) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <RouteDetailsPanel
          route={selectedRoute}
          allRoutes={sim.routes}
          allScores={sim.scores}
          icebergs={sim.icebergs}
          vessels={sim.vessels}
          onBack={handleBack}
          onSelectRoute={(id) => {
            setSelectedRouteId(id);
            const r = sim.routes.find((x) => x.id === id);
            if (r) {
              const mid = r.waypoints[Math.floor(r.waypoints.length / 2)];
              setFlyTo({ lat: mid[0], lon: mid[1], zoom: 5 });
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top Operations Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[#142840] bg-[#040b16]/95 flex-shrink-0 flex-wrap">
        {/* Layer toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-mono text-[#5878a0] tracking-wider mr-1">LAYERS:</span>
          {(Object.keys(layers) as Array<keyof LayerVis>).map((key) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`px-2 py-0.5 rounded border text-[10px] font-mono transition-colors ${
                layers[key]
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 font-semibold'
                  : 'border-[#142840] text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {key === 'seaIce' ? '❄ Sea-Ice' : key === 'icebergs' ? '▲ Icebergs' : key === 'vessels' ? '🚢 Vessels' : key === 'stations' ? '📍 Stations' : key === 'routes' ? '⚡ Routes' : 'Risk Zones'}
            </button>
          ))}
        </div>

        {/* Time Scrubbing Forecast Slider */}
        <div className="flex items-center gap-2 bg-[#081424] border border-[#142840] px-2.5 py-1 rounded">
          <span className="text-[10px] font-mono text-slate-400">FORECAST:</span>
          {[0, 12, 24, 48, 72, 120].map((h) => (
            <button
              key={h}
              onClick={() => setForecastHours(h)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                forecastHours === h
                  ? 'bg-cyan-500 text-[#050d1a] font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {h === 0 ? 'NOW' : `+${h}h`}
            </button>
          ))}
        </div>

        {/* Live Simulation Controls & Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={sim.toggleSimulation}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-mono transition-colors ${
              sim.isRunning
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                : 'border-[#142840] text-[#5878a0] hover:border-slate-600'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${sim.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-[#5878a0]'}`} />
            {sim.isRunning ? 'LIVE DRIFT ACTIVE' : 'PAUSED'}
          </button>

          <button
            onClick={handleExportJSON}
            className="px-2.5 py-1 rounded border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-[10px] font-mono transition-colors flex items-center gap-1"
          >
            <span>📥 Export Clearance</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Map & Telemetry HUD */}
      <div className="flex-1 relative overflow-hidden">
        <LeafletMap
          routes={sim.routes}
          vessels={sim.vessels}
          icebergs={sim.icebergs}
          seaIceZones={SEA_ICE_ZONES}
          layers={layers}
          selectedRouteId={selectedRouteId}
          onRouteClick={handleRouteClick}
          flyTo={flyTo}
          forecastHours={forecastHours}
        />

        {/* Floating Telemetry & Threat Summary Card */}
        <div className="absolute bottom-4 right-4 z-[1000] w-72 bg-[#040b16]/95 border border-[#142840] rounded-lg p-3 shadow-2xl backdrop-blur-md space-y-2 pointer-events-auto">
          <div className="flex items-center justify-between border-b border-[#142840] pb-1.5">
            <span className="text-[11px] font-bold text-cyan-400 font-mono tracking-wider">SITUATION SUMMARY</span>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              SAR LIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="bg-[#081424] p-1.5 rounded border border-[#142840]">
              <div className="text-[#5878a0]">TRACKED BERGS</div>
              <div className="text-sm font-bold text-slate-100">{sim.icebergs.length} units</div>
              <div className="text-[9px] text-amber-400 mt-0.5">
                {sim.icebergs.filter(b => b.nearestRouteDistKm < 25).length} near shipping routes
              </div>
            </div>

            <div className="bg-[#081424] p-1.5 rounded border border-[#142840]">
              <div className="text-[#5878a0]">RESEARCH FLEET</div>
              <div className="text-sm font-bold text-slate-100">{sim.vessels.length} vessels</div>
              <div className="text-[9px] text-cyan-400 mt-0.5">PC-3 / PC-4 / PC-5</div>
            </div>
          </div>

          <div className="border-t border-[#142840] pt-1.5">
            <div className="text-[9px] font-mono text-[#5878a0] mb-1">ROUTE RISK MATRIX</div>
            <div className="space-y-1">
              {sim.routes.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleRouteClick(r.id)}
                  className="flex items-center justify-between p-1 rounded hover:bg-white/5 cursor-pointer text-[10px] font-mono border border-transparent hover:border-[#1e3a5f]"
                >
                  <span className="text-slate-300 truncate max-w-[140px]">{r.name}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${riskTextClass(r.riskLevel)}`}>
                    {r.riskLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
