import { StadiumNode, ProblemCause, IncidentSeverity } from '../data/stadiumGraph';
import styles from './StadiumMap.module.css';

const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; label: string; icon: string }> = {
  critical: { color: '#FF4D6A', bg: 'rgba(255, 77, 106, 0.12)', label: 'CRITICAL', icon: '🔴' },
  warning:  { color: '#FFB020', bg: 'rgba(255, 176, 32, 0.10)', label: 'WARNING',  icon: '🟡' },
  info:     { color: '#60A5FA', bg: 'rgba(96, 165, 250, 0.10)', label: 'INFO',     icon: '🔵' },
  none:     { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', label: 'CLEAR',    icon: '🟢' },
};

const NODE_ICONS: Record<string, string> = {
  gate: '🚪', section: '🏟️', food: '🍔', restroom: '🚻', path: '🚶', medical: '🏥', merch: '🛍️',
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
        <h3 className={styles.panelTitle}>
          <span className={styles.panelTitleIcon} aria-hidden="true">⚡</span>
          Live Incident Feed
        </h3>
        <div className={styles.incidentStats} aria-label="Current incident statistics">
          <span className={styles.statBadgeCritical}>{stats.critical} Critical</span>
          <span className={styles.statBadgeWarning}>{stats.warning} Warning</span>
        </div>
      </div>

      <div className={styles.filterRow}>
        {(['all', 'critical', 'warning', 'info', 'none'] as const).map(sev => (
          <button
            key={sev}
            className={`${styles.filterChip} ${filterSeverity === sev ? styles.filterChipActive : ''}`}
            onClick={() => onFilterChange(sev)}
            style={filterSeverity === sev && sev !== 'all' ? { borderColor: SEVERITY_CONFIG[sev as IncidentSeverity]?.color } : {}}
          >
            {sev === 'all' ? 'All' : SEVERITY_CONFIG[sev].icon + ' ' + SEVERITY_CONFIG[sev].label}
          </button>
        ))}
      </div>

      <div className={styles.incidentList}>
        {filteredIncidents.map((item, i) => {
          const cfg = SEVERITY_CONFIG[item.cause.severity];
          return (
            <div
              key={`${item.node.id}-${i}`}
              className={`${styles.incidentCard} ${selectedNodeId === item.node.id ? styles.incidentCardActive : ''}`}
              onClick={() => onNodeClick(item.node.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onNodeClick(item.node.id);
                }
              }}
              style={{ borderLeftColor: cfg.color }}
              role="button"
              tabIndex={0}
              aria-label={`View details for incident: ${item.cause.title} at ${item.node.label}`}
            >
              <div className={styles.incidentCardHeader}>
                <span className={styles.incidentBadge} style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className={styles.incidentTime}>{item.cause.timestamp}</span>
              </div>
              <h4 className={styles.incidentTitle}>{item.cause.title}</h4>
              <p className={styles.incidentLocation}>
                {NODE_ICONS[item.node.type]} {item.node.label}
                {item.cause.metric && (
                  <span className={styles.incidentMetric}>{item.cause.metric}</span>
                )}
              </p>
              <p className={styles.incidentDesc}>{item.cause.description}</p>
              {item.cause.recommendation && (
                <div className={styles.incidentRec}>
                  <span className={styles.recIcon}>💡</span>
                  <span>{item.cause.recommendation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
