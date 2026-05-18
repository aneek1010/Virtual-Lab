import React, { useState, useCallback, useEffect } from 'react';import RoomJoin from './components/RoomJoin';
import Toolbar from './components/Toolbar';
import PhysicsCanvas from './components/PhysicsCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import Dashboard from './components/Dashboard';
import ExperimentLibrary from './components/ExperimentLibrary';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [userName, setUserName] = useState('');
  const [users, setUsers] = useState({});
  const [activeTool, setActiveTool] = useState('select');
  const [selectedBody, setSelectedBody] = useState(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showDashboard, setShowDashboard] = useState(true);
  const [physicsData, setPhysicsData] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showVectors, setShowVectors] = useState(false);
  const [engineRef, setEngineRef] = useState(null);
  const [bodyCount, setBodyCount] = useState(0);

  const [dashboardHeight, setDashboardHeight] = useState(300); // Default height in pixels
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      setDashboardHeight((prev) => {
        const newHeight = prev + e.movementY;
        return Math.max(100, Math.min(newHeight, window.innerHeight - 200));
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  // -------------------------
  const joinRoom = useCallback((name, room) => {
    const s = io(SOCKET_URL);
    s.on('connect', () => {
      s.emit('join-room', { roomId: room, name });
      setSocket(s);
      setRoomId(room);
      setUserName(name);
    });
    s.on('users-update', (u) => setUsers(u));
    s.on('disconnect', () => { setSocket(null); setRoomId(null); });
  }, []);

  const handleLoadExperiment = useCallback((worldState) => {
    if (socket) socket.emit('load-experiment', worldState);
    setShowLibrary(false);
  }, [socket]);

  const handleClearWorld = useCallback(() => {
    if (socket) socket.emit('clear-world');
  }, [socket]);

  if (!roomId) return <RoomJoin onJoin={joinRoom} />;

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Top Bar */}
      <header className="h-14 glass flex items-center justify-between px-4 z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-white font-bold text-sm">VL</div>
            <h1 className="text-lg font-semibold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Virtual Lab</h1>
          </div>
          <div className="h-6 w-px bg-white/10 mx-2"></div>
          <span className="text-xs text-slate-400">Room:</span>
          <code className="text-xs bg-white/5 px-2 py-1 rounded text-accent-400 font-mono">{roomId}</code>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {Object.entries(users).map(([id, u]) => (
              <div key={id} className="w-7 h-7 rounded-full border-2 border-surface-950 flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: u.color }}>{u.name?.[0]?.toUpperCase()}</div>
            ))}
          </div>
          <button onClick={() => setShowLibrary(!showLibrary)} className="btn-ghost text-sm">📚 Library</button>
          <button onClick={() => setShowDashboard(!showDashboard)} className="btn-ghost text-sm">📊 Analytics</button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Toolbar */}
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused(!isPaused)}
          showVectors={showVectors}
          onToggleVectors={() => setShowVectors(!showVectors)}
          onClear={handleClearWorld}
        />

        {/* Canvas */}
        <div className="flex-1 relative">
          <PhysicsCanvas
            socket={socket}
            activeTool={activeTool}
            selectedBody={selectedBody}
            onSelectBody={setSelectedBody}
            isPaused={isPaused}
            showVectors={showVectors}
            onPhysicsData={setPhysicsData}
            onEngineReady={setEngineRef}
            onBodyCountChange={setBodyCount}
            onLoadExperiment={handleLoadExperiment}
          />
          {/* Status Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-8 glass flex items-center px-4 text-xs text-slate-400 gap-4 z-10">
            <span className={socket?.connected ? 'text-emerald-400' : 'text-red-400'}>● {socket?.connected ? 'Connected' : 'Disconnected'}</span>
            <span>Bodies: {bodyCount}</span>
            <span>Tool: {activeTool}</span>
            <span>{isPaused ? '⏸ Paused' : '▶ Running'}</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 glass flex flex-col overflow-hidden shrink-0">
          
          {showDashboard && (
            <div style={{ height: `${dashboardHeight}px` }} className="flex flex-col shrink-0 overflow-hidden">
              <Dashboard data={physicsData} selectedBody={selectedBody} />
            </div>
          )}

          {showDashboard && (
            <div 
              onMouseDown={handleMouseDown}
              className={`h-1.5 w-full cursor-ns-resize shrink-0 transition-colors ${
                isDragging ? 'bg-indigo-500' : 'bg-white/10 hover:bg-indigo-400/50'
              }`}
              title="Drag to resize"
            />
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <PropertiesPanel 
              selectedBody={selectedBody} 
              engineRef={engineRef} 
              socket={socket} 
            />
          </div>
        </div>
      </div>

      {/* Experiment Library Modal */}
      {showLibrary && (
        <ExperimentLibrary
          onClose={() => setShowLibrary(false)}
          onLoad={handleLoadExperiment}
          engineRef={engineRef}
          socket={socket}
        />
      )}
    </div>
  );
}
