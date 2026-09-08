import SectionHeader from '../components/common/SectionHeader';
import { useClock } from '../hooks/useClock';
import { DEMO_MODELS } from '../data/demoData';
import type { ModelMetric } from '../types';

// Map internal model status to operational display
const STATUS_DISPLAY: Record<ModelMetric['status'], { color: string; bg: string; border: string; label: string; dot: string }> = {
  DEMO_MODEL:   { color: 'text-[#5878a0]',  bg: 'bg-[#0d2040]',      border: 'border-[#142840]',     label: 'NOT CONFIGURED', dot: 'bg-[#3a5a78]' },
  TRAINED:      { color: 'text-emerald-400', bg: 'bg-emerald-950/30', border: 'border-emerald-700/40', label: 'ONLINE',         dot: 'bg-emerald-400' },
  BASELINE:     { color: 'text-blue-400',    bg: 'bg-blue-950/30',    border: 'border-blue-700/40',    label: 'OPERATIONAL',    dot: 'bg-blue-400' },
  EXPERIMENTAL: { color: 'text-violet-400',  bg: 'bg-violet-950/30',  border: 'border-violet-700/40',  label: 'EXPERIMENTAL',   dot: 'bg-violet-400' },
};

export default function ModelCenter() {
  const clock = useClock();
  const operationalModels = DEMO_MODELS.filter((m) => m.status !== 'DEMO_MODEL');
  const pendingModels = DEMO_MODELS.filter((m) => m.status === 'DEMO_MODEL');

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Model status summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Online',        count: DEMO_MODELS.filter((m) => m.status === 'TRAINED').length,      color: 'text-emerald-400', bg: 'bg-emerald-950/20 border-emerald-700/30' },
          { label: 'Operational',   count: DEMO_MODELS.filter((m) => m.status === 'BASELINE').length,     color: 'text-blue-400',    bg: 'bg-blue-950/20 border-blue-700/30' },
          { label: 'Experimental',  count: DEMO_MODELS.filter((m) => m.status === 'EXPERIMENTAL').length, color: 'text-violet-400',  bg: 'bg-violet-950/20 border-violet-700/30' },
          { label: 'Not Configured',count: pendingModels.length,                                          color: 'text-[#4a6080]',   bg: 'bg-[#0d2040] border-[#142840]' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`rounded border p-3 text-center ${bg}`}>
            <div className={`font-mono text-2xl font-bold ${color}`}>{count}</div>
            <div className={`text-[10px] font-mono tracking-wide ${color} opacity-70`}>{label.toUpperCase()}</div>
          </div>
        ))}
      </div>

      {/* Operational model cards */}
      {operationalModels.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-[#5878a0] tracking-wider mb-3">ACTIVE MODELS</div>
          <div className="space-y-3">
            {operationalModels.map((model) => (
              <ModelCard key={model.name} model={model} clock={clock} />
            ))}
          </div>
        </div>
      )}

      {/* Not-configured models */}
      {pendingModels.length > 0 && (
        <div>
          <div className="text-[10px] font-mono text-[#3a5a78] tracking-wider mb-3">MODELS REQUIRING CONFIGURATION</div>
          <div className="space-y-3">
            {pendingModels.map((model) => (
              <ModelCard key={model.name} model={model} clock={clock} />
            ))}
          </div>
        </div>
      )}

      {/* Implementation roadmap — framed as technical planning, not prototype stages */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <SectionHeader title="IMPLEMENTATION PLAN" subtitle="Phased model integration schedule" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { phase: 1, label: 'Phase 1', desc: 'Route engine + Risk map + Dashboard framework', done: true },
            { phase: 2, label: 'Phase 2', desc: 'Real data ingestion + Baseline model integration', done: false },
            { phase: 3, label: 'Phase 3', desc: 'ConvLSTM + LSTM/GRU on live satellite data', done: false },
            { phase: 4, label: 'Phase 4', desc: 'GNN + Transformer architecture', done: false },
            { phase: 5, label: 'Phase 5', desc: 'Multi-objective route optimization (NSGA-II)', done: false },
            { phase: 6, label: 'Phase 6', desc: 'Reinforcement learning module (DQN/PPO)', done: false },
            { phase: 7, label: 'Phase 7', desc: 'Model comparison + Uncertainty + Explainability', done: false },
          ].map((p) => (
            <div
              key={p.phase}
              className={`rounded border p-2.5 text-center ${
                p.done ? 'border-emerald-700/40 bg-emerald-950/20' : 'border-[#142840] bg-[#050d1a]'
              }`}
            >
              <div className={`font-mono text-[9px] tracking-wider mb-1 ${p.done ? 'text-emerald-400' : 'text-[#3a5a78]'}`}>
                {p.done ? '✓ COMPLETE' : p.label.toUpperCase()}
              </div>
              <div className={`text-[10px] ${p.done ? 'text-[#90aac8]' : 'text-[#4a6080]'}`}>{p.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModelCard({ model, clock }: { model: ModelMetric; clock: { istTime: string } }) {
  const cfg = STATUS_DISPLAY[model.status];
  return (
    <div className="bg-[#081424] border border-[#142840] rounded overflow-hidden">
      <div className="flex items-start justify-between px-4 py-3 border-b border-[#142840]">
        <div>
          <h3 className="text-sm font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
            {model.name}
          </h3>
          <div className="text-xs text-[#5878a0] mt-0.5">{model.type}</div>
          <div className="font-mono text-[10px] text-[#3a5a78] mt-0.5">{model.architecture}</div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded border flex items-center gap-1.5 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="font-mono text-[9px] text-[#3a5a78]">v{model.version.replace('-demo', '')}</span>
          {model.status !== 'DEMO_MODEL' && (
            <span className="font-mono text-[9px] text-[#3a5a78]">Last: {clock.istTime} IST</span>
          )}
        </div>
      </div>
      <div className="p-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 space-y-2">
          {[
            { label: 'Architecture', value: model.architecture },
            model.mae !== undefined && { label: 'MAE', value: String(model.mae) },
            model.rmse !== undefined && { label: 'RMSE', value: String(model.rmse) },
            model.accuracy !== undefined && { label: 'Accuracy', value: `${(model.accuracy * 100).toFixed(1)}%` },
          ].filter(Boolean).map((item) => {
            const { label, value } = item as { label: string; value: string };
            return (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-[#4a6080]">{label}</span>
                <span className="font-mono text-[#90aac8]">{value}</span>
              </div>
            );
          })}
        </div>
        <div className="col-span-12 md:col-span-8">
          <p className="text-xs text-[#607890]">{model.description}</p>
        </div>
      </div>
    </div>
  );
}
