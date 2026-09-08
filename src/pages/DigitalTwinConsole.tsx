import { useState, useMemo } from 'react';
import DigitalTwinMap from '../components/digitaltwin/DigitalTwinMap';
import Marine3DView from '../components/digitaltwin/Marine3DView';
import DigitalTwinTab from '../components/digitaltwin/DigitalTwinTab';
import LogisticsTab from '../components/digitaltwin/LogisticsTab';
import PhysicsTab from '../components/digitaltwin/PhysicsTab';
import WhatIfTab from '../components/digitaltwin/WhatIfTab';
import {
  DEFAULT_ENVIRONMENT,
  calculateVesselPhysics,
  type EnvironmentalConditions,
} from '../services/physicsEngine';
import { computeRouteLogistics } from '../services/logisticsEngine';

export type ActiveTab = 'DIGITAL_TWIN' | 'LOGISTICS' | 'PHYSICS' | 'WHAT_IF';
export type ViewLayout = 'SPLIT' | '3D_ONLY' | '2D_ONLY';

export default function DigitalTwinConsole() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('DIGITAL_TWIN');
  const [viewLayout, setViewLayout] = useState<ViewLayout>('SPLIT');
  const [env, setEnv] = useState<EnvironmentalConditions>(DEFAULT_ENVIRONMENT);
  const [activeRouteType, setActiveRouteType] = useState<'ORIGINAL_BLOCKED' | 'AI_OPTIMIZED' | 'WHAT_IF'>('AI_OPTIMIZED');
  const [vesselProgressPct, setVesselProgressPct] = useState<number>(35);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Map layer controls
  const [showCurrentVectors, setShowCurrentVectors] = useState(true);
  const [showWindVectors, setShowWindVectors] = useState(true);
  const [showIceConcentration, setShowIceConcentration] = useState(true);

  // Real-time Physics & Logistics Computation
  const physics = useMemo(() => {
    return calculateVesselPhysics(env, 14.5, 'PC-3');
  }, [env]);

  const logistics = useMemo(() => {
    return computeRouteLogistics(env, physics, activeRouteType, vesselProgressPct);
  }, [env, physics, activeRouteType, vesselProgressPct]);

  const handleResetEnv = () => {
    setEnv(DEFAULT_ENVIRONMENT);
    setActiveRouteType('AI_OPTIMIZED');
    setVesselProgressPct(35);
    setIsPlaying(false);
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#060d19] text-white overflow-hidden select-none font-sans">
      {/* ── TOP MISSION HEADER ── */}
      <header className="px-6 py-3 bg-[#0c182b] border-b-2 border-[#1e3559] flex items-center justify-between flex-shrink-0 flex-wrap gap-4 shadow-xl">
        {/* Left: Identity & Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-lg">
            🌐
          </div>
          <div>
            <div className="text-xl font-black font-heading tracking-wide text-white leading-tight">
              NIRNAY
            </div>
            <div className="text-xs font-mono font-semibold text-cyan-400">
              REAL-TIME ANTARCTIC MARITIME NAVIGATION
            </div>
          </div>
        </div>

        {/* Center: View Layout Switcher (Split View vs 3D vs 2D) */}
        <div className="flex items-center bg-[#060d19] p-1.5 rounded-xl border-2 border-[#1e3559] gap-1.5 font-mono text-xs">
          <button
            onClick={() => setViewLayout('SPLIT')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === 'SPLIT'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>📱</span>
            <span>SPLIT TWIN (3D + 2D)</span>
          </button>

          <button
            onClick={() => setViewLayout('3D_ONLY')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === '3D_ONLY'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>🌊</span>
            <span>3D OCEAN VIEW</span>
          </button>

          <button
            onClick={() => setViewLayout('2D_ONLY')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === '2D_ONLY'
                ? 'bg-cyan-500 text-black shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
              }`}
          >
            <span>🗺️</span>
            <span>2D GIS MAP</span>
          </button>
        </div>

        {/* Right: Quick Environmental Readout & Reset */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="bg-[#060d19] px-3 py-1.5 rounded-xl border border-[#1e3559]">
            <span className="text-slate-400">WIND: </span>
            <span className="text-cyan-300 font-bold">{env.windSpeedKnots} kts</span>
          </div>
          <div className="bg-[#060d19] px-3 py-1.5 rounded-xl border border-[#1e3559]">
            <span className="text-slate-400">SIC: </span>
            <span className="text-red-400 font-bold">{env.seaIceConcentrationPct}%</span>
          </div>
          <button
            onClick={handleResetEnv}
            className="px-3 py-1.5 bg-[#060d19] hover:bg-[#12233f] text-slate-300 hover:text-white border border-[#1e3559] rounded-xl font-mono text-xs font-bold cursor-pointer transition-colors"
          >
            ↺ Reset
          </button>
        </div>
      </header>

      {/* ── 5-LAYER INTERACTIVE ARCHITECTURE RIBBON ── */}
      <div className="bg-[#040b17] border-b-2 border-[#162a45] px-6 py-2 flex items-center justify-between font-mono text-xs overflow-x-auto flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase font-bold pr-1 border-r border-[#1e3559]">
            DIGITAL TWIN STACK:
          </span>

          {/* Layer 1 */}
          <button
            onClick={() => { setViewLayout('3D_ONLY'); }}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${viewLayout === '3D_ONLY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                : 'bg-[#0c182b] border border-[#1e3559] text-slate-300 hover:text-white'
              }`}
          >
            <span>1. 🌊 REALISTIC 3D WORLD</span>
          </button>
          <span className="text-slate-600">➔</span>

          {/* Layer 2 */}
          <button
            onClick={() => setActiveTab('PHYSICS')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'PHYSICS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400 font-bold'
                : 'bg-[#0c182b] border border-[#1e3559] text-slate-300 hover:text-white'
              }`}
          >
            <span>2. ⚙️ PHYSICS (WIND & CURRENTS)</span>
          </button>
          <span className="text-slate-600">➔</span>

          {/* Layer 3 */}
          <button
            onClick={() => setActiveTab('DIGITAL_TWIN')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'DIGITAL_TWIN'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold'
                : 'bg-[#0c182b] border border-[#1e3559] text-slate-300 hover:text-white'
              }`}
          >
            <span>3. 🚢 VESSEL & REROUTING</span>
          </button>
          <span className="text-slate-600">➔</span>

          {/* Layer 4 */}
          <button
            onClick={() => setActiveTab('LOGISTICS')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'LOGISTICS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400 font-bold'
                : 'bg-[#0c182b] border border-[#1e3559] text-slate-300 hover:text-white'
              }`}
          >
            <span>4. 📊 LOGISTICS (FUEL & ETA)</span>
          </button>
          <span className="text-slate-600">➔</span>

          {/* Layer 5 */}
          <button
            onClick={() => setActiveTab('WHAT_IF')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${activeTab === 'WHAT_IF'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400 font-bold'
                : 'bg-[#0c182b] border border-[#1e3559] text-slate-300 hover:text-white'
              }`}
          >
            <span>5. 🔮 WHAT-IF SIMULATOR</span>
          </button>
        </div>

        <div className="text-[11px] text-emerald-400 font-bold hidden xl:block">
          ● REAL-TIME CAUSE & EFFECT ACTIVE
        </div>
      </div>

      {/* ── MAIN WORKSPACE: ENVIRONMENT VIEW (LEFT ~65%) & 4-TAB CONTROL PANEL (RIGHT ~35%) ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── LEFT: DIGITAL TWIN FIRST-PERSON 3D + 2D GIS SPLIT SCREEN ── */}
        <div className="flex-1 flex flex-col bg-[#040914] border-r-2 border-[#1e3559] overflow-hidden">
          {/* Top Half: 3D First-Person Bridge "Street View" */}
          {(viewLayout === 'SPLIT' || viewLayout === '3D_ONLY') && (
            <div className={`relative ${viewLayout === 'SPLIT' ? 'h-1/2 border-b-2 border-[#1e3559]' : 'h-full'}`}>
              <div className="absolute top-2 right-4 z-20 bg-black/60 border border-cyan-400 px-2.5 py-0.5 rounded text-[10px] font-mono text-cyan-300 pointer-events-none">
                3D FIRST-PERSON BRIDGE CAM · AR ROUTE
              </div>
              <Marine3DView
                env={env}
                physics={physics}
                activeRouteType={activeRouteType}
                vesselProgressPct={vesselProgressPct}
              />
            </div>
          )}

          {/* Bottom Half: 2D Tactical GIS Map */}
          {(viewLayout === 'SPLIT' || viewLayout === '2D_ONLY') && (
            <div className={`relative ${viewLayout === 'SPLIT' ? 'h-1/2' : 'h-full'}`}>
              <DigitalTwinMap
                env={env}
                physics={physics}
                activeRouteType={activeRouteType}
                vesselProgressPct={vesselProgressPct}
                onVesselProgressChange={setVesselProgressPct}
                isPlaying={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                showCurrentVectors={showCurrentVectors}
                showWindVectors={showWindVectors}
                showIceConcentration={showIceConcentration}
              />
            </div>
          )}
        </div>

        {/* ── RIGHT: 4-TAB CONTROL PANEL (TWIN | LOGISTICS | PHYSICS | WHAT-IF) ── */}
        <div className="w-[520px] bg-[#0c182b] flex flex-col justify-between overflow-hidden border-l-2 border-[#1e3559]">
          {/* Top 4 Tabs Navigation */}
          <div className="p-3 border-b-2 border-[#1e3559] bg-[#060d19] grid grid-cols-4 gap-1.5 font-mono text-xs">
            <button
              onClick={() => setActiveTab('DIGITAL_TWIN')}
              className={`py-2 px-1 rounded-xl font-black text-center transition-all cursor-pointer ${activeTab === 'DIGITAL_TWIN'
                  ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              🗺️ TWIN
            </button>

            <button
              onClick={() => setActiveTab('LOGISTICS')}
              className={`py-2 px-1 rounded-xl font-black text-center transition-all cursor-pointer ${activeTab === 'LOGISTICS'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              📊 LOGISTICS
            </button>

            <button
              onClick={() => setActiveTab('PHYSICS')}
              className={`py-2 px-1 rounded-xl font-black text-center transition-all cursor-pointer ${activeTab === 'PHYSICS'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              ⚙️ PHYSICS
            </button>

            <button
              onClick={() => setActiveTab('WHAT_IF')}
              className={`py-2 px-1 rounded-xl font-black text-center transition-all cursor-pointer ${activeTab === 'WHAT_IF'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              🔮 WHAT-IF
            </button>
          </div>

          {/* Active Tab Scrollable Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {activeTab === 'DIGITAL_TWIN' && (
              <DigitalTwinTab
                env={env}
                physics={physics}
                logistics={logistics}
                activeRouteType={activeRouteType}
                onSelectRoute={setActiveRouteType}
                showCurrentVectors={showCurrentVectors}
                setShowCurrentVectors={setShowCurrentVectors}
                showWindVectors={showWindVectors}
                setShowWindVectors={setShowWindVectors}
                showIceConcentration={showIceConcentration}
                setShowIceConcentration={setShowIceConcentration}
              />
            )}

            {activeTab === 'LOGISTICS' && (
              <LogisticsTab
                logistics={logistics}
                activeRouteType={activeRouteType}
              />
            )}

            {activeTab === 'PHYSICS' && (
              <PhysicsTab
                env={env}
                onEnvChange={setEnv}
                physics={physics}
                onResetEnv={handleResetEnv}
              />
            )}

            {activeTab === 'WHAT_IF' && (
              <WhatIfTab
                env={env}
                onEnvChange={setEnv}
                physics={physics}
                logistics={logistics}
                onSelectRoute={setActiveRouteType}
                activeRouteType={activeRouteType}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
