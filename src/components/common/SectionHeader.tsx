interface Props {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export default function SectionHeader({ title, subtitle, children }: Props) {
  return (
    <div className="flex items-start justify-between mb-4 pb-3 border-b border-[#142840]">
      <div>
        <h2 className="text-xl font-bold text-[#dde8f5] tracking-wide">{title}</h2>
        {subtitle && <p className="text-sm text-[#5878a0] mt-0.5">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
