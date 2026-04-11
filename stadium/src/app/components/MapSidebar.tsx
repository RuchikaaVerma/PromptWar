import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  AlertTriangle, 
  Info, 
  Shield, 
  Activity, 
  Target, 
  Navigation, 
  Lightbulb,
  Radio
} from 'lucide-react';
import { StadiumNode, ProblemCause, IncidentSeverity } from '../data/stadiumGraph';
import styles from './StadiumMap.module.css';

const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; label: string; Icon: React.ElementType; glowClass: string }> = {
  critical: { color: '#FF00FF', bg: 'rgba(255, 0, 255, 0.15)', label: 'CRITICAL', Icon: AlertTriangle, glowClass: 'glow-magenta' },
  warning:  { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)', label: 'WARNING',  Icon: Zap,           glowClass: 'glow-amber' },
  info:     { color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.10)', label: 'OPTIMAL',  Icon: Info,          glowClass: 'glow-cyan' },
  none:     { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', label: 'STABLE',   Icon: Shield,        glowClass: '' },
};

const NODE_ICONS: Record<string, React.ElementType> = {
  gate: Navigation,
  section: Target,
  food: Activity,
  restroom: Radio,
  path: Navigation,
  medical: Shield,
  merch: Activity,
};

interface MapSidebarProps {
  filteredIncidents: { node: StadiumNode; cause: ProblemCause }[];
  stats: { critical: number; warning: number };
  selectedNodeId: string | null;
  filterSeverity: IncidentSeverity | 'all';
  onNodeClick: (nodeId: string) => void;
  onFilterChange: (sev: IncidentSeverity | 'all') => void;
}

export function MapSidebar({
  filteredIncidents,
  stats,
  selectedNodeId,
  filterSeverity,
  onNodeClick,
  onFilterChange
}: MapSidebarProps) {
  return (
    <aside className={styles.sidePanel} aria-label="Incident Feed" aria-live="polite">
      <div className={styles.sidePanelHeader}>
        <h3 className={`${styles.panelTitle} technical-text`}>
          <Radio size={15} className="glow-cyan pulse-glow" style={{ marginRight: '6px' }} />
          KINETIC TELEMETRY FEED
        </h3>
        <div className={styles.incidentStats}>
          <span className={`${styles.statBadgeCritical} technical-text`}>{stats.critical} CRITICAL</span>
          <span className={`${styles.statBadgeWarning} technical-text`}>{stats.warning} WARNING</span>
        </div>
      </div>

      <div className={styles.filterRow}>
        {(['all', 'critical', 'warning', 'info', 'none'] as const).map(sev => {
          const cfg = sev !== 'all' ? SEVERITY_CONFIG[sev] : null;
          const Icon = cfg?.Icon;
          return (
            <button
              key={sev}
              className={`${styles.filterChip} ${filterSeverity === sev ? styles.filterChipActive : ''}`}
              onClick={() => onFilterChange(sev)}
              style={filterSeverity === sev && sev !== 'all' && cfg ? { borderColor: cfg.color } : {}}
            >
              {sev === 'all' ? (
                <span className="technical-text">ALL</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }} className="technical-text">
                  {Icon && <Icon size={11} className={filterSeverity === sev ? cfg!.glowClass : ''} />}
                  {cfg?.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className={styles.incidentList}>
        <AnimatePresence mode="popLayout">
          {filteredIncidents.map((item, i) => {
            const cfg = SEVERITY_CONFIG[item.cause.severity];
            const CauseIcon = cfg.Icon;
            const NodeIcon = NODE_ICONS[item.node.type] || Target;
            return (
              <motion.div
                key={`${item.node.id}-${i}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`${styles.incidentCard} ${selectedNodeId === item.node.id ? styles.incidentCardActive : ''}`}
                onClick={() => onNodeClick(item.node.id)}
                style={{ borderLeftColor: cfg.color }}
                role="button"
                tabIndex={0}
              >
                <div className={styles.incidentCardHeader}>
                  <span
                    className={`${styles.incidentBadge} technical-text`}
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    <CauseIcon size={10} className={cfg.glowClass} style={{ marginRight: '4px' }} />
                    {cfg.label}
                  </span>
                  <span className={styles.incidentTime}>{item.cause.timestamp}</span>
                </div>
                <h4 className={styles.incidentTitle}>{item.cause.title}</h4>
                <div className={styles.incidentLocation}>
                  <NodeIcon size={11} style={{ marginRight: '5px', opacity: 0.55, flexShrink: 0 }} />
                  <span className="technical-text" style={{ fontSize: '0.62rem' }}>{item.node.label}</span>
                  {item.cause.metric && (
                    <span className={`${styles.incidentMetric} technical-text`}>{item.cause.metric}</span>
                  )}
                </div>
                <p className={styles.incidentDesc}>{item.cause.description}</p>
                {item.cause.recommendation && (
                  <div className={styles.incidentRec}>
                    <Lightbulb size={12} className="glow-amber" style={{ marginRight: '6px', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.7rem' }}>{item.cause.recommendation}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
