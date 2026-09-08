import type { EnvironmentalConditions, PhysicsReadout } from '../../services/physicsEngine';
import type { RouteLogistics } from '../../services/logisticsEngine';

interface DigitalTwinTabProps {
  env: EnvironmentalConditions;
  physics: PhysicsReadout;
  logistics: RouteLogistics;
  activeRouteType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF';
  onSelectRoute: (type: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF') => void;
  showCurrentVectors: boolean;
  setShowCurrentVectors: (v: boolean) => void;
  showWindVectors: boolean;
  setShowWindVectors: (v: boolean) => void;
  showIceConcentration: boolean;
  setShowIceConcentration: (v: boolean) => void;
}

export default function DigitalTwinTab({
  env,
  physics,
  logistics,
  activeRouteType,
  onSelectRoute,
  showCurrentVectors,
  setShowCurrentVectors,
  showWindVectors,
  setShowWindVectors,
  showIceConcentration,
  setShowIceConcentration,
}: DigitalTwinTabProps) {
  return (
    <div className="space-y-4 font-sans">
      {/* Active Route Selector & Status */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          ACTIVE ROUTE DIGITAL TWIN
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onSelectRoute('ORIGINAL_BLOCKED')}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
              activeRouteType === 'ORIGINAL_BLOCKED'
                ? 'bg-red-500/20 border-red-500 text-white shadow-lg shadow-red-500/20'
                : 'border-[#1e3559] text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-[10px] text-red-400 font-bold">1. DIRECT (BLOCKED)</div>
            <div className="text-xs text-white truncate mt-0.5">Heavy Ice & Berg</div>
          </button>

          <button
            onClick={() => onSelectRoute('AI_OPTIMIZED')}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
              activeRouteType === 'AI_OPTIMIZED'
                ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                : 'border-[#1e3559] text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-[10px] text-emerald-400 font-bold">2. AI LEAD (SAFE)</div>
            <div className="text-xs text-white truncate mt-0.5">SAR Fracture Path</div>
          </button>

          <button
            onClick={() => onSelectRoute('WHAT_IF')}
            className={`p-2.5 rounded-xl border text-xs font-mono font-bold transition-all text-left cursor-pointer ${
              activeRouteType === 'WHAT_IF'
                ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                : 'border-[#1e3559] text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="text-[10px] text-cyan-400 font-bold">3. WHAT-IF SIM</div>
            <div className="text-xs text-white truncate mt-0.5">Custom Physics</div>
          </button>
        </div>
      </div>

      {/* Environmental Layer Toggles */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          DIGITAL TWIN SENSOR OVERLAYS
        </div>

        <div className="space-y-2 font-mono text-xs">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559] cursor-pointer hover:border-cyan-400 transition-colors">
            <span className="flex items-center gap-2 text-slate-200">
              <span className="text-base">❄️</span>
              <span>Satellite Sea-Ice Concentration (SIC %)</span>
            </span>
            <input
              type="checkbox"
              checked={showIceConcentration}
              onChange={(e) => setShowIceConcentration(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559] cursor-pointer hover:border-cyan-400 transition-colors">
            <span className="flex items-center gap-2 text-slate-200">
              <span className="text-base">💨</span>
              <span>ECMWF Polar Wind Vector Streamlines</span>
            </span>
            <input
              type="checkbox"
              checked={showWindVectors}
              onChange={(e) => setShowWindVectors(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559] cursor-pointer hover:border-cyan-400 transition-colors">
            <span className="flex items-center gap-2 text-slate-200">
              <span className="text-base">🌊</span>
              <span>Copernicus Ocean Current Velocity Vectors</span>
            </span>
            <input
              type="checkbox"
              checked={showCurrentVectors}
              onChange={(e) => setShowCurrentVectors(e.target.checked)}
              className="w-4 h-4 accent-cyan-400 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Real-Time Telemetry Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">VESSEL ICE CLASS</div>
          <div className="text-xl font-black text-cyan-300 mt-1 font-heading">POLAR CLASS PC-3</div>
          <div className="text-xs text-slate-400 mt-0.5">Year-round multi-year ice hull rating</div>
        </div>

        <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">SAR SATELLITE PASS</div>
          <div className="text-xl font-black text-emerald-400 mt-1 font-heading">SENTINEL-1A LIVE</div>
          <div className="text-xs text-slate-400 mt-0.5">Resolution: 10m · SAR Stripmap</div>
        </div>
      </div>

      {/* Immediate Cause & Effect Insight */}
      <div className="p-4 rounded-2xl bg-[#060d19] border-2 border-[#1e3559] space-y-2">
        <div className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>⚡</span>
          <span>ENVIRONMENTAL COUPLING INSIGHT</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Wind forces at <strong>{env.windSpeedKnots} kts</strong> combined with <strong>{env.currentSpeedKnots} kts</strong> ocean current drive Iceberg D-28 westward at <strong>{physics.icebergDriftSpeedKnots} kts</strong>, maintaining a safe <strong>38.4 km</strong> separation from the AI-optimized SAR lead corridor.
        </p>
      </div>
    </div>
  );
}
