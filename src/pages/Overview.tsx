import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AntarcticMap from '../components/map/AntarcticMap';
import { useSimulation } from '../context/SimulationContext';
import { useClock, timeAgo } from '../hooks/useClock';
import { getServiceStatuses, STATUS_DOT, STATUS_COLOR, STATUS_TEXT, overallSystemStatus } from '../services/dataService';
import { routeColor, riskTextClass } from '../services/riskService';
import { RISK_TIMELINE, DEMO_ENVIRONMENT } from '../data/demoData';
import type { PageId } from '../types';

export default function Overview({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const sim = useSimulation();
  const clock = useClock();
  const services = getServiceStatuses();
  const sysStatus = overallSystemStatus(services);
  const env = DEMO_ENVIRONMENT;

  const activeAlertCount = sim.alertCount;
  const proxAlerts = sim.icebergs.filter((b) => b.nearestRouteDistKm < 25);
  const highRiskRoutes = sim.highRiskRoutes;

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* System status bar */}
      <div className="flex items-center justify-between rounded border border-[#142840] bg-[#081424] px-4 py-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-[#dde8f5] font-semibold">
              ANTARCTIC DECISION SUPPORT SYSTEM · AI/ML ACTIVE
            </span>
          </div>
          <span className="text-cyan-400 text-[10px] font-mono hidden md:inline-block bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            POLARIS ICE INDEX COMPLIANT
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-[#5878a0]">UTC {clock.utcTime}</span>
          <button
            onClick={() => onNavigate('live-map')}
            className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded hover:bg-cyan-500/20 transition-colors flex items-center gap-1.5"
          >
            <span>Launch Live GIS Map</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Core 3 Pillars Executive Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Pillar 1: Sea-Ice Concentration */}
        <div
          onClick={() => onNavigate('sea-ice')}
          className="group cursor-pointer rounded-lg border border-[#142840] bg-gradient-to-br from-[#081424] to-[#040b16] p-3.5 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">❄</span>
              <span className="text-xs font-bold text-slate-100 font-mono">1. SEA-ICE FORECAST</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
              U-Net / SAR
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            High-resolution Sea-Ice Concentration (SIC) & lead detection using Sentinel-1 SAR & AMSR2 microwave radiometry.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-[#142840] text-[10px] font-mono text-cyan-400 group-hover:text-cyan-300">
            <span>Forecast Horizon: +120h</span>
            <span>View SIC Model →</span>
          </div>
        </div>

        {/* Pillar 2: Iceberg Trajectory */}
        <div
          onClick={() => onNavigate('icebergs')}
          className="group cursor-pointer rounded-lg border border-[#142840] bg-gradient-to-br from-[#081424] to-[#040b16] p-3.5 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">▲</span>
              <span className="text-xs font-bold text-slate-100 font-mono">2. ICEBERG TRAJECTORY</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
              Physics + Drift ODE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Drift physics model driven by Copernicus ocean currents, ECMWF surface winds, and Coriolis acceleration.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-[#142840] text-[10px] font-mono text-amber-400 group-hover:text-amber-300">
            <span>{sim.icebergs.length} Bergs Tracked (US-NIC)</span>
            <span>Check CPA Trajectories →</span>
          </div>
        </div>

        {/* Pillar 3: Route & Fuel Optimization */}
        <div
          onClick={() => onNavigate('route-planner')}
          className="group cursor-pointer rounded-lg border border-[#142840] bg-gradient-to-br from-[#081424] to-[#040b16] p-3.5 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-xs font-bold text-slate-100 font-mono">3. ROUTE & FUEL SOLVER</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
              A* Multi-Objective
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
            Identifies safe and fuel-efficient navigation corridors across pack ice, minimizing hull ice resistance and bunker burn.
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-[#142840] text-[10px] font-mono text-emerald-400 group-hover:text-emerald-300">
            <span>Avg. Fuel Saved: ~14.8%</span>
            <span>Launch Route Solver →</span>
          </div>
        </div>
      </div>

      {/* Key Operations Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="ACTIVE VESSELS"
          value={sim.vessels.filter((v) => v.status === 'UNDERWAY').length}
          sub={`${sim.vessels.length} total tracked in fleet`}
          onClick={() => onNavigate('live-map')}
        />
        <MetricCard
          label="ACTIVE ROUTES"
          value={sim.routes.filter((r) => r.status === 'ACTIVE').length}
          sub={`${sim.routes.length} computed corridors`}
          onClick={() => onNavigate('route-comparison')}
        />
        <MetricCard
          label="TRACKED ICEBERGS"
          value={sim.icebergs.length}
          sub={`${sim.icebergs.filter((b) => b.riskLevel === 'HIGH' || b.riskLevel === 'CRITICAL').length} high risk proximity`}
          warn={sim.icebergs.some((b) => b.riskLevel === 'HIGH' || b.riskLevel === 'CRITICAL')}
          onClick={() => onNavigate('icebergs')}
        />
        <MetricCard
          label="NAVIGATION ALERTS"
          value={activeAlertCount}
          sub={activeAlertCount > 0 ? 'immediate review recommended' : 'all corridors clear'}
          warn={activeAlertCount > 0}
          onClick={() => onNavigate('alerts')}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left: Map & Route Status */}
        <div className="col-span-12 xl:col-span-7 space-y-4">
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                ANTARCTIC SECTOR OVERVIEW
              </h3>
              <button
                onClick={() => onNavigate('live-map')}
                className="text-[10px] font-mono text-[#00c4e8] hover:text-[#00e5a0] transition-colors"
              >
                Open interactive GIS map →
              </button>
            </div>
            <AntarcticMap compact />
          </div>

          {/* Route status */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#dde8f5] font-mono tracking-wider">EXPEDITION CORRIDORS & POLARIS RISK</h3>
              <button onClick={() => onNavigate('route-comparison')} className="text-[9px] font-mono text-[#5878a0] hover:text-[#00c4e8] transition-colors">
                Compare all routes →
              </button>
            </div>
            <div className="space-y-1.5">
              {sim.routes.map((r) => {
                const isRec = sim.recommendedRouteId === r.id;
                return (
                  <div
                    key={r.id}
                    onClick={() => onNavigate('live-map')}
                    className={`flex items-center gap-3 rounded border px-3 py-2 cursor-pointer transition-colors hover:border-cyan-500/40 ${
                      isRec ? 'border-[#00c4e8]/25 bg-[#00c4e8]/5' : 'border-[#0d2040] bg-[#050d1a]'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: routeColor(r.riskLevel) }} />
                    <span className="font-mono text-xs font-semibold" style={{ color: routeColor(r.riskLevel) }}>{r.id}</span>
                    <span className="text-[11px] text-slate-300 flex-1 truncate">{r.name}</span>
                    <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded font-bold ${riskTextClass(r.riskLevel)}`}>{r.riskLevel}</span>
                    <span className="text-[10px] font-mono text-[#5878a0]">{r.distanceKm} km</span>
                    {isRec && <span className="text-[9px] font-mono text-[#00c4e8] font-bold">★ OPTIMAL</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Active Alerts, Risk Chart & Services */}
        <div className="col-span-12 xl:col-span-5 space-y-4">
          {/* Live alerts */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-[#dde8f5] font-mono tracking-wider">COLLISION & HAZARD ALERTS</h3>
              <button onClick={() => onNavigate('alerts')} className="text-[9px] font-mono text-[#5878a0] hover:text-[#00c4e8] transition-colors">
                View all alerts →
              </button>
            </div>
            {proxAlerts.length === 0 && highRiskRoutes.length === 0 ? (
              <div className="text-center py-4">
                <div className="text-emerald-400 font-mono text-xs">● No active collision hazards</div>
                <div className="text-[#3a5a78] text-[10px] mt-1">All tracked bergs and vessels outside critical buffer (25km)</div>
              </div>
            ) : (
              <div className="space-y-2">
                {proxAlerts.map((b) => (
                  <div key={b.id} className="rounded border border-red-700/40 bg-red-950/20 px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono font-bold text-red-400">CRITICAL CPA HAZARD</span>
                      <span className="text-[9px] text-[#607890] font-mono">ICEBERG {b.id}</span>
                    </div>
                    <p className="text-xs text-[#90aac8]">
                      {b.id} ({b.sizeKm2} km²) is {b.nearestRouteDistKm} km from {b.nearestRouteId}. Trajectory intercept estimated in ~14h.
                    </p>
                  </div>
                ))}
                {highRiskRoutes.map((r) => (
                  <div key={r.id} className="rounded border border-amber-700/40 bg-amber-950/20 px-3 py-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono font-bold text-amber-400">ICE CONCENTRATION WARNING</span>
                      <span className="text-[9px] text-[#607890] font-mono">{r.id}</span>
                    </div>
                    <p className="text-xs text-[#90aac8]">{r.name} — High sea ice concentration ({r.riskLevel}). Divert to Lead Channel recommended.</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk forecast chart */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <h3 className="text-xs font-bold text-[#dde8f5] font-mono tracking-wider mb-3">72-HOUR FLEET RISK FORECAST</h3>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={RISK_TIMELINE} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c4e8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00c4e8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <YAxis domain={[0, 80]} tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                  <Area type="monotone" dataKey="total" stroke="#00c4e8" strokeWidth={2} fill="url(#riskGrad)" name="Composite Ice Risk" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Environmental Conditions */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <h3 className="text-xs font-bold text-[#dde8f5] font-mono tracking-wider mb-2">POLAR METEOROLOGICAL & OCEAN CONDITIONS</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Wind Speed (ECMWF)', value: `${env.windSpeedKmh} km/h`, sub: `Heading ${env.windDirectionDeg}° (Katabatic)` },
                { label: 'Significant Wave', value: `${env.waveHeightM} m`, sub: 'Southern Ocean Swell' },
                { label: 'Sea Surface Temp', value: `${env.seaSurfaceTempC}°C`, sub: 'Copernicus GLORYS' },
                { label: 'Surface Air Temp', value: `${env.airTempC}°C`, sub: 'ERA5 Reanalysis' },
              ].map(({ label, value, sub }) => (
                <div key={label} className="rounded border border-[#0d2040] bg-[#050d1a] p-2">
                  <div className="font-mono text-[9px] text-[#3a5a78] tracking-wider">{label}</div>
                  <div className="font-mono text-sm text-[#dde8f5] font-semibold">{value}</div>
                  <div className="font-mono text-[9px] text-[#4a6080]">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label, value, sub, warn, onClick,
}: {
  label: string;
  value: number;
  sub: string;
  warn?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-center w-full transition-all hover:border-[#2a4060] ${
        warn ? 'border-amber-700/40 bg-amber-950/10' : 'border-[#142840] bg-[#081424]'
      }`}
    >
      <div className={`font-mono text-2xl font-bold ${warn ? 'text-amber-400' : 'text-[#00c4e8]'}`}>{value}</div>
      <div className="font-mono text-[9px] tracking-wider text-[#5878a0] mb-0.5">{label}</div>
      <div className={`text-[9px] ${warn ? 'text-amber-400/70' : 'text-[#3a5a78]'}`}>{sub}</div>
    </button>
  );
}
