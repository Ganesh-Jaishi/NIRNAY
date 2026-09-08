import type { PageId } from '../../types';

interface NavItem {
  id: PageId;
  label: string;
  sub: string;
  icon: string;
}

const CORE_NAV: NavItem[] = [
  { id: 'bridge',    label: 'BRIDGE COMMAND',    sub: '50s Decision Showcase', icon: '🚢' },
  { id: 'sea-ice',   label: 'SEA-ICE RADAR',      sub: 'Sentinel-1 SAR & Leads', icon: '❄️' },
  { id: 'icebergs',  label: 'ICEBERG DRIFT',      sub: 'CPA & Physics Cones',    icon: '🏔️' },
  { id: 'overview',  label: 'FLEET OVERVIEW',     sub: 'Multi-Vessel Posture',  icon: '⬡' },
];

interface Props {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
}

export default function Sidebar({ activePage, onNavigate }: Props) {
  return (
    <aside className="flex flex-col h-full w-[240px] flex-shrink-0 bg-[#040a17] border-r-2 border-[#162a45]">
      {/* Top Logo */}
      <div className="px-5 py-4 border-b border-[#162a45] bg-[#050e1d]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-cyan-500/30">
            ▲
          </div>
          <div>
            <div className="font-black text-base tracking-wider text-white font-mono leading-none">
              NIRNAY
            </div>
            <div className="text-[10px] text-cyan-400 font-mono tracking-wide mt-1">
              ANTARCTIC MARITIME NAVIGATION
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Navigation (Large, High Contrast Buttons) */}
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
        <div className="text-[10px] font-mono tracking-widest text-[#5878a0] px-2 uppercase font-bold">
          OPERATIONAL SCREENS
        </div>

        {CORE_NAV.map((item) => {
          const isActive = activePage === item.id || (activePage === 'overview' && item.id === 'overview');
          const isBridge = item.id === 'bridge';
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-2 border-cyan-400 text-white shadow-lg shadow-cyan-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-black font-mono tracking-wider flex items-center justify-between">
                  <span>{item.label}</span>
                  {isBridge && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                      ★ HERO
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">{item.sub}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Mission Summary */}
      <div className="p-3 border-t border-[#162a45] bg-[#050e1d] space-y-2">
        <div className="text-[10px] font-mono text-slate-400 font-bold">SATELLITE & SENSORS</div>
        <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px]">
          <div className="p-1.5 rounded bg-[#091629] border border-[#1e385c] text-cyan-300">
            SAR: <span className="text-emerald-400 font-bold">LIVE</span>
          </div>
          <div className="p-1.5 rounded bg-[#091629] border border-[#1e385c] text-cyan-300">
            GLORYS: <span className="text-emerald-400 font-bold">LIVE</span>
          </div>
        </div>
        <div className="text-[9px] font-mono text-center text-[#4a6b8c] pt-1">
          IMO Polar Code PC-3 Compliant
        </div>
      </div>
    </aside>
  );
}
