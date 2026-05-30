import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

interface SystemLog {
  timestamp: string;
  agent: string;
  message: string;
}

interface Agent {
  name: string;
  role: string;
  avatar: string;
  status: string;
}

interface DraftContent {
  category_id?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  imageGlow?: string;
  platform?: string;
  postText?: string;
  recommendations?: string;
}

interface TaskReview {
  agent: string;
  decision: 'approved' | 'rejected';
  reviewText: string;
  timestamp: string;
}

interface OfficeTask {
  id: string;
  title: string;
  description: string;
  type: string;
  assignee: string;
  status: string;
  draftContent: DraftContent | string | null;
  reviews: TaskReview[];
  createdAt: string;
  updatedAt: string;
}

interface BoardroomProps {
  onSendDirective: (text: string) => Promise<void>;
  isProcessing: boolean;
  agents: Agent[];
  systemLogs?: SystemLog[];
  tasks?: OfficeTask[];
  timeLeft?: string;
  timerColor?: string;
  runLoopLoading?: boolean;
  onTriggerAgentLoop?: () => Promise<void>;
}

export const Boardroom: React.FC<BoardroomProps> = ({ 
  onSendDirective, 
  isProcessing, 
  agents, 
  systemLogs = [],
  tasks = [],
  timeLeft = '--:--',
  timerColor = 'rgba(255,255,255,0.6)',
  runLoopLoading = false,
  onTriggerAgentLoop
}) => {
  const logBodyRef = useRef<HTMLDivElement>(null);

  // Scroll within the log container only — never moves the page
  useEffect(() => {
    if (logBodyRef.current) {
      logBodyRef.current.scrollTop = logBodyRef.current.scrollHeight;
    }
  }, [systemLogs]);
  const [directiveText, setDirectiveText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim()) return;
    setErrorMessage(null);
    try {
      await onSendDirective(directiveText);
      setDirectiveText('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to submit directive.');
    }
  };

  const templates = [
    {
      title: "📝 Write PDF Compressor Blog",
      text: "Write an in-depth blog post detailing how our offline PDF Compressor uses browser-only libraries like pdf-lib for total user privacy. Target SEO keywords like 'offline pdf compressor' and 'privacy pdf tools'."
    },
    {
      title: "🖼️ Image Compressor SEO Guide",
      text: "Draft a viral blog post showing the benefits of client-side PNG/JPEG to WebP conversion. Target Indian designer communities looking for fast online compression alternatives."
    },
    {
      title: "🔍 Page SEO Review",
      text: "Perform a static on-page SEO scan of the landing page files, evaluate structural tag hierarchies, and list recommendations."
    },
    {
      title: "💼 Hire React/Wasm Dev Notice",
      text: "Draft a remote job description for a Frontend Developer experienced in WebAssembly and React Canvas rendering to build local-first browser utilities."
    }
  ];

  const getSearchVolume = (desc: string) => {
    const match = desc.match(/(\d+[,.]?\d*[KM]\+?\s*(?:searches|volume)?)/i) || 
                  desc.match(/volume:?\s*(\d+[,.]?\d*[KM]\+?)/i);
    if (match) {
      return match[1].replace(/searches/i, '').replace(/volume:?/i, '').trim();
    }
    const genericMatch = desc.match(/(\d+\s*[KM]\+)/i);
    if (genericMatch) return genericMatch[1];
    return '100K+';
  };

  const renderActiveCampaign = () => {
    if (!tasks || tasks.length === 0) return null;

    const activeTask = [...tasks].reverse().find(t => t.status !== 'completed') || 
                       [...tasks].reverse().find(t => t.status === 'completed');

    if (!activeTask) return null;

    const isTaskCompleted = activeTask.status === 'completed';
    const searchVolume = getSearchVolume(activeTask.description || '');
    
    let campaignTopic = activeTask.title;
    if (activeTask.description) {
      const briefMatch = activeTask.description.match(/(?:context|details|about|for|alert|recruitment|issue):\s*([^.]+)/i) ||
                         activeTask.description.match(/(?:hook|topic):\s*([^.]+)/i);
      if (briefMatch) {
        campaignTopic = briefMatch[1].trim();
      } else if (activeTask.title.includes(':')) {
        campaignTopic = activeTask.title.split(':')[0].trim();
      }
    }

    const statusOrder = ['todo', 'inprogress', 'manager_review', 'ceo_approval', 'completed'];
    const currentIndex = statusOrder.indexOf(activeTask.status);

    const steps = [
      { label: 'Queued', desc: 'Topic researched & queued', icon: '📝' },
      { label: 'Drafting', desc: `${activeTask.assignee} writing article`, icon: '✍️' },
      { label: 'Reviewing', desc: 'Alex auditing keywords & SEO', icon: '🔍' },
      { label: 'Approving', desc: 'Sophia evaluating final draft', icon: '👑' },
      { label: 'Published', desc: 'Deployer pushing updates live', icon: '🚀' },
    ];

    const isStalled = timeLeft === 'Overdue / Stalled';

    return (
      <div style={styles.campaignCard}>
        <div style={styles.campaignHeader}>
          <div style={styles.campaignTitle}>
            <Sparkles size={18} style={{ color: isTaskCompleted ? '#10b981' : 'var(--primary, #00f2fe)' }} />
            <span>
              {isTaskCompleted ? 'Latest Deployed Campaign (Published)' : 'Active Campaign: Work In Progress'}
            </span>
          </div>
          {isStalled && !isTaskCompleted && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#ef4444',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: 'rgba(239, 68, 68, 0.1)',
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              <AlertCircle size={14} />
              <span>Campaign Stalled / Delayed</span>
            </div>
          )}
        </div>

        <div style={styles.campaignMetaGrid}>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Trending Topic Context</span>
            <span style={styles.metaValue}>{campaignTopic}</span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Estimated Search Volume</span>
            <span style={{ ...styles.metaValue, color: 'var(--primary, #00f2fe)', fontWeight: 600 }}>
              📈 {searchVolume} searches
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Assigned Specialist</span>
            <span style={styles.metaValue}>
              {activeTask.assignee === 'Mark' ? '✍️ Mark (Marketing)' : 
               activeTask.assignee === 'Sarah' ? '🐦 Sarah (Social Media)' : 
               activeTask.assignee === 'Codey' ? '💻 Codey (IT Dev)' : `👤 ${activeTask.assignee}`}
            </span>
          </div>
          <div style={styles.metaItem}>
            <span style={styles.metaLabel}>Article Target Title</span>
            <span style={{ ...styles.metaValue, fontStyle: 'italic' }}>"{activeTask.title}"</span>
          </div>
        </div>

        <div style={styles.progressContainer}>
          <div style={styles.stepsRow}>
            {steps.map((step, idx) => {
              const isCompleted = idx < currentIndex || isTaskCompleted;
              const isActive = idx === currentIndex && !isTaskCompleted;
              
              let stepStyle = styles.stepDotPending;
              if (isCompleted) stepStyle = styles.stepDotCompleted;
              else if (isActive) stepStyle = styles.stepDotActive;

              return (
                <React.Fragment key={idx}>
                  <div style={styles.stepBubble}>
                    <div style={{
                      ...styles.stepDot,
                      ...stepStyle
                    }}>
                      <span>{step.icon}</span>
                    </div>
                    <div style={{
                      ...styles.stepLabel,
                      color: isActive ? 'var(--primary, #00f2fe)' : isCompleted ? '#10b981' : 'rgba(255,255,255,0.4)',
                      fontWeight: isActive ? 600 : 400
                    }}>
                      {step.label}
                    </div>
                    <div style={styles.stepDesc}>
                      {step.desc}
                    </div>
                  </div>

                  {idx < steps.length - 1 && (
                    <div style={{
                      ...styles.connectingLine,
                      background: (idx < currentIndex || isTaskCompleted) ? '#10b981' : 'rgba(255,255,255,0.1)'
                    }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {isStalled && !isTaskCompleted && onTriggerAgentLoop && (
          <div style={styles.stalledContainer}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} style={{ color: '#ef4444' }} />
              <span>The background agent cycle appears delayed or stalled. You can force-restart the loop execution right now.</span>
            </div>
            <button
              onClick={onTriggerAgentLoop}
              disabled={runLoopLoading}
              style={styles.restartBtn}
            >
              <RefreshCw size={12} className={runLoopLoading ? 'spin' : ''} />
              {runLoopLoading ? 'Restarting...' : 'Restart Loop & Force Step'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.grid}>
        
        {/* Mandate Board */}
        <div style={styles.leftCol} className="glass-card">
          <div style={styles.header}>
            <Sparkles size={20} style={{ color: 'var(--primary, #00f2fe)' }} />
            <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)' }}>Boardroom Mandate</h2>
          </div>
          
          <p style={styles.text}>
            You sit at the head of the boardroom. Submit directives here to command the AI company. 
            <strong> Sophia (CEO)</strong> and <strong>Alex (Manager)</strong> will parse your objectives, 
            delegate task items to departments, and automate execution.
          </p>

          <form onSubmit={handleSubmit} style={styles.form}>
            <textarea
              style={styles.textarea}
              value={directiveText}
              onChange={(e) => setDirectiveText(e.target.value)}
              placeholder="e.g. Write an educational blog article on the benefits of local image studio converters, and post it to our blogs page..."
              required
            />

            {errorMessage && (
              <div style={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={isProcessing} style={{ alignSelf: 'flex-start', border: 'none', cursor: 'pointer' }}>
              {isProcessing ? (
                <>
                  <RefreshCw className="spin" size={16} />
                  Manager Parsing Directive...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Issue Board Directive
                </>
              )}
            </button>
          </form>

          <div style={styles.templatesGroup}>
            <h4 style={styles.subHeader}>Quick Directive Presets</h4>
            <div style={styles.presetsList}>
              {templates.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => setDirectiveText(t.text)}
                  style={styles.presetCard}
                  className="preset-card-hover"
                >
                  <strong style={{ color: 'var(--primary, #00f2fe)' }}>{t.title}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Listening Agents Attendance */}
        <div style={styles.rightCol} className="glass-card">
          <h3 style={styles.sidebarHeader}>Boardroom Attendance</h3>
          <div style={styles.agentsAttendees}>
            {agents.map((a) => (
              <div key={a.name} style={styles.attendeeRow}>
                <span style={styles.attendeeAvatar}>{a.avatar}</span>
                <div>
                  <div style={styles.attendeeName}>{a.name}</div>
                  <div style={styles.attendeeRole}>{a.role}</div>
                </div>
                <span style={{
                  ...styles.attendeeStatusBadge,
                  color: a.status !== 'Idle' ? 'var(--primary, #00f2fe)' : 'var(--text-muted, #888)'
                }}>
                  {a.status !== 'Idle' ? 'Working' : 'Ready'}
                </span>
              </div>
            ))}
          </div>
          <div style={styles.holoBar}></div>
        </div>

      </div>

      {/* Active Campaign Info Panel */}
      {renderActiveCampaign()}

      {/* Real-Time Agent Subprocess Log Terminal */}
      <div style={styles.logPanel} className="glass-card">
        <div style={styles.logHeader}>
          <Terminal size={16} style={{ color: 'var(--primary, #00f2fe)' }} />
          <span style={styles.logTitle}>Agent Subprocess Logs</span>
          <span style={styles.logCount}>{systemLogs.length} entries</span>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>Auto-updating every 6s</span>
        </div>
        <div style={styles.logBody} ref={logBodyRef}>
          {systemLogs.length === 0 ? (
            <div style={styles.logEmpty}>
              <Terminal size={20} style={{ opacity: 0.3 }} />
              <span>No agent logs yet. Trigger a cloud cycle or issue a board directive to start.</span>
            </div>
          ) : (
            [...systemLogs].reverse().map((log, idx) => {
              const agentColor = {
                'System':   'rgba(160,160,160,0.8)',
                'Alex':     'rgba(0, 242, 254, 0.9)',
                'Sophia':   'rgba(255, 200, 80, 0.9)',
                'Mark':     'rgba(100, 220, 130, 0.9)',
                'Sarah':    'rgba(200, 130, 255, 0.9)',
                'Codey':    'rgba(80, 190, 255, 0.9)',
                'Deployer': 'rgba(255, 130, 80, 0.9)',
                'Harper':   'rgba(255, 170, 200, 0.9)',
              }[log.agent] || 'rgba(200, 200, 200, 0.8)';

              const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                hour: '2-digit', minute: '2-digit', second: '2-digit'
              });

              return (
                <div key={idx} style={styles.logRow}>
                  <span style={styles.logTime}>{timeStr}</span>
                  <span style={{ ...styles.logAgent, color: agentColor }}>[{log.agent}]</span>
                  <span style={styles.logMsg}>{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '30px',
  },
  leftCol: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '15px',
  },
  text: {
    fontSize: '0.95rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.6',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  textarea: {
    width: '100%',
    height: '140px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    padding: '16px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    resize: 'none' as const,
    fontFamily: 'inherit',
    lineHeight: '1.5',
    boxSizing: 'border-box' as const,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    color: '#fecaca',
    fontSize: '0.88rem',
  },
  templatesGroup: {
    marginTop: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  subHeader: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  presetsList: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  presetCard: {
    padding: '12px 16px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center' as const,
    transition: 'all 0.2s ease',
  },
  rightCol: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  sidebarHeader: {
    fontSize: '1.1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '12px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  agentsAttendees: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    zIndex: 2,
  },
  attendeeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.85rem',
  },
  attendeeAvatar: {
    fontSize: '1.3rem',
    background: 'rgba(255, 255, 255, 0.03)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  attendeeName: {
    fontWeight: 600,
    color: '#fff',
  },
  attendeeRole: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  attendeeStatusBadge: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    fontWeight: 500,
  },
  holoBar: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, var(--primary, #00f2fe), transparent)',
    boxShadow: '0 0 10px var(--primary, #00f2fe)',
  },
  // Agent Subprocess Logs Terminal
  logPanel: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0',
    background: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(0, 242, 254, 0.12)',
    borderRadius: '12px',
    fontFamily: "'Courier New', monospace",
  },
  logHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(0, 242, 254, 0.08)',
    paddingBottom: '12px',
    marginBottom: '12px',
  },
  logTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    fontFamily: 'var(--font-heading)',
  },
  logCount: {
    background: 'rgba(0, 242, 254, 0.1)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    borderRadius: '10px',
    fontSize: '0.7rem',
    padding: '2px 8px',
    color: 'var(--primary, #00f2fe)',
  },
  logBody: {
    maxHeight: '220px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    paddingRight: '4px',
  },
  logEmpty: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    justifyContent: 'center',
    padding: '30px',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.82rem',
    flexDirection: 'column' as const,
  },
  logRow: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
    fontSize: '0.78rem',
    lineHeight: '1.5',
    padding: '2px 0',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  },
  logTime: {
    color: 'rgba(255,255,255,0.3)',
    minWidth: '78px',
    flexShrink: 0,
  },
  logAgent: {
    minWidth: '82px',
    flexShrink: 0,
    fontWeight: 600,
  },
  logMsg: {
    color: 'rgba(255,255,255,0.75)',
    lineHeight: '1.4',
    wordBreak: 'break-word' as const,
  },
  campaignCard: {
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    boxShadow: '0 8px 32px 0 rgba(0, 242, 254, 0.03)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  campaignHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '12px',
  },
  campaignTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontFamily: 'var(--font-heading)',
  },
  campaignMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    background: 'rgba(0,0,0,0.15)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.04)',
  },
  metaItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  metaLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  metaValue: {
    fontSize: '0.9rem',
    color: '#fff',
    fontWeight: 500,
  },
  progressContainer: {
    padding: '10px 0',
    overflowX: 'auto' as const,
  },
  stepsRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minWidth: '600px',
    position: 'relative' as const,
    padding: '0 20px',
  },
  stepBubble: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    width: '120px',
    textAlign: 'center' as const,
    zIndex: 2,
  },
  stepDot: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
  },
  stepDotPending: {
    background: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.3)',
  },
  stepDotActive: {
    background: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'var(--primary, #00f2fe)',
    boxShadow: '0 0 15px rgba(0, 242, 254, 0.3)',
    color: 'var(--primary, #00f2fe)',
  },
  stepDotCompleted: {
    background: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
    boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)',
    color: '#10b981',
  },
  stepLabel: {
    fontSize: '0.82rem',
    marginTop: '8px',
  },
  stepDesc: {
    fontSize: '0.68rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: '4px',
    lineHeight: '1.3',
  },
  connectingLine: {
    height: '2px',
    flex: 1,
    marginTop: '20px',
    marginRight: '-10px',
    marginLeft: '-10px',
    minWidth: '30px',
    transition: 'background 0.3s ease',
  },
  stalledContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    color: '#fecaca',
  },
  restartBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    transition: 'background 0.2s',
  }
};
