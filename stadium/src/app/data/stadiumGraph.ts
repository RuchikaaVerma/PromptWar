export type NodeType = 'gate' | 'section' | 'food' | 'restroom' | 'path' | 'medical' | 'merch';

export type IncidentSeverity = 'none' | 'info' | 'warning' | 'critical';

export interface ProblemCause {
  title: string;
  description: string;
  severity: IncidentSeverity;
  timestamp: string; // e.g. "7:14 PM"
  metric?: string;   // e.g. "87% capacity"
  recommendation?: string;
}

export interface StadiumNode {
  id: string;
  label: string;
  x: number; /* Percentage 0-100 for SVG positioning */
  y: number;
  type: NodeType;
  congestion: 'low' | 'medium' | 'high';
  capacity: number;       // max people
  currentLoad: number;    // current people
  problemCauses: ProblemCause[];
}

export interface StadiumEdge {
  from: string;
  to: string;
  weight: number; 
  blocked?: boolean;
  blockReason?: string;
}

// A mapped out 2D coordinate system of a simulated stadium concourse
export const stadiumNodes: StadiumNode[] = [
  {
    id: 'gate_north', label: 'North Gate', x: 50, y: 8, type: 'gate', congestion: 'high',
    capacity: 3000, currentLoad: 2610,
    problemCauses: [
      { title: 'Pre-Game Surge', description: 'Late-arriving fans concentrated at primary entry. Scanner throughput bottleneck at lanes 3-6.', severity: 'critical', timestamp: '6:52 PM', metric: '87% capacity', recommendation: 'Activate overflow lanes 7-10, deploy 2 additional scanner operators.' },
      { title: 'Bag Check Delay', description: 'Enhanced security screening protocol triggered after threat level escalation at 6:40 PM. Each patron requiring 45s avg vs 15s baseline.', severity: 'warning', timestamp: '6:40 PM', metric: '3x slowdown', recommendation: 'Open expedited re-entry line for clear-bag holders.' },
    ]
  },
  {
    id: 'sec_110', label: 'Sec 110', x: 18, y: 30, type: 'section', congestion: 'high',
    capacity: 500, currentLoad: 460,
    problemCauses: [
      { title: 'Home Team Bench Proximity', description: 'Premium section adjacent to team bench. Fans crowding aisles for player visibility causing egress gridlock.', severity: 'warning', timestamp: '7:05 PM', metric: '92% occupied', recommendation: 'Deploy 2 ushers for aisle flow management. Consider restricting standing in rows 1-5.' },
      { title: 'Stairwell Blockage', description: 'Upper concourse stairwell A-3 partially blocked by vendor cart misplacement. Reducing throughput by ~40%.', severity: 'critical', timestamp: '7:10 PM', metric: '40% flow reduction', recommendation: 'Dispatch facilities to relocate vendor cart immediately.' },
    ]
  },
  {
    id: 'sec_115', label: 'Sec 115', x: 82, y: 30, type: 'section', congestion: 'low',
    capacity: 500, currentLoad: 180,
    problemCauses: [
      { title: 'Normal Operations', description: 'Visitor team section with low attendance due to away game. All pathways clear.', severity: 'none', timestamp: '7:00 PM', metric: '36% occupied' },
    ]
  },
  {
    id: 'food_1', label: 'Hot Dogs (112)', x: 32, y: 18, type: 'food', congestion: 'high',
    capacity: 80, currentLoad: 74,
    problemCauses: [
      { title: 'POS System Failure', description: 'Register #3 offline since 6:30 PM. Card-only terminal forcing cash customers to adjacent registers, creating uneven queue distribution.', severity: 'critical', timestamp: '6:30 PM', metric: '1 of 4 POS down', recommendation: 'IT ticket escalated. Reroute customers to Express Bar (Sec 115) via PA announcement.' },
      { title: 'Supply Chain Delay', description: 'Hot dog bun resupply delayed 20 min from commissary. Menu items limited to nachos & pretzels until restock.', severity: 'warning', timestamp: '7:02 PM', metric: '~20 min ETA', recommendation: 'Update digital menu boards to reflect limited items. Push Express Bar promo.' },
    ]
  },
  {
    id: 'food_2', label: 'Express Bar', x: 72, y: 18, type: 'food', congestion: 'low',
    capacity: 60, currentLoad: 12,
    problemCauses: [
      { title: 'Under-Utilized Asset', description: 'Low foot traffic due to location on visitor side. Only 20% capacity despite full menu availability and zero wait time.', severity: 'info', timestamp: '7:00 PM', metric: '20% utilized', recommendation: 'Push real-time wait-time comparison to SVES mobile app. Activate wayfinding signage near Sec 110.' },
    ]
  },
  {
    id: 'rr_1', label: 'Restroom West', x: 8, y: 48, type: 'restroom', congestion: 'medium',
    capacity: 40, currentLoad: 28,
    problemCauses: [
      { title: 'Fixture Maintenance', description: '2 of 8 stalls out of service (plumbing issue reported at 5:45 PM). Effective capacity reduced by 25%.', severity: 'warning', timestamp: '5:45 PM', metric: '2 stalls OOS', recommendation: 'Maintenance dispatched. ETA 15 min. Direct overflow to Restroom East via digital signage.' },
    ]
  },
  {
    id: 'rr_2', label: 'Restroom East', x: 92, y: 48, type: 'restroom', congestion: 'low',
    capacity: 40, currentLoad: 10,
    problemCauses: [
      { title: 'Normal Operations', description: 'All fixtures operational. Low traffic on visitor concourse side. Good candidate for overflow routing.', severity: 'none', timestamp: '7:00 PM', metric: '25% utilized' },
    ]
  },
  {
    id: 'center_hub', label: 'Main Concourse', x: 50, y: 50, type: 'path', congestion: 'medium',
    capacity: 2000, currentLoad: 1340,
    problemCauses: [
      { title: 'Halftime Anticipation', description: 'Crowd density rising as fans pre-position for halftime concession rush. Predictive model forecasts 85% load in ~8 minutes.', severity: 'warning', timestamp: '7:12 PM', metric: '67% → 85% (predicted)', recommendation: 'Pre-open auxiliary concession windows. Staff halftime express lanes now.' },
      { title: 'Merch Kiosk Spillover', description: 'Pop-up merchandise kiosk near center hub creating foot traffic eddy. Queue for limited-edition item extending 12m into walking path.', severity: 'info', timestamp: '7:08 PM', metric: '12m queue intrusion', recommendation: 'Install queue barriers to channelize merch line away from main flow.' },
    ]
  },
  {
    id: 'medical_1', label: 'First Aid', x: 50, y: 35, type: 'medical', congestion: 'low',
    capacity: 20, currentLoad: 3,
    problemCauses: [
      { title: 'Heat-Related Incidents', description: '3 heat exhaustion cases treated since gates opened. Outdoor temperature 34°C. Hydration stations at 60% supply.', severity: 'info', timestamp: '6:50 PM', metric: '3 cases today', recommendation: 'Request additional water supply from commissary. Activate misting fans at Gates N/S.' },
    ]
  },
  {
    id: 'merch_1', label: 'Team Store', x: 35, y: 60, type: 'merch', congestion: 'medium',
    capacity: 120, currentLoad: 78,
    problemCauses: [
      { title: 'Limited Edition Drop', description: 'Championship commemorative jersey released today. High demand causing 15-min avg wait. Queue extending into Sec 202 corridor.', severity: 'warning', timestamp: '6:15 PM', metric: '15 min avg wait', recommendation: 'Open secondary checkout counter. Consider mobile-order pickup for pre-paid items.' },
    ]
  },
  {
    id: 'sec_202', label: 'Sec 202', x: 35, y: 78, type: 'section', congestion: 'low',
    capacity: 400, currentLoad: 220,
    problemCauses: [
      { title: 'Normal Operations', description: 'Upper bowl section with moderate attendance. Clear sightlines, all exits unobstructed.', severity: 'none', timestamp: '7:00 PM', metric: '55% occupied' },
    ]
  },
  {
    id: 'sec_203', label: 'Sec 203', x: 65, y: 78, type: 'section', congestion: 'low',
    capacity: 400, currentLoad: 196,
    problemCauses: [
      { title: 'Normal Operations', description: 'Upper bowl section. Low density. Ideal egress candidate for post-game routing.', severity: 'none', timestamp: '7:00 PM', metric: '49% occupied' },
    ]
  },
  {
    id: 'gate_south', label: 'South Gate', x: 50, y: 92, type: 'gate', congestion: 'low',
    capacity: 3000, currentLoad: 420,
    problemCauses: [
      { title: 'Egress Pre-Staging', description: 'Gate staffed and ready for post-game egress. Currently at 14% load with full lane availability.', severity: 'none', timestamp: '7:00 PM', metric: '14% capacity', recommendation: 'Designate as primary egress route. Pre-position traffic control at parking lot junctions.' },
    ]
  },
  {
    id: 'gate_east', label: 'East Gate', x: 92, y: 70, type: 'gate', congestion: 'medium',
    capacity: 1500, currentLoad: 780,
    problemCauses: [
      { title: 'VIP Entrance Congestion', description: 'VIP/suite credential verification adding 30s per patron. Mixed-use lane causing general admission backup.', severity: 'warning', timestamp: '6:55 PM', metric: '52% capacity', recommendation: 'Separate VIP and GA lanes. Deploy dedicated VIP scanner.' },
    ]
  },
  {
    id: 'gate_west', label: 'West Gate', x: 8, y: 70, type: 'gate', congestion: 'low',
    capacity: 1500, currentLoad: 300,
    problemCauses: [
      { title: 'Low Utilization', description: 'Parking structure on west side at 40% capacity. Gate under-utilized due to poor wayfinding from transit stops.', severity: 'info', timestamp: '7:00 PM', metric: '20% capacity', recommendation: 'Add directional signage at transit hub pointing to West Gate.' },
    ]
  },
];

export const stadiumEdges: StadiumEdge[] = [
  { from: 'gate_north', to: 'food_1', weight: 2 },
  { from: 'gate_north', to: 'food_2', weight: 2 },
  { from: 'food_1', to: 'sec_110', weight: 1 },
  { from: 'sec_110', to: 'rr_1', weight: 1 },
  { from: 'food_2', to: 'sec_115', weight: 1 },
  { from: 'sec_115', to: 'rr_2', weight: 1 },
  { from: 'food_1', to: 'center_hub', weight: 3 },
  { from: 'food_2', to: 'center_hub', weight: 3 },
  { from: 'rr_1', to: 'center_hub', weight: 4 },
  { from: 'rr_2', to: 'center_hub', weight: 4 },
  { from: 'center_hub', to: 'sec_202', weight: 2 },
  { from: 'center_hub', to: 'sec_203', weight: 2 },
  { from: 'sec_202', to: 'gate_south', weight: 1 },
  { from: 'sec_203', to: 'gate_south', weight: 1 },
  // Cross routes
  { from: 'sec_110', to: 'center_hub', weight: 2 },
  { from: 'sec_115', to: 'center_hub', weight: 2 },
  // New connections for expanded nodes
  { from: 'center_hub', to: 'medical_1', weight: 1 },
  { from: 'center_hub', to: 'merch_1', weight: 2 },
  { from: 'medical_1', to: 'food_1', weight: 2 },
  { from: 'medical_1', to: 'food_2', weight: 2 },
  { from: 'merch_1', to: 'sec_202', weight: 1 },
  { from: 'gate_east', to: 'rr_2', weight: 2 },
  { from: 'gate_east', to: 'sec_203', weight: 2 },
  { from: 'gate_west', to: 'rr_1', weight: 2 },
  { from: 'gate_west', to: 'sec_202', weight: 2 },
  { from: 'sec_110', to: 'medical_1', weight: 2, blocked: false },
  { from: 'sec_115', to: 'medical_1', weight: 2, blocked: false },
];
