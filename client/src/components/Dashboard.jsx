import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#818cf8', '#f472b6', '#34d399', '#fb923c', '#38bdf8'];

export default function Dashboard({ data, selectedBody }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => ({ ...d, idx: i }));
  }, [data]);

  const velocityKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const last = chartData[chartData.length - 1];
    return Object.keys(last).filter(k => k.startsWith('v') && k !== 'idx');
  }, [chartData]);

  const keKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const last = chartData[chartData.length - 1];
    return Object.keys(last).filter(k => k.startsWith('ke'));
  }, [chartData]);

  if (chartData.length < 2) {
    return (
      <div className="flex-1 p-4 flex items-center justify-center">
        <p className="text-sm text-slate-500 italic">Add bodies to see analytics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto space-y-4 fade-in">
      <p className="panel-title">📊 Real-Time Analytics</p>

      {/* Velocity Chart */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs font-medium text-slate-300 mb-2">Velocity (m/s)</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="idx" hide />
            <YAxis width={35} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: '11px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            {velocityKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5} dot={false} name={`Body ${i}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Kinetic Energy Chart */}
      <div className="glass rounded-xl p-3">
        <p className="text-xs font-medium text-slate-300 mb-2">Kinetic Energy (J) — KE = ½mv²</p>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="idx" hide />
            <YAxis width={35} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px', fontSize: '11px' }}
              labelStyle={{ color: '#94a3b8' }}
            />
            {keKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]}
                strokeWidth={1.5} dot={false} name={`Body ${i}`} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick Stats */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {velocityKeys.slice(0, 4).map((key, i) => {
            const latest = chartData[chartData.length - 1];
            return (
              <div key={key} className="glass rounded-lg p-2 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: COLORS[i] }} />
                <p className="text-[10px] text-slate-500">Body {i}</p>
                <p className="text-sm font-semibold" style={{ color: COLORS[i] }}>{latest[key]?.toFixed(1) || '0'}</p>
                <p className="text-[9px] text-slate-500">m/s</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
