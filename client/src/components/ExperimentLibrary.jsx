import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

export default function ExperimentLibrary({ onClose, onLoad, engineRef, socket }) {
  const [experiments, setExperiments] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDesc, setSaveDesc] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/experiments${search ? `?search=${search}` : ''}`)
      .then(r => r.json())
      .then(data => { setExperiments(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search]);

  const handleLoad = async (id) => {
    try {
      const r = await fetch(`${API_BASE}/experiments/${id}`);
      const exp = await r.json();
      onLoad(exp.worldState);
    } catch (e) { console.error('Load failed:', e); }
  };

  const handleSave = async () => {
    if (!saveName.trim() || !engineRef) return;
    const Matter = await import('matter-js');
    const allBodies = Matter.Composite.allBodies(engineRef.world)
      .filter(b => !['ground', 'wall'].includes(b.label));
    const allConstraints = Matter.Composite.allConstraints(engineRef.world)
      .filter(c => c.label !== 'Mouse Constraint');

    const worldState = {
      bodies: allBodies.map(b => ({
        id: b._customId || b.label,
        type: b.circleRadius ? 'circle' : 'rectangle',
        x: b.position.x, y: b.position.y,
        w: b.circleRadius ? undefined : (b.bounds.max.x - b.bounds.min.x),
        h: b.circleRadius ? undefined : (b.bounds.max.y - b.bounds.min.y),
        radius: b.circleRadius || undefined,
        color: b.render.fillStyle,
        options: { isStatic: b.isStatic, mass: b.mass, restitution: b.restitution, friction: b.friction }
      })),
      constraints: allConstraints.map(c => ({
        id: c._customId || c.label,
        bodyAId: c.bodyA?._customId || c.bodyA?.label,
        bodyBId: c.bodyB?._customId || c.bodyB?.label,
        stiffness: c.stiffness,
        length: c.length,
        type: c.stiffness < 0.5 ? 'spring' : 'rigid'
      }))
    };

    try {
      await fetch(`${API_BASE}/experiments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName, description: saveDesc,
          author: 'User', tags: saveTags.split(',').map(t => t.trim()).filter(Boolean),
          worldState
        })
      });
      setSaving(false);
      setSaveName(''); setSaveDesc(''); setSaveTags('');
      // Refresh list
      const r = await fetch(`${API_BASE}/experiments`);
      setExperiments(await r.json());
    } catch (e) { console.error('Save failed:', e); }
  };

  const TAG_COLORS = {
    mechanics: 'bg-indigo-500/20 text-indigo-300',
    oscillation: 'bg-violet-500/20 text-violet-300',
    energy: 'bg-amber-500/20 text-amber-300',
    collision: 'bg-rose-500/20 text-rose-300',
    momentum: 'bg-pink-500/20 text-pink-300',
    springs: 'bg-emerald-500/20 text-emerald-300',
    gravity: 'bg-cyan-500/20 text-cyan-300',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-[700px] max-h-[80vh] glass rounded-2xl shadow-2xl overflow-hidden fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">📚 Experiment Library</h2>
            <p className="text-xs text-slate-400 mt-1">Browse, load, and save physics experiments</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setSaving(!saving)} className="btn-primary text-sm">{saving ? '✕ Cancel' : '💾 Save Current'}</button>
            <button onClick={onClose} className="btn-ghost">✕</button>
          </div>
        </div>

        {/* Save Form */}
        {saving && (
          <div className="p-4 border-b border-white/5 bg-accent-500/5 fade-in">
            <div className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Experiment name..." value={saveName} onChange={e => setSaveName(e.target.value)} />
              <input className="input-field" placeholder="Tags (comma separated)..." value={saveTags} onChange={e => setSaveTags(e.target.value)} />
            </div>
            <textarea className="input-field mt-2" rows={2} placeholder="Description..." value={saveDesc} onChange={e => setSaveDesc(e.target.value)} />
            <button onClick={handleSave} className="btn-primary mt-2 text-sm" disabled={!saveName.trim()}>Save Experiment</button>
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <input className="input-field" placeholder="🔍 Search experiments..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* List */}
        <div className="p-4 overflow-y-auto max-h-[50vh] space-y-3">
          {loading ? (
            <p className="text-center text-slate-500 py-8">Loading experiments...</p>
          ) : experiments.length === 0 ? (
            <p className="text-center text-slate-500 py-8">No experiments found</p>
          ) : (
            experiments.map(exp => (
              <div key={exp.id} className="glass rounded-xl p-4 hover:border-accent-400/30 transition-all cursor-pointer group" onClick={() => handleLoad(exp.id)}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-accent-400 transition-colors">{exp.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{exp.description}</p>
                    <div className="flex gap-1.5 mt-2">
                      {(exp.tags || []).map(tag => (
                        <span key={tag} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${TAG_COLORS[tag] || 'bg-white/10 text-slate-300'}`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[10px] text-slate-500">{exp.author}</span>
                    <button className="block mt-1 text-xs text-accent-400 hover:text-accent-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Load →</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
