"use client";
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  Shield, 
  MessageSquareCode, 
  LayoutDashboard, 
  Navigation, 
  CreditCard, 
  Ticket, 
  Activity,
  Cpu,
  Radio,
  TrendingUp,
  Users,
  AlertTriangle,
  Zap,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { trackEvent, trackPageView, TelemetryEvents } from '../lib/analytics';
import { getAssistantResponseAction, logSafetyAlertAction } from './actions';

import styles from './page.module.css';
import StadiumMap from './components/StadiumMap';
import FoodOrdering from './components/FoodOrdering';
import '../lib/firebase'; // Initialize Firebase on client boot

type TabType = 'dashboard' | 'map' | 'food' | 'tickets' | 'assistant';

const TABS: { id: TabType; label: string; Icon: React.ElementType; desc: string }[] = [
  { id: 'dashboard', label: 'OVERVIEW',   Icon: LayoutDashboard,    desc: 'Live ops' },
  { id: 'map',       label: 'NAVIGATOR',  Icon: Navigation,          desc: 'Routing' },
  { id: 'food',      label: 'TERMINAL',   Icon: CreditCard,          desc: 'Order' },
  { id: 'tickets',   label: 'IDENTITY',   Icon: Ticket,              desc: 'Access' },
  { id: 'assistant', label: 'ASSISTANT',  Icon: MessageSquareCode,   desc: 'AI Chat' },
];

// ─── 3D TILT CARD ───────────────────────────────────────────────────────────
function TelemetryCard({ children, className = "", accent = false }: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 400, damping: 40 });
  const mouseY = useSpring(y, { stiffness: 400, damping: 40 });
  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-8deg", "8deg"]);
  const glow = useTransform(mouseX, [-0.5, 0.5], [
    `radial-gradient(600px circle at 0% 50%, ${accent ? 'rgba(255,0,255,0.08)' : 'rgba(0,255,255,0.08)'}, transparent)`,
    `radial-gradient(600px circle at 100% 50%, ${accent ? 'rgba(255,0,255,0.08)' : 'rgba(0,255,255,0.08)'}, transparent)`
  ]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", backgroundImage: glow }}
      className={`${styles.telemetryCard} ${accent ? styles.telemetryCardAccent : ''} ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
        {children}
      </div>
    </motion.div>
  );
}

// ─── LIVE CLOCK ─────────────────────────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className={styles.liveClock} aria-live="polite">{time}</span>;
}

// ─── STAT COUNTER ───────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(target / 40);
    const id = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(start);
      if (start >= target) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [target]);
  return <>{val.toLocaleString()}{suffix}</>;
}

// ─── MAIN APP ───────────────────────────────────────────────────────────────
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [rerouteAccepted, setRerouteAccepted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'SVES AI Kernel v2.1 initialized. Real-time telemetry linked. I can help you navigate the venue, find food, check wait times, or manage crowd incidents. What do you need?' }
  ]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isTyping]);

  const switchTab = async (id: TabType) => {
    setActiveTab(id);
    await trackEvent(TelemetryEvents.TAB_SWITCH, { tab: id });
    await trackPageView(id);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLog(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);
    await trackEvent(TelemetryEvents.AI_CHAT_MSG, { length: userMsg.length });
    const history = chatLog.map(msg => ({
      role: (msg.role === 'ai' ? 'model' : 'user') as 'model' | 'user',
      parts: [{ text: msg.text }]
    }));
    const responseText = await getAssistantResponseAction(userMsg, history);
    setChatLog(prev => [...prev, { role: 'ai', text: responseText }]);
    setIsTyping(false);
  };

  return (
    <div className={styles.shell}>
      {/* ─── HEADER ─── */}
      <header className={styles.header} role="banner">
        <div className={styles.headerLeft}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={styles.logo}>
            <motion.span
              className={styles.logoIcon}
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >◆</motion.span>
            <span className={styles.logoText}>VELOCITY ARENA</span>
          </motion.div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>AETHER COMMAND CENTER</h1>
            <p className={styles.headerSub}>Smart Venue Experience System • Neural Routing v2.1</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.headerMetrics}>
            <div className={styles.headerMetric}>
              <Users size={12} className="glow-cyan" style={{ display: 'inline', marginRight: '5px' }} />
              <span className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>ATTENDANCE</span>
              <span className={styles.headerMetricValue}><AnimatedCounter target={18420} /></span>
            </div>
            <div className={styles.headerMetric}>
              <TrendingUp size={12} className="glow-magenta" style={{ display: 'inline', marginRight: '5px' }} />
              <span className="technical-text" style={{ fontSize: '0.65rem', color: 'var(--on-surface-variant)' }}>LOAD AVG</span>
              <span className={styles.headerMetricValue} style={{ color: 'var(--secondary)' }}>68%</span>
            </div>
          </div>
          <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }} 
            transition={{ duration: 3.5, repeat: Infinity }}
            className={styles.broadcast}
          >
            <span className={styles.broadcastDot} />
            <span className={styles.broadcastLabel}>LIVE</span>
            <span className={styles.broadcastText}>Egress routing active — Redirect all units to South Gate</span>
          </motion.div>
          <LiveClock />
        </div>
      </header>

      {/* ─── NAVIGATION ─── */}
      <nav className={styles.nav} role="tablist" aria-label="Primary navigation">
        {TABS.map(({ id, label, Icon, desc }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              id={`tab-${id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              className={`${styles.navBtn} ${isActive ? styles.navBtnActive : ''}`}
              onClick={() => switchTab(id)}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className={styles.activeIndicator}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <Icon 
                size={15}
                style={{ 
                  position: 'relative', zIndex: 1, 
                  color: isActive ? 'var(--primary)' : 'rgba(185,202,201,0.5)',
                  filter: isActive ? 'drop-shadow(0 0 6px rgba(0,255,255,0.8))' : 'none',
                  marginRight: '8px',
                  flexShrink: 0
                }}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div className="technical-text" style={{ fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.2 }}>{label}</div>
                <div style={{ fontSize: '0.52rem', color: 'var(--on-surface-variant)', letterSpacing: '0.05em', opacity: 0.6 }}>{desc}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* ─── CONTENT ─── */}
      <main className={styles.content} role="main">
        <AnimatePresence mode="wait">

          {/* MAP TAB */}
          {activeTab === 'map' && (
            <motion.div
              key="map"
              id="panel-map"
              role="tabpanel"
              aria-labelledby="tab-map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className={styles.fullWidth}
            >
              <StadiumMap />
            </motion.div>
          )}

          {/* FOOD TAB */}
          {activeTab === 'food' && (
            <motion.div
              key="food"
              id="panel-food"
              role="tabpanel"
              aria-labelledby="tab-food"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className={styles.centeredContent}
              style={{ maxWidth: 920, padding: '40px' }}
            >
              <FoodOrdering />
            </motion.div>
          )}

          {/* TICKETS TAB */}
          {activeTab === 'tickets' && (
            <motion.div
              key="tickets"
              id="panel-tickets"
              role="tabpanel"
              aria-labelledby="tab-tickets"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className={styles.centeredContent}
              style={{ maxWidth: 640, padding: '40px' }}
            >
              <h2 className={styles.sectionTitle}>
                <Shield size={15} style={{ color: 'var(--primary)', marginRight: '10px' }} />
                Access Identity Node
              </h2>
              <TelemetryCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Cpu size={20} style={{ color: 'var(--primary)', filter: 'drop-shadow(0 0 8px rgba(0,255,255,0.6))' }} />
                    <span className="technical-text" style={{ fontSize: '0.62rem', color: 'var(--on-surface-variant)' }}>CREDENTIAL NODE</span>
                  </div>
                  <motion.span 
                    className={styles.validatedBadge}
                    animate={{ boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 20px rgba(16,185,129,0.4)', '0 0 0 rgba(16,185,129,0)'] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                  >
                    ✓ IDENTITY VERIFIED
                  </motion.span>
                </div>
                <h3 className="technical-text" style={{ fontSize: '1.3rem', color: '#fff', marginBottom: '6px' }}>Championship Series</h3>
                <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.82rem', borderBottom: '1px solid var(--ghost-border)', paddingBottom: '22px', marginBottom: '22px' }}>
                  OPERATIONAL WINDOW: OCT 14 • 19:00 HRS
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
                  {[
                    { label: 'ZONE', value: '110', accent: true },
                    { label: 'SEC', value: 'F', accent: false },
                    { label: 'NODE', value: '12', accent: false },
                  ].map(item => (
                    <div key={item.label}>
                      <p className={styles.ticketLabel}>{item.label}</p>
                      <p className="technical-text" style={{ fontSize: '2rem', fontWeight: 700, color: item.accent ? 'var(--primary)' : '#fff', textShadow: item.accent ? '0 0 20px rgba(0,255,255,0.5)' : 'none' }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                <motion.button
                  className={styles.ticketBtn}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    await trackEvent(TelemetryEvents.TICKET_VIEW, { zone: '110', sec: 'F' });
                  }}
                >
                  <Navigation size={14} style={{ marginRight: '8px' }} />
                  NAVIGATE TO SEAT
                </motion.button>
              </TelemetryCard>
            </motion.div>
          )}

          {/* ASSISTANT TAB */}
          {activeTab === 'assistant' && (
            <motion.div
              key="assistant"
              id="panel-assistant"
              role="tabpanel"
              aria-labelledby="tab-assistant"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}
              className={styles.centeredContent}
              style={{ maxWidth: 860 }}
            >
              <h2 className={styles.sectionTitle}>
                <Radio size={15} className="glow-cyan pulse-glow" style={{ marginRight: '10px' }} />
                KINETIC ASSISTANT UPLINK
              </h2>
              <div className={styles.chatBox} role="log" aria-label="AI Chat">
                <div className={styles.chatMessages}>
                  <AnimatePresence>
                    {chatLog.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: msg.role === 'ai' ? -20 : 20, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`${styles.chatBubble} ${msg.role === 'ai' ? styles.chatBubbleAi : styles.chatBubbleUser}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.55 }}>
                          {msg.role === 'ai'
                            ? <Cpu size={11} style={{ color: 'var(--primary)' }} />
                            : <Shield size={11} style={{ color: 'var(--secondary)' }} />
                          }
                          <span className="technical-text" style={{ fontSize: '0.58rem' }}>
                            {msg.role === 'ai' ? 'SVES_KERNEL v2.1' : 'OP_IDENTITY'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.88rem', lineHeight: 1.65 }}>{msg.text}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`${styles.chatBubble} ${styles.chatBubbleAi}`}
                    >
                      <div className={styles.typingIndicator}>
                        {[0, 0.2, 0.4].map((delay, i) => (
                          <motion.span
                            key={i}
                            animate={{ opacity: [0.3, 1, 0.3], y: [0, -4, 0] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay }}
                            style={{ background: 'var(--primary)' }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className={styles.chatInputBar}>
                  <div className={styles.chatInputWrapper}>
                    <MessageSquareCode size={14} style={{ color: 'var(--primary)', opacity: 0.6, flexShrink: 0 }} />
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="ENTER COMMAND OR QUERY..."
                      className={styles.chatInput}
                      aria-label="Chat input"
                      disabled={isTyping}
                    />
                  </div>
                  <motion.button
                    onClick={handleSendChat}
                    className={`${styles.chatSendBtn} technical-text`}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isTyping || !chatInput.trim()}
                    aria-label="Send message"
                  >
                    <ArrowRight size={16} style={{ marginRight: '6px' }} />
                    EXECUTE
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              id="panel-dashboard"
              role="tabpanel"
              aria-labelledby="tab-dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className={`${styles.dashboardGrid} ${styles.centeredContent}`}
            >
              {/* LEFT COL */}
              <section className={styles.dashCol}>
                <h2 className={styles.sectionTitle}>
                  <Activity size={14} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                  Predictive Latency Engine
                </h2>

                <TelemetryCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={styles.bigMetric} style={{ color: 'var(--primary)' }}>2m</span>
                      <span className={styles.metricSub}>Facility Load • Sec 110</span>
                    </div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      style={{ color: 'var(--primary)', opacity: 0.3 }}
                    >
                      <Activity size={36} strokeWidth={0.8} />
                    </motion.div>
                  </div>
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { label: 'North Gate Queue', pct: 87, color: 'var(--secondary)' },
                      { label: 'Main Concourse', pct: 67, color: '#FBBF24' },
                      { label: 'Section 115', pct: 36, color: 'var(--primary)' },
                    ].map(bar => (
                      <div key={bar.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span className="technical-text" style={{ fontSize: '0.58rem', color: 'var(--on-surface-variant)' }}>{bar.label}</span>
                          <span className="technical-text" style={{ fontSize: '0.58rem', color: bar.color }}>{bar.pct}%</span>
                        </div>
                        <div style={{ height: '3px', background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${bar.pct}%` }}
                            transition={{ duration: 1.2, delay: 0.3 }}
                            style={{ height: '100%', background: bar.color, boxShadow: `0 0 8px ${bar.color}` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TelemetryCard>

                <TelemetryCard>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className={styles.bigMetric} style={{ color: 'var(--secondary)' }}>15m</span>
                      <span className={styles.metricSub}>Concession Load • Sec 112</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="technical-text" style={{ fontSize: '0.58rem', color: 'rgba(185,202,201,0.5)' }}>PREDICTED PEAK</span>
                      <div className="technical-text" style={{ fontSize: '1rem', color: '#FBBF24', fontWeight: 700 }}>8 MIN</div>
                    </div>
                  </div>
                </TelemetryCard>

                {/* Google Maps integration badge */}
                <motion.div
                  className={styles.servicesBadge}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Zap size={12} style={{ color: 'var(--primary)' }} />
                    <span className="technical-text" style={{ fontSize: '0.6rem', color: 'var(--primary)' }}>GOOGLE SERVICES ACTIVE</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Firebase Analytics', 'Firestore DB', 'Maps API', 'Gemini AI'].map(svc => (
                      <span key={svc} style={{
                        fontSize: '0.58rem',
                        fontFamily: 'var(--font-technical)',
                        color: '#10B981',
                        background: 'rgba(16,185,129,0.08)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        padding: '2px 8px',
                        borderRadius: '2px',
                        letterSpacing: '0.04em'
                      }}>✓ {svc}</span>
                    ))}
                  </div>
                </motion.div>
              </section>

              {/* RIGHT COL */}
              <section className={styles.dashCol}>
                <h2 className={styles.sectionTitle}>
                  <Cpu size={14} style={{ color: 'var(--primary)', marginRight: '8px' }} />
                  Kinetic Routing (UEBA Engine)
                </h2>

                <TelemetryCard accent>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <motion.div
                      animate={{ opacity: rerouteAccepted ? 1 : [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: rerouteAccepted ? 0 : Infinity }}
                    >
                      <AlertTriangle size={18} style={{ color: rerouteAccepted ? '#10B981' : 'var(--secondary)', filter: `drop-shadow(0 0 8px ${rerouteAccepted ? 'rgba(16,185,129,0.6)' : 'rgba(255,0,255,0.6)'})` }} />
                    </motion.div>
                    <h3 className="technical-text" style={{ fontSize: '1rem', color: '#fff' }}>
                      {rerouteAccepted ? "Optimization Implemented" : "⚠ Anomaly Detected"}
                    </h3>
                  </div>
                  <p className={styles.alertDesc}>
                    {rerouteAccepted
                      ? "Infrastructure load balanced. Egress redirected to Section 115 Express terminals. All units on optimal path."
                      : "Irregular density spike at Gate 3. AI model (XGBoost) recommends redirection of 40% headcount to Sector B immediately."}
                  </p>
                  {!rerouteAccepted && (
                    <motion.button
                      className={styles.alertBtn}
                      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(255,0,255,0.4)' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        setRerouteAccepted(true);
                        await trackEvent(TelemetryEvents.SAFETY_ALERT_ACK, { type: 'gate_anomaly' });
                        await logSafetyAlertAction('gate_anomaly', 'Redirection Protocol Gate 3 → Gate 5 engaged.');
                        setTimeout(() => switchTab('map'), 1500);
                      }}
                    >
                      <ChevronRight size={16} style={{ marginRight: '6px' }} />
                      ENGAGE OPTIMAL ROUTING
                    </motion.button>
                  )}
                </TelemetryCard>

                {/* Live venue stats */}
                <div className={styles.statsGrid}>
                  {[
                    { label: 'TOTAL ATTENDANCE', value: 18420, icon: Users, color: 'var(--primary)' },
                    { label: 'ACTIVE ALERTS', value: 6, icon: AlertTriangle, color: 'var(--secondary)' },
                    { label: 'ROUTES COMPUTED', value: 142, icon: Navigation, color: '#FBBF24' },
                    { label: 'AI QUERIES TODAY', value: 89, icon: MessageSquareCode, color: '#10B981' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <motion.div
                      key={label}
                      className={styles.statCard}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 }}
                      whileHover={{ borderColor: color, boxShadow: `0 0 20px ${color}22` }}
                    >
                      <Icon size={14} style={{ color, marginBottom: '8px' }} />
                      <div className="technical-text" style={{ fontSize: '1.4rem', fontWeight: 700, color, lineHeight: 1 }}>
                        <AnimatedCounter target={value} />
                      </div>
                      <div className="technical-text" style={{ fontSize: '0.52rem', color: 'var(--on-surface-variant)', marginTop: '4px', letterSpacing: '0.08em' }}>{label}</div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
