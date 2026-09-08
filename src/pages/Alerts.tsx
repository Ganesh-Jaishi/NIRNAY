import { useState } from 'react';
import { DEMO_ALERTS } from '../data/demoData';
import type { Alert, PageId } from '../types';
import { useSimulation } from '../context/SimulationContext';
import { useClock } from '../hooks/useClock';
import { riskTextClass } from '../services/riskService';

const SEVERITY_CONFIG: Record<Alert['severity'], { border: string; bg: string; text: string; icon: string }> = {
  CRITICAL: { border: 'border-red-600/60',    bg: 'bg-red-950/40',    text: 'text-red-300',    icon: '⛔' },
  DANGER:   { border: 'border-orange-600/50', bg: 'bg-orange-950/30', text: 'text-orange-300', icon: '●' },
  WARNING:  { border: 'border-amber-600/50',  bg: 'bg-amber-950/30',  text: 'text-amber-300',  icon: '⚠' },
  INFO:     { border: 'border-blue-600/40',   bg: 'bg-blue-950/20',   text: 'text-blue-300',   icon: 'ℹ' },
};

export default function Alerts({ onNavigate }: { onNavigate: (page: PageId) => void }) {
  const sim = useSimulation();
  const clock = useClock();
  const [alerts, setAlerts] = useState(DEMO_ALERTS);
  const [filter, setFilter] = useState<'ALL' | Alert['severity']>('ALL');

  const liveProxAlerts = sim.icebergs.filter((b) => b.nearestRouteDistKm < 25);
  const liveRouteAlerts = sim.highRiskRoutes;
  const hasLiveAlerts = liveProxAlerts.length > 0 || liveRouteAlerts.length > 0;

  const filtered = alerts.filter((a) => filter === 'ALL' || a.severity === filter);
  const unacked = alerts.filter((a) => !a.acknowledged).length;

  function acknowledgeAlert(id: string) {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)));
  }

  function acknowledgeAll() {
    setAlerts((prev) => prev.map((a) => ({ ...a, acknowledged: true })));
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Alert summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Critical', count: alerts.filter((a) => a.severity === 'CRITICAL').length + liveRouteAlerts.filter(r => r.riskLevel === 'CRITICAL').length, color: 'text-red-400', bg: 'bg-red-950/30 border-red-700/40' },
          { label: 'Danger',   count: alerts.filter((a) => a.severity === 'DANGER').length + liveProxAlerts.length, color: 'text-orange-400', bg: 'bg-orange-950/30 border-orange-700/40' },
          { label: 'Warning',  count: alerts.filter((a) => a.severity === 'WARNING').length + liveRouteAlerts.filter(r => r.riskLevel === 'HIGH').length, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-700/40' },
          { label: 'Info',     count: alerts.filter((a) => a.severity === 'INFO').length, color: 'text-blue-400', bg: 'bg-blue-950/30 border-blue-700/40' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded border p-3 text-center ${bg}`}>
            <div className={`font-mono text-2xl font-bold ${color}`}>{count}</div>
            <div className={`text-xs font-mono tracking-wide ${color} opacity-70`}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Computed alerts from live data */}
      {hasLiveAlerts && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-[#5878a0] tracking-wider">COMPUTED ALERTS — {clock.istTime} IST</div>
          {liveProxAlerts.map((b) => (
            <div key={b.id} className="rounded border border-red-600/50 bg-red-950/30 p-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-red-300">DANGER</span>
                  <span className="text-[10px] font-mono text-[#5878a0]">ICEBERG PROXIMITY</span>
                  <span className={`text-[9px] font-mono ${riskTextClass(b.riskLevel)}`}>{b.riskLevel}</span>
                </div>
                <p className="text-xs text-[#90aac8]">
                  Iceberg {b.id} ({b.sizeKm2} km²) is {b.nearestRouteDistKm} km from {b.nearestRouteId} — {b.speedKnots}kt heading {b.headingDeg}°
                </p>
              </div>
              <button
                onClick={() => onNavigate('live-map')}
                className="flex-shrink-0 px-2 py-1 rounded border border-[#00c4e8]/30 text-[10px] font-mono text-[#00c4e8] hover:bg-[#00c4e8]/10 transition-colors"
              >
                VIEW MAP →
              </button>
            </div>
          ))}
          {liveRouteAlerts.map((r) => (
            <div key={r.id} className="rounded border border-amber-600/40 bg-amber-950/20 p-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-bold text-amber-300">WARNING</span>
                  <span className="text-[10px] font-mono text-[#5878a0]">HIGH RISK ROUTE</span>
                </div>
                <p className="text-xs text-[#90aac8]">
                  Route {r.id} — {r.name} classified {r.riskLevel}. Sea-ice: {r.seaIceRisk}, Weather: {r.weatherRisk}
                </p>
              </div>
              <button
                onClick={() => onNavigate('live-map')}
                className="flex-shrink-0 px-2 py-1 rounded border border-[#00c4e8]/30 text-[10px] font-mono text-[#00c4e8] hover:bg-[#00c4e8]/10 transition-colors"
              >
                VIEW MAP →
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {(['ALL', 'CRITICAL', 'DANGER', 'WARNING', 'INFO'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded border text-[11px] font-mono transition-colors ${
                filter === f
                  ? 'border-[#00c4e8]/50 bg-[#00c4e8]/10 text-[#00c4e8]'
                  : 'border-[#142840] text-[#4a6080] hover:border-[#2a4060] hover:text-[#90aac8]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        {unacked > 0 && (
          <button
            onClick={acknowledgeAll}
            className="px-3 py-1 rounded border border-[#142840] text-[11px] font-mono text-[#5878a0] hover:text-[#90aac8] hover:border-[#2a4060] transition-colors"
          >
            Acknowledge All ({unacked})
          </button>
        )}
      </div>

      {/* Alert list */}
      <div className="space-y-3">
        {filtered.map((alert) => {
          const cfg = SEVERITY_CONFIG[alert.severity];
          return (
            <div
              key={alert.id}
              className={`rounded border p-4 ${cfg.border} ${cfg.bg} ${alert.acknowledged ? 'opacity-50' : ''} transition-opacity`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <span className="text-xl flex-shrink-0 mt-0.5">{cfg.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-mono text-[11px] font-bold tracking-wider ${cfg.text}`}>
                        {alert.severity}
                      </span>
                      <span className="font-mono text-[10px] text-[#5878a0]">{alert.type.replace('_', ' ')}</span>
                      {alert.affectedRoutes.length > 0 && (
                        <span className="font-mono text-[9px] text-[#4a6080]">
                          Routes: {alert.affectedRoutes.join(', ')}
                        </span>
                      )}
                      {alert.acknowledged && (
                        <span className="font-mono text-[9px] text-emerald-400">✓ ACKNOWLEDGED</span>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold mb-1 ${cfg.text}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                      {alert.title}
                    </h3>
                    <p className="text-xs text-[#90aac8] mb-1">{alert.message}</p>
                    <p className="text-[11px] text-[#5878a0]">{alert.detail}</p>
                    <div className="mt-2 font-mono text-[10px] text-[#3a5a78]">
                      {new Date(alert.timestamp).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })} UTC
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  {alert.affectedRoutes.length > 0 && (
                    <button
                      onClick={() => onNavigate('live-map')}
                      className="flex-shrink-0 px-2 py-1 rounded border border-[#00c4e8]/30 text-[10px] font-mono text-[#00c4e8] hover:bg-[#00c4e8]/10 transition-colors"
                    >
                      MAP →
                    </button>
                  )}
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="flex-shrink-0 px-2 py-1 rounded border border-[#142840] text-[10px] font-mono text-[#5878a0] hover:text-[#90aac8] hover:border-[#2a4060] transition-colors"
                    >
                      ACK
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#3a5a78] font-mono text-sm">
            No alerts matching filter "{filter}"
          </div>
        )}
      </div>

      <div className="rounded border border-[#142840] bg-[#050d1a] p-3 text-[11px] text-[#4a6080]">
        <span className="font-mono text-[#00c4e8] mr-2">SYSTEM NOTE:</span>
        Computed alerts are generated from route optimization outputs, iceberg trajectory calculations,
        and sea-ice risk assessments. When external data services are connected, alerts update automatically.
      </div>
    </div>
  );
}
