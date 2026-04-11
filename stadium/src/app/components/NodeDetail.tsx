import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Target, 
  Activity, 
  AlertTriangle, 
  Info, 
  Shield, 
  Zap, 
  Navigation,
  MapPin,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { StadiumNode, IncidentSeverity } from '../data/stadiumGraph';
import styles from './StadiumMap.module.css';

const SEVERITY_CONFIG: Record<IncidentSeverity, { color: string; bg: string; label: string; Icon: React.ElementType; glowClass: string }> = {
  critical: { color: '#FF00FF', bg: 'rgba(255, 0, 255, 0.15)', label: 'CRITICAL', Icon: AlertTriangle, glowClass: 'glow-magenta' },
  warning:  { color: '#FBBF24', bg: 'rgba(251, 191, 36, 0.10)', label: 'WARNING',  Icon: Zap,           glowClass: 'glow-amber' },
  info:     { color: '#00FFFF', bg: 'rgba(0, 255, 255, 0.10)', label: 'OPTIMAL',  Icon: Info,          glowClass: 'glow-cyan' },
  none:     { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', label: 'STABLE',   Icon: Shield,        glowClass: '' },
};

const NODE_TYPES: Record<string, { Icon: React.ElementType }> = {
  gate:     { Icon: Navigation },
  section:  { Icon: Target },
  food:     { Icon: Activity },
  restroom: { Icon: Activity },
  path:     { Icon: Navigation },
  medical:  { Icon: Shield },
  merch:    { Icon: Activity },
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
          <div className={`${styles.placeholderIcon} glow-cyan pulse-glow`}>
            <Target size={36} strokeWidth={1.2} />
          </div>
          <h4 className="technical-text">Select a Node</h4>
          <p>Initialize tactical analysis for a specific venue sector to view real-time telemetry and optimization recommendations.</p>
        </div>
      </aside>
    );
  }

  const handleGoogleMapsLink = () => {
    const lat = 40.7128;
    const lng = -74.0060;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const TypeIcon = NODE_TYPES[selectedNode.type]?.Icon || Navigation;

  return (
    <aside className={`${styles.detailPanel} ${styles.detailPanelOpen}`}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.detailHeaderTop}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${styles.nodeTypeIcon} glow-cyan`}
          >
            <TypeIcon size={22} />
          </motion.div>
          <button className={styles.closeBtn} aria-label="Terminate analysis" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <h3 className={styles.detailNodeName}>{selectedNode.label}</h3>
        <span className={`${styles.detailNodeType} technical-text`}>{selectedNode.type} sector protocol</span>
      </div>

      {/* Navigate Button */}
      <button className={styles.googleMapsBtn} onClick={handleGoogleMapsLink}>
        <MapPin size={14} className="glow-cyan" style={{ marginRight: '8px' }} />
        <span className="technical-text">Locate Satellite Uplink</span>
      </button>

      {/* Capacity Gauge */}
      <div className={styles.gaugeSection}>
        <div className={styles.gaugeHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={13} className="glow-cyan" />
            <span className="technical-text">Infrastructure Load</span>
          </div>
          <span className={`${styles.gaugeValue} technical-text`} style={{ color: getNodeFill(selectedNode) }}>
            {Math.round((selectedNode.currentLoad / selectedNode.capacity) * 100)}%
          </span>
        </div>
        <div className={styles.gaugeTrack}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(selectedNode.currentLoad / selectedNode.capacity) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className={styles.gaugeFill}
            style={{
              background: getNodeFill(selectedNode),
              boxShadow: `0 0 10px ${getNodeFill(selectedNode)}88`
            }}
          />
        </div>
        <div className={styles.gaugeLabels}>
          <span className="technical-text">{selectedNode.currentLoad} units active</span>
          <span className="technical-text">{selectedNode.capacity} max capacity</span>
        </div>
      </div>

      {/* Problem Cause Analysis */}
      <div className={styles.causeSection}>
        <h4 className={`${styles.causeSectionTitle} technical-text`}>
          Tactical Analysis
          <span className={styles.causeCount}>{selectedNode.problemCauses.length}</span>
        </h4>
        <AnimatePresence mode="popLayout">
          {selectedNode.problemCauses.map((cause, i) => {
            const cfg = SEVERITY_CONFIG[cause.severity];
            const CauseIcon = cfg.Icon;
            return (
              <motion.div 
                key={`${selectedNode.id}-cause-${i}`} 
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={styles.causeCard} 
                style={{ borderLeftColor: cfg.color }}
              >
                <div className={styles.causeCardHeader}>
                  <span className={`${styles.causeBadge} technical-text`} style={{ background: cfg.bg, color: cfg.color }}>
                    <CauseIcon size={11} className={cfg.glowClass} style={{ marginRight: '4px' }} /> {cfg.label}
                  </span>
                  <span className={styles.causeTime}>{cause.timestamp}</span>
                </div>
                <h5 className={styles.causeTitle}>{cause.title}</h5>
                {cause.metric && (
                  <div className={styles.causeMetric}>
                    <TrendingUp size={11} style={{ marginRight: '7px', opacity: 0.5 }} />
                    <span className="technical-text" style={{ fontSize: '0.68rem' }}>{cause.metric}</span>
                  </div>
                )}
                <p className={styles.causeDesc}>{cause.description}</p>
                {cause.recommendation && (
                  <div className={styles.causeRec}>
                    <div className={styles.causeRecHeader}>
                      <Lightbulb size={11} className="glow-amber" style={{ marginRight: '7px' }} />
                      <span className="technical-text">Mitigation Protocol</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', opacity: 0.88, lineHeight: 1.45 }}>{cause.recommendation}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Route Info */}
      {activePath.length > 1 && (
        <div className={styles.routeSection}>
          <h4 className={`${styles.routeSectionTitle} technical-text`}>
            <Navigation size={13} style={{ marginRight: '8px' }} /> Kinetic Route
          </h4>
          <div className={styles.routeSteps}>
            {activePath.map((nodeId, i) => {
              const n = stadiumNodes.find(nd => nd.id === nodeId);
              const isFirst = i === 0;
              const isLast = i === activePath.length - 1;
              return (
                <div key={nodeId} className={styles.routeStep}>
                  <div 
                    className={styles.routeStepDot} 
                    style={{ 
                      background: isFirst ? 'var(--primary)' : isLast ? 'var(--secondary)' : 'rgba(255,255,255,0.18)',
                      boxShadow: isFirst ? '0 0 8px var(--primary)' : isLast ? '0 0 8px var(--secondary)' : 'none'
                    }} 
                  />
                  {i < activePath.length - 1 && <div className={styles.routeStepLine} />}
                  <span 
                    className={`${styles.routeStepLabel} ${isLast ? 'glow-magenta' : ''}`}
                    style={{ fontWeight: isFirst || isLast ? 700 : 500 }}
                  >
                    {isFirst ? '📍 ' : ''}{n?.label || nodeId}{isLast ? ' 🎯' : ''}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
