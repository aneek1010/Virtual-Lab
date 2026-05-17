const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// ── In-memory experiment store ──
const experiments = [
  {
    id: 'preset-pendulum',
    name: 'Simple Pendulum',
    author: 'Virtual Lab',
    description: 'A classic pendulum demonstrating periodic motion and energy conservation.',
    tags: ['mechanics', 'oscillation', 'energy'],
    shared: true,
    createdAt: new Date().toISOString(),
    worldState: {
      bodies: [
        { id: 'p1', type: 'rectangle', x: 500, y: 80, w: 20, h: 20, options: { isStatic: true }, color: '#64748b' },
        { id: 'p2', type: 'circle', x: 620, y: 280, radius: 22, options: { mass: 5, restitution: 0.9, frictionAir: 0.002 }, color: '#818cf8' }
      ],
      constraints: [
        { id: 'pc1', bodyAId: 'p1', bodyBId: 'p2', stiffness: 1, length: 250, type: 'rigid' }
      ]
    }
  },
  {
    id: 'preset-newton-cradle',
    name: "Newton's Cradle",
    author: 'Virtual Lab',
    description: 'Demonstrates conservation of momentum and energy with swinging balls.',
    tags: ['mechanics', 'momentum', 'collision'],
    shared: true,
    createdAt: new Date().toISOString(),
    worldState: {
      bodies: [
        { id: 'nc-a1', type: 'rectangle', x: 350, y: 100, w: 10, h: 10, options: { isStatic: true }, color: '#64748b' },
        { id: 'nc-a2', type: 'rectangle', x: 400, y: 100, w: 10, h: 10, options: { isStatic: true }, color: '#64748b' },
        { id: 'nc-a3', type: 'rectangle', x: 450, y: 100, w: 10, h: 10, options: { isStatic: true }, color: '#64748b' },
        { id: 'nc-a4', type: 'rectangle', x: 500, y: 100, w: 10, h: 10, options: { isStatic: true }, color: '#64748b' },
        { id: 'nc-a5', type: 'rectangle', x: 550, y: 100, w: 10, h: 10, options: { isStatic: true }, color: '#64748b' },
        { id: 'nc-b1', type: 'circle', x: 280, y: 250, radius: 22, options: { mass: 5, restitution: 1, friction: 0, frictionAir: 0 }, color: '#f472b6' },
        { id: 'nc-b2', type: 'circle', x: 400, y: 300, radius: 22, options: { mass: 5, restitution: 1, friction: 0, frictionAir: 0 }, color: '#818cf8' },
        { id: 'nc-b3', type: 'circle', x: 450, y: 300, radius: 22, options: { mass: 5, restitution: 1, friction: 0, frictionAir: 0 }, color: '#818cf8' },
        { id: 'nc-b4', type: 'circle', x: 500, y: 300, radius: 22, options: { mass: 5, restitution: 1, friction: 0, frictionAir: 0 }, color: '#818cf8' },
        { id: 'nc-b5', type: 'circle', x: 550, y: 300, radius: 22, options: { mass: 5, restitution: 1, friction: 0, frictionAir: 0 }, color: '#34d399' }
      ],
      constraints: [
        { id: 'ncc1', bodyAId: 'nc-a1', bodyBId: 'nc-b1', stiffness: 1, length: 200, type: 'rigid' },
        { id: 'ncc2', bodyAId: 'nc-a2', bodyBId: 'nc-b2', stiffness: 1, length: 200, type: 'rigid' },
        { id: 'ncc3', bodyAId: 'nc-a3', bodyBId: 'nc-b3', stiffness: 1, length: 200, type: 'rigid' },
        { id: 'ncc4', bodyAId: 'nc-a4', bodyBId: 'nc-b4', stiffness: 1, length: 200, type: 'rigid' },
        { id: 'ncc5', bodyAId: 'nc-a5', bodyBId: 'nc-b5', stiffness: 1, length: 200, type: 'rigid' }
      ]
    }
  },
  {
    id: 'preset-spring-launcher',
    name: 'Spring Launcher',
    author: 'Virtual Lab',
    description: 'A spring-loaded launcher demonstrating elastic potential energy conversion.',
    tags: ['mechanics', 'springs', 'energy'],
    shared: true,
    createdAt: new Date().toISOString(),
    worldState: {
      bodies: [
        { id: 'sl1', type: 'rectangle', x: 200, y: 500, w: 40, h: 40, options: { isStatic: true }, color: '#64748b' },
        { id: 'sl2', type: 'circle', x: 200, y: 400, radius: 25, options: { mass: 3, restitution: 0.7 }, color: '#fb923c' },
        { id: 'sl3', type: 'rectangle', x: 600, y: 450, w: 200, h: 20, options: { isStatic: true, angle: -0.3 }, color: '#64748b' }
      ],
      constraints: [
        { id: 'slc1', bodyAId: 'sl1', bodyBId: 'sl2', stiffness: 0.02, length: 30, type: 'spring' }
      ]
    }
  },
  {
    id: 'preset-ramp',
    name: 'Ramp & Collision',
    author: 'Virtual Lab',
    description: 'Ball rolls down a ramp and collides — demonstrates kinetic energy and momentum.',
    tags: ['mechanics', 'collision', 'gravity'],
    shared: true,
    createdAt: new Date().toISOString(),
    worldState: {
      bodies: [
        { id: 'r1', type: 'rectangle', x: 300, y: 350, w: 400, h: 20, options: { isStatic: true, angle: 0.35 }, color: '#64748b' },
        { id: 'r2', type: 'circle', x: 150, y: 200, radius: 20, options: { mass: 2, restitution: 0.6 }, color: '#818cf8' },
        { id: 'r3', type: 'rectangle', x: 650, y: 480, w: 60, h: 60, options: { mass: 4, restitution: 0.4 }, color: '#f472b6' }
      ],
      constraints: []
    }
  }
];

// ── REST API ──
app.get('/api/experiments', (req, res) => {
  const { tag, search } = req.query;
  let results = experiments;
  if (tag) results = results.filter(e => e.tags.includes(tag));
  if (search) results = results.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));
  res.json(results.map(({ worldState, ...rest }) => rest));
});

app.get('/api/experiments/:id', (req, res) => {
  const exp = experiments.find(e => e.id === req.params.id);
  if (!exp) return res.status(404).json({ error: 'Not found' });
  res.json(exp);
});

app.post('/api/experiments', (req, res) => {
  const exp = { id: 'exp-' + Date.now(), createdAt: new Date().toISOString(), shared: true, ...req.body };
  experiments.push(exp);
  res.status(201).json(exp);
});

// ── Room management ──
const rooms = new Map();

function getRoomData(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { users: new Map(), bodies: [], constraints: [], nextId: 1 });
  }
  return rooms.get(roomId);
}

// ── Socket.io ──
io.on('connection', (socket) => {
  let currentRoom = null;
  let userName = 'Anonymous';

  socket.on('join-room', ({ roomId, name }) => {
    currentRoom = roomId;
    userName = name || 'Anonymous';
    socket.join(roomId);
    const room = getRoomData(roomId);
    room.users.set(socket.id, { name: userName, color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0') });
    socket.emit('room-state', {
      bodies: room.bodies,
      constraints: room.constraints,
      users: Object.fromEntries(room.users)
    });
    io.to(roomId).emit('users-update', Object.fromEntries(room.users));
    console.log(`${userName} joined room ${roomId}`);
  });

  socket.on('add-body', (bodyData) => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    const body = { ...bodyData, id: bodyData.id || 'b-' + room.nextId++ };
    room.bodies.push(body);
    io.to(currentRoom).emit('body-added', body);
  });

  socket.on('remove-body', (bodyId) => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    room.bodies = room.bodies.filter(b => b.id !== bodyId);
    room.constraints = room.constraints.filter(c => c.bodyAId !== bodyId && c.bodyBId !== bodyId);
    io.to(currentRoom).emit('body-removed', bodyId);
  });

  socket.on('add-constraint', (constraintData) => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    const constraint = { ...constraintData, id: constraintData.id || 'c-' + room.nextId++ };
    room.constraints.push(constraint);
    io.to(currentRoom).emit('constraint-added', constraint);
  });

  socket.on('load-experiment', (worldState) => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    room.bodies = worldState.bodies || [];
    room.constraints = worldState.constraints || [];
    io.to(currentRoom).emit('world-reset', worldState);
  });

  socket.on('clear-world', () => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    room.bodies = [];
    room.constraints = [];
    io.to(currentRoom).emit('world-reset', { bodies: [], constraints: [] });
  });

  socket.on('cursor-move', (pos) => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('cursor-update', { id: socket.id, ...pos });
  });

  socket.on('state-sync', (state) => {
    if (!currentRoom) return;
    const room = getRoomData(currentRoom);
    room.bodies = state.bodies || room.bodies;
    room.constraints = state.constraints || room.constraints;
    socket.to(currentRoom).emit('state-sync', state);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      const room = getRoomData(currentRoom);
      room.users.delete(socket.id);
      io.to(currentRoom).emit('users-update', Object.fromEntries(room.users));
      io.to(currentRoom).emit('cursor-remove', socket.id);
      if (room.users.size === 0) rooms.delete(currentRoom);
      console.log(`${userName} left room ${currentRoom}`);
    }
  });
});

// ── Serve static files in production ──
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../client/dist/index.html')));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Virtual Lab server running on port ${PORT}`));
