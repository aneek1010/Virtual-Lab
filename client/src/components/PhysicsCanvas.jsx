import React, { useRef, useEffect, useCallback, useState } from 'react';
import Matter from 'matter-js';

const { Engine, Render, Runner, Bodies, Body, World, Composite, Constraint, Mouse, MouseConstraint, Events } = Matter;

const BODY_COLORS = ['#818cf8', '#f472b6', '#34d399', '#fb923c', '#38bdf8', '#a78bfa', '#f87171', '#fbbf24'];
const STATIC_COLOR = '#475569';

function generateId() { return 'b-' + Math.random().toString(36).substr(2, 9); }

export default function PhysicsCanvas({ socket, activeTool, selectedBody, onSelectBody, isPaused, showVectors, onPhysicsData, onEngineReady, onBodyCountChange, onLoadExperiment }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const renderRef = useRef(null);
  const runnerRef = useRef(null);
  const mouseConstraintRef = useRef(null);
  const constraintStartRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });
  const bodyMapRef = useRef(new Map());
  const constraintMapRef = useRef(new Map());
  const vectorCanvasRef = useRef(null);
  const colorIndexRef = useRef(0);
  const activeToolRef = useRef(activeTool);

  // Keep activeToolRef in sync
  useEffect(() => {
    activeToolRef.current = activeTool;
  }, [activeTool]);

  const getNextColor = () => {
    const c = BODY_COLORS[colorIndexRef.current % BODY_COLORS.length];
    colorIndexRef.current++;
    return c;
  };

  // ── Initialize Matter.js ──
  useEffect(() => {
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;
    setCanvasSize({ w, h });

    const engine = Engine.create({ gravity: { x: 0, y: 1 } });
    engineRef.current = engine;
    onEngineReady?.(engine);

    // Let Matter.js create its own canvas for clean event handling
    const render = Render.create({
      element: container,
      engine,
      options: {
        width: w, height: h,
        background: '#0f0a1a',
        wireframes: false,
        showAngleIndicator: false,
        pixelRatio: 1
      }
    });
    renderRef.current = render;
    // Store reference to the Matter-created canvas
    canvasRef.current = render.canvas;
    render.canvas.style.position = 'relative';
    render.canvas.style.zIndex = '1';

    // Ground, ceiling, and thick walls to prevent escape
    const wallThickness = 200;
    const groundOffset = 40; // raise ground above the status bar
    const ground = Bodies.rectangle(w / 2, h + wallThickness / 2 - groundOffset, w + wallThickness * 2, wallThickness, { isStatic: true, render: { fillStyle: '#1e293b' }, label: 'ground' });
    const ceiling = Bodies.rectangle(w / 2, -wallThickness / 2, w + wallThickness * 2, wallThickness, { isStatic: true, render: { fillStyle: '#1e293b' }, label: 'wall' });
    const wallL = Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h + wallThickness * 2, { isStatic: true, render: { fillStyle: '#1e293b' }, label: 'wall' });
    const wallR = Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h + wallThickness * 2, { isStatic: true, render: { fillStyle: '#1e293b' }, label: 'wall' });
    World.add(engine.world, [ground, ceiling, wallL, wallR]);

    // Mouse constraint for dragging
    const mouse = Mouse.create(render.canvas);
    const mc = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: true, strokeStyle: '#6366f1', lineWidth: 1 } }
    });
    mouseConstraintRef.current = mc;
    World.add(engine.world, mc);
    render.mouse = mouse;

    // Track selected body on startdrag
    Events.on(mc, 'startdrag', (e) => {
      if (e.body) onSelectBody?.(e.body);
    });

    // Handle click-to-add when not in select mode
    Events.on(mc, 'mousedown', (e) => {
      const tool = activeToolRef.current;
      if (tool === 'select') return; // Let drag work naturally

      const { x, y } = mouse.position;

      if (tool === 'constraint-start' || tool === 'rigid-start') {
        const bodies = Composite.allBodies(engine.world).filter(b => !['ground', 'wall'].includes(b.label));
        const clicked = bodies.find(b => Matter.Bounds.contains(b.bounds, { x, y }) && Matter.Vertices.contains(b.vertices, { x, y }));
        
        if (clicked && clicked._customId) {
          // If we haven't clicked a first body yet, save this one
          if (!constraintStartRef.current) {
            constraintStartRef.current = clicked._customId;
          } 
          // If we ALREADY clicked a first body, connect them!
          else if (clicked._customId !== constraintStartRef.current) {
            const isRigid = tool === 'rigid-start';
            const cData = { 
              bodyAId: constraintStartRef.current, 
              bodyBId: clicked._customId, 
              stiffness: isRigid ? 1 : 0.05, 
              type: isRigid ? 'rigid' : 'spring' 
            };
            
            addConstraintFromData(engine, { ...cData, id: 'c-' + Math.random().toString(36).substr(2, 6) });
            socket?.emit('add-constraint', cData);
            
            // Reset the ref so you can start a brand new connection
            constraintStartRef.current = null;
          }
        }
        return;
      }

      if (tool === 'delete') {
        const bodies = Composite.allBodies(engine.world).filter(b => !['ground', 'wall'].includes(b.label));
        const clicked = bodies.find(b => Matter.Bounds.contains(b.bounds, { x, y }) && Matter.Vertices.contains(b.vertices, { x, y }));
        if (clicked && clicked._customId) {
          World.remove(engine.world, clicked);
          bodyMapRef.current.delete(clicked._customId);
          socket?.emit('remove-body', clicked._customId);
        }
        return;
      }

      // Add body tools
      const id = generateId();
      const color = getNextColor();
      let bodyData;

      switch (tool) {
        case 'rectangle':
          bodyData = { id, type: 'rectangle', x, y, w: 50, h: 50, color, options: { restitution: 0.5, friction: 0.3 } };
          break;
        case 'circle':
          bodyData = { id, type: 'circle', x, y, radius: 25, color, options: { restitution: 0.6, friction: 0.2 } };
          break;
        case 'polygon':
          bodyData = { id, type: 'polygon', x, y, sides: 5, radius: 30, color, options: { restitution: 0.4 } };
          break;
        case 'static-rect':
          bodyData = { id, type: 'rectangle', x, y, w: 120, h: 20, color: STATIC_COLOR, options: { isStatic: true } };
          break;
        default: return;
      }

      addBodyFromData(engine, bodyData);
      socket?.emit('add-body', bodyData);
    });

    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Physics data collection — use stable body IDs for consistent chart lines
    const trackedBodiesRef = [];
    const dataInterval = setInterval(() => {
      const allBodies = Composite.allBodies(engine.world).filter(b => !b.isStatic && !['ground', 'wall'].includes(b.label));
      onBodyCountChange?.(allBodies.length);

      // Track up to 5 bodies by their stable ID
      allBodies.forEach(b => {
        if (!trackedBodiesRef.includes(b._customId) && trackedBodiesRef.length < 5) {
          trackedBodiesRef.push(b._customId);
        }
      });

      const dataPoint = { time: Date.now() };
      trackedBodiesRef.forEach((bodyId, i) => {
        const b = allBodies.find(body => body._customId === bodyId);
        if (b) {
          const rawSpeed = Math.sqrt(b.velocity.x ** 2 + b.velocity.y ** 2);
          const speedMPerS = (rawSpeed * 60) / 100; // px/tick → px/s → m/s (100px = 1m)
          const ke = 0.5 * b.mass * speedMPerS * speedMPerS;
          dataPoint[`v${i}`] = parseFloat(speedMPerS.toFixed(2));
          dataPoint[`ke${i}`] = parseFloat(ke.toFixed(2));
        } else {
          dataPoint[`v${i}`] = 0;
          dataPoint[`ke${i}`] = 0;
        }
      });

      onPhysicsData?.(prev => {
        const next = [...(prev || []), dataPoint];
        return next.slice(-80);
      });
    }, 150);

    // Resize handler
    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      render.canvas.width = nw;
      render.canvas.height = nh;
      render.options.width = nw;
      render.options.height = nh;
      setCanvasSize({ w: nw, h: nh });
      Body.setPosition(ground, { x: nw / 2, y: nh + wallThickness / 2 - groundOffset });
      Body.setPosition(ceiling, { x: nw / 2, y: -wallThickness / 2 });
      Body.setPosition(wallL, { x: -wallThickness / 2, y: nh / 2 });
      Body.setPosition(wallR, { x: nw + wallThickness / 2, y: nh / 2 });
      if (vectorCanvasRef.current) {
        vectorCanvasRef.current.width = nw;
        vectorCanvasRef.current.height = nh;
      }
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearInterval(dataInterval);
      window.removeEventListener('resize', onResize);
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      // Remove the canvas Matter.js created
      if (render.canvas && render.canvas.parentNode) {
        render.canvas.parentNode.removeChild(render.canvas);
      }
    };
  }, []);

  // ── Enable/Disable MouseConstraint based on active tool ──
  useEffect(() => {
    const mc = mouseConstraintRef.current;
    if (!mc) return;
    if (activeTool === 'select') {
      mc.constraint.stiffness = 0.2;
    } else {
      // Disable dragging when using other tools
      mc.constraint.stiffness = 0;
    }
  }, [activeTool]);

  // ── Pause/Resume ──
  useEffect(() => {
    if (!runnerRef.current || !engineRef.current) return;
    runnerRef.current.enabled = !isPaused;
  }, [isPaused]);

  // ── Vector overlay ──
  useEffect(() => {
    if (!showVectors) return;
    const canvas = vectorCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;
    let animId;

    const drawVectors = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const allBodies = Composite.allBodies(engine.world).filter(b => !b.isStatic && !['ground', 'wall'].includes(b.label));
      allBodies.forEach(b => {
        const { x, y } = b.position;
        const vScale = 8;
        drawArrow(ctx, x, y, x + b.velocity.x * vScale, y + b.velocity.y * vScale, '#38bdf8', 2);
        const gScale = 20;
        drawArrow(ctx, x, y, x, y + engine.gravity.y * b.mass * gScale, '#f87171', 1.5);
      });
      animId = requestAnimationFrame(drawVectors);
    };
    drawVectors();
    return () => cancelAnimationFrame(animId);
  }, [showVectors]);

  // ── Socket event handlers ──
  useEffect(() => {
    if (!socket || !engineRef.current) return;
    const engine = engineRef.current;

    const handleBodyAdded = (data) => {
      if (bodyMapRef.current.has(data.id)) return;
      addBodyFromData(engine, data);
    };

    const handleBodyRemoved = (bodyId) => {
      const body = bodyMapRef.current.get(bodyId);
      if (body) {
        World.remove(engine.world, body);
        bodyMapRef.current.delete(bodyId);
      }
    };

    const handleConstraintAdded = (data) => {
      if (constraintMapRef.current.has(data.id)) return;
      addConstraintFromData(engine, data);
    };

    const handleWorldReset = (worldState) => {
      const bodiesToRemove = Composite.allBodies(engine.world).filter(b => !['ground', 'wall'].includes(b.label));
      bodiesToRemove.forEach(b => World.remove(engine.world, b));
      Composite.allConstraints(engine.world).forEach(c => {
        if (c.label !== 'Mouse Constraint') World.remove(engine.world, c);
      });
      bodyMapRef.current.clear();
      constraintMapRef.current.clear();
      (worldState.bodies || []).forEach(bd => addBodyFromData(engine, bd));
      (worldState.constraints || []).forEach(cd => addConstraintFromData(engine, cd));
    };

    const handleRoomState = ({ bodies, constraints }) => {
      handleWorldReset({ bodies, constraints });
    };

    socket.on('body-added', handleBodyAdded);
    socket.on('body-removed', handleBodyRemoved);
    socket.on('constraint-added', handleConstraintAdded);
    socket.on('world-reset', handleWorldReset);
    socket.on('room-state', handleRoomState);

    return () => {
      socket.off('body-added', handleBodyAdded);
      socket.off('body-removed', handleBodyRemoved);
      socket.off('constraint-added', handleConstraintAdded);
      socket.off('world-reset', handleWorldReset);
      socket.off('room-state', handleRoomState);
    };
  }, [socket]);

  const addBodyFromData = (engine, data) => {
    const opts = {
      ...data.options,
      render: { fillStyle: data.color || getNextColor(), strokeStyle: 'rgba(255,255,255,0.1)', lineWidth: 1 },
      label: data.id
    };
    let body;
    if (data.type === 'circle') {
      body = Bodies.circle(data.x, data.y, data.radius || 25, opts);
    } else if (data.type === 'polygon') {
      body = Bodies.polygon(data.x, data.y, data.sides || 5, data.radius || 30, opts);
    } else {
      body = Bodies.rectangle(data.x, data.y, data.w || 50, data.h || 50, opts);
    }
    if (data.options?.angle) Body.setAngle(body, data.options.angle);
    body._customId = data.id;
    bodyMapRef.current.set(data.id, body);
    World.add(engine.world, body);
    return body;
  };

  const addConstraintFromData = (engine, data) => {
    const bodyA = bodyMapRef.current.get(data.bodyAId);
    const bodyB = bodyMapRef.current.get(data.bodyBId);
    if (!bodyA || !bodyB) return;
    const isSpring = data.type === 'spring' || (data.stiffness && data.stiffness < 0.5);
    const c = Constraint.create({
      bodyA, bodyB,
      stiffness: data.stiffness ?? (isSpring ? 0.05 : 1),
      length: data.length ?? undefined,
      render: {
        strokeStyle: isSpring ? '#34d399' : '#94a3b8',
        lineWidth: isSpring ? 2 : 3,
        type: isSpring ? 'spring' : 'line'
      },
      label: data.id
    });
    c._customId = data.id;
    constraintMapRef.current.set(data.id, c);
    World.add(engine.world, c);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative bg-surface-950" style={{ cursor: activeTool === 'select' ? 'grab' : 'crosshair' }}>
      {/* Grid background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {showVectors && <canvas ref={vectorCanvasRef} width={canvasSize.w} height={canvasSize.h} className="absolute top-0 left-0 z-[2] pointer-events-none" />}
      {constraintStartRef.current && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 glass px-4 py-2 rounded-lg text-sm text-amber-300 fade-in">
          🔗 Click on a second body to create the connection
        </div>
      )}
    </div>
  );
}

function drawArrow(ctx, x1, y1, x2, y2, color, width) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 2) return;
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.globalAlpha = 0.7;
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const angle = Math.atan2(dy, dx);
  const headLen = Math.min(10, len * 0.3);
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}
