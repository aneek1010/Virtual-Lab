import React, { useState } from 'react';

export default function Toolbar({ activeTool, onToolChange, isPaused, onTogglePause, showVectors, onToggleVectors, onClear }) {
  const [constraintMode, setConstraintMode] = useState(null);

  const tools = [
    { id: 'select', icon: '🖱️', tip: 'Select & Drag' },
    { id: 'rectangle', icon: '⬜', tip: 'Rectangle' },
    { id: 'circle', icon: '⚪', tip: 'Circle' },
    { id: 'polygon', icon: '⬠', tip: 'Polygon' },
    { id: 'static-rect', icon: '🧱', tip: 'Static Platform' },
  ];

  const handleSpring = () => {
    if (activeTool === 'constraint-start' || activeTool === 'constraint-end') {
      onToolChange('select');
    } else {
      onToolChange('constraint-start');
    }
  };

  const handleRigid = () => {
    if (activeTool === 'rigid-start' || activeTool === 'rigid-end') {
      onToolChange('select');
    } else {
      onToolChange('rigid-start');
    }
  };

  return (
    <div className="w-14 glass flex flex-col items-center py-3 gap-1 shrink-0 z-10">
      {tools.map(t => (
        <button
          key={t.id}
          className={`tool-btn ${activeTool === t.id ? 'active' : ''}`}
          onClick={() => onToolChange(t.id)}
          title={t.tip}
        >
          {t.icon}
        </button>
      ))}

      <div className="w-8 h-px bg-white/10 my-1"></div>

      <button
        className={`tool-btn ${['constraint-start', 'constraint-end'].includes(activeTool) ? 'active' : ''}`}
        onClick={handleSpring}
        title="Spring Constraint"
      >🌊</button>

      <button
        className={`tool-btn ${['rigid-start', 'rigid-end'].includes(activeTool) ? 'active' : ''}`}
        onClick={handleRigid}
        title="Rigid Constraint"
      >🔗</button>

      <button
        className={`tool-btn ${activeTool === 'delete' ? 'active' : ''}`}
        onClick={() => onToolChange(activeTool === 'delete' ? 'select' : 'delete')}
        title="Delete"
      >🗑️</button>

      <div className="w-8 h-px bg-white/10 my-1"></div>

      <button
        className={`tool-btn ${isPaused ? 'active text-amber-400' : ''}`}
        onClick={onTogglePause}
        title={isPaused ? 'Resume' : 'Pause'}
      >{isPaused ? '▶️' : '⏸️'}</button>

      <button
        className={`tool-btn ${showVectors ? 'active text-cyan-400' : ''}`}
        onClick={onToggleVectors}
        title="Toggle Force Vectors"
      >📐</button>

      <div className="flex-1"></div>

      <button className="tool-btn text-red-400 hover:text-red-300" onClick={onClear} title="Clear All">
        💥
      </button>
    </div>
  );
}
