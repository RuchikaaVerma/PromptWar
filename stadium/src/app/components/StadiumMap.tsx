import React, { useCallback, useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { Activity, Shield, AlertTriangle, Info, Map as MapIcon, Layers, Maximize2, Zap } from 'lucide-react';
import { stadiumNodes, stadiumEdges, StadiumNode, ProblemCause, IncidentSeverity } from '../data/stadiumGraph';
import { MapSidebar } from './MapSidebar';
import { NodeDetail } from './NodeDetail';
import StadiumSatellite from './StadiumSatellite';
import { trackEvent, TelemetryEvents } from '../../lib/analytics';
import styles from './StadiumMap.module.css';

const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; label: string; Icon: React.ElementType }> = {
  critical: { color: '#FF00FF', bg: 'rgba(255, 0, 255, 0.15)', label: 'CRITICAL', Icon: AlertTriangle },
  warning:  { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)', label: 'WARNING',  Icon: Zap },
  info:     { color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.10)', label: 'OPTIMAL',  Icon: Info },
  none:     { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', label: 'STABLE',   Icon: Shield },
};

/**
 * SVES Smart Stadium Map
 * Orchestrates navigation, incident triage, and route optimization.
 */
// --- MEMOIZED & ANIMATED COMPONENTS ---
const MapNode = React.memo(({ 
  node, 
  isHome, 
  isSelected, 
  isPathNode, 
  isHovered, 
  fill, 
  stroke, 
  onClick, 
  onMouseEnter, 
  onMouseLeave 
}: {
  node: StadiumNode;
  isHome: boolean;
  isSelected: boolean;
  isPathNode: boolean;
  isHovered: boolean;
  fill: string;
  stroke: string;
  onClick: (id: string) => void;
  onMouseEnter: (id: string) => void;
  onMouseLeave: () => void;
}) => {
  const pct = Math.round((node.currentLoad / node.capacity) * 100);
  return (
    <motion.g 
      initial={false}
      animate={{ scale: isHovered || isSelected ? 1.15 : 1 }}
      className={styles.nodeGroup} 
      onClick={() => onClick(node.id)} 
      onMouseEnter={() => onMouseEnter(node.id)} 
      onMouseLeave={onMouseLeave} 
      style={{ cursor: 'pointer', pointerEvents: 'all' }}
    >
      <circle cx={node.x} cy={node.y} r="6.5" fill="none" stroke={stroke} strokeWidth="0.5" className={styles.selectRing} opacity={isSelected ? 1 : 0} />
      <motion.circle 
        cx={node.x} cy={node.y} r="5.5" fill="none" stroke={fill} strokeWidth="0.4" 
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.2, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className={styles.nodePulse} opacity={(isPathNode || isHome) ? 1 : 0} 
      />
      {isHome && <circle cx={node.x} cy={node.y} r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" className={styles.homeGlow} />}
      <motion.circle 
        cx={node.x} cy={node.y} r={isHome ? '4' : '3.2'} 
        fill={isHome ? '#fff' : fill} 
        stroke={isSelected ? '#fff' : stroke} 
        strokeWidth={isSelected ? '1' : '0.6'} 
        animate={{ filter: isSelected ? 'drop-shadow(0 0 4px #fff)' : 'none' }}
        className={styles.node} 
      />
      <text x={node.x} y={node.y - 5.5} className={styles.nodeLabel} textAnchor="middle" fill={isSelected ? '#fff' : 'var(--on-surface-variant)'} fontWeight={isSelected ? '700' : '500'}>{isHome ? '📍 YOU' : node.label}</text>
      <text x={node.x} y={node.y + 6} fontSize="2.2" textAnchor="middle" fill={fill} fontFamily="var(--font-technical)" fontWeight="600">{pct}%</text>
      
      <motion.g 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: isHovered && !isSelected ? 1 : 0, scale: isHovered && !isSelected ? 1 : 0.8, y: isHovered && !isSelected ? 0 : 5 }}
        className={styles.tooltipGroup}
      >
        <rect x={node.x - 16} y={node.y + 8} width="32" height="11" rx="2" fill="rgba(10, 12, 16, 0.95)" stroke="var(--primary)" strokeWidth="0.3" />
        <text x={node.x} y={node.y + 13} fontSize="2.5" fill="#fff" textAnchor="middle" fontFamily="var(--font-technical)" fontWeight="600">{node.currentLoad}/{node.capacity} units</text>
        <text x={node.x} y={node.y + 17} fontSize="2.2" fill={SEVERITY_CONFIG[node.problemCauses[0]?.severity || 'none'].color} textAnchor="middle" fontFamily="var(--font-technical)" fontWeight="700">
           {node.problemCauses[0]?.title.toUpperCase() || 'SYSTEM STABLE'}
        </text>
      </motion.g>
    </motion.g>
  );
});
MapNode.displayName = 'MapNode';

const MapEdge = React.memo(({ 
  start, 
  end, 
  blocked, 
  isActive 
}: { 
  start: StadiumNode; 
  end: StadiumNode; 
  blocked: boolean; 
  isActive: boolean;
}) => {
  if (isActive) {
    return (
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={styles.edgeActive} />
        <motion.line 
          x1={start.x} y1={start.y} x2={end.x} y2={end.y} 
          className={styles.edgeActiveAnimated} 
        />
      </motion.g>
    );
  }
  return <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={blocked ? styles.edgeBlocked : styles.edge} />;
});
MapEdge.displayName = 'MapEdge';


export default function StadiumMap() {
  const [activePath, setActivePath] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'all'>('all');
  const [mapView, setMapView] = useState<'schematic' | 'satellite'>('schematic');
  const pathCalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 3D PARALLAX LOGIC ---
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { damping: 20, stiffness: 100 });
  const springY = useSpring(mouseY, { damping: 20, stiffness: 100 });

  const rotateX = useTransform(springY, [0, 1], [5, -5]);
  const rotateY = useTransform(springX, [0, 1], [-5, 5]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  };

  const selectedNode = useMemo(() => stadiumNodes.find(n => n.id === selectedNodeId) || null, [selectedNodeId]);

  // Aggregate and sort incidents
  const allIncidents = useMemo(() => {
    const incidents: { node: StadiumNode; cause: ProblemCause }[] = [];
    stadiumNodes.forEach(node => {
      node.problemCauses.forEach(cause => {
        incidents.push({ node, cause });
      });
    });
    const order: Record<IncidentSeverity, number> = { critical: 0, warning: 1, info: 2, none: 3 };
    incidents.sort((a, b) => order[a.cause.severity] - order[b.cause.severity]);
    return incidents;
  }, []);

  const filteredIncidents = useMemo(() => {
    if (filterSeverity === 'all') return allIncidents;
    return allIncidents.filter(i => i.cause.severity === filterSeverity);
  }, [allIncidents, filterSeverity]);

  const stats = useMemo(() => {
    const critical = allIncidents.filter(i => i.cause.severity === 'critical').length;
    const warning = allIncidents.filter(i => i.cause.severity === 'warning').length;
    const totalPeople = stadiumNodes.reduce((s, n) => s + n.currentLoad, 0);
    const totalCap = stadiumNodes.reduce((s, n) => s + n.capacity, 0);
    return { critical, warning, totalPeople, totalCap, utilization: Math.round((totalPeople / totalCap) * 100) };
  }, [allIncidents]);

  // BFS pathfinding
  const calculatePath = useCallback(async (targetId: string) => {
    if (pathCalcRef.current) clearTimeout(pathCalcRef.current);
    setLoading(true);
    setActivePath([]);

    pathCalcRef.current = setTimeout(async () => {
      const queue: {node: string, path: string[]}[] = [{node: 'sec_110', path: ['sec_110']}];
      const visited = new Set<string>();
      let foundPath: string[] = [];

      while (queue.length > 0) {
        const {node, path} = queue.shift()!;
        if (node === targetId) { foundPath = path; break; }
        if (!visited.has(node)) {
          visited.add(node);
          const neighbors = stadiumEdges
            .filter(e => !e.blocked && (e.from === node || e.to === node))
            .map(e => e.from === node ? e.to : e.from);
          for (const neighbor of neighbors) {
            queue.push({node: neighbor, path: [...path, neighbor]});
          }
        }
      }
      setActivePath(foundPath);
      setLoading(false);
      
      if (foundPath.length > 0) {
        await trackEvent(TelemetryEvents.ROUTE_CALCULATED, { destination: targetId, steps: foundPath.length });
      }
    }, 350);
  }, []);

  const getNodeFill = (node: StadiumNode) => {
    const pct = node.currentLoad / node.capacity;
    if (pct >= 0.8) return '#FF4D6A';
    if (pct >= 0.5) return '#FFB020';
    return '#10B981';
  };

  const getNodeStroke = (node: StadiumNode) => {
    const worst = node.problemCauses.reduce<IncidentSeverity>((max, c) => {
      const order: Record<IncidentSeverity, number> = { critical: 0, warning: 1, info: 2, none: 3 };
      return order[c.severity] < order[max] ? c.severity : max;
    }, 'none');
    return SEVERITY_CONFIG[worst].color;
  };

  const handleNodeClick = useCallback(async (nodeId: string) => {
    setSelectedNodeId(prev => (prev === nodeId ? prev : nodeId));
    calculatePath(nodeId);
    await trackEvent(TelemetryEvents.MAP_NODE_SELECT, { nodeId });
  }, [calculatePath]);

  return (
    <div className={styles.mapPage}>
      <MapSidebar
        filteredIncidents={filteredIncidents}
        stats={stats}
        selectedNodeId={selectedNodeId}
        filterSeverity={filterSeverity}
        onNodeClick={handleNodeClick}
        onFilterChange={setFilterSeverity}
      />

      <main className={styles.mapMain}>
        <div className={styles.metricsBar}>
          <div className={styles.metricPill}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
               <Activity size={13} className="glow-cyan pulse-glow" />
               <span className={styles.metricPillLabel}>Venue Load</span>
            </div>
            <span className={styles.metricPillValue}>{stats.utilization}%</span>
            <div className={styles.metricBarTrack}>
              <div className={styles.metricBarFill} style={{
                width: `${stats.utilization}%`,
                background: stats.utilization > 75 ? 'var(--secondary)' : stats.utilization > 50 ? '#FBBF24' : 'var(--primary)',
                boxShadow: `0 0 8px ${stats.utilization > 75 ? 'rgba(255,0,255,0.5)' : 'rgba(0,255,255,0.5)'}`
              }} />
            </div>
          </div>
          <div className={styles.metricPill}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
               <Maximize2 size={13} className="glow-cyan" strokeWidth={2.5} />
               <span className={styles.metricPillLabel}>Headcount</span>
            </div>
            <span className={styles.metricPillValue}>{stats.totalPeople.toLocaleString()}</span>
          </div>
          <div className={styles.metricPill}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
               <AlertTriangle size={13} className="glow-magenta pulse-glow" />
               <span className={styles.metricPillLabel}>Active Alerts</span>
            </div>
            <span className={styles.metricPillValue} style={{ color: stats.critical > 0 ? 'var(--secondary)' : '#10B981', textShadow: `0 0 10px ${stats.critical > 0 ? 'rgba(255,0,255,0.35)' : 'rgba(16,185,129,0.35)'}` }}>{stats.critical + stats.warning}</span>
          </div>

          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${mapView === 'schematic' ? styles.toggleBtnActive : ''}`}
              onClick={() => setMapView('schematic')}
            >
              <Layers size={13} />
              Schematic
            </button>
            <button
              className={`${styles.toggleBtn} ${mapView === 'satellite' ? styles.toggleBtnActive : ''}`}
              onClick={() => setMapView('satellite')}
            >
              <MapIcon size={13} />
              Satellite
            </button>
          </div>
        </div>

        <div className={styles.mapCanvasWrapper} onMouseMove={handleMouseMove}>
            {loading && (
              <div className={styles.mapOverlay} aria-live="assertive">
                <div className={styles.mapSpinner} aria-hidden="true" />
                <span>Calculating Optimal Route…</span>
              </div>
            )}

            {mapView === 'satellite' ? (
              <StadiumSatellite />
            ) : (
              <motion.svg 
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
                className={styles.svgMap} 
                viewBox="0 0 100 100" 
                preserveAspectRatio="xMidYMid meet" 
                role="img" 
                aria-label="Interactive map of the stadium"
              >
                <title>Interactive Stadium Map</title>
                <defs>
                  <filter id="nodeGlow"><feGaussianBlur stdDeviation="1.2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <filter id="nodeGlowStrong"><feGaussianBlur stdDeviation="2" /><feMerge><feMergeNode /><feMergeNode in="SourceGraphic"/></feMerge></filter>
                  <radialGradient id="heatHigh" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,77,106,0.2)" /><stop offset="100%" stopColor="rgba(255,77,106,0)" /></radialGradient>
                  <radialGradient id="heatMed" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="rgba(255,176,32,0.12)" /><stop offset="100%" stopColor="rgba(255,176,32,0)" /></radialGradient>
                </defs>

                {stadiumNodes.map(node => {
                  const pct = node.currentLoad / node.capacity;
                  if (pct < 0.5) return null;
                  return <circle key={`heat-${node.id}`} cx={node.x} cy={node.y} r={pct >= 0.8 ? 10 : 7} fill={pct >= 0.8 ? 'url(#heatHigh)' : 'url(#heatMed)'} className={styles.heatHalo} />;
                })}

                {stadiumEdges.map((edge, i) => {
                  const start = stadiumNodes.find(n => n.id === edge.from);
                  const end = stadiumNodes.find(n => n.id === edge.to);
                  if (!start || !end) return null;
                  const isActive = activePath.includes(start.id) && activePath.includes(end.id) && Math.abs(activePath.indexOf(start.id) - activePath.indexOf(end.id)) === 1;
                  return <MapEdge key={`e-${i}`} start={start} end={end} blocked={!!edge.blocked} isActive={isActive} />;
                })}

                {stadiumNodes.map(node => (
                  <MapNode
                    key={node.id}
                    node={node}
                    isHome={node.id === 'sec_110'}
                    isSelected={selectedNodeId === node.id}
                    isPathNode={activePath.includes(node.id)}
                    isHovered={hoveredNodeId === node.id}
                    fill={getNodeFill(node)}
                    stroke={getNodeStroke(node)}
                    onClick={handleNodeClick}
                    onMouseEnter={setHoveredNodeId}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  />
                ))}
              </motion.svg>
            )}

            {mapView === 'schematic' && (
              <div className={styles.mapLegend}>
                <div className={styles.legendTitle}>System Status</div>
                <div className={styles.legendItems}>
                  <div className={styles.legendItem}><span style={{background: '#10B981'}} />STABLE</div>
                  <div className={styles.legendItem}><span style={{background: '#FBBF24'}} />WARNING</div>
                  <div className={styles.legendItem}><span style={{background: '#FF00FF'}} />CRITICAL</div>
                  <div className={styles.legendDivider} /><div className={styles.legendItem}><span style={{background: '#00FFFF'}} />ROUTE</div>
                </div>
              </div>
            )}
          </div>
      </main>

      <NodeDetail
        selectedNode={selectedNode}
        activePath={activePath}
        stadiumNodes={stadiumNodes}
        onClose={() => { setSelectedNodeId(null); setActivePath([]); }}
        getNodeFill={getNodeFill}
      />
    </div>
  );
}

