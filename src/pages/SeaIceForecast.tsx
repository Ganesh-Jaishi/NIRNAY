import { useState } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import SectionHeader from '../components/common/SectionHeader';
import StatCard from '../components/common/StatCard';
import { SEA_ICE_HISTORY, DEMO_ENVIRONMENT } from '../data/demoData';

const HORIZONS = ['6h', '12h', '24h', '48h', '72h'];
const FORECAST_POINTS = [
  { hour: '+0h', sic: 38, conf: 100, lower: 38, upper: 38 },
  { hour: '+6h', sic: 39, conf: 92, lower: 36, upper: 43 },
  { hour: '+12h', sic: 40, conf: 88, lower: 35, upper: 46 },
  { hour: '+24h', sic: 43, conf: 80, lower: 34, upper: 52 },
  { hour: '+48h', sic: 49, conf: 68, lower: 34, upper: 61 },
  { hour: '+72h', sic: 55, conf: 55, lower: 34, upper: 68 },
];

const MODEL_COMPARISON = [
  { horizon: '6h', convlstm: 3.8, persistence: 5.2, xgboost: 4.6 },
  { horizon: '12h', convlstm: 4.1, persistence: 6.8, xgboost: 5.1 },
  { horizon: '24h', convlstm: 4.8, persistence: 9.1, xgboost: 6.4 },
  { horizon: '48h', convlstm: 6.2, persistence: 12.4, xgboost: 8.7 },
  { horizon: '72h', convlstm: 7.1, persistence: 15.8, xgboost: 11.2 },
];

export default function SeaIceForecast() {
  const [horizon, setHorizon] = useState('24h');
  const forecastIdx = HORIZONS.indexOf(horizon) + 1;
  const forecastPoint = FORECAST_POINTS[forecastIdx] ?? FORECAST_POINTS[3];

  const historyData = SEA_ICE_HISTORY.filter((d) => d.actual > 0 || d.date >= 'Jan 15');

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="font-mono text-[10px] text-[#5878a0]">Model: ConvLSTM · Uncertainty: Monte Carlo dropout</div>
      </div>

      {/* Forecast Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Current SIC" value={DEMO_ENVIRONMENT.sicPercent} unit="%" sub="Vessel position" />
        <StatCard label={`SIC Forecast (${horizon})`} value={forecastPoint.sic} unit="%" sub={`Confidence: ${forecastPoint.conf}%`} warning={forecastPoint.sic > 45} danger={forecastPoint.sic > 60} />
        <StatCard label="Model MAE" value="0.048" unit="" sub="ConvLSTM vs persistence baseline" accent />
        <StatCard label="Vessel Threshold" value="70" unit="% max SIC" sub={forecastPoint.sic > 60 ? '⚠ Approaching limit' : '✓ Within limits'} warning={forecastPoint.sic > 60} />
      </div>

      {/* Horizon Selector */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-[#5878a0] tracking-wider">FORECAST HORIZON:</span>
        {HORIZONS.map((h) => (
          <button
            key={h}
            onClick={() => setHorizon(h)}
            className={`px-3 py-1 rounded border text-xs font-mono transition-colors ${
              horizon === h
                ? 'border-[#00c4e8]/50 bg-[#00c4e8]/10 text-[#00c4e8]'
                : 'border-[#142840] text-[#4a6080] hover:border-[#2a4060] hover:text-[#90aac8]'
            }`}
          >
            {h}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Historical + Forecast Chart */}
        <div className="col-span-12 lg:col-span-8 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader
            title="SIC HISTORICAL RECORD & FORECAST"
            subtitle="Sea-ice concentration (%) — past 15 days + 3-day forecast"
          >
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <LegendDot color="#dde8f5" label="Observed" />
              <LegendDot color="#00c4e8" label="ConvLSTM" dashed />
              <LegendDot color="#5878a0" label="Persistence" dashed />
              <LegendDot color="#00c4e8" label="Uncertainty" area />
            </div>
          </SectionHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={SEA_ICE_HISTORY} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c4e8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#00c4e8" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} interval={2} />
                <YAxis domain={[20, 70]} tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} unit="%" />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                <ReferenceLine y={70} stroke="#ef444460" strokeDasharray="4 4" label={{ value: 'Max SIC', fontSize: 9, fill: '#ef4444' }} />
                <Area type="monotone" dataKey="upperBound" stroke="none" fill="url(#confBand)" />
                <Area type="monotone" dataKey="lowerBound" stroke="none" fill="url(#confBand)" />
                <Line type="monotone" dataKey="actual" stroke="#dde8f5" strokeWidth={2} dot={{ r: 2, fill: '#dde8f5' }} connectNulls={false} name="Observed" />
                <Line type="monotone" dataKey="predicted" stroke="#00c4e8" strokeWidth={1.5} strokeDasharray="6 3" dot={false} name="ConvLSTM" />
                <Line type="monotone" dataKey="persistence" stroke="#5878a0" strokeWidth={1} strokeDasharray="3 4" dot={false} name="Persistence" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 p-2 rounded bg-[#050d1a] border border-[#142840] text-[10px] text-[#3a5a78] font-mono">
            Shaded band = 90% prediction interval. Values beyond the observation window are model forecast. Confidence decreases with forecast horizon.
          </div>
        </div>

        {/* Forecast confidence */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader title="FORECAST BY HORIZON" subtitle="ConvLSTM predictions" />
            <div className="space-y-2">
              {FORECAST_POINTS.slice(1).map((fp, i) => (
                <div key={fp.hour} className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-[#5878a0] w-10">{fp.hour}</span>
                  <div className="flex-1 bg-[#050d1a] rounded-full h-4 relative overflow-hidden border border-[#142840]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${fp.sic}%`,
                        background: fp.sic > 60
                          ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                          : fp.sic > 45
                            ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                            : 'linear-gradient(90deg, #00c4e8, #0ea5e9)',
                      }}
                    />
                    <span className="absolute right-2 top-0 text-[10px] font-mono text-[#dde8f5] leading-4">
                      {fp.sic}%
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[#3a5a78] w-8">{fp.conf}%</span>
                </div>
              ))}
            </div>
            <div className="text-[9px] text-[#3a5a78] font-mono mt-2">Rightmost value = model confidence</div>
          </div>

          <div className="bg-[#081424] border border-[#142840] rounded p-3">
            <SectionHeader title="MODEL COMPARISON" subtitle="MAE (%) by forecast horizon" />
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MODEL_COMPARISON} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                  <XAxis dataKey="horizon" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                  <Bar dataKey="convlstm" fill="#00c4e8" name="ConvLSTM" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="persistence" fill="#4a6080" name="Persistence" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="xgboost" fill="#a78bfa" name="XGBoost" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Risk interpretation */}
      <div className="bg-[#081424] border border-[#142840] rounded p-3">
        <SectionHeader title="SIC RISK INTERPRETATION" subtitle="Sea-ice concentration thresholds" />
        <div className="flex gap-0">
          {[
            { range: '0–30%', label: 'SAFE', color: '#22c55e', desc: 'Open water / minimal ice' },
            { range: '30–50%', label: 'LOW', color: '#84cc16', desc: 'Scattered ice — navigable' },
            { range: '50–65%', label: 'MODERATE', color: '#f59e0b', desc: 'Significant ice — reduced speed' },
            { range: '65–80%', label: 'HIGH', color: '#ef4444', desc: 'Heavy ice — approach vessel limit' },
            { range: '80–100%', label: 'CRITICAL', color: '#dc2626', desc: 'Impassable — exceeds PC-5 limit' },
          ].map((tier) => (
            <div
              key={tier.label}
              className="flex-1 border-l first:border-l-0 border-[#142840] px-3 py-2"
              style={{ borderTopColor: tier.color, borderTopWidth: 2 }}
            >
              <div className="font-mono text-xs font-bold" style={{ color: tier.color }}>
                {tier.label}
              </div>
              <div className="font-mono text-[10px] text-[#5878a0] mb-1">{tier.range}</div>
              <div className="text-[10px] text-[#4a6080]">{tier.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed, area }: { color: string; label: string; dashed?: boolean; area?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {area ? (
        <span className="w-3 h-3 rounded-sm opacity-40" style={{ background: color }} />
      ) : (
        <span
          className="w-4 border-t"
          style={{ borderColor: color, borderStyle: dashed ? 'dashed' : 'solid', borderWidth: dashed ? 1 : 2 }}
        />
      )}
      <span className="text-[#5878a0]">{label}</span>
    </div>
  );
}
