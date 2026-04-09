# Velocity Arena: Smart Venue Experience System (SVES) 🏟️⚡

**Narrative:** *How we transformed a standard dashboard into an interactive, real-time venue operations protocol.*

---

## 🎯 Chosen Vertical
**Sports & Entertainment Events (Smart Stadium Management)**

Managing crowd flow and incident response in large-scale, 50,000+ seat arenas requires more than just reactive systems and static data tables. With thousands of fans navigating tight concourses, a single bottleneck—whether from a POS system failure or a delayed gate check—can ripple into a massive congestion event. Our chosen vertical specifically targets the operational efficiency and patron safety aspects of major sporting and entertainment events.

## 🧠 Approach and Logic

Our approach centered around combining predictive data analytics, interactive wayfinding, and real-time operational alerts into a single cohesive interface.

1.  **Topological Data Modeling:** Instead of treating stadium navigation as a static image, we modeled the concourse as a graph (nodes and edges). Each area (sections, gates, restrooms) is a node with inherent capacity constraints, current loads, and active incident attributes.
2.  **Predictive & Behavioral Analytics (Simulated):** We simulated data processing pipelines like XGBoost (for queue prediction) and UEBA / Isolation Forests (for anomaly detection in crowd spikes).
3.  **Continuous UI Architecture:** To handle a stream of real-time telemetry natively in the browser without performance drops, we architected the SVG map to use stable identifier tracking and CSS-based opacity transitions rather than computationally expensive React mount/unmount lifecycles.
4.  **Generative AI Integration:** Operators are aided by an LLM-powered assistant designed to query textual telemetry and output routing suggestions.

## ⚙️ How the Solution Works

1.  **3-Panel Command Center (`<StadiumMap />`)** 
    *   **Live Incident Feed (Left):** Aggregates problem causes from all stadium nodes (e.g., POS failures, stairwell blockages). Severity levels (Critical, Warning, Info) highlight what needs immediate attention.
    *   **Interactive SVG Map (Center):** Visualizes the topological graph. Heat halos indicate capacity loads. Clicking any node instantly calculates the shortest optimal path from a user's location (via Breadth-First Search) while avoiding "blocked" edges.
    *   **Root Cause Analysis (Right):** Drilling down into a specific node displays its active incidents, real-time load vs. max capacity gauge, and provides direct mitigation recommendations.
2.  **Dashboard Hub** 
    *   Monitors enterprise metrics like queue wait times and UEBA system alerts. Operators can acknowledge anomalies (like a crowded gate) to automatically redeploy dynamic routing across the stadium screens.
3.  **LLM Event Agent** 
    *   An interface allowing operators to ask questions like "Where is the nearest empty washroom?" and surface safe routes based on live crowd telemetry.

## 🤔 Assumptions Made

*   **Telemetry Integration is Established:** The application assumes backend IoT sensors (cameras, turnstiles, POS data) are actively reporting accurate load numbers to the frontend states.
*   **Constant Device Connectivity:** Assumes the venue has robust infrastructure (Wi-Fi 6 or 5G mmWave) to ensure real-time client-state sync.
*   **Pathing Symmetry:** The BFS route calculation operates under the assumption that paths between nodes are bidirectional and equal in transit time (unless obstructed).
*   **Pre-Identified Incident Profiles:** The mock data assumes the system is capable of automatically classifying the *reason* for congestion (e.g., distinguishing between a "POS failure" versus "Supply Chain Delay"). Real-world application would likely require human verification for these classifications.

---

## 💻 Getting Started Locally

Install dependencies and run the development server:

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
*   `src/app/components/StadiumMap.module.css` - Custom CSS rules for glitch-free SVG map rendering.
*   `src/app/data/stadiumGraph.ts` - Our underlying stadium topological data model packed with incident properties and spatial coordinates.
