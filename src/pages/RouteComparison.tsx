import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import SectionHeader from '../components/common/SectionHeader';
import RiskBadge from '../components/common/RiskBadge';
import { DEMO_ROUTES, RISK_RADAR_DATA } from '../data/demoData';

const METRICS_CHART_DATA = [
  { label: 'Dist. (×10 km)', safest: 432, fastest: 384, fuel: 406, balanced: 398 },
  { label: 'Time (h)', safest: 44.2, fastest: 32.5, fuel: 40.1, balanced: 38.4 },
  { label: 'Fuel (×100 k L)', safest: 13.8, fastest: 12.3, fuel: 12.2, balanced: 12.7 },
  { label: 'Risk (/100)', safest: 17, fastest: 53, fuel: 27, balanced: 24 },
];

const ROUTE_COLORS = { safest: '#22c55e', fastest: '#f59e0b', fuel: '#a78bfa', balanced: '#00c4e8' };

export default function RouteComparison() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-[#5878a0]">A* · Dijkstra · Multi-objective route comparison</div>
      </div>

      {/* Scorecard Table */}
      <div className="bg-[#081424] border border-[#142840] rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-[#142840]">
          <h2 className="text-base font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            ROUTE SCORECARD
          </h2>
          <p className="text-xs text-[#5878a0] mt-0.5">All 4 candidate routes — objective comparison</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#050d1a] text-[#4a6080] font-mono text-[10px] tracking-wider">
                <th className="px-4 py-2.5 text-left">Route</th>
                <th className="px-4 py-2.5 text-right">Distance</th>
                <th className="px-4 py-2.5 text-right">Time</th>
                <th className="px-4 py-2.5 text-right">Fuel</th>
                <th className="px-4 py-2.5 text-right">Ice Risk</th>
                <th className="px-4 py-2.5 text-right">Berg Risk</th>
                <th className="px-4 py-2.5 text-right">Wx Risk</th>
                <th className="px-4 py-2.5 text-center">Overall</th>
                <th className="px-4 py-2.5 text-center">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {DEMO_ROUTES.map((route, i) => (
                <tr
                  key={route.id}
                  className={`border-t border-[#142840] ${route.isRecommended ? 'bg-[#00c4e8]/5' : i % 2 === 0 ? 'bg-[#081424]' : 'bg-[#050d1a]'}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: route.color }} />
                      <div>
                        <div className="font-mono font-bold" style={{ color: route.color }}>{route.id}</div>
                        <div className="text-[10px] text-[#4a6080] capitalize">{route.type.replace('_', ' ')}</div>
                      </div>
                      {route.isRecommended && (
                        <span className="ml-1 text-[9px] font-mono bg-[#00c4e8] text-[#050d1a] px-1 py-0.5 rounded font-bold">★ REC</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#dde8f5]">
                    {route.distanceKm.toLocaleString()} km
                    {route.distanceKm === Math.min(...DEMO_ROUTES.map((r) => r.distanceKm)) && (
                      <span className="ml-1 text-emerald-400">★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#dde8f5]">
                    {route.estimatedTimeH} h
                    {route.estimatedTimeH === Math.min(...DEMO_ROUTES.map((r) => r.estimatedTimeH)) && (
                      <span className="ml-1 text-emerald-400">★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[#dde8f5]">
                    {(route.estimatedFuelL / 1000).toFixed(0)}k L
                    {route.estimatedFuelL === Math.min(...DEMO_ROUTES.map((r) => r.estimatedFuelL)) && (
                      <span className="ml-1 text-emerald-400">★</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RiskBar value={route.seaIceRisk} color="#60a5fa" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RiskBar value={route.icebergRisk} color="#fb923c" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <RiskBar value={route.weatherRisk} color="#f59e0b" />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <RiskBadge level={route.riskLevel} score={route.overallRisk} compact />
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-[#90aac8]">
                    {(route.confidence * 100).toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-[#050d1a] border-t border-[#142840] text-[9px] font-mono text-[#3a5a78]">
          ★ = best value for that metric across all routes. All metrics derived from A*/multi-objective routing on the current risk map.
          Fuel uncertainty: ±7–11%. Not for real navigation use.
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Bar comparison */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="MULTI-METRIC COMPARISON" subtitle="Normalized bar chart by route type" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={METRICS_CHART_DATA} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} width={90} />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                <Bar dataKey="safest" fill={ROUTE_COLORS.safest} name="Safest (R2)" radius={[0, 2, 2, 0]} />
                <Bar dataKey="fastest" fill={ROUTE_COLORS.fastest} name="Fastest (R1)" radius={[0, 2, 2, 0]} />
                <Bar dataKey="fuel" fill={ROUTE_COLORS.fuel} name="Low Fuel (R4)" radius={[0, 2, 2, 0]} />
                <Bar dataKey="balanced" fill={ROUTE_COLORS.balanced} name="Balanced (R3)" radius={[0, 2, 2, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radar chart */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="RISK PROFILE RADAR" subtitle="Risk score by component (lower = safer)" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RISK_RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#0d2040" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <PolarRadiusAxis angle={90} domain={[0, 70]} tick={false} />
                <Radar name="Safest (R2)" dataKey="safest" stroke={ROUTE_COLORS.safest} fill={ROUTE_COLORS.safest} fillOpacity={0.1} />
                <Radar name="Fastest (R1)" dataKey="fastest" stroke={ROUTE_COLORS.fastest} fill={ROUTE_COLORS.fastest} fillOpacity={0.1} />
                <Radar name="Low Fuel (R4)" dataKey="fuel" stroke={ROUTE_COLORS.fuel} fill={ROUTE_COLORS.fuel} fillOpacity={0.1} />
                <Radar name="Balanced (R3)" dataKey="balanced" stroke={ROUTE_COLORS.balanced} fill={ROUTE_COLORS.balanced} fillOpacity={0.15} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explanation cards */}
        {DEMO_ROUTES.map((route) => (
          <div key={route.id} className="col-span-12 md:col-span-6 lg:col-span-3 bg-[#081424] border border-[#142840] rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: route.color }} />
              <span className="font-mono text-xs font-bold" style={{ color: route.color }}>{route.id}</span>
              <span className="text-[10px] text-[#5878a0] capitalize">{route.type.replace('_', ' ')}</span>
            </div>
            <div className="text-[10px] text-[#3a5a78] font-mono mb-2">{route.algorithm}</div>
            <div className="space-y-1">
              {route.explanation.slice(0, 3).map((ex, i) => (
                <div key={i} className="flex items-start gap-1.5 text-[11px]">
                  <span className={ex.positive ? 'text-emerald-400' : 'text-red-400'}>
                    {ex.positive ? '✓' : '✗'}
                  </span>
                  <span className="text-[#607890]">{ex.text}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <div className="w-16 bg-[#050d1a] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono text-[10px] w-5 text-right" style={{ color }}>{value}</span>
    </div>
  );
}
