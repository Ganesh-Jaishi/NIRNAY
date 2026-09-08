import type { RiskLevel } from '../../types';

interface Props {
  level: RiskLevel;
  score?: number;
  compact?: boolean;
}

const CONFIG: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  SAFE: { bg: 'bg-emerald-950/80 border-emerald-700/50', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  LOW: { bg: 'bg-lime-950/80 border-lime-700/50', text: 'text-lime-400', dot: 'bg-lime-400' },
  MODERATE: { bg: 'bg-amber-950/80 border-amber-700/50', text: 'text-amber-400', dot: 'bg-amber-400' },
  HIGH: { bg: 'bg-red-950/80 border-red-700/50', text: 'text-red-400', dot: 'bg-red-400' },
  CRITICAL: { bg: 'bg-red-950 border-red-500/80', text: 'text-red-300', dot: 'bg-red-400 animate-blink' },
};

export default function RiskBadge({ level, score, compact }: Props) {
  const c = CONFIG[level];
  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-xs font-mono font-medium ${c.bg} ${c.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
        {level}
        {score !== undefined && <span className="ml-0.5 opacity-70">({score})</span>}
      </span>
    );
  }
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded border ${c.bg}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={`font-mono text-sm font-semibold tracking-wider ${c.text}`}>{level}</span>
      {score !== undefined && (
        <span className={`font-mono text-xs opacity-80 ${c.text}`}>{score}/100</span>
      )}
    </div>
  );
}
