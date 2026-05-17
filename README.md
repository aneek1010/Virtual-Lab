<div align="center">
  
# 🧪 Virtual Lab
### Collaborative 2D Physics Sandbox

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![Matter.js](https://img.shields.io/badge/Matter.js-4B5563?style=for-the-badge&logo=javascript&logoColor=white)](https://brm.io/matter-js/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

</div>

## 📖 What is Virtual Lab?

**Virtual Lab** is a "Digital Twin" environment—a real-time, multi-user 2D physics sandbox designed for educational and experimental purposes. It allows users to build rigid body mechanisms, test structural integrity, and observe real-world forces dynamically within a shared, collaborative workspace. 

Think of it as a multiplayer whiteboard, but governed by the laws of physics. Multiple users can join the same room to drop blocks, create pendulums, attach springs, and watch the resulting kinetic energy and velocity changes in real-time on live analytical charts.

---

## 🚀 How to Run the Project

To run this project on your local machine, you will need to open **two separate terminal windows** (one for the backend server and one for the frontend client).

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher) installed on your computer.

### Step 1: Start the Backend Server
Open your first terminal and run the following commands:
```bash
# Navigate to the server directory
cd path/to/Virtual_Lab/server

# Install server dependencies (only needed the first time)
npm install

# Start the Node.js server
node index.js
```
*You should see a message saying: `Virtual Lab server running on port 3001`*

### Step 2: Start the Frontend Client
Open your second terminal and run:
```bash
# Navigate to the client directory
cd path/to/Virtual_Lab/client

# Install client dependencies (only needed the first time)
npm install

# Start the Vite development server
npm run dev
```
*You should see a message saying Vite is ready at `http://localhost:5173`*

### Step 3: Open the App
1. Open your web browser and go to: **`http://localhost:5173`**
2. Enter your name and click **"Create & Enter Lab"**.
3. *Optional:* Open the same link in an Incognito window or a different browser to test the real-time multiplayer features!

---

## 🧠 How We Built It: The Development Process

This project was developed rapidly as a full-stack engineering challenge. Here is the step-by-step process of how it was architected and built:

### Phase 1: Foundation & Architecture Setup
We started by establishing a modern decoupled architecture. We chose **Vite + React** for a fast frontend, styled it beautifully with **Tailwind CSS** (glassmorphism design), and set up an **Express + Node.js** backend. We configured Vite to proxy API and WebSocket requests to the backend to avoid CORS issues during development.

### Phase 2: Integrating the Physics Engine
We implemented **Matter.js** into a React component (`PhysicsCanvas.jsx`). We carefully managed the React lifecycle to ensure the physics engine (`Engine`, `Render`, `Runner`) started on mount and cleaned up properly on unmount. We added static walls, a floor, and a ceiling to enclose the simulation space.

### Phase 3: Real-Time Multiplayer Sync
To make it collaborative, we integrated **Socket.io**. We utilized an **Authoritative Server Pattern**:
- When a user adds a body or constraint, an event is sent to the server.
- The server manages "Rooms" and broadcasts the new state to all other clients.
- If a user joins late, the server sends them the entire current `worldState` so they immediately see the exact same layout as everyone else.

### Phase 4: Fixing Physics & Interaction Nuances
Combining React states with a raw HTML5 canvas physics engine presented challenges. We solved:
- **HiDPI Monitor Issues:** Forced `pixelRatio: 1` in Matter.js to fix mouse drag coordinate misalignment.
- **Event Collisions:** Prevented the native Matter.js `MouseConstraint` from interfering with custom tools (like drawing springs) by dynamically toggling its stiffness.
- **UI Overlap:** Adjusted the physics ground level so bodies wouldn't fall behind the bottom toolbar.

### Phase 5: Live Analytics & Scientific Calibration
We integrated **Recharts** to visualize live data. Because native physics engines use arbitrary units (e.g., pixels per tick), we calibrated the simulation to real-world physics:
- We defined a scale of **100 pixels = 1 meter**.
- We converted Matter.js raw velocity into **m/s**.
- We calculated Kinetic Energy accurately in **Joules (J)** using `KE = ½mv²`.
- We added live vector overlays directly on the bodies to visualize gravity (red) and velocity (blue).

### Phase 6: Experiment Library
Finally, we built a persistent state system. We created a REST API on the server to save entire physics canvas layouts as JSON strings. We pre-loaded 4 templates (Pendulum, Newton's Cradle, Spring Launcher, Ramp) so users could immediately test complex physics scenarios.

---

## ✨ Features

- **Interactive Physics Engine** — High-performance 2D rigid body physics (collisions, gravity, friction, restitution).
- **Real-Time Collaboration** — See changes from other users in your room with near-zero latency.
- **Constraint Tools** — Connect bodies dynamically using elastic Springs (🌊) or solid Rigid Joints (🔗).
- **Live Analytics Dashboard** — Visualize physics data via real-time line charts.
- **Force Vectors Overlay** — Toggle live velocity vectors and gravity/weight vectors on objects.
- **Experiment Library** — Save your setups or load built-in educational presets.

## 🎮 Tools & Controls

| Tool | Icon | Action |
|:---|:---:|:---|
| **Select & Drag** | 🖱️ | Click and drag any dynamic body. Shows properties on the right. |
| **Rectangle** | ⬜ | Click anywhere to drop a rectangle. |
| **Circle** | ⚪ | Click anywhere to drop a circle. |
| **Polygon** | ⬠ | Click anywhere to drop a pentagon. |
| **Platform** | 🧱 | Click to drop a static (immovable) platform. |
| **Spring** | 🌊 | Click body A, then body B to connect them with an elastic spring. |
| **Rigid Joint** | 🔗 | Click body A, then body B to connect them with a solid rod. |
| **Delete** | 🗑️ | Click any object to remove it from the simulation. |
| **Vectors** | 📐 | Toggle the visual rendering of velocity and gravity arrows. |

---

## ⚙️ Architecture Summary

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts
- **Physics Engine:** Matter.js
- **Backend:** Node.js, Express.js
- **Real-time Sync:** WebSockets via Socket.io

## 📐 Physics Scale & Units
To provide meaningful analytics, the lab uses the following internal conversion scale:
- **Distance:** `100 pixels = 1 meter`
- **Velocity:** Calculated in `m/s`
- **Kinetic Energy:** Calculated in Joules (`J`)
- **Angle:** Normalized to `0° – 360°`
