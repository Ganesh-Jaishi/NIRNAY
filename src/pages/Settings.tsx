import { getServiceStatuses, STATUS_DOT, STATUS_TEXT, STATUS_COLOR } from '../services/dataService';
import { useClock } from '../hooks/useClock';
import SectionHeader from '../components/common/SectionHeader';

export default function Settings() {
  const services = getServiceStatuses();
  const clock = useClock();

  const envVars = [
    { key: 'VITE_VESSEL_API_URL',      label: 'AIS / Vessel Feed URL',    desc: 'Endpoint for vessel position data' },
    { key: 'VITE_ICEBERG_API_URL',     label: 'Iceberg Tracking URL',     desc: 'Endpoint for iceberg position and trajectory data' },
    { key: 'VITE_SEA_ICE_API_URL',     label: 'Sea-Ice Service URL',      desc: 'Endpoint for SIC grid data (NIC / NSIDC / Copernicus)' },
    { key: 'VITE_WEATHER_API_URL',     label: 'Weather / Ocean URL',      desc: 'Endpoint for weather and oceanographic conditions' },
    { key: 'VITE_BACKEND_API_URL',     label: 'Backend API URL',          desc: 'Central backend service URL' },
    { key: 'VITE_GOOGLE_MAPS_API_KEY', label: 'Google Maps API Key',      desc: 'Optional — leave empty to use Leaflet / CARTO tiles' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* System clock */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <SectionHeader title="SYSTEM CLOCK" />
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-1">LOCAL TIME (IST · UTC+5:30)</div>
            <div className="font-mono text-xl text-[#dde8f5] tabular-nums">{clock.istTime}</div>
            <div className="font-mono text-xs text-[#5878a0]">{clock.istDate}</div>
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#5878a0] tracking-wider mb-1">COORDINATED UNIVERSAL TIME</div>
            <div className="font-mono text-xl text-[#dde8f5] tabular-nums">{clock.utcTime}</div>
            <div className="font-mono text-xs text-[#5878a0]">UTC</div>
          </div>
        </div>
      </div>

      {/* Service connection status */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <SectionHeader title="SERVICE CONNECTIONS" subtitle="Configured via environment variables" />
        <div className="space-y-2 mt-3">
          {services.map((s) => (
            <div key={s.key} className="flex items-center justify-between py-2 border-b border-[#0d2040] last:border-0">
              <div>
                <div className="text-sm text-[#dde8f5]">{s.name}</div>
                <div className="font-mono text-[10px] text-[#3a5a78]">{s.key}</div>
              </div>
              <span className={`font-mono text-xs flex items-center gap-2 ${STATUS_COLOR[s.status]}`}>
                <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s.status]}`} />
                {STATUS_TEXT[s.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Environment variable reference */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <SectionHeader title="ENVIRONMENT CONFIGURATION" subtitle="Set in .env file — never commit credentials" />
        <div className="space-y-3 mt-3">
          {envVars.map(({ key, label, desc }) => {
            const isSet = Boolean((import.meta.env[key] as string | undefined)?.trim());
            return (
              <div key={key} className="flex items-start justify-between gap-4 py-2 border-b border-[#0d2040] last:border-0">
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#dde8f5]">{label}</div>
                  <div className="font-mono text-[10px] text-[#00c4e8] mt-0.5">{key}</div>
                  <div className="text-[10px] text-[#3a5a78] mt-0.5">{desc}</div>
                </div>
                <span className={`font-mono text-[10px] flex-shrink-0 flex items-center gap-1.5 ${isSet ? 'text-emerald-400' : 'text-[#3a5a78]'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isSet ? 'bg-emerald-400' : 'bg-[#3a5a78]'}`} />
                  {isSet ? 'SET' : 'NOT SET'}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 rounded border border-[#142840] bg-[#050d1a] p-3 font-mono text-[10px] text-[#3a5a78]">
          Copy <span className="text-[#00c4e8]">.env.example</span> to <span className="text-[#00c4e8]">.env</span> and
          fill in service URLs to connect live external data. The <span className="text-[#00c4e8]">.env</span> file
          is excluded from version control.
        </div>
      </div>

      {/* Map provider */}
      <div className="bg-[#081424] border border-[#142840] rounded p-4">
        <SectionHeader title="MAP PROVIDER" />
        <div className="mt-2 flex items-center justify-between py-2">
          <div>
            <div className="text-sm text-[#dde8f5]">Leaflet + CARTO Dark Matter</div>
            <div className="text-[10px] text-[#5878a0] mt-0.5">
              Current map provider — no API key required. Set VITE_GOOGLE_MAPS_API_KEY to switch to Google Maps.
            </div>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-1.5 flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
