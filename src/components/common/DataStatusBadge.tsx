import type { DataStatus } from '../../types';

interface Props {
  status: DataStatus;
  inline?: boolean;
}

const CONFIG: Record<DataStatus, { label: string; color: string; dot: string }> = {
  LIVE_OBSERVATION: { label: 'LIVE OBSERVATION', color: 'text-emerald-400', dot: 'bg-emerald-400 animate-blink' },
  HISTORICAL_DATA: { label: 'HISTORICAL DATA', color: 'text-blue-400', dot: 'bg-blue-400' },
  MODEL_FORECAST: { label: 'MODEL FORECAST', color: 'text-violet-400', dot: 'bg-violet-400' },
  DEMO_SYNTHETIC: { label: 'DEMO / SYNTHETIC', color: 'text-amber-400', dot: 'bg-amber-400' },
  FALLBACK_ESTIMATE: { label: 'FALLBACK ESTIMATE', color: 'text-orange-400', dot: 'bg-orange-400' },
};

export default function DataStatusBadge({ status, inline }: Props) {
  const c = CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${c.color} ${inline ? '' : 'bg-black/30 border border-current/20 px-2 py-0.5 rounded'}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}
