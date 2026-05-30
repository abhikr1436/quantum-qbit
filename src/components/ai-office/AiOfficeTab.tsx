import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Briefcase, RefreshCw, Terminal, Trash2, ShieldCheck, Play } from 'lucide-react';

interface OfficeConfig {
  websitePath: string;
  isAutomationActive: boolean;
  lastRunTimestamp?: string | null;
}

interface SystemLog {
  timestamp: string;
  agent: string;
  message: string;
}

interface AiOfficeTabProps {
  isLocalMode?: boolean;
}

export const AiOfficeTab: React.FC<AiOfficeTabProps> = ({ isLocalMode = false }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [config, setConfig] = useState<OfficeConfig | null>(null);
  const [statusMessage, setStatusMessage] = useState('System Ready');
  const [statusColor, setStatusColor] = useState('rgba(255,255,255,0.7)');

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll terminal container without force scrolling the window
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  // Load configuration
  const fetchConfig = useCallback(async () => {
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setConfig(parsed.config || null);
        } catch {
          // skip
        }
      } else {
        const defaultConf = { websitePath: '.', isAutomationActive: true, lastRunTimestamp: new Date().toISOString() };
        setConfig(defaultConf);
      }
      return;
    }

    try {
      const res = await fetch('/api/ai_office.php?action=dashboard');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || null);
      }
    } catch (e) {
      console.error("Failed to load backend config", e);
    }
  }, [isLocalMode]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchConfig();
    });
  }, [fetchConfig]);

  // Helper to add logs locally
  const addLog = (message: string, agent: string = 'System') => {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] [${agent.toUpperCase()}] ${message}`;
    setLogs(prev => [...prev, formatted]);
  };

  // Local simulated blog publisher
  const publishBlogLocally = (title: string, isJob: boolean) => {
    const localBlogsStr = localStorage.getItem('quantum_blogs');
    let blogs = [];
    if (localBlogsStr) {
      try {
        blogs = JSON.parse(localBlogsStr);
      } catch {
        // Fallback
      }
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
    
    const category = isJob ? 'General Utilities' : 'Privacy & Security';
    const categoryId = isJob ? 'general-utilities' : 'privacy-security';
    const imageGlow = isJob ? 'rgba(157, 78, 221, 0.15)' : 'rgba(0, 242, 254, 0.15)';
    const excerpt = isJob 
      ? `Latest recruitment notification for ${title}. Apply online, check eligibility, age limit, selection criteria, important dates and fees.`
      : `Detailed analytical guide exploring ${title}. Learn how client-side computing enhances speed and user data safety.`;

    const content = isJob ? `<h2>${title} Notification</h2>
<p>Here are the complete notification details, important dates, and eligibility criteria for ${title}. Candidates can apply online through the official portal before the deadline. Make sure to prepare your documents and compress photo/signature files to correct upload size using browser-only local compression tools before submitting the form.</p>
<table class="job-details-table">
  <tr>
    <td colspan="2" class="table-header-main">
      <h2>Uttar Pradesh Subordinate Service Selection Commission (UPSSSC)</h2>
      <h3>UPSSSC Lower PCS (Graduate Level) Recruitment 2026</h3>
      <div class="highlight-cyan" style="text-align: center;">Advt No. 07-Exam/2026 : Short Details of Notification</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Important Dates</div>
      <ul>
        <li>Application Begin : <span class="highlight-green">29/05/2026</span></li>
        <li>Last Date for Apply Online : <span class="highlight-red">18/06/2026</span></li>
        <li>Last Date Pay Exam Fee : <span class="highlight-red">18/06/2026</span></li>
        <li>Correction Last Date : <span class="highlight-cyan">25/06/2026</span></li>
        <li>Exam Date : <span class="highlight-cyan">As Per Schedule</span></li>
      </ul>
    </td>
    <td>
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Application Fee</div>
      <ul>
        <li>General / OBC / EWS : <span class="highlight-green">25/-</span></li>
        <li>SC / ST : <span class="highlight-green">25/-</span></li>
        <li>PH (Divyang) : <span class="highlight-green">25/-</span></li>
        <li>Payment Mode : Online Debit/Credit Card, Net Banking</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Age Limit as on 01/07/2026</div>
      <ul>
        <li>Minimum Age : <strong>18 Years</strong></li>
        <li>Maximum Age : <strong>40 Years</strong></li>
        <li>Age Relaxation Extra as per UPSSSC Lower PCS Recruitment Rules.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Vacancy Details &amp; Eligibility (Total : 2285 Posts)</div>
      <ul>
        <li><strong>Post Name:</strong> Combined Lower Subordinate (Lower PCS)</li>
        <li><strong>Total Post:</strong> 2285</li>
        <li><strong>Eligibility:</strong> Bachelor Degree in Any Stream from Any Recognized University. For Executive Officer, Graduation with 'O' Level is required.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Some Useful Important Links</div>
      <table style="width: 100%; border: none; margin: 0; background: transparent;">
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Apply Online:</strong></td>
          <td style="border: none; padding: 6px;"><a href="https://upsssc.gov.in" target="_blank">Click Here</a></td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Download Notification:</strong></td>
          <td style="border: none; padding: 6px;"><a href="#" target="_blank">Click Here</a></td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Official Website:</strong></td>
          <td style="border: none; padding: 6px;"><a href="https://upsssc.gov.in" target="_blank">UPSSSC Official Portal</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p>Note: Remember to use local tools on quantumqbit.in to resize, crop and compress your photos and signatures. Since all processing happens in your browser locally, your personal and sensitive documents never reach third-party servers.</p>` : `<h2>Understanding ${title}</h2>
<p>In standard web applications, every document upload, picture conversion, or password check is pushed to a remote server. While simple, it exposes sensitive user assets to database vulnerabilities and third-party leaks.</p>
<p>By utilizing modern HTML5 File APIs and client-side scripts, tools like those on <strong>quantumqbit.in</strong> process bytes entirely in the browser memory cache. Photos are modified on canvas, conversions happen locally, and no records ever leak to host registers. It's instant, costs zero bandwidth, and stays 100% private.</p>
<p>This trending topic highlights the growing global pivot toward edge computing, local privacy, and user-centric software architectures.</p>`;

    const newBlog = {
      id: slug,
      title: title,
      excerpt: excerpt,
      content: content,
      author: 'Quantum AI Writer (Simulated)',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + new Date().toTimeString().split(' ')[0],
      readTime: "4 min read",
      category: category,
      category_id: categoryId,
      imageGlow: imageGlow,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    blogs.unshift(newBlog);
    localStorage.setItem('quantum_blogs', JSON.stringify(blogs));
  };

  // Local simulated execution state machine
  const executeLocalSimulation = (type: 'trends' | 'jobs') => {
    setIsRunning(true);
    setActiveTask(type === 'trends' ? 'Trending Content Campaign' : 'Job Vacancy Poster');
    setStatusMessage(type === 'trends' ? 'Researching Google Trends...' : 'Checking Government Portals...');
    setStatusColor('var(--primary, #00f2fe)');
    setLogs([]);

    const steps = type === 'trends' ? [
      { text: 'Initiating local simulation for Google Trends content campaign...', agent: 'System', delay: 1000 },
      { text: 'Querying Google Trends API for region: India (IN)...', agent: 'Mark', delay: 1200 },
      { text: 'Found Google Trends query: "UPSSSC Lower PCS Graduate Level 2026" (Search volume: 500K+ searches)', agent: 'Mark', delay: 1500 },
      { text: 'Selecting highest search volume topic: "UPSSSC Lower PCS Graduate Level Recruitment 2026"', agent: 'Mark', delay: 1200 },
      { text: 'Alex (Manager) parsed search context and formulated writer directive.', agent: 'Alex', delay: 1000 },
      { text: 'Drafting structured HTML blog post with trending context and quantumqbit.in tool highlights...', agent: 'Mark', delay: 2000 },
      { text: 'Content draft complete. Excerpt generated: "Apply online for UPSSSC Lower PCS Advt No 07-Exam/2026..."', agent: 'Mark', delay: 1000 },
      { text: 'Sophia (CEO) performed quality audit. Draft meets 600-word criteria. Approved.', agent: 'Sophia', delay: 1200 },
      { text: 'Deployer (DevOps) compiled project builds and verified index files.', agent: 'Deployer', delay: 1500 },
      { text: 'Deploying article locally and updating index logs...', agent: 'Deployer', delay: 1000 },
      { text: 'Success! Trending article "UPSSSC Lower PCS Graduate Level Recruitment 2026" is now published.', agent: 'System', delay: 500 }
    ] : [
      { text: 'Initiating local simulation for Job Vacancy publisher...', agent: 'System', delay: 1000 },
      { text: 'Querying Sarkari Result and Government recruitment notifications...', agent: 'Mark', delay: 1500 },
      { text: 'Found active job posting: "UPSSSC Combined Lower Subordinate Services Graduate Level (2285 Posts)"', agent: 'Mark', delay: 1200 },
      { text: 'Extracting key details: Important dates, fee structures, age limit, and eligibility criteria...', agent: 'Mark', delay: 1800 },
      { text: 'Alex (Manager) validated details formatting request.', agent: 'Alex', delay: 1000 },
      { text: 'Formulating structured details HTML table with class "job-details-table" and highlighting CSS rules...', agent: 'Mark', delay: 2000 },
      { text: 'Drafting post text complete. Table structure validation passed.', agent: 'Mark', delay: 1000 },
      { text: 'Sophia (CEO) approved publication of Sarkari Result structured job article.', agent: 'Sophia', delay: 1200 },
      { text: 'Deployer (DevOps) staging files and compiling index.js...', agent: 'Deployer', delay: 1500 },
      { text: 'Writing details table to local database fallback...', agent: 'Deployer', delay: 1000 },
      { text: 'Success! Job Vacancy table for "UPSSSC Lower PCS Graduate Level 2285 Posts" is now published.', agent: 'System', delay: 500 }
    ];

    let currentStep = 0;

    const runNextStep = () => {
      if (currentStep >= steps.length) {
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Campaign Complete');
        setStatusColor('#10b981');
        
        // Actually publish the post
        const title = type === 'trends' 
          ? 'UPSSSC Lower PCS Graduate Level Recruitment 2026' 
          : 'UPSSSC Lower PCS Graduate Level 2285 Posts Job Vacancy';
        publishBlogLocally(title, type === 'jobs');
        
        const localDBStr = localStorage.getItem('quantum_office_db');
        if (localDBStr) {
          try {
            const db = JSON.parse(localDBStr);
            db.config.lastRunTimestamp = new Date().toISOString();
            localStorage.setItem('quantum_office_db', JSON.stringify(db));
            setConfig(db.config);
          } catch {
            // skip
          }
        }
        return;
      }

      const step = steps[currentStep];
      setTimeout(() => {
        addLog(step.text, step.agent);
        currentStep++;
        runNextStep();
      }, step.delay);
    };

    runNextStep();
  };

  // Cloud backend trigger
  const triggerBackendAction = async (actionType: 'trigger_trends' | 'trigger_jobs') => {
    setIsRunning(true);
    setActiveTask(actionType === 'trigger_trends' ? 'Trending Content Campaign (Cloud)' : 'Job Vacancy Poster (Cloud)');
    setStatusMessage('Dispatching Cloud Runner...');
    setStatusColor('var(--secondary, #9d4ede)');
    setLogs([]);

    addLog(`Sending trigger dispatch request to backend API: /api/ai_office.php?action=${actionType}...`, 'System');

    try {
      const response = await fetch(`/api/ai_office.php?action=${actionType}`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        addLog(`Backend Response: ${data.message || 'Trigger successful.'}`, 'System');
        addLog('Connecting to cloud logs database... Polling in progress.', 'System');
        setStatusMessage('Cloud Execution Active (Polling)...');
        
        // Start polling the server logs
        startPollingLogs();
      } else {
        const err = await response.json();
        addLog(`Error: ${err.error || 'Backend failed to trigger cycle.'}`, 'System');
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Error Occurred');
        setStatusColor('#ef4444');
      }
    } catch (e) {
      addLog(`Network Error: ${e instanceof Error ? e.message : 'Connection failed.'}`, 'System');
      setIsRunning(false);
      setActiveTask(null);
      setStatusMessage('Network Error');
      setStatusColor('#ef4444');
    }
  };

  // Poll system logs from backend during cloud execution
  const startPollingLogs = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    let pollCount = 0;
    
    const poll = async () => {
      pollCount++;
      try {
        const res = await fetch('/api/ai_office.php?action=dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.systemLogs && Array.isArray(data.systemLogs)) {
            const formattedLogs = data.systemLogs.map((log: SystemLog) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              return `[${time}] [${log.agent.toUpperCase()}] ${log.message}`;
            });
            setLogs(formattedLogs);
          }
          
          // Check if Deployer published and marked Idle
          const activeTask = data.tasks && data.tasks.find((t: { status: string }) => t.status !== 'completed');
          if (!activeTask && pollCount > 3) {
            // Task has completed
            setIsRunning(false);
            setActiveTask(null);
            setStatusMessage('Cloud Campaign Complete');
            setStatusColor('#10b981');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            fetchConfig();
          }
        }
      } catch (e) {
        console.error("Polling logs error", e);
      }
      
      // Stop polling after 45 attempts (approx 3 minutes) to avoid infinite loops
      if (pollCount > 45) {
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Polling Timed Out');
        setStatusColor('#ef4444');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    };
    
    poll();
    pollIntervalRef.current = setInterval(poll, 4000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleAction = (type: 'trends' | 'jobs') => {
    if (isRunning) return;
    if (isLocalMode) {
      executeLocalSimulation(type);
    } else {
      triggerBackendAction(type === 'trends' ? 'trigger_trends' : 'trigger_jobs');
    }
  };

  const clearConsole = () => {
    setLogs([]);
    addLog('Terminal cleared. Waiting for actions...');
  };

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div className="glass-card" style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={{ ...styles.statusDot, backgroundColor: isRunning ? '#ef4444' : '#10b981', boxShadow: isRunning ? '0 0 10px #ef4444' : '0 0 10px #10b981' }}></div>
          <div>
            <h1 style={styles.title}>AI Virtual Office</h1>
            <p style={styles.subtitle}>Direct Campaign Operations &amp; Real-Time Logs Console</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.metaBadge}>
            <ShieldCheck size={14} style={{ color: 'var(--primary, #00f2fe)' }} />
            <span>Mode: <strong>{isLocalMode ? 'Local Dev Simulation' : 'Production (Cloud)'}</strong></span>
          </div>
          <div style={styles.metaBadge}>
            <ClockBadge label="Last Action" value={config?.lastRunTimestamp ? new Date(config.lastRunTimestamp).toLocaleTimeString() : 'Never'} />
          </div>
        </div>
      </div>

      {/* Main Two Buttons Action Section */}
      <div style={styles.actionGrid}>
        {/* Button 1: Trends */}
        <button 
          className="glass-card" 
          style={{ 
            ...styles.actionButton, 
            opacity: isRunning ? 0.6 : 1,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            borderColor: activeTask === 'Trending Content Campaign' || activeTask === 'Trending Content Campaign (Cloud)' ? 'var(--primary, #00f2fe)' : 'var(--border-glass)'
          }}
          disabled={isRunning}
          onClick={() => handleAction('trends')}
        >
          <div style={{ ...styles.btnIconContainer, background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), transparent)' }}>
            <Sparkles size={28} style={{ color: 'var(--primary, #00f2fe)' }} />
          </div>
          <div style={styles.btnContent}>
            <span style={styles.btnLabel}>Check Trends &amp; Publish</span>
            <span style={styles.btnDesc}>Analyze real-time search volume queries in Google Trends, choose top topics, write guides, and publish content.</span>
          </div>
          <div className="btn-glow-cyan" style={styles.btnPlayGlow}>
            <Play size={16} style={{ color: '#05070c' }} />
          </div>
        </button>

        {/* Button 2: Jobs */}
        <button 
          className="glass-card" 
          style={{ 
            ...styles.actionButton, 
            opacity: isRunning ? 0.6 : 1,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            borderColor: activeTask === 'Job Vacancy Poster' || activeTask === 'Job Vacancy Poster (Cloud)' ? 'var(--secondary, #9d4ede)' : 'var(--border-glass)'
          }}
          disabled={isRunning}
          onClick={() => handleAction('jobs')}
        >
          <div style={{ ...styles.btnIconContainer, background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), transparent)' }}>
            <Briefcase size={28} style={{ color: 'var(--secondary, #9d4ede)' }} />
          </div>
          <div style={styles.btnContent}>
            <span style={styles.btnLabel}>Check &amp; Post Job Vacancy</span>
            <span style={styles.btnDesc}>Scrape government or private sector vacancy lists, extract dates and fees, layout Sarkari Result details table, and publish.</span>
          </div>
          <div className="btn-glow-purple" style={styles.btnPlayGlow}>
            <Play size={16} style={{ color: '#05070c' }} />
          </div>
        </button>
      </div>

      {/* Terminal Logs Panel */}
      <div className="glass-card" style={styles.terminalCard}>
        <div style={styles.terminalHeader}>
          <div style={styles.terminalHeaderLeft}>
            <Terminal size={16} style={{ color: 'var(--primary, #00f2fe)' }} />
            <span style={styles.terminalTitle}>Real-Time Execution Logs</span>
          </div>
          <div style={styles.terminalHeaderRight}>
            <span style={{ ...styles.consoleStatusText, color: statusColor }}>
              {isRunning && <RefreshCw size={12} className="spin-animation" style={{ marginRight: '6px' }} />}
              {statusMessage}
            </span>
            <button style={styles.clearBtn} onClick={clearConsole} title="Clear terminal console">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div ref={terminalBodyRef} style={styles.terminalBody}>
          {logs.length === 0 ? (
            <div style={styles.terminalEmpty}>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>Console terminal is empty. Click one of the action buttons above to trigger execution.</span>
            </div>
          ) : (
            logs.map((log, index) => {
              let color = 'rgba(255, 255, 255, 0.8)';
              if (log.includes('[SYSTEM]')) color = 'var(--primary, #00f2fe)';
              else if (log.includes('[ALEX]')) color = '#f59e0b';
              else if (log.includes('[MARK]')) color = '#38bdf8';
              else if (log.includes('[SOPHIA]')) color = '#a78bfa';
              else if (log.includes('[DEPLOYER]')) color = '#10b981';
              else if (log.includes('Error') || log.includes('FAILED')) color = '#ef4444';
              else if (log.includes('Success')) color = '#10b981';

              return (
                <div key={index} style={{ ...styles.logLine, color }}>
                  {log}
                </div>
              );
            })
          )}
          {isRunning && (
            <div style={styles.terminalCursorLine}>
              <span style={styles.terminalCursor}></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClockBadge: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ display: 'flex', flexDirection: 'column' as const, fontSize: '0.75rem', textAlign: 'right' }}>
    <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{value}</span>
  </div>
);

const styles = {
  container: {
    padding: '30px 24px 100px 24px',
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  headerCard: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 15, 30, 0.4)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  metaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    padding: '6px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px'
  },
  actionButton: {
    textAlign: 'left' as const,
    padding: '30px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'rgba(15, 20, 35, 0.5)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
  },
  btnIconContainer: {
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  btnContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flexGrow: 1
  },
  btnLabel: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  btnDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  btnPlayGlow: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    boxShadow: '0 4px 12px rgba(255,255,255,0.2)',
    transition: 'transform 0.2s ease'
  },
  terminalCard: {
    background: 'rgba(5, 7, 12, 0.9)',
    border: '1px solid var(--border-glass-active)',
    borderRadius: '16px',
    padding: '0',
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'
  },
  terminalHeader: {
    padding: '16px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  terminalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  terminalTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    letterSpacing: '1px',
    color: 'var(--text-primary)',
    textTransform: 'uppercase' as const
  },
  terminalHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  consoleStatusText: {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center'
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  terminalBody: {
    padding: '24px',
    height: '420px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    backgroundColor: '#04060a'
  },
  terminalEmpty: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '0 20px'
  },
  logLine: {
    wordBreak: 'break-word' as const,
    letterSpacing: '0.5px'
  },
  terminalCursorLine: {
    display: 'flex',
    alignItems: 'center'
  },
  terminalCursor: {
    display: 'inline-block',
    width: '8px',
    height: '15px',
    backgroundColor: 'var(--primary, #00f2fe)',
    animation: 'blink 1s step-end infinite',
    marginLeft: '2px'
  }
};
