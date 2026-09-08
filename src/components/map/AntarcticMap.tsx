import { useState } from 'react';
import { polarProject, waypointsToPolyline, outlineToSVGPath, ANTARCTICA_OUTLINE, ANTARCTICA_INNER, MAP_CENTER, polarProjectRadius } from '../../utils/projection';
import { DEMO_ICEBERGS, DEMO_ROUTES, DEMO_VESSEL, generateSeaIceGrid } from '../../data/demoData';

interface Layers {
  seaIce: boolean;
  icebergs: boolean;
  icebergTrajectories: boolean;
  riskMap: boolean;
  routes: boolean;
  currents: boolean;
}

interface Props {
  timeOffsetH?: number;
  compact?: boolean;
}

const RISK_COLORS: Record<string, string> = {
  SAFE: '#22c55e22',
  LOW: '#84cc1622',
  MODERATE: '#f59e0b33',
  HIGH: '#ef444440',
  CRITICAL: '#dc262650',
};

const seaIceCells = generateSeaIceGrid();

export default function AntarcticMap({ timeOffsetH = 0, compact = false }: Props) {
  const [layers, setLayers] = useState<Layers>({
    seaIce: true,
    icebergs: true,
    icebergTrajectories: true,
    riskMap: false,
    routes: true,
    currents: false,
  });
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

  const vesselPos = polarProject(DEMO_VESSEL.position.lat, DEMO_VESSEL.position.lon);
  const destPos = polarProject(DEMO_VESSEL.destination.lat, DEMO_VESSEL.destination.lon);

  const size = compact ? 520 : 600;

  const toggleLayer = (key: keyof Layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Layer Toggles */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          {(Object.keys(layers) as Array<keyof Layers>).map((key) => (
            <button
              key={key}
              onClick={() => toggleLayer(key)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono transition-colors ${
                layers[key]
                  ? 'border-[#00c4e8]/40 bg-[#00c4e8]/10 text-[#00c4e8]'
                  : 'border-[#142840] text-[#4a6080] hover:border-[#2a4060]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-sm ${layers[key] ? 'bg-[#00c4e8]' : 'bg-[#2a4060]'}`} />
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
            </button>
          ))}
        </div>
      )}

      {/* Map Container */}
      <div className="flex-1 relative rounded border border-[#142840] overflow-hidden bg-[#020810]">
        {/* Grid overlay */}
        <div className="absolute inset-0 grid-overlay pointer-events-none" />

        <svg
          viewBox={`0 0 600 600`}
          className="w-full h-full"
          style={{ aspectRatio: '1/1', maxHeight: compact ? 360 : 480 }}
        >
          <defs>
            <radialGradient id="oceanGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#020d1e" />
              <stop offset="100%" stopColor="#010810" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id="vesselGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00c4e8" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#00c4e8" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ocean background */}
          <circle cx={MAP_CENTER.x} cy={MAP_CENTER.y} r={300} fill="url(#oceanGrad)" />

          {/* Latitude rings */}
          {[60, 65, 70, 75, 80, 85].map((lat) => {
            const r = polarProjectRadius(90 - lat);
            return (
              <g key={lat}>
                <circle
                  cx={MAP_CENTER.x}
                  cy={MAP_CENTER.y}
                  r={r}
                  fill="none"
                  stroke="#0d2040"
                  strokeWidth="0.5"
                  strokeDasharray="4 8"
                />
                <text
                  x={MAP_CENTER.x + r + 2}
                  y={MAP_CENTER.y - 2}
                  fontSize="8"
                  fill="#1a3a5a"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lat}°S
                </text>
              </g>
            );
          })}

          {/* Longitude spokes */}
          {[0, 30, 60, 90, 120, 150, 180, -150, -120, -90, -60, -30].map((lon) => {
            const inner = polarProject(-60, lon);
            const outer = polarProject(-56, lon);
            return (
              <line
                key={lon}
                x1={MAP_CENTER.x}
                y1={MAP_CENTER.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#0d2040"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Sea ice cells */}
          {layers.seaIce &&
            seaIceCells.map((cell, i) => {
              const pos = polarProject(cell.lat, cell.lon);
              const radius = layers.riskMap ? 12 : 10;
              const fill = layers.riskMap
                ? RISK_COLORS[cell.riskLevel]
                : `rgba(200, 230, 255, ${cell.sic * 0.55})`;
              return (
                <circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={fill}
                  stroke={layers.riskMap ? RISK_COLORS[cell.riskLevel].replace('22', '60') : 'rgba(180,210,255,0.15)'}
                  strokeWidth="0.5"
                />
              );
            })}

          {/* Antarctica continent */}
          <path
            d={outlineToSVGPath(ANTARCTICA_OUTLINE)}
            fill="#0e1a28"
            stroke="#1e3450"
            strokeWidth="1"
          />
          <path
            d={outlineToSVGPath(ANTARCTICA_INNER)}
            fill="#0a1420"
            stroke="#162840"
            strokeWidth="0.5"
          />

          {/* Ocean current indicator (simplified) */}
          {layers.currents && (
            <g opacity="0.5">
              {[70, 80, 90, 100, 110, 120, 130, 140].map((lon) => {
                const lat = -58;
                const p = polarProject(lat, lon);
                const ang = ((lon + 90) * Math.PI) / 180;
                return (
                  <g key={lon} transform={`translate(${p.x}, ${p.y}) rotate(${lon + 90})`}>
                    <line x1="-6" y1="0" x2="6" y2="0" stroke="#00e5a0" strokeWidth="1" />
                    <polygon points="6,0 3,-2 3,2" fill="#00e5a0" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Iceberg trajectories */}
          {layers.icebergTrajectories &&
            DEMO_ICEBERGS.map((berg) => {
              const pts = berg.trajectory.map((t) => polarProject(t.lat, t.lon));
              const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
              return (
                <g key={`traj-${berg.id}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#fb923c"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    opacity="0.6"
                  />
                  {/* Uncertainty cone at final point */}
                  {berg.trajectory.length > 1 && (() => {
                    const last = berg.trajectory[berg.trajectory.length - 1];
                    const lp = polarProject(last.lat, last.lon);
                    return (
                      <circle
                        cx={lp.x}
                        cy={lp.y}
                        r={8 * (1 - last.confidence)}
                        fill="#fb923c"
                        opacity="0.12"
                        stroke="#fb923c"
                        strokeWidth="0.5"
                        strokeDasharray="2 3"
                      />
                    );
                  })()}
                </g>
              );
            })}

          {/* Routes */}
          {layers.routes &&
            DEMO_ROUTES.map((route) => {
              const isRecommended = route.isRecommended;
              const isHovered = hoveredRoute === route.id;
              return (
                <g key={route.id}>
                  <polyline
                    points={waypointsToPolyline(route.waypoints)}
                    fill="none"
                    stroke={route.color}
                    strokeWidth={isRecommended ? (isHovered ? 3.5 : 2.5) : isHovered ? 2 : 1.2}
                    strokeDasharray={isRecommended ? 'none' : '6 4'}
                    opacity={isHovered ? 1 : isRecommended ? 0.9 : 0.5}
                    style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={() => setHoveredRoute(route.id)}
                    onMouseLeave={() => setHoveredRoute(null)}
                  />
                  {/* Route label */}
                  {(() => {
                    const mid = route.waypoints[Math.floor(route.waypoints.length / 2)];
                    const mp = polarProject(mid.lat, mid.lon);
                    return (
                      <text
                        x={mp.x + 6}
                        y={mp.y - 4}
                        fontSize="9"
                        fill={route.color}
                        fontFamily="JetBrains Mono, monospace"
                        opacity={isHovered || isRecommended ? 1 : 0.5}
                      >
                        {route.id}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

          {/* Icebergs */}
          {layers.icebergs &&
            DEMO_ICEBERGS.map((berg) => {
              const pos = polarProject(berg.position.lat, berg.position.lon);
              const size = Math.max(5, Math.min(12, berg.lengthKm * 0.7));
              const highRisk = berg.collisionProbability > 0.5;
              return (
                <g
                  key={berg.id}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() =>
                    setTooltip({
                      x: pos.x,
                      y: pos.y,
                      text: `${berg.name} | ${berg.lengthKm}×${berg.widthKm}km | Risk: ${Math.round(berg.collisionProbability * 100)}%`,
                    })
                  }
                  onMouseLeave={() => setTooltip(null)}
                >
                  {highRisk && (
                    <circle cx={pos.x} cy={pos.y} r={size + 4} fill="#ef444420" stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3 2" />
                  )}
                  <polygon
                    points={`${pos.x},${pos.y - size} ${pos.x + size * 0.7},${pos.y + size * 0.5} ${pos.x - size * 0.7},${pos.y + size * 0.5}`}
                    fill={highRisk ? '#ef444430' : '#93c5fd30'}
                    stroke={highRisk ? '#ef4444' : '#93c5fd'}
                    strokeWidth="1"
                  />
                  <text
                    x={pos.x + size + 2}
                    y={pos.y + 3}
                    fontSize="8"
                    fill={highRisk ? '#ef4444' : '#93c5fd'}
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {berg.name}
                  </text>
                </g>
              );
            })}

          {/* Vessel */}
          <g filter="url(#glow)">
            <circle cx={vesselPos.x} cy={vesselPos.y} r={14} fill="url(#vesselGlow)" />
            <circle cx={vesselPos.x} cy={vesselPos.y} r={14} fill="none" stroke="#00c4e8" strokeWidth="0.5" opacity="0.3" />
            <circle cx={vesselPos.x} cy={vesselPos.y} r={5} fill="#00c4e8" opacity="0.2" />
            <circle cx={vesselPos.x} cy={vesselPos.y} r={3} fill="#00c4e8" />
            {/* Heading indicator */}
            <line
              x1={vesselPos.x}
              y1={vesselPos.y}
              x2={vesselPos.x + 10 * Math.sin((DEMO_VESSEL.heading * Math.PI) / 180)}
              y2={vesselPos.y - 10 * Math.cos((DEMO_VESSEL.heading * Math.PI) / 180)}
              stroke="#00c4e8"
              strokeWidth="1.5"
            />
          </g>
          <text x={vesselPos.x + 8} y={vesselPos.y - 8} fontSize="9" fill="#00c4e8" fontFamily="JetBrains Mono, monospace">
            RV Bharti
          </text>

          {/* Destination */}
          <g>
            <circle cx={destPos.x} cy={destPos.y} r={8} fill="none" stroke="#00e5a0" strokeWidth="1" />
            <circle cx={destPos.x} cy={destPos.y} r={3} fill="#00e5a0" />
            <text x={destPos.x + 10} y={destPos.y + 3} fontSize="9" fill="#00e5a0" fontFamily="JetBrains Mono, monospace">
              McMurdo
            </text>
          </g>

          {/* South Pole label */}
          <circle cx={MAP_CENTER.x} cy={MAP_CENTER.y} r={3} fill="#2a4060" />
          <text x={MAP_CENTER.x + 5} y={MAP_CENTER.y + 3} fontSize="8" fill="#2a4060" fontFamily="JetBrains Mono, monospace">
            90°S
          </text>

          {/* Tooltip */}
          {tooltip && (
            <g>
              <rect
                x={tooltip.x + 10}
                y={tooltip.y - 20}
                width={Math.min(200, tooltip.text.length * 5.5)}
                height={24}
                rx="3"
                fill="#081424"
                stroke="#142840"
              />
              <text
                x={tooltip.x + 14}
                y={tooltip.y - 5}
                fontSize="9"
                fill="#dde8f5"
                fontFamily="JetBrains Mono, monospace"
              >
                {tooltip.text.substring(0, 38)}
              </text>
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-3 left-3 bg-[#040b16]/90 border border-[#142840] rounded p-2 text-[9px] font-mono space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 border-t-2 border-[#00c4e8]" />
            <span className="text-[#607890]">Recommended Route</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 border-t border-dashed border-[#f59e0b]" />
            <span className="text-[#607890]">Alt. Routes</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#fb923c]">- -</span>
            <span className="text-[#607890]">Iceberg Trajectory</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00c4e8]" />
            <span className="text-[#607890]">Vessel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00e5a0]" />
            <span className="text-[#607890]">Destination</span>
          </div>
        </div>

        {/* Time offset indicator */}
        {timeOffsetH > 0 && (
          <div className="absolute top-3 right-3 bg-violet-950/80 border border-violet-700/50 rounded px-2 py-1 font-mono text-[10px] text-violet-300">
            FORECAST +{timeOffsetH}h
          </div>
        )}
      </div>
    </div>
  );
}
