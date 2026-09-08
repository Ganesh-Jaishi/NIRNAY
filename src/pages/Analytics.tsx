import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from 'recharts';
import SectionHeader from '../components/common/SectionHeader';
import StatCard from '../components/common/StatCard';
import { MODEL_PERFORMANCE_HISTORY, TRAJECTORY_FORECAST_SERIES } from '../data/demoData';

const ROUTE_PERF = [
  { algo: 'A* Balanced', distance: 3980, fuel: 1273.6, risk: 24, time: 38.4 },
  { algo: 'A* Safety',   distance: 4320, fuel: 1382.4, risk: 17, time: 44.2 },
  { algo: 'Dijkstra',    distance: 3840, fuel: 1228.8, risk: 53, time: 32.5 },
  { algo: 'A* Fuel',     distance: 4060, fuel: 1219.2, risk: 27, time: 40.1 },
];

export default function Analytics() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Performance KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="SIC Forecast MAE" value="0.048" unit="" sub="Sea-ice model accuracy" accent />
        <StatCard label="Trajectory Error"  value="8.4"   unit="km" sub="Iceberg position MAE" />
        <StatCard label="Risk Engine Acc."  value="89.1"  unit="%" sub="vs. reference scenarios" />
        <StatCard label="Route Satisfaction" value="96.2" unit="%" sub="Constraint satisfaction rate" accent />
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Sea-ice model performance */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="SEA-ICE MODEL PERFORMANCE" subtitle="MAE and RMSE over evaluation period" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MODEL_PERFORMANCE_HISTORY} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                <Line type="monotone" dataKey="mae"  stroke="#00c4e8" strokeWidth={2} dot={{ r: 3 }} name="MAE" />
                <Line type="monotone" dataKey="rmse" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} name="RMSE" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Routing algorithm comparison */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="ROUTING ALGORITHM COMPARISON" subtitle="Risk score by algorithm (lower = safer)" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ROUTE_PERF} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="algo" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                <Bar dataKey="risk" name="Risk Score" fill="#00c4e8" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Iceberg trajectory error */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="ICEBERG TRAJECTORY ERROR" subtitle="Position error (km) vs. forecast horizon" />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TRAJECTORY_FORECAST_SERIES} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0d2040" />
                <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} />
                <YAxis tick={{ fontSize: 9, fill: '#5878a0', fontFamily: 'JetBrains Mono' }} unit="km" />
                <Tooltip contentStyle={{ background: '#081424', border: '1px solid #142840', fontSize: 10 }} />
                <Bar dataKey="ml"      name="LSTM"              fill="#00c4e8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="physics" name="Physics Baseline"  fill="#4a6080" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Evaluation methodology */}
        <div className="col-span-12 lg:col-span-6 bg-[#081424] border border-[#142840] rounded p-3">
          <SectionHeader title="EVALUATION METHODOLOGY" subtitle="Data splits and validation approach" />
          <div className="space-y-3">
            <div className="rounded border border-[#142840] bg-[#050d1a] p-3">
              <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-2">CHRONOLOGICAL TRAIN / VAL / TEST SPLIT</div>
              <div className="flex gap-1 h-6 rounded overflow-hidden">
                <div className="flex-[7] bg-[#00c4e8]/30 border border-[#00c4e8]/40 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-[#00c4e8]">TRAIN 70%</span>
                </div>
                <div className="flex-[2] bg-[#a78bfa]/30 border border-[#a78bfa]/40 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-[#a78bfa]">VAL 15%</span>
                </div>
                <div className="flex-[2] bg-[#22c55e]/30 border border-[#22c55e]/40 flex items-center justify-center">
                  <span className="text-[9px] font-mono text-[#22c55e]">TEST 15%</span>
                </div>
              </div>
              <div className="text-[9px] text-[#3a5a78] font-mono mt-1">
                Chronological split — no temporal data leakage.
              </div>
            </div>

            <div className="rounded border border-[#142840] bg-[#050d1a] p-3">
              <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-2">UNCERTAINTY ESTIMATION</div>
              <div className="space-y-1 text-xs text-[#607890]">
                <div className="flex items-center gap-2"><span className="text-[#00c4e8]">▸</span> Monte Carlo dropout (SIC model)</div>
                <div className="flex items-center gap-2"><span className="text-[#00c4e8]">▸</span> Ensemble variance (iceberg trajectory)</div>
                <div className="flex items-center gap-2"><span className="text-[#00c4e8]">▸</span> Bootstrap uncertainty (fuel estimation)</div>
                <div className="flex items-center gap-2"><span className="text-[#00c4e8]">▸</span> Prediction intervals (risk scores)</div>
              </div>
            </div>

            <div className="rounded border border-[#142840] bg-[#050d1a] p-2.5">
              <div className="font-mono text-[9px] text-[#3a5a78] tracking-wider">PERFORMANCE NOTE</div>
              <div className="text-[11px] text-[#4a6080] mt-0.5">
                Metrics shown reflect computed model evaluation on the current dataset.
                Performance will update when external data services are connected.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
