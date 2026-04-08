# Velocity Arena: Smart Venue Experience System (SVES) 🏟️⚡

**Narrative:** *How we transformed a standard dashboard into an interactive, real-time venue operations protocol.*

Managing crowd flow and incident response in large-scale, 50,000+ seat arenas requires more than just reactive systems and static data tables. With thousands of fans navigating tight concourses, a single bottleneck—whether from a POS system failure or a delayed gate check—can ripple into a massive congestion event. 

The **Smart Venue Experience System (SVES)** is a comprehensive, enterprise-level operations dashboard capable of taking in telemetry data, running AI predictions, and visualizing the real-time state of the venue in a highly actionable, responsive interface.

---

## 🚀 Key Features

*   **Interactive Concourse Navigation:** A full 3-panel command center mapping the stadium concourse using custom SVG visualizations. It traces live, optimal routes through the stadium while actively avoiding incident zones.
*   **AI-Driven Queue Prediction:** Integrates simulated predictive models (like XGBoost algorithms) to forecast queue lengths and concession loads before they become critical bottlenecks.
*   **UEBA Anomaly Detection:** Monitors crowd patterns (simulated via Isolation Forests) to trigger smart routing alerts when abnormal crowd spikes occur, keeping throughput optimally distributed.
*   **LLM Event Agent:** A natural language assistant integrated directly into operations to help parse incoming venue telemetry and coordinate rapid facility responses.
*   **Identity & Access Core:** Secure, validated ticketing integration with fast node-locating for individual fans.

## 🛠️ The Tech & "Flicker-Free" Implementation

Built entirely on **Next.js**, we engineered this app with a modern, glassmorphic UI overlaying Deep Slate and Oceanic background gradients.

**Achieving the Butter-Smooth SVG Map:**
One of the most complex technical hurdles was handling real-time map data seamlessly. In a high-render loop, standard conditional mountings (e.g. `{isSelected && <pulse-ring />}`) caused CSS animations across the SVG canvas to snap and flicker constantly. 

To overcome this, we localized SVES state management:
1.  **Continuous Rendering:** Elements are permanently kept in the DOM, controlled strictly via opacity transitions instead of costly unmounting.
2.  **Stable ID Tracking:** We avoided object-reference bloat by using unique stable IDs for hovering and selecting zones.
3.  **Debounced Pathfinding:** We decoupled our Breadth-First Search (BFS) routing algorithm via `useRef` timeouts, preventing high-frequency interaction from locking the main thread.

The result is a responsive, mission-control aesthetic dashboard suitable for professional deployments.

---

## 💻 Getting Started Locally

First, install the target dependencies and run the development server:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to launch the SVES Command Center.

## 📁 Repository Structure
*   `src/app/page.tsx` - The primary multi-column layout and tab system (SVES Overview, Dashboards).
*   `src/app/components/StadiumMap.tsx` - The highly interactive SVG stadium map and intelligent sidebar.
*   `src/app/data/stadiumGraph.ts` - Our underlying stadium topological data model packed with incident properties and spatial coordinates.
