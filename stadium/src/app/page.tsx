"use client";
import { useState } from 'react';
import { trackEvent, TelemetryEvents } from '../lib/analytics';
import { getAssistantResponse } from '../lib/gemini';

import styles from './page.module.css';
import StadiumMap from './components/StadiumMap';
import FoodOrdering from './components/FoodOrdering';
import '../lib/firebase'; // Initialize Firebase for telemetry

type TabType = 'dashboard' | 'map' | 'food' | 'tickets' | 'assistant';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'SVES Overview', icon: '⚡' },
  { id: 'map',       label: 'Navigation',   icon: '🗺️' },
  { id: 'food',      label: 'POS Terminal',  icon: '🍔' },
  { id: 'tickets',   label: 'Identity Core', icon: '🎟️' },
  { id: 'assistant', label: 'AI Assistant',  icon: '🤖' },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatLog, setChatLog] = useState<{role: 'user' | 'ai', text: string}[]>([
    { role: 'ai', text: 'Hello! I am your SVES LLM Assistant. How can I facilitate your venue experience today?' }
  ]);
  const [rerouteAccepted, setRerouteAccepted] = useState(false);

  // Track AI Assistant usage

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    const userMsg = chatInput;
    setChatInput('');
    setChatLog(prev => [...prev, {role: 'user', text: userMsg}]);
    setIsTyping(true);

    await trackEvent(TelemetryEvents.AI_CHAT_MSG, { length: userMsg.length });

    // Format history for Gemini
    const history = chatLog.map(msg => ({
      role: (msg.role === 'ai' ? 'model' : 'user') as 'model' | 'user',
      parts: [{ text: msg.text }]
    }));

    const responseText = await getAssistantResponse(userMsg, history);
    
    setChatLog(prev => [...prev, {role: 'ai', text: responseText}]);
    setIsTyping(false);
  };

  return (
    <div className={styles.shell}>
      {/* ─── HEADER ─── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◆</span>
            <span className={styles.logoText}>SVES</span>
          </div>
          <div className={styles.headerInfo}>
            <h1 className={styles.headerTitle}>Enterprise Stadium Control</h1>
            <p className={styles.headerSub}>Operations Dashboard & Fan Routing Protocol</p>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.broadcast}>
            <span className={styles.broadcastLabel}>BROADCAST</span>
            <span className={styles.broadcastText}>Egress routing active — Redirect to South Gate</span>
          </div>
          <div className={styles.statusBadge}>
            <span className={styles.liveDot} />
            <span>Event Active</span>
          </div>
        </div>
      </header>

      {/* ─── NAVIGATION ─── */}
      <nav className={styles.nav} role="tablist" aria-label="Main Navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            className={`${styles.navBtn} ${activeTab === tab.id ? styles.navBtnActive : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              trackEvent(TelemetryEvents.TAB_SWITCH, { tab: tab.id });
            }}
          >
            <span className={styles.navIcon} aria-hidden="true">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* ─── CONTENT AREA ─── */}
      <main className={styles.content}>

        {/* MAP TAB — full width */}
        {activeTab === 'map' && (
          <div role="tabpanel" id="panel-map" aria-labelledby="tab-map" className={styles.fullWidth}>
            <StadiumMap />
          </div>
        )}

        {/* FOOD TAB */}
        {activeTab === 'food' && (
          <div role="tabpanel" id="panel-food" aria-labelledby="tab-food" className={styles.centeredContent} style={{ maxWidth: '800px' }}>
            <FoodOrdering />
          </div>
        )}

        {/* TICKETS TAB */}
        {activeTab === 'tickets' && (
          <div role="tabpanel" id="panel-tickets" aria-labelledby="tab-tickets" className={styles.centeredContent} style={{ maxWidth: '600px', animation: 'popIn 0.4s ease backwards' }}>
            <h2 className={styles.sectionTitle}>Access Identity Context</h2>
            <div className="glass-card" style={{ padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '1.8rem' }}>🆔</span>
                <span className={styles.validatedBadge}>VALIDATED</span>
              </div>
              <h3 className="heading-stadium" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>Championship Series</h3>
              <p style={{ color: 'var(--on-surface-variant)', fontSize: '0.92rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '20px' }}>Oct 14 • 7:00 PM</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {[
                  { label: 'ZONE', value: '110', accent: true },
                  { label: 'SECTOR', value: 'F', accent: false },
                  { label: 'NODE', value: '12', accent: false },
                ].map(item => (
                  <div key={item.label}>
                    <p className={styles.ticketLabel}>{item.label}</p>
                    <p className={`heading-stadium ${styles.ticketValue}`} style={{ color: item.accent ? 'var(--primary-light)' : 'var(--on-surface)' }}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className={styles.ticketFooter}>Node location dictates real-time topology reroutes.</p>
          </div>
        )}

        {/* AI ASSISTANT TAB */}
        {activeTab === 'assistant' && (
          <div role="tabpanel" id="panel-assistant" aria-labelledby="tab-assistant" className={styles.centeredContent} style={{ maxWidth: '800px', animation: 'popIn 0.4s ease backwards' }}>
            <h2 className={styles.sectionTitle}>LLM Event Agent</h2>
            <div className={`glass-card ${styles.chatBox}`}>
              <div className={styles.chatMessages}>
                {chatLog.map((msg, i) => (
                  <div key={i} className={`${styles.chatBubble} ${msg.role === 'ai' ? styles.chatBubbleAi : styles.chatBubbleUser}`}>
                    {msg.role === 'ai' && <span className={styles.chatAvatar}>🤖</span>}
                    <p>{msg.text}</p>
                  </div>
                ))}
                {isTyping && (
                  <div className={`${styles.chatBubble} ${styles.chatBubbleAi}`}>
                    <span className={styles.chatAvatar}>🤖</span>
                    <div className={styles.typingIndicator}>
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.chatInputBar}>
                <label htmlFor="ai-chat-input" className="sr-only" aria-hidden="false" style={{ display: 'none' }}>Ask the assistant</label>
                <input
                  id="ai-chat-input"
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="e.g. 'Where is the nearest empty washroom?'"
                  className={styles.chatInput}
                />
                <button onClick={handleSendChat} aria-label="Send message" className={styles.chatSendBtn}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div role="tabpanel" id="panel-dashboard" aria-labelledby="tab-dashboard" className={styles.dashboardGrid}>
            {/* Left Column: Queue Prediction */}
            <section className={styles.dashCol}>
              <h2 className={styles.sectionTitle}>Queue Prediction (XGBoost)</h2>
              <div className={styles.cardStack}>
                <div className="glass-card">
                  <div className={styles.metricCard}>
                    <div>
                      <span className={`heading-stadium ${styles.bigMetric}`} style={{ color: 'var(--secondary-light)' }}>2m</span>
                      <span className={styles.metricSub}>Facility Load • Sec 110</span>
                    </div>
                    <span className={styles.metricEmoji}>🚻</span>
                  </div>
                </div>

                <div className="glass-card">
                  <div className={styles.metricCard}>
                    <div>
                      <span className={`heading-stadium ${styles.bigMetric}`} style={{ color: 'var(--tertiary-light)' }}>15m</span>
                      <span className={styles.metricSub}>Concession Load • Sec 112</span>
                    </div>
                    <span className={styles.metricEmoji}>🍔</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Safety & Routing */}
            <section className={styles.dashCol}>
              <h2 className={styles.sectionTitle}>Safety & Routing (UEBA)</h2>
              <div className={`glass-card ${styles.alertCard}`}>
                <div className={styles.alertContent}>
                  <h3 className="heading-stadium" style={{ fontSize: '1.4rem', marginBottom: '6px' }}>
                    {rerouteAccepted ? "Optimization Executed ✅" : "Isolation Forest Anomaly Detected ⚠️"}
                  </h3>
                  <p className={styles.alertDesc}>
                    {rerouteAccepted 
                      ? "Load distribution adjusted. The fan is now safely routed to Section 115 Express Bar."
                      : "Abnormal crowd spike detected at Gate 3. Triggering smart notification engine: 'Gate 3 crowded, rerouting to Gate 5.'"}
                  </p>
                  {!rerouteAccepted && (
                    <button 
                      className={styles.alertBtn}
                      onClick={() => {
                        setRerouteAccepted(true);
                        trackEvent(TelemetryEvents.SAFETY_ALERT_ACK, { type: 'gate_anomaly' });
                        setTimeout(() => setActiveTab('map'), 1200);
                      }}
                      aria-label="Acknowledge anomaly and deploy smart alert"
                    >
                      Acknowledge & Deploy Smart Alert
                    </button>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
