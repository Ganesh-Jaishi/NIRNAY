import type { EnvironmentalConditions, PhysicsReadout } from '../../services/physicsEngine';
import type { RouteLogistics } from '../../services/logisticsEngine';

interface WhatIfTabProps {
  env: EnvironmentalConditions;
  onEnvChange: (newEnv: EnvironmentalConditions) => void;
  physics: PhysicsReadout;
  logistics: RouteLogistics;
  onSelectRoute: (type: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF') => void;
  activeRouteType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF';
}

export default function WhatIfTab({
  env,
  onEnvChange,
  physics,
  logistics,
  onSelectRoute,
  activeRouteType,
}: WhatIfTabProps) {
  // Scenario Launchers
  const applyScenarioA = () => {
    // Katabatic Gale Storm: Wind 48 kts, waves 6.5m
    onEnvChange({
      ...env,
      windSpeedKnots: 48,
      windDirectionDeg: 280,
      waveHeightMeters: 6.5,
      seaIceConcentrationPct: 65,
    });
    onSelectRoute('WHAT_IF');
  };

  const applyScenarioB = () => {
    // Iceberg Incursion directly on route
    onEnvChange({
      ...env,
      currentSpeedKnots: 2.8,
      currentDirectionDeg: 190,
      windSpeedKnots: 35,
    });
    onSelectRoute('ORIGINAL_BLOCKED');
  };

  const applyScenarioC = () => {
    // Rapid Freeze-Up: SIC 92%, ice thickness 2.5m
    onEnvChange({
      ...env,
      seaIceConcentrationPct: 92,
      iceThicknessMeters: 2.5,
      airTempCelsius: -28,
    });
    onSelectRoute('WHAT_IF');
  };

  const applyScenarioD = () => {
    // Optimal Green Lead Voyage
    onEnvChange({
      ...env,
      windSpeedKnots: 16,
      currentSpeedKnots: 0.8,
      waveHeightMeters: 1.8,
      seaIceConcentrationPct: 20,
      iceThicknessMeters: 0.8,
    });
    onSelectRoute('AI_OPTIMIZED');
  };

  return (
    <div className="space-y-4 font-sans">
      {/* What-If Scenario Selector */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            🔮 WHAT-IF SCENARIO SIMULATOR
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">1-CLICK REAL-TIME REACT</span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
          <button
            onClick={applyScenarioA}
            className="p-3 rounded-xl bg-[#0c182b] hover:bg-[#162a45] border border-cyan-500/40 text-left transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="text-cyan-400 font-black flex items-center gap-1.5">
              <span>🌪️</span>
              <span>SCENARIO A: GALE STORM</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Wind 48 kts · Waves 6.5m · Hull drag +180%</div>
          </button>

          <button
            onClick={applyScenarioB}
            className="p-3 rounded-xl bg-[#0c182b] hover:bg-[#162a45] border border-red-500/40 text-left transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="text-red-400 font-black flex items-center gap-1.5">
              <span>▲</span>
              <span>SCENARIO B: BERG ENCROACHMENT</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">CPA drops to 1.8 km · Auto collision warning</div>
          </button>

          <button
            onClick={applyScenarioC}
            className="p-3 rounded-xl bg-[#0c182b] hover:bg-[#162a45] border border-amber-500/40 text-left transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="text-amber-400 font-black flex items-center gap-1.5">
              <span>❄️</span>
              <span>SCENARIO C: RAPID FREEZE-UP</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Pack SIC 92% · Lead closes · Severe delay</div>
          </button>

          <button
            onClick={applyScenarioD}
            className="p-3 rounded-xl bg-[#0c182b] hover:bg-[#162a45] border border-emerald-500/40 text-left transition-all cursor-pointer hover:scale-[1.02]"
          >
            <div className="text-emerald-400 font-black flex items-center gap-1.5">
              <span>⚡</span>
              <span>SCENARIO D: OPTIMAL GREEN ROUTE</span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">Open SAR lead · -18.4 T Fuel · Max efficiency</div>
          </button>
        </div>
      </div>

      {/* Side-by-Side Route Comparison Matrix */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#1e3559] pb-2">
          <span className="font-bold text-white uppercase">SIDE-BY-SIDE ROUTE COMPARISON</span>
          <span className="text-[10px] text-cyan-400 font-bold">LOGISTICS MATRIX</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1e3559] text-slate-400 text-[10px]">
                <th className="pb-2">METRIC</th>
                <th className="pb-2 text-red-400">ORIGINAL DIRECT</th>
                <th className="pb-2 text-emerald-400">AI OPTIMIZED</th>
                <th className="pb-2 text-cyan-400">WHAT-IF SIM</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3559] text-xs">
              <tr>
                <td className="py-2 text-slate-300 font-bold">Total Distance</td>
                <td className="py-2 text-slate-200">548 km</td>
                <td className="py-2 text-emerald-300 font-bold">586 km (+38 km)</td>
                <td className="py-2 text-cyan-300 font-bold">612 km</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300 font-bold">Travel Duration</td>
                <td className="py-2 text-red-400 font-bold">38.5 hrs (Stuck)</td>
                <td className="py-2 text-emerald-300 font-bold">30.0 hrs (-8.5h)</td>
                <td className="py-2 text-cyan-300 font-bold">33.5 hrs</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300 font-bold">Bunker Fuel Burn</td>
                <td className="py-2 text-red-400">114.2 Tonnes</td>
                <td className="py-2 text-emerald-300 font-bold">95.8 Tonnes (-18.4T)</td>
                <td className="py-2 text-cyan-300 font-bold">108.5 Tonnes</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300 font-bold">Collision Risk</td>
                <td className="py-2 text-red-400 font-black">82% (CRITICAL)</td>
                <td className="py-2 text-emerald-300 font-black">0.0% (ZERO)</td>
                <td className="py-2 text-cyan-300 font-black">4.5% (LOW)</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300 font-bold">Expected Delay</td>
                <td className="py-2 text-red-400 font-bold">+6.2 hrs</td>
                <td className="py-2 text-emerald-300 font-bold">0.0 hrs (On Time)</td>
                <td className="py-2 text-cyan-300 font-bold">+2.8 hrs</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-300 font-bold">Estimated Cost</td>
                <td className="py-2 text-slate-200">$89,000 USD</td>
                <td className="py-2 text-emerald-300 font-bold">$74,700 USD</td>
                <td className="py-2 text-cyan-300 font-bold">$84,600 USD</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action: Apply to Navigation Bridge */}
      <button
        onClick={() => alert('What-If Route Solution exported to Bridge Navigation Console!')}
        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-heading font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer border-2 border-white/40"
      >
        <span>📡</span>
        <span>DEPLOY SIMULATION AS ACTIVE VOYAGE PLAN</span>
      </button>
    </div>
  );
}
