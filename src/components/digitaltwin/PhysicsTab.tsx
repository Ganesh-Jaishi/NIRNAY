import type { EnvironmentalConditions, PhysicsReadout } from '../../services/physicsEngine';

interface PhysicsTabProps {
  env: EnvironmentalConditions;
  onEnvChange: (newEnv: EnvironmentalConditions) => void;
  physics: PhysicsReadout;
  onResetEnv: () => void;
}

export default function PhysicsTab({ env, onEnvChange, physics, onResetEnv }: PhysicsTabProps) {
  const handleSlider = (key: keyof EnvironmentalConditions, val: number) => {
    onEnvChange({ ...env, [key]: val });
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header & Reset */}
      <div className="flex items-center justify-between bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4">
        <div>
          <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            PHYSICS DRIVER CONTROLS
          </div>
          <div className="text-sm font-bold text-white mt-0.5">
            Modify Environmental Variables to Simulate Real Forces
          </div>
        </div>
        <button
          onClick={onResetEnv}
          className="px-3 py-1.5 rounded-lg bg-[#0c182b] hover:bg-[#162a45] text-cyan-300 font-mono text-xs font-bold border border-cyan-500/40 cursor-pointer transition-colors"
        >
          ↺ Reset Physics
        </button>
      </div>

      {/* Physics Sliders */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-4 font-mono text-xs">
        {/* 1. Wind Speed */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <span>💨</span>
              <span>Wind Speed (10m Polar Winds)</span>
            </span>
            <span className="text-sm font-black text-cyan-400">{env.windSpeedKnots} kts</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="1"
            value={env.windSpeedKnots}
            onChange={(e) => handleSlider('windSpeedKnots', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-sans">
            <span>10 kts (Calm)</span>
            <span>30 kts (Moderate)</span>
            <span>60 kts (Gale Force)</span>
          </div>
        </div>

        {/* 2. Ocean Current Strength */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <span>🌊</span>
              <span>Ocean Surface Current (Copernicus)</span>
            </span>
            <span className="text-sm font-black text-cyan-400">{env.currentSpeedKnots} kts</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="4.0"
            step="0.1"
            value={env.currentSpeedKnots}
            onChange={(e) => handleSlider('currentSpeedKnots', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>

        {/* 3. Sea-Ice Concentration */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <span>❄️</span>
              <span>Sea-Ice Concentration (SIC %)</span>
            </span>
            <span className="text-sm font-black text-red-400">{env.seaIceConcentrationPct}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={env.seaIceConcentrationPct}
            onChange={(e) => handleSlider('seaIceConcentrationPct', parseFloat(e.target.value))}
            className="w-full accent-red-400 cursor-pointer"
          />
        </div>

        {/* 4. Significant Wave Height */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 font-bold">
              <span>〰️</span>
              <span>Southern Ocean Wave Swell</span>
            </span>
            <span className="text-sm font-black text-amber-400">{env.waveHeightMeters} meters</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="9.0"
            step="0.2"
            value={env.waveHeightMeters}
            onChange={(e) => handleSlider('waveHeightMeters', parseFloat(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
        </div>
      </div>

      {/* Live Physics Resistance & Force Readouts */}
      <div className="bg-[#060d19] border-2 border-[#1e3559] rounded-2xl p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[#1e3559] pb-2">
          <span className="font-bold text-white uppercase">HYDRODYNAMIC & ICE RESISTANCE FORCES</span>
          <span className="text-[10px] text-cyan-400 font-bold">LINDQVIST MODEL</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Ice Crushing Force (R_ice):</span>
            <div className="text-lg font-black text-red-400">{physics.vesselIceResistanceKN} kN</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Hydrodynamic Drag (R_hydro):</span>
            <div className="text-lg font-black text-white">{physics.vesselHydrodynamicDragKN} kN</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Wind Superstructure Drag:</span>
            <div className="text-lg font-black text-white">{physics.vesselWindDragKN} kN</div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c182b] border border-[#1e3559]">
            <span className="text-slate-400">Total Hull Load:</span>
            <div className="text-lg font-black text-cyan-300">{physics.totalResistanceKN} kN</div>
          </div>
        </div>

        {/* Iceberg Dynamic Vector Result */}
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/80 text-red-200">
          <div className="font-bold text-white flex items-center justify-between">
            <span>▲ ICEBERG D-28 DRIFT VECTOR</span>
            <span className="text-xs text-red-400 font-bold">{physics.icebergDriftSpeedKnots} kts @ {physics.icebergDriftHeadingDeg}°</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1">
            Resultant drift velocity calculated from vector coupling of <strong>{env.windSpeedKnots} kts</strong> wind drag + <strong>{env.currentSpeedKnots} kts</strong> ocean current with Coriolis deflection.
          </div>
        </div>
      </div>
    </div>
  );
}
