import React, { useState } from 'react';

export default function RoomJoin({ onJoin }) {
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState('create');

  const generateRoom = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const room = mode === 'create' ? generateRoom() : roomId.trim().toUpperCase();
    if (!room) return;
    onJoin(name.trim(), room);
  };

  return (
    <div className="h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md px-6 fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mx-auto mb-4 glow-accent">
            <span className="text-3xl">⚗️</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Virtual Lab</h1>
          <p className="text-slate-400 mt-2 text-sm">Collaborative 2D Physics Sandbox</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 space-y-4 glow-accent">
          <div>
            <label className="panel-title">Your Name</label>
            <input type="text" className="input-field" placeholder="Enter your name..." value={name} onChange={e => setName(e.target.value)} autoFocus required />
          </div>

          {/* Mode toggle */}
          <div className="flex gap-2">
            <button type="button" onClick={() => setMode('create')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'create' ? 'bg-accent-500 text-white' : 'bg-white/5 text-slate-400'}`}>
              🆕 Create Room
            </button>
            <button type="button" onClick={() => setMode('join')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'join' ? 'bg-accent-500 text-white' : 'bg-white/5 text-slate-400'}`}>
              🔑 Join Room
            </button>
          </div>

          {mode === 'join' && (
            <div className="fade-in">
              <label className="panel-title">Room Code</label>
              <input type="text" className="input-field font-mono text-center text-lg tracking-widest uppercase" placeholder="ABC123" maxLength={6} value={roomId} onChange={e => setRoomId(e.target.value)} required />
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-lg">
            {mode === 'create' ? '🚀 Create & Enter Lab' : '🔬 Join Lab'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">Drag, drop, and experiment with physics in real-time</p>
      </div>
    </div>
  );
}
