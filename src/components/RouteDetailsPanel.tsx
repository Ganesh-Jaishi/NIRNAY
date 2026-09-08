import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { AntarcticRoute, AntarcticIceberg, AntarcticVessel } from '../data/antarcticData';
import { SIM_CONFIG } from '../data/antarcticData';
import type { RouteScore } from '../services/routeOptimizationService';
import { getAlternativeRoutes } from '../services/routeOptimizationService';
import { routeColor, riskTextClass, riskBgClass } from '../services/riskService';

interface Props {
  route: AntarcticRoute;
  allRoutes: AntarcticRoute[];
  allScores: RouteScore[];
  icebergs: AntarcticIceberg[];
  vessels: AntarcticVessel[];
  onBack: () => void;
  onSelectRoute: (id: string) => void;
}

function MetaRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-[#0d2040]">
      <span className="text-xs text-[#5878a0]">{label}</span>
      <span
        className={`text-xs ${mono !== false ? 'font-mono' : ''} ${highlight ? 'text-amber-400 font-semibold' : 'text-[#dde8f5]'}`}
      >
        {value}
      </span>
    </div>
  );
}

function RiskBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = value >= 72 ? '#ef4444' : value >= 45 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[11px] text-[#5878a0] w-24 text-right shrink-0">{label}</span>
      <div className="flex-1 bg-[#050d1a] rounded-full h-2 border border-[#142840] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-[11px] w-6 shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

export default function RouteDetailsPanel({
  route, allRoutes, allScores, icebergs, vessels, onBack, onSelectRoute
}: Props) {
  const score = allScores.find((s) => s.routeId === route.id);
  const assignedVessel = vessels.find((v) => v.currentRouteId === route.id);
  const alternatives = getAlternativeRoutes(route.id, allRoutes, allScores).slice(0, 3);
  const recommended = allScores.find((s) => s.isRecommended);
  const isRecommended = recommended?.routeId === route.id;

  // Nearby icebergs within 50 km of this route
  const nearbyIcebergs = icebergs.filter((b) => b.nearestRouteId === route.id && b.nearestRouteDistKm < 50);

  // Comparison chart data
  const chartData = [route, ...alternatives.map((a) => a.route)].map((r) => ({
    id: r.id,
    Distance: r.distanceKm,
    'Fuel (kL)': Math.round(r.fuelLitres / 1000),
    'Time (h)': Math.round(r.estimatedTimeH),
    Risk: allScores.find((s) => s.routeId === r.id)?.overallRisk ?? 0,
  }));

  const riskColor = routeColor(route.riskLevel);

  return (
    <div className="h-full overflow-y-auto bg-[#050d1a] animate-fade-in">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#040b16]/95 backdrop-blur-sm border-b border-[#142840] px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-mono text-[#5878a0] hover:text-[#00c4e8] transition-colors border border-[#142840] hover:border-[#00c4e8]/40 px-2.5 py-1.5 rounded"
          >
            ← BACK TO LIVE MAP
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
                style={{ color: riskColor, borderColor: `${riskColor}50`, background: `${riskColor}15` }}
              >
                {route.id}
              </span>
              <h2 className="text-base font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                {route.name}
              </h2>
              {isRecommended && (
                <span className="text-[9px] font-mono bg-[#00c4e8] text-[#050d1a] px-1.5 py-0.5 rounded font-bold tracking-wider">
                  ★ RECOMMENDED
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5">
              <span className={`font-mono text-xs font-bold ${riskTextClass(route.riskLevel)}`}>{route.riskLevel} RISK</span>
              <span className="text-[10px] text-[#3a5a78] font-mono">{route.status}</span>
              <span className="text-[10px] text-[#3a5a78] font-mono">Decision Support</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-12 gap-4">
          {/* LEFT COLUMN */}
          <div className="col-span-12 lg:col-span-5 space-y-4">
            {/* Route Information */}
            <Card title="ROUTE INFORMATION">
              <MetaRow label="Route ID" value={route.id} />
              <MetaRow label="Starting Point" value={route.start} />
              <MetaRow label="Destination" value={route.destination} />
              <MetaRow
                label="Start Coordinates"
                value={`${route.startCoord[0]}°S, ${route.startCoord[1]}°E`}
              />
              <MetaRow
                label="Destination Coords"
                value={`${route.destCoord[0]}°S, ${route.destCoord[1]}°E`}
              />
              <MetaRow label="Total Distance" value={`${route.distanceKm.toLocaleString()} km`} />
              <MetaRow label="Est. Travel Time" value={`${route.estimatedTimeH} hours`} />
              <MetaRow label="Route Status" value={route.status} />
            </Card>

            {/* Vessel */}
            <Card title="VESSEL INFORMATION">
              {assignedVessel ? (
                <>
                  <MetaRow label="Vessel Name" value={assignedVessel.name} />
                  <MetaRow label="Type" value={assignedVessel.type} />
                  <MetaRow label="Ice Class" value={assignedVessel.iceClass} />
                  <MetaRow
                    label="Current Position"
                    value={`${assignedVessel.lat.toFixed(3)}°S, ${assignedVessel.lon.toFixed(3)}°E`}
                  />
                  <MetaRow label="Speed" value={`${assignedVessel.speedKnots} kt`} />
                  <MetaRow label="Status" value={assignedVessel.status} />
                  <MetaRow
                    label="Progress"
                    value={`${(assignedVessel.progress * 100).toFixed(1)}% of route`}
                  />
                  <MetaRow
                    label="Fuel Remaining"
                    value={`${((assignedVessel.fuelRemainingL / assignedVessel.fuelCapacityL) * 100).toFixed(0)}% (${(assignedVessel.fuelRemainingL / 1000).toFixed(0)}k L)`}
                  />
                </>
              ) : (
                <p className="text-xs text-[#5878a0] py-2">No vessel currently assigned to this route.</p>
              )}
            </Card>

            {/* Fuel Analysis */}
            <Card title="FUEL ANALYSIS">
              <MetaRow label="Est. Fuel Consumption" value={`${route.fuelLitres.toLocaleString()} L`} />
              <MetaRow label="Fuel per km" value={`${route.fuelPerKm} L/km`} />
              <MetaRow
                label="Est. Fuel Cost"
                value={`USD $${route.fuelCostUSD.toLocaleString()}`}
              />
              <MetaRow
                label="Fuel Rate (base)"
                value={`52 L/km × env. factor`}
              />
              <MetaRow label="Efficiency Rating" value={route.fuelEfficiencyLabel} />
              <div className="mt-2 p-2 rounded bg-[#0a1830] border border-[#142840] text-[10px] text-[#3a5a78] font-mono">
                Calculation: distanceKm × 52 L/km × iceFactor × weatherFactor.
                Fuel estimate includes ice and weather factors. Subject to operational uncertainty.
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-12 lg:col-span-7 space-y-4">
            {/* Environment */}
            <Card title="ENVIRONMENTAL CONDITIONS">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] font-mono text-[#5878a0] tracking-wider mb-1.5">CURRENT</div>
                  <MetaRow label="Sea-Ice Condition" value={route.seaIceRisk} />
                  <MetaRow label="Iceberg Risk" value={route.icebergRisk} />
                  <MetaRow label="Weather" value={route.weatherRisk} />
                  <MetaRow label="Ocean/Current" value={route.oceanRisk} />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-[#5878a0] tracking-wider mb-1.5">NOTES</div>
                  <p className="text-[11px] text-[#607890] mb-2">{route.seaIceNotes}</p>
                  <p className="text-[11px] text-[#607890]">{route.weatherNotes}</p>
                </div>
              </div>
            </Card>

            {/* Safety / Risk breakdown */}
            <Card title="SAFETY ANALYSIS">
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`font-mono text-sm font-bold px-2 py-0.5 rounded border ${riskBgClass(route.riskLevel)} ${riskTextClass(route.riskLevel)}`}
                  >
                    {route.riskLevel} RISK
                  </span>
                  {score && (
                    <span className="font-mono text-xs text-[#5878a0]">
                      Overall risk score: {score.overallRisk}/100
                    </span>
                  )}
                </div>
              </div>
              {score && (
                <>
                  <RiskBar label="Sea-Ice" value={score.iceRiskPenalty} />
                  <RiskBar label="Iceberg" value={score.icebergRiskPenalty} />
                  <RiskBar label="Weather" value={score.weatherRiskPenalty} />
                  <RiskBar label="Overall" value={score.overallRisk} />
                </>
              )}
              {nearbyIcebergs.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <div className="text-[10px] font-mono text-[#5878a0] tracking-wider">NEARBY ICEBERGS</div>
                  {nearbyIcebergs.map((berg) => (
                    <div
                      key={berg.id}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded border text-xs ${riskBgClass(berg.riskLevel)}`}
                    >
                      <span className="font-mono font-bold text-[#dde8f5]">{berg.id}</span>
                      <span className="text-[#607890]">{berg.sizeKm2} km² · {berg.speedKnots}kt {berg.headingLabel}</span>
                      <span className={`font-mono ${riskTextClass(berg.riskLevel)}`}>
                        {berg.nearestRouteDistKm} km away
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {nearbyIcebergs.length === 0 && (
                <p className="text-xs text-emerald-400 mt-2">✓ No icebergs within 50 km of this route.</p>
              )}
            </Card>

            {/* Alternative routes */}
            <Card title="ALTERNATIVE ROUTES">
              {alternatives.length === 0 ? (
                <p className="text-xs text-[#5878a0]">No alternatives available.</p>
              ) : (
                <div className="space-y-2">
                  {alternatives.map(({ route: alt, score: altScore }) => {
                    const isAltRec = recommended?.routeId === alt.id;
                    return (
                      <div
                        key={alt.id}
                        className={`rounded border p-3 ${isAltRec ? 'border-[#00c4e8]/30 bg-[#00c4e8]/5' : 'border-[#142840] bg-[#081424]'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-xs font-bold"
                              style={{ color: routeColor(alt.riskLevel) }}
                            >
                              {alt.id}
                            </span>
                            <span className="text-xs text-[#90aac8]">{alt.name}</span>
                            {isAltRec && (
                              <span className="text-[9px] font-mono text-[#00c4e8]">★ RECOMMENDED</span>
                            )}
                          </div>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${riskBgClass(alt.riskLevel)} ${riskTextClass(alt.riskLevel)}`}
                          >
                            {alt.riskLevel}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-[10px] font-mono mb-2">
                          {[
                            { l: 'Dist', v: `${alt.distanceKm} km` },
                            { l: 'Time', v: `${alt.estimatedTimeH}h` },
                            { l: 'Fuel', v: `${(alt.fuelLitres / 1000).toFixed(0)}k L` },
                            { l: 'Risk', v: `${altScore.overallRisk}/100` },
                          ].map(({ l, v }) => (
                            <div key={l}>
                              <div className="text-[#3a5a78]">{l}</div>
                              <div className="text-[#90aac8]">{v}</div>
                            </div>
                          ))}
                        </div>
                        {isAltRec && recommended && (
                          <div className="text-[11px] text-[#00c4e8] bg-[#00c4e8]/5 border border-[#00c4e8]/20 rounded px-2 py-1.5">
                            {recommended.recommendationReason}
                          </div>
                        )}
                        <button
                          onClick={() => onSelectRoute(alt.id)}
                          className="mt-2 w-full text-center text-[10px] font-mono text-[#5878a0] hover:text-[#00c4e8] border border-[#142840] hover:border-[#00c4e8]/30 rounded py-1 transition-colors"
                        >
                          VIEW {alt.id} DETAILS →
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Comparison chart */}
            {chartData.length > 1 && (
              <Card title="ROUTE COMPARISON CHART">
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                      <XAxis dataKey="id" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                      <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                      <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                      <Bar dataKey="Risk" fill="#ef4444" radius={[2, 2, 0, 0]} name="Risk Score" />
                      <Bar dataKey="Fuel (kL)" fill="#a78bfa" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[9px] text-[#3a5a78] font-mono text-center mt-1">
                  Lower = better for both Risk Score and Fuel
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#081424] border border-[#142840] rounded overflow-hidden">
      <div className="px-3 py-2 border-b border-[#142840] bg-[#050d1a]">
        <h3 className="text-xs font-mono font-bold text-[#5878a0] tracking-widest">{title}</h3>
      </div>
      <div className="px-3 py-2">{children}</div>
    </div>
  );
}
