import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import SectionHeader from '../components/common/SectionHeader';
import DataStatusBadge from '../components/common/DataStatusBadge';
import StatCard from '../components/common/StatCard';
import { DEMO_ICEBERGS, TRAJECTORY_FORECAST_SERIES } from '../data/demoData';

const CATEGORIES: Record<string, string> = {
  GR: 'Growler (<5m)',
  BB: 'Bergy Bit (5–14m)',
  LG: 'Large (121–200m)',
  VLG: 'Very Large (201–400m)',
  GNT: 'Giant (>400m)',
};

export default function IcebergTracking() {
  const [selected, setSelected] = useState(DEMO_ICEBERGS[0].id);
  const berg = DEMO_ICEBERGS.find((b) => b.id === selected) ?? DEMO_ICEBERGS[0];

  const trajectoryData = berg.trajectory.map((t) => ({
    time: `+${t.timeHours}h`,
    lat: t.lat,
    lon: t.lon,
    conf: Math.round(t.confidence * 100),
    lowerLat: t.lat - (1 - t.confidence) * 0.8,
    upperLat: t.lat + (1 - t.confidence) * 0.8,
  }));

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-[#5878a0]">Model: LSTM + Physics Baseline · {DEMO_ICEBERGS.length} icebergs tracked</div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Icebergs" value={DEMO_ICEBERGS.length} sub="Southern Ocean, route area" />
        <StatCard label="High Risk" value={DEMO_ICEBERGS.filter((b) => b.collisionProbability > 0.5).length} sub="P(collision) > 50%" danger />
        <StatCard label="Max Category" value="VLG" sub="Very Large (201–400m)" warning />
        <StatCard label="Model MAE" value="8.4" unit="km" sub="Position error — trajectory model" accent />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Iceberg List */}
        <div className="col-span-12 lg:col-span-4 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="TRACKED ICEBERGS" subtitle="Select for trajectory details" />
          <div className="space-y-2">
            {DEMO_ICEBERGS.map((b) => {
              const risk = b.collisionProbability;
              const riskColor = risk > 0.5 ? '#ef4444' : risk > 0.3 ? '#f59e0b' : '#22c55e';
              return (
                <button
                  key={b.id}
                  onClick={() => setSelected(b.id)}
                  className={`w-full rounded border p-3 text-left transition-colors ${
                    selected === b.id
                      ? 'border-[#00c4e8]/40 bg-[#00c4e8]/5'
                      : 'border-[#142840] hover:border-[#2a4060] bg-[#050d1a]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm" style={{ color: riskColor }}>▲</span>
                      <span className="font-mono text-sm font-bold text-[#dde8f5]">{b.name}</span>
                    </div>
                    <span
                      className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ color: riskColor, background: `${riskColor}20` }}
                    >
                      {Math.round(risk * 100)}% risk
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 text-[11px]">
                    <div className="text-[#4a6080]">Category: <span className="text-[#90aac8]">{b.category}</span></div>
                    <div className="text-[#4a6080]">Size: <span className="text-[#90aac8]">{b.lengthKm}×{b.widthKm}km</span></div>
                    <div className="text-[#4a6080]">Speed: <span className="text-[#90aac8]">{b.speedKnots}kt</span></div>
                    <div className="text-[#4a6080]">Dir: <span className="text-[#90aac8]">{b.directionDeg}°</span></div>
                  </div>
                  {b.riskToRoute.length > 0 && (
                    <div className="mt-1.5 text-[10px] font-mono text-red-400">
                      ⚠ Risk to {b.riskToRoute.join(', ')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Trajectory Details */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {/* Selected berg info */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                  Iceberg {berg.name}
                </h3>
                <div className="text-xs text-[#5878a0]">{CATEGORIES[berg.category]}</div>
              </div>
              <div className="text-right">
                <div
                  className="font-mono text-xl font-bold"
                  style={{ color: berg.collisionProbability > 0.5 ? '#ef4444' : berg.collisionProbability > 0.3 ? '#f59e0b' : '#22c55e' }}
                >
                  {Math.round(berg.collisionProbability * 100)}%
                </div>
                <div className="text-[10px] text-[#5878a0]">Collision probability</div>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[
                { label: 'Position', value: `${berg.position.lat}°S` },
                { label: 'Longitude', value: `${berg.position.lon}°E` },
                { label: 'Length', value: `${berg.lengthKm} km` },
                { label: 'Width', value: `${berg.widthKm} km` },
                { label: 'Speed', value: `${berg.speedKnots} kt` },
                { label: 'Direction', value: `${berg.directionDeg}°` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#050d1a] rounded border border-[#142840] p-2 text-center">
                  <div className="font-mono text-xs text-[#5878a0] mb-0.5">{label}</div>
                  <div className="font-mono text-sm font-semibold text-[#dde8f5]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trajectory chart — latitude over time */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader
              title="PREDICTED TRAJECTORY"
              subtitle="72-hour latitude forecast with uncertainty corridor"
            >
              <DataStatusBadge status="MODEL_FORECAST" />
            </SectionHeader>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} unit="°" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }}
                    formatter={(val, name) => [
                      name === 'conf' ? `${val}%` : `${(val as number).toFixed(2)}°S`,
                      name === 'conf' ? 'Confidence' : name === 'lat' ? 'Latitude' : String(name),
                    ]}
                  />
                  <Line type="monotone" dataKey="upperLat" stroke="#fb923c" strokeWidth={0.5} dot={false} strokeDasharray="3 3" name="Upper bound" />
                  <Line type="monotone" dataKey="lowerLat" stroke="#fb923c" strokeWidth={0.5} dot={false} strokeDasharray="3 3" name="Lower bound" />
                  <Line type="monotone" dataKey="lat" stroke="#fb923c" strokeWidth={2} dot={{ r: 3, fill: '#fb923c' }} name="Predicted Lat" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ML vs Physics comparison */}
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader
              title="MODEL vs PHYSICS BASELINE"
              subtitle="Positional error (km) by forecast horizon"
            />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={TRAJECTORY_FORECAST_SERIES} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} unit="km" />
                  <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                  <Bar dataKey="ml" fill="#00c4e8" name="LSTM Model" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="physics" fill="#4a6080" name="Physics Baseline" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[10px] text-[#3a5a78] font-mono mt-1">
              Physics baseline: v_iceberg = α·v_current + β·v_wind. LSTM uses sequential trajectory + environmental features.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
