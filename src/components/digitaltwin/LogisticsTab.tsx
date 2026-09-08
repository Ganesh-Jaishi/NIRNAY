import type { RouteLogistics } from '../../services/logisticsEngine';

interface LogisticsTabProps {
  logistics: RouteLogistics;
  activeRouteType: 'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF';
}

export default function LogisticsTab({ logistics, activeRouteType }: LogisticsTabProps) {
  const isDanger = activeRouteType === 'ORIGINAL_BLOCKED';

  return (
    <div className="space-y-4 font-sans">
      {/* Top Key Logistics Overview (Big Bold Numbers) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">ESTIMATED TRAVEL TIME</div>
          <div className="text-2xl font-black text-white mt-1 font-heading">
            {logistics.actualDurationHours} hrs
          </div>
          <div className="text-xs font-mono font-bold text-cyan-400 mt-0.5">
            ETA: {logistics.timeline.currentETA}
          </div>
        </div>

        <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase">BUNKER FUEL SAVED</div>
          <div className="text-2xl font-black text-emerald-400 mt-1 font-heading">
            {logistics.fuelSavedVsBaselineTons > 0 ? `+${logistics.fuelSavedVsBaselineTons} T` : '0.0 T'}
          </div>
          <div className="text-xs font-mono font-bold text-emerald-300 mt-0.5">
            {logistics.costSavedUSD > 0 ? `-$${logistics.costSavedUSD.toLocaleString()} USD Saved` : 'Baseline Burn'}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#1e3559] pb-2">
          <span className="font-bold text-white uppercase">VOYAGE METRICS BREAKDOWN</span>
          <span className="text-[10px] text-cyan-400 font-bold">ROUTE: {logistics.routeId}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Total Distance:</span>
            <div className="text-base font-black text-white">{logistics.totalDistanceKm} km ({logistics.totalDistanceNm} nm)</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Remaining Dist:</span>
            <div className="text-base font-black text-white">{logistics.distanceRemainingKm} km</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Average Speed:</span>
            <div className="text-base font-black text-white">{logistics.averageSpeedKnots} kts</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Expected Delay:</span>
            <div className={`text-base font-black ${logistics.delayMinutes > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
              {logistics.timeline.delayString}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Fuel Consumed:</span>
            <div className="text-base font-black text-white">{logistics.fuelConsumedMetricTons} Tonnes</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">CO₂ Emissions:</span>
            <div className="text-base font-black text-white">{logistics.co2EmissionsTons} Tonnes</div>
          </div>
        </div>
      </div>

      {/* Visual Cause and Effect Chain */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e3559] pb-2 font-mono text-xs">
          <span className="font-bold text-white uppercase flex items-center gap-1.5">
            <span>🔗</span>
            <span>CAUSE ➔ EFFECT CHAIN</span>
          </span>
          <span className="text-[10px] text-cyan-400">PHYSICAL EVENT ➔ LOGISTICS IMPACT</span>
        </div>

        <div className="space-y-2 font-mono text-xs">
          {logistics.causeEffectChain.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border ${
                item.severity === 'CRITICAL'
                  ? 'bg-red-950/40 border-red-500/80 text-red-200'
                  : item.severity === 'CAUTION'
                  ? 'bg-amber-950/40 border-amber-500/80 text-amber-200'
                  : 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
              }`}
            >
              <div className="font-black text-xs flex items-center gap-1.5 mb-1 text-white">
                <span>{item.severity === 'CRITICAL' ? '🚨' : item.severity === 'CAUTION' ? '⚠️' : '✓'}</span>
                <span>{item.trigger}</span>
              </div>
              <div className="text-[11px] text-slate-300 pl-4 border-l-2 border-white/20 space-y-0.5">
                <div><strong>Physical Effect:</strong> {item.physicalEffect}</div>
                <div><strong>Logistics Impact:</strong> {item.logisticsImpact}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voyage ETA Timeline */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3">
        <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
          VOYAGE TIMELINE PROGRESSION
        </div>

        <div className="grid grid-cols-4 gap-2 font-mono text-xs text-center">
          <div className="p-2 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <div className="text-[10px] text-slate-400">DEPARTURE</div>
            <div className="text-sm font-bold text-white mt-1">{logistics.timeline.departureTime}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <div className="text-[10px] text-slate-400">PLANNED ETA</div>
            <div className="text-sm font-bold text-slate-200 mt-1">{logistics.timeline.plannedETA}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <div className="text-[10px] text-red-400 font-bold">DELAYED</div>
            <div className="text-sm font-bold text-red-300 mt-1">{logistics.timeline.delayString}</div>
          </div>
          <div className="p-2 rounded-xl bg-[#0c182b] border border-emerald-500/80 bg-emerald-950/30">
            <div className="text-[10px] text-emerald-400 font-bold">NEW AI ETA</div>
            <div className="text-sm font-bold text-emerald-300 mt-1">{logistics.timeline.newAIETA}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
