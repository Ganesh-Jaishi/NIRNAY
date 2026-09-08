interface Props {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  accent?: boolean;
  warning?: boolean;
  danger?: boolean;
}

export default function StatCard({ label, value, unit, sub, accent, warning, danger }: Props) {
  const valueColor = danger
    ? 'text-red-400'
    : warning
      ? 'text-amber-400'
      : accent
        ? 'text-[#00c4e8]'
        : 'text-[#dde8f5]';

  return (
    <div className="bg-[#081424] border border-[#142840] rounded p-3 flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-widest text-[#5878a0] uppercase">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-semibold ${valueColor}`}>{value}</span>
        {unit && <span className="font-mono text-xs text-[#5878a0]">{unit}</span>}
      </div>
      {sub && <span className="text-xs text-[#5878a0]">{sub}</span>}
    </div>
  );
}
