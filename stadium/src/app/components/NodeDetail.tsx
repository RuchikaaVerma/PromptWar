import { StadiumNode, IncidentSeverity } from '../data/stadiumGraph';
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

interface NodeDetailProps {
  selectedNode: StadiumNode | null;
  activePath: string[];
  stadiumNodes: StadiumNode[];
  onClose: () => void;
  getNodeFill: (node: StadiumNode) => string;
}

export function NodeDetail({
  selectedNode,
  activePath,
  stadiumNodes,
  onClose,
  getNodeFill
}: NodeDetailProps) {
  if (!selectedNode) {
    return (
      <aside className={styles.detailPanel}>
        <div className={styles.detailPlaceholder}>
          <div className={styles.placeholderIcon}>🗺️</div>
          <h4>Select a Zone</h4>
          <p>Click any node on the map to view detailed problem cause analysis, capacity metrics, and recommended actions.</p>
        </div>
      </aside>
    );
  }

  const handleGoogleMapsLink = () => {
    // Mock stadium coordinates for demonstration
    const lat = 40.7128;
    const lng = -74.0060;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  return (
    <aside className={`${styles.detailPanel} ${styles.detailPanelOpen}`}>
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderTop}>
          <span className={styles.nodeTypeIcon} aria-hidden="true">{NODE_ICONS[selectedNode.type]}</span>
          <button className={styles.closeBtn} aria-label="Close node details" onClick={onClose}>✕</button>
        </div>
        <h3 className={styles.detailNodeName}>{selectedNode.label}</h3>
        <span className={styles.detailNodeType}>{selectedNode.type.toUpperCase()}</span>
      </div>

      {/* Google Maps Integration Link */}
      <button className={styles.googleMapsBtn} onClick={handleGoogleMapsLink}>
        <span className={styles.googleIcon}>📍</span>
        Locate via Google Maps
      </button>

      {/* Capacity Gauge */}
      <div className={styles.gaugeSection}>
        <div className={styles.gaugeHeader}>
          <span>Capacity</span>
          <span className={styles.gaugeValue} style={{ color: getNodeFill(selectedNode) }}>
            {Math.round((selectedNode.currentLoad / selectedNode.capacity) * 100)}%
          </span>
        </div>
        <div className={styles.gaugeTrack}>
          <div
            className={styles.gaugeFill}
            style={{
              width: `${(selectedNode.currentLoad / selectedNode.capacity) * 100}%`,
              background: getNodeFill(selectedNode),
            }}
          />
        </div>
        <div className={styles.gaugeLabels}>
          <span>{selectedNode.currentLoad} current</span>
          <span>{selectedNode.capacity} max</span>
        </div>
      </div>

      {/* Problem Causes */}
      <div className={styles.causeSection}>
        <h4 className={styles.causeSectionTitle}>
          Root Cause Analysis
          <span className={styles.causeCount}>{selectedNode.problemCauses.length}</span>
        </h4>
        {selectedNode.problemCauses.map((cause, i) => {
          const cfg = SEVERITY_CONFIG[cause.severity];
          return (
            <div key={`${selectedNode.id}-cause-${i}`} className={styles.causeCard} style={{ borderLeftColor: cfg.color }}>
              <div className={styles.causeCardHeader}>
                <span className={styles.causeBadge} style={{ background: cfg.bg, color: cfg.color }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className={styles.causeTime}>{cause.timestamp}</span>
              </div>
              <h5 className={styles.causeTitle}>{cause.title}</h5>
              {cause.metric && (
                <div className={styles.causeMetric}>
                  <span className={styles.causeMetricIcon}>📊</span>
                  {cause.metric}
                </div>
              )}
              <p className={styles.causeDesc}>{cause.description}</p>
              {cause.recommendation && (
                <div className={styles.causeRec}>
                  <div className={styles.causeRecHeader}>
                    <span>💡</span>
                    <span>Recommended Action</span>
                  </div>
                  <p>{cause.recommendation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Route Info */}
      {activePath.length > 1 && (
        <div className={styles.routeSection}>
          <h4 className={styles.routeSectionTitle}>🧭 Optimal Route</h4>
          <div className={styles.routeSteps}>
            {activePath.map((nodeId, i) => {
              const n = stadiumNodes.find(nd => nd.id === nodeId);
              return (
                <div key={nodeId} className={styles.routeStep}>
                  <div className={styles.routeStepDot} style={{ background: i === 0 ? '#fff' : i === activePath.length - 1 ? '#3B82F6' : '#A4B2D1' }} />
                  {i < activePath.length - 1 && <div className={styles.routeStepLine} />}
                  <span className={styles.routeStepLabel}>{n?.label || nodeId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
