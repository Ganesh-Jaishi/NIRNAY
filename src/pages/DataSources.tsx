import SectionHeader from '../components/common/SectionHeader';
import DataStatusBadge from '../components/common/DataStatusBadge';
import { DEMO_DATA_SOURCES } from '../data/demoData';
import { getServiceStatuses, STATUS_DOT, STATUS_COLOR, STATUS_TEXT } from '../services/dataService';
import { useClock } from '../hooks/useClock';
import type { DataSource } from '../types';

const QUALITY_CONFIG: Record<DataSource['qualityFlag'], { color: string; label: string }> = {
  GOOD:        { color: 'text-emerald-400', label: 'GOOD' },
  ACCEPTABLE:  { color: 'text-lime-400',    label: 'ACCEPTABLE' },
  DEGRADED:    { color: 'text-amber-400',   label: 'DEGRADED' },
  UNAVAILABLE: { color: 'text-red-400',     label: 'UNAVAILABLE' },
};

export default function DataSources() {
  const services = getServiceStatuses();
  const clock = useClock();

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Live service connections */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="SERVICE CONNECTIONS" />
          <span className="font-mono text-[9px] text-[#3a5a78]">{clock.istString}</span>
        </div>
        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-[#0d2040] last:border-0">
              <div>
                <div className="text-xs text-[#dde8f5] font-medium">{s.name}</div>
                <div className="font-mono text-[9px] text-[#3a5a78]">{s.key}</div>
              </div>
              <div className="flex items-center gap-2">
                {s.lastSuccessAt && (
                  <span className="font-mono text-[9px] text-[#3a5a78]">
                    Last: {s.lastSuccessAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} UTC
                  </span>
                )}
                <span className={`font-mono text-[10px] flex items-center gap-1.5 ${STATUS_COLOR[s.status]}`}>
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s.status]}`} />
                  {STATUS_TEXT[s.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[10px] text-[#3a5a78] font-mono border-t border-[#0d2040] pt-2">
          Configure service URLs in <span className="text-[#00c4e8]">.env</span> to connect live data.
          See <span className="text-[#00c4e8]">.env.example</span> for required variables.
        </div>
      </div>

      {/* Data provenance schema */}
      <div className="rounded border border-[#142840] bg-[#050d1a] p-3">
        <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-2">DATA PROVENANCE SCHEMA</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
          {['source', 'timestamp', 'latitude', 'longitude', 'quality_flag', 'data_type', 'spatial_resolution', 'temporal_resolution'].map((field) => (
            <div key={field} className="font-mono text-[#00c4e8] bg-[#081424] border border-[#142840] rounded px-2 py-1">
              {field}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#4a6080] mt-2">
          Every processed dataset retains these fields for reproducibility and auditability.
        </p>
      </div>

      {/* Status legend */}
      <div className="bg-[#081424] border border-[#142840] rounded p-3">
        <SectionHeader title="DATA STATUS LEGEND" />
        <div className="flex flex-wrap gap-3">
          {(['LIVE_OBSERVATION', 'HISTORICAL_DATA', 'MODEL_FORECAST', 'FALLBACK_ESTIMATE'] as const).map((status) => (
            <DataStatusBadge key={status} status={status} />
          ))}
        </div>
      </div>

      {/* Source cards */}
      <div className="space-y-3">
        {DEMO_DATA_SOURCES.map((source) => {
          const qc = QUALITY_CONFIG[source.qualityFlag];
          return (
            <div key={source.id} className="bg-[#081424] border border-[#142840] rounded p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {source.name}
                  </h3>
                  <div className="text-xs text-[#5878a0] mt-0.5">{source.dataset}</div>
                  <div className="text-xs text-[#3a5a78] mt-0.5">{source.provider}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <DataStatusBadge status={source.status} />
                  <span className={`font-mono text-[10px] ${qc.color}`}>QC: {qc.label}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] mb-3">
                {[
                  { label: 'Last Update',   value: new Date(source.lastUpdate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
                  { label: 'Spatial Res.',  value: source.spatialResolution },
                  { label: 'Temporal Res.', value: source.temporalResolution },
                  { label: 'Coverage',      value: source.coverage },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-[#050d1a] border border-[#142840] rounded p-2">
                    <div className="font-mono text-[9px] text-[#3a5a78] tracking-wider mb-0.5">{label}</div>
                    <div className="font-mono text-xs text-[#90aac8]">{value}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-[#4a6080] font-mono">Variables:</span>
                {source.variables.map((v) => (
                  <span key={v} className="font-mono text-[10px] bg-[#0d2040] border border-[#142840] text-[#607890] px-1.5 py-0.5 rounded">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Environment variable reference */}
      <div className="bg-[#081424] border border-[#142840] rounded p-3">
        <SectionHeader title="REQUIRED ENVIRONMENT VARIABLES" subtitle="Configure in .env for live data" />
        <div className="font-mono text-xs space-y-1 bg-[#020810] border border-[#142840] rounded p-3">
          {[
            '# External data services',
            'VITE_VESSEL_API_URL=        # AIS / vessel position feed',
            'VITE_ICEBERG_API_URL=       # Iceberg tracking API',
            'VITE_SEA_ICE_API_URL=       # Sea-ice concentration service',
            'VITE_WEATHER_API_URL=       # Weather / ocean conditions',
            'VITE_BACKEND_API_URL=       # Central backend API',
            '',
            '# Optional: map provider',
            'VITE_GOOGLE_MAPS_API_KEY=   # Leave empty to use built-in Leaflet/CARTO',
          ].map((line, i) => (
            <div key={i} className={line.startsWith('#') ? 'text-[#3a5a78]' : line === '' ? 'h-2' : 'text-[#00e5a0]'}>
              {line || ' '}
            </div>
          ))}
        </div>
        <div className="text-[10px] text-amber-400/80 font-mono mt-2">
          Never expose API keys or credentials in frontend source code.
          All sensitive configuration is managed via environment variables.
        </div>
      </div>
    </div>
  );
}
