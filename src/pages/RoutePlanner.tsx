import { useState } from 'react';
import SectionHeader from '../components/common/SectionHeader';
import RiskBadge from '../components/common/RiskBadge';
import { DEMO_VESSEL, DEMO_ROUTES } from '../data/demoData';

interface VesselConfig {
  name: string;
  type: string;
  startLat: string;
  startLon: string;
  destLat: string;
  destLon: string;
  speedKnots: string;
  maxSIC: string;
  maxWave: string;
  iceClass: string;
}

const PRIORITY_PRESETS = [
  { label: 'MAX SAFETY', safety: 90, fuel: 40, speed: 20, distance: 20 },
  { label: 'BALANCED', safety: 65, fuel: 65, speed: 55, distance: 55 },
  { label: 'FUEL EFFICIENT', safety: 50, fuel: 90, speed: 40, distance: 60 },
  { label: 'FASTEST', safety: 30, fuel: 30, speed: 90, distance: 80 },
];

export default function RoutePlanner() {
  const [config, setConfig] = useState<VesselConfig>({
    name: DEMO_VESSEL.name,
    type: DEMO_VESSEL.type,
    startLat: String(DEMO_VESSEL.position.lat),
    startLon: String(DEMO_VESSEL.position.lon),
    destLat: String(DEMO_VESSEL.destination.lat),
    destLon: String(DEMO_VESSEL.destination.lon),
    speedKnots: String(DEMO_VESSEL.cruisingSpeedKnots),
    maxSIC: String(Math.round(DEMO_VESSEL.maxSIC * 100)),
    maxWave: String(DEMO_VESSEL.maxWaveHeightM),
    iceClass: 'PC-5',
  });

  const [weights, setWeights] = useState({ safety: 65, fuel: 65, speed: 55, distance: 55 });
  const [computed, setComputed] = useState(true);
  const [loading, setLoading] = useState(false);
  const recommended = DEMO_ROUTES.find((r) => r.isRecommended)!;

  function handleCompute() {
    setLoading(true);
    setComputed(false);
    setTimeout(() => {
      setLoading(false);
      setComputed(true);
    }, 1400);
  }

  function applyPreset(preset: (typeof PRIORITY_PRESETS)[0]) {
    setWeights({ safety: preset.safety, fuel: preset.fuel, speed: preset.speed, distance: preset.distance });
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-[#5878a0]">Algorithms: A* · Dijkstra · Multi-objective (NSGA-II)</div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Configuration Panel */}
        <div className="col-span-12 lg:col-span-5 space-y-4">
          {/* Vessel Config */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader title="VESSEL CONFIGURATION" />
            <div className="space-y-3">
              <FormRow label="Vessel Name">
                <input
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="input-field"
                />
              </FormRow>
              <FormRow label="Vessel Type">
                <select
                  value={config.type}
                  onChange={(e) => setConfig({ ...config, type: e.target.value })}
                  className="input-field"
                >
                  <option>Polar Research Vessel</option>
                  <option>Ice-Strengthened Supply Ship</option>
                  <option>Icebreaker</option>
                  <option>Scientific Expedition Vessel</option>
                </select>
              </FormRow>
              <FormRow label="Ice Class">
                <select
                  value={config.iceClass}
                  onChange={(e) => setConfig({ ...config, iceClass: e.target.value })}
                  className="input-field"
                >
                  <option>PC-1 (Year-round in all ice)</option>
                  <option>PC-3 (Year-round in 2nd yr)</option>
                  <option>PC-5 (Year-round medium 1yr)</option>
                  <option>PC-6 (Summer thin 1yr ice)</option>
                  <option>PC-7 (Summer/autumn thin 1yr)</option>
                </select>
              </FormRow>
              <div className="grid grid-cols-2 gap-2">
                <FormRow label="Cruising Speed (kt)">
                  <input
                    value={config.speedKnots}
                    onChange={(e) => setConfig({ ...config, speedKnots: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
                <FormRow label="Max SIC (%)">
                  <input
                    value={config.maxSIC}
                    onChange={(e) => setConfig({ ...config, maxSIC: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
                <FormRow label="Max Wave (m)">
                  <input
                    value={config.maxWave}
                    onChange={(e) => setConfig({ ...config, maxWave: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
              </div>
            </div>
          </div>

          {/* Route Config */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader title="DEPARTURE & DESTINATION" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <FormRow label="Start Lat (°S)">
                  <input
                    value={config.startLat}
                    onChange={(e) => setConfig({ ...config, startLat: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
                <FormRow label="Start Lon (°E)">
                  <input
                    value={config.startLon}
                    onChange={(e) => setConfig({ ...config, startLon: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
                <FormRow label="Dest. Lat (°S)">
                  <input
                    value={config.destLat}
                    onChange={(e) => setConfig({ ...config, destLat: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
                <FormRow label="Dest. Lon (°E)">
                  <input
                    value={config.destLon}
                    onChange={(e) => setConfig({ ...config, destLon: e.target.value })}
                    className="input-field"
                    type="number"
                  />
                </FormRow>
              </div>
              <div className="p-2 rounded bg-[#050d1a] border border-[#142840] text-[10px] text-[#5878a0] font-mono">
                Start: Mawson Station (67.6°S, 62.9°E) → Dest: McMurdo Station (77.8°S, 166.7°E)
              </div>
            </div>
          </div>

          {/* Optimization Weights */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader
              title="OPTIMIZATION PRIORITY"
              subtitle="Configurable decision weights — not scientifically validated coefficients"
            />
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {PRIORITY_PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="px-2 py-1 rounded border border-[#142840] text-[10px] font-mono text-[#5878a0] hover:border-[#2a4060] hover:text-[#90aac8] transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {([
                { key: 'safety', label: 'Safety', color: '#22c55e' },
                { key: 'fuel', label: 'Fuel Efficiency', color: '#a78bfa' },
                { key: 'speed', label: 'Speed', color: '#f59e0b' },
                { key: 'distance', label: 'Distance', color: '#60a5fa' },
              ] as const).map(({ key, label, color }) => (
                <div key={key}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-[#90aac8]">{label}</span>
                    <span className="font-mono text-xs" style={{ color }}>{weights[key]}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={weights[key]}
                    onChange={(e) => setWeights({ ...weights, [key]: Number(e.target.value) })}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompute}
            disabled={loading}
            className="w-full py-3 rounded border border-[#00c4e8]/50 bg-[#00c4e8]/10 text-[#00c4e8] font-mono font-semibold tracking-wider text-sm hover:bg-[#00c4e8]/20 transition-colors disabled:opacity-50"
          >
            {loading ? '◐ COMPUTING ROUTES...' : '▷ COMPUTE OPTIMAL ROUTES'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          {loading && (
            <div className="bg-[#081424] border border-[#142840] rounded p-8 text-center">
              <div className="text-4xl mb-3 animate-pulse">◎</div>
              <div className="font-mono text-sm text-[#00c4e8]">Running A* + Multi-objective optimization...</div>
              <div className="text-xs text-[#5878a0] mt-1">Applying risk map · Generating candidate routes · Evaluating constraints</div>
            </div>
          )}

          {!loading && computed && (
            <>
              {/* Recommended result */}
              <div className="bg-[#081424] border border-[#00c4e8]/30 rounded p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-mono text-[10px] text-[#00c4e8] tracking-widest mb-1">RECOMMENDED ROUTE</div>
                    <h3 className="text-xl font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {recommended.name} — {recommended.id}
                    </h3>
                  </div>
                  <RiskBadge level={recommended.riskLevel} score={recommended.overallRisk} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'DISTANCE', value: `${recommended.distanceKm.toLocaleString()}`, unit: 'km' },
                    { label: 'EST. TIME', value: `${recommended.estimatedTimeH}`, unit: 'h' },
                    { label: 'EST. FUEL', value: `${(recommended.estimatedFuelL / 1000).toFixed(0)}k`, unit: `L ±${recommended.fuelUncertaintyPct}%` },
                    { label: 'CONFIDENCE', value: `${(recommended.confidence * 100).toFixed(0)}`, unit: '%' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="bg-[#050d1a] rounded border border-[#142840] p-2.5 text-center">
                      <div className="font-mono text-[9px] text-[#5878a0] tracking-widest">{label}</div>
                      <div className="font-mono text-lg font-bold text-[#00c4e8]">{value}</div>
                      <div className="font-mono text-[10px] text-[#5878a0]">{unit}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded border border-[#142840] bg-[#050d1a] p-3">
                  <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-2">WHY THIS ROUTE?</div>
                  <div className="space-y-1.5">
                    {recommended.explanation.map((ex, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`font-mono text-sm ${ex.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                          {ex.positive ? '✓' : '✗'}
                        </span>
                        <span className="text-[#90aac8]">{ex.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk breakdown */}
              <div className="bg-[#081424] border border-[#142840] rounded p-3">
                <SectionHeader title="RISK BREAKDOWN" subtitle="Component risk scores (0–100)" />
                <div className="space-y-2">
                  {[
                    { label: 'Sea-Ice Risk', value: recommended.seaIceRisk, color: '#60a5fa' },
                    { label: 'Iceberg Risk', value: recommended.icebergRisk, color: '#fb923c' },
                    { label: 'Weather Risk', value: recommended.weatherRisk, color: '#f59e0b' },
                    { label: 'Wave Risk', value: recommended.waveRisk, color: '#a78bfa' },
                    { label: 'OVERALL RISK', value: recommended.overallRisk, color: '#00c4e8' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center gap-3">
                      <span className="text-xs text-[#5878a0] w-28 text-right">{label}</span>
                      <div className="flex-1 bg-[#050d1a] rounded-full h-3 border border-[#142840] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${value}%`, background: color }}
                        />
                      </div>
                      <span className="font-mono text-xs w-8" style={{ color }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* All routes */}
              <div className="bg-[#081424] border border-[#142840] rounded p-3">
                <SectionHeader title="ALL CANDIDATE ROUTES" subtitle="4 routes computed" />
                <div className="space-y-2">
                  {DEMO_ROUTES.map((route) => (
                    <div
                      key={route.id}
                      className={`flex items-center gap-3 p-2.5 rounded border ${
                        route.isRecommended ? 'border-[#00c4e8]/30 bg-[#00c4e8]/5' : 'border-[#142840]'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold" style={{ color: route.color }}>{route.id}</span>
                          <span className="text-xs text-[#5878a0] capitalize">{route.type.replace('_', ' ')}</span>
                          {route.isRecommended && <span className="text-[9px] font-mono text-[#00c4e8]">★ RECOMMENDED</span>}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-[11px] font-mono text-right">
                        <div><span className="text-[#4a6080]">dist </span><span className="text-[#90aac8]">{route.distanceKm}</span></div>
                        <div><span className="text-[#4a6080]">time </span><span className="text-[#90aac8]">{route.estimatedTimeH}h</span></div>
                        <div><span className="text-[#4a6080]">fuel </span><span className="text-[#90aac8]">{(route.estimatedFuelL / 1000).toFixed(0)}k</span></div>
                        <RiskBadge level={route.riskLevel} compact />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-[#5878a0] tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}
