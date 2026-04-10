"use client";
import { useCallback, useRef, useState, useMemo } from 'react';
import { stadiumNodes, stadiumEdges, StadiumNode, ProblemCause, IncidentSeverity } from '../data/stadiumGraph';
import { MapSidebar } from './MapSidebar';
import { NodeDetail } from './NodeDetail';
import { trackEvent, TelemetryEvents } from '../../lib/analytics';
import styles from './StadiumMap.module.css';


const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; label: string; icon: string }> = {
  critical: { color: '#FF4D6A', bg: 'rgba(255, 77, 106, 0.12)', label: 'CRITICAL', icon: '🔴' },
  warning:  { color: '#FFB020', bg: 'rgba(255, 176, 32, 0.10)', label: 'WARNING',  icon: '🟡' },
  info:     { color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.10)', label: 'INFO',     icon: '🔵' },
  none:     { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', label: 'CLEAR',    icon: '🟢' },
};

/**
 * SVES Smart Stadium Map
 * Orchestrates navigation, incident triage, and route optimization.
 */
export default function StadiumMap() {
  const [activePath, setActivePath] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<IncidentSeverity | 'all'>('all');
  const pathCalcRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
            <span className={styles.metricPillLabel}>Venue Load</span>
            <span className={styles.metricPillValue}>{stats.utilization}%</span>
            <div className={styles.metricBarTrack}>
              <div className={styles.metricBarFill} style={{
                width: `${stats.utilization}%`,
                background: stats.utilization > 75 ? '#FF4D6A' : stats.utilization > 50 ? '#FFB020' : '#10B981'
              }} />
            </div>
          </div>
          <div className={styles.metricPill}>
            <span className={styles.metricPillLabel}>Headcount</span>
            <span className={styles.metricPillValue}>{stats.totalPeople.toLocaleString()}</span>
          </div>
          <div className={styles.metricPill}>
            <span className={styles.metricPillLabel}>Capacity</span>
            <span className={styles.metricPillValue}>{stats.totalCap.toLocaleString()}</span>
          </div>
          <div className={styles.metricPill}>
            <span className={styles.metricPillLabel}>Active Alerts</span>
            <span className={styles.metricPillValue} style={{ color: '#FF4D6A' }}>{stats.critical + stats.warning}</span>
          </div>
        </div>

        <div className={styles.mapCanvasWrapper}>
          {loading && (
            <div className={styles.mapOverlay} aria-live="assertive">
              <div className={styles.mapSpinner} aria-hidden="true" />
              <p>Calculating Optimal Route…</p>
            </div>
          )}

          <svg className={styles.svgMap} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interactive map of the stadium">
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
              return !isActive && <line key={`e-${i}`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={edge.blocked ? styles.edgeBlocked : styles.edge} />;
            })}

            {stadiumEdges.map((edge, i) => {
              const start = stadiumNodes.find(n => n.id === edge.from);
              const end = stadiumNodes.find(n => n.id === edge.to);
              if (!start || !end) return null;
              const isActive = activePath.includes(start.id) && activePath.includes(end.id) && Math.abs(activePath.indexOf(start.id) - activePath.indexOf(end.id)) === 1;
              return isActive && (
                <g key={`ae-${i}`}>
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={styles.edgeActive} />
                  <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} className={styles.edgeActiveAnimated} />
                </g>
              );
            })}

            {stadiumNodes.map(node => {
              const isPathNode = activePath.includes(node.id);
              const isHome = node.id === 'sec_110';
              const isSelected = selectedNodeId === node.id;
              const isHovered = hoveredNodeId === node.id;
              const fill = getNodeFill(node);
              const stroke = getNodeStroke(node);
              const pct = Math.round((node.currentLoad / node.capacity) * 100);

              return (
                <g key={node.id} className={styles.nodeGroup} onClick={() => handleNodeClick(node.id)} onMouseEnter={() => setHoveredNodeId(node.id)} onMouseLeave={() => setHoveredNodeId(null)} role="button" tabIndex={0} aria-label={`Zone ${node.label}, ${pct}% capacity`}>
                  <circle cx={node.x} cy={node.y} r="6.5" fill="none" stroke={stroke} strokeWidth="0.5" className={styles.selectRing} opacity={isSelected ? 1 : 0} />
                  <circle cx={node.x} cy={node.y} r="5.5" fill="none" stroke={fill} strokeWidth="0.4" className={styles.nodePulse} opacity={(isPathNode || isHome) ? 1 : 0} />
                  {isHome && <circle cx={node.x} cy={node.y} r="5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" className={styles.homeGlow} />}
                  <circle cx={node.x} cy={node.y} r={isHome ? '4' : '3.2'} fill={isHome ? '#fff' : fill} stroke={isSelected ? '#fff' : stroke} strokeWidth={isSelected ? '1' : '0.6'} className={styles.node} filter={isSelected ? 'url(#nodeGlowStrong)' : isPathNode ? 'url(#nodeGlow)' : undefined} />
                  <text x={node.x} y={node.y - 5.5} className={styles.nodeLabel} textAnchor="middle" fill={isSelected ? '#fff' : 'var(--on-surface-variant)'} fontWeight={isSelected ? '700' : '500'}>{isHome ? '📍 YOU' : node.label}</text>
                  <text x={node.x} y={node.y + 6} fontSize="2.2" textAnchor="middle" fill={fill} fontFamily="var(--font-body)" fontWeight="600">{pct}%</text>
                  <g opacity={isHovered && !isSelected ? 1 : 0} className={styles.tooltipGroup}>
                    <rect x={node.x - 16} y={node.y + 8} width="32" height="11" rx="2" fill="rgba(0,0,0,0.92)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.3" />
                    <text x={node.x} y={node.y + 13} fontSize="2.5" fill="#fff" textAnchor="middle" fontFamily="var(--font-body)" fontWeight="600">{node.currentLoad}/{node.capacity} people</text>
                    <text x={node.x} y={node.y + 17} fontSize="2" fill={SEVERITY_CONFIG[node.problemCauses[0]?.severity || 'none'].color} textAnchor="middle" fontFamily="var(--font-body)">{node.problemCauses[0]?.title || 'Normal'}</text>
                  </g>
                </g>
              );
            })}
          </svg>

          <div className={styles.mapLegend}>
            <div className={styles.legendTitle}>Capacity Load</div>
            <div className={styles.legendItems}>
              <div className={styles.legendItem}><span style={{background: '#10B981'}} />&lt; 50%</div>
              <div className={styles.legendItem}><span style={{background: '#FFB020'}} />50-80%</div>
              <div className={styles.legendItem}><span style={{background: '#FF4D6A'}} />&gt; 80%</div>
              <div className={styles.legendDivider} /><div className={styles.legendItem}><span style={{background: '#3B82F6'}} />Route</div>
            </div>
          </div>
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

