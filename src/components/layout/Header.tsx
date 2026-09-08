import type { PageId } from '../../types';
import { useClock } from '../../hooks/useClock';
import { DEMO_ENVIRONMENT } from '../../data/demoData';

const PAGE_TITLES: Record<PageId, string> = {
  'overview': 'Mission Overview & Decision Support',
  'live-map': 'Live Antarctic GIS Navigation Map',
  'sea-ice': 'Sea-Ice Concentration (SIC) AI Forecast',
  'icebergs': 'Iceberg Trajectory & Collision Predictor',
  'route-planner': 'Safe & Fuel-Efficient Route Optimization',
  'route-comparison': 'Route Comparison & Scorecard',
  'analytics': 'Polar Operations Analytics & POLARIS',
  'alerts': 'Collision & Weather Navigation Alerts',
  'data-sources': 'Satellite, Ocean & Meteorological Data Hub',
  'model-center': 'AI/ML Models & Drift Physics Center',
  'settings': 'Vessel Polar Class & System Settings',
};

interface Props {
  activePage: PageId;
}

export default function Header({ activePage }: Props) {
  const clock = useClock();
  const env = DEMO_ENVIRONMENT;

  return (
    <header className="flex items-center justify-between px-5 py-2.5 border-b border-[#142840] bg-[#040b16]/90 backdrop-blur-md flex-shrink-0">
      {/* Title & Core Subtitle */}
      <div className="flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wider text-[#dde8f5]" style={{ fontFamily: "'Rajdhani', sans-serif" }}>
              {PAGE_TITLES[activePage] || 'Antarctic Decision Support'}
            </h1>
            <span className="hidden sm:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              AI/ML v3.2 POLARIS
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#5878a0] mt-0.5">
            NIRNAY: Real-Time Antarctic Maritime Navigation & Ice Decision Support System
          </div>
        </div>
      </div>

      {/* Satellite Feeds & Live Telemetry */}
      <div className="flex items-center gap-4">
        {/* Sensor ingestion badges */}
        <div className="hidden xl:flex items-center gap-2 border-r border-[#142840] pr-4">
          <FeedPill name="SENTINEL-1 SAR" status="LIVE" />
          <FeedPill name="AMSR2 MW" status="LIVE" />
          <FeedPill name="GLORYS CURRENTS" status="LIVE" />
          <FeedPill name="ECMWF ERA5" status="LIVE" />
        </div>

        {/* Environmental conditions */}
        <div className="hidden lg:flex items-center gap-3 border-r border-[#142840] pr-4">
          <Stat label="WIND" value={`${env.windSpeedKmh} km/h`} />
          <Stat label="WAVE" value={`${env.waveHeightM} m`} />
          <Stat label="SST" value={`${env.seaSurfaceTempC}°C`} />
          <Stat label="SIC" value={`${env.sicPercent}%`} />
        </div>

        {/* Clocks */}
        <div className="text-right min-w-[120px]">
          <div className="font-mono text-xs text-[#dde8f5] tabular-nums font-semibold">
            {clock.utcString}
          </div>
          <div className="font-mono text-[10px] text-[#5878a0] tabular-nums">
            {clock.istTime} IST
          </div>
        </div>
      </div>
    </header>
  );
}

function FeedPill({ name, status }: { name: string; status: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#081424] border border-[#142840] text-[9px] font-mono text-slate-300">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      <span>{name}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-[9px] text-[#5878a0] tracking-widest">{label}</div>
      <div className="font-mono text-xs text-cyan-300 font-semibold">{value}</div>
    </div>
  );
}
