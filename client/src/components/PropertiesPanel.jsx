import React from 'react';
import Matter from 'matter-js';

// Scale: 100 pixels = 1 meter
const PX_PER_METER = 100;

// Format large numbers nicely
function fmt(val, decimals = 1) {
  if (Math.abs(val) >= 1e6) return (val / 1e6).toFixed(1) + 'M';
  if (Math.abs(val) >= 1e3) return (val / 1e3).toFixed(1) + 'k';
  return val.toFixed(decimals);
}

export default function PropertiesPanel({ selectedBody, engineRef }) {
  if (!selectedBody || selectedBody.isStatic && ['ground', 'wall'].includes(selectedBody.label)) {
    return (
      <div className="p-4 border-b border-white/5">
        <p className="panel-title">Properties</p>
        <p className="text-sm text-slate-500 italic">Select a body to view properties</p>
      </div>
    );
  }

  const b = selectedBody;
  // Matter.js velocity is px/tick. At 60fps → px/s, then ÷100 for m/s
  const rawSpeed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
  const speedPxPerS = rawSpeed * 60;
  const speedMPerS = speedPxPerS / PX_PER_METER;
  // KE = ½mv² (mass in kg, velocity in m/s → Joules)
  const ke = 0.5 * b.mass * speedMPerS * speedMPerS;
  // Normalize angle to 0–360°
  const angleDeg = ((b.angle * 180 / Math.PI) % 360 + 360) % 360;

  const handleMassChange = (e) => {
    Matter.Body.setMass(b, parseFloat(e.target.value) || 1);
  };

  const handleFrictionChange = (e) => {
    b.friction = parseFloat(e.target.value);
  };

  const handleBounceChange = (e) => {
    b.restitution = parseFloat(e.target.value);
  };

  const handleStaticToggle = () => {
    Matter.Body.setStatic(b, !b.isStatic);
  };

  return (
    <div className="p-4 border-b border-white/5 fade-in">
      <div className="flex justify-between items-center mb-3">
        <p className="panel-title mb-0">Properties</p>
        <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded">Scale: 100px = 1m</span>
      </div>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">ID</span>
          <code className="text-xs text-accent-400">{b._customId || b.label}</code>
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Mass <span className="text-slate-600 text-[10px]">(kg)</span></span>
            <span className="text-white">{b.mass.toFixed(1)} kg</span>
          </div>
          <input type="range" min="0.5" max="50" step="0.5" defaultValue={b.mass}
            onChange={handleMassChange} className="w-full accent-indigo-500 h-1" />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Friction <span className="text-slate-600 text-[10px]">(μ, 0–1)</span></span>
            <span className="text-white">{(b.friction || 0).toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" defaultValue={b.friction}
            onChange={handleFrictionChange} className="w-full accent-indigo-500 h-1" />
        </div>

        <div>
          <div className="flex justify-between text-slate-400 mb-1">
            <span>Bounce <span className="text-slate-600 text-[10px]">(e, 0–1)</span></span>
            <span className="text-white">{(b.restitution || 0).toFixed(2)}</span>
          </div>
          <input type="range" min="0" max="1" step="0.05" defaultValue={b.restitution}
            onChange={handleBounceChange} className="w-full accent-indigo-500 h-1" />
        </div>

        <button onClick={handleStaticToggle}
          className={`w-full py-1.5 rounded-lg text-xs font-medium transition-colors ${b.isStatic ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-white/5 text-slate-400 border border-white/10'}`}>
          {b.isStatic ? '📌 Static' : '🏃 Dynamic'}
        </button>

        <div className="pt-2 border-t border-white/5 space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Position</span><span>({(b.position.x / PX_PER_METER).toFixed(2)}, {(b.position.y / PX_PER_METER).toFixed(2)}) m</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Speed</span><span className="text-cyan-400">{fmt(speedMPerS, 2)} m/s</span></div>
          <div className="flex justify-between"><span className="text-slate-500">KE</span><span className="text-amber-400">{fmt(ke)} J</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Angle</span><span>{angleDeg.toFixed(1)}°</span></div>
        </div>
      </div>
    </div>
  );
}
