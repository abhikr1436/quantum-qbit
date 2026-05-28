import React, { useState, useEffect } from 'react';
import { Users, MessageSquare, KanbanSquare, Sparkles, Search, Settings as SettingsIcon, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { OrgChart } from './OrgChart';
import { WorkspaceChat } from './WorkspaceChat';
import { KanbanBoard } from './KanbanBoard';
import { Boardroom } from './Boardroom';
import { SeoDashboard } from './SeoDashboard';
import { AiSettings } from './AiSettings';

export const AiOfficeTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'org' | 'chat' | 'tasks' | 'boardroom' | 'seo' | 'settings'>('boardroom');
  
  // Dashboard States
  const [config, setConfig] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automation / execution load states
  const [runLoopLoading, setRunLoopLoading] = useState(false);
  const [boardroomProcessing, setBoardroomProcessing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch full dashboard state from PHP backend
  const fetchDashboardData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetch('/api/ai_office.php?action=dashboard');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || {});
        setAgents(data.agents || []);
        setTasks(data.tasks || []);
        setChatLogs(data.chatLogs || []);
        setErrorMsg(null);
      } else {
        setErrorMsg('Failed to read status data from AI Office backend.');
      }
    } catch (err: any) {
      setErrorMsg('Cannot connect to AI Office PHP backend API.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial fetch + background syncing (every 6 seconds)
  useEffect(() => {
    fetchDashboardData(true);
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Update Settings
  const handleUpdateConfig = async (newConfig: any) => {
    try {
      const response = await fetch('/api/ai_office.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        await fetchDashboardData(false);
      } else {
        throw new Error('Failed to update config.');
      }
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  // Send workspace chat message
  const handleSendMessage = async (text: string) => {
    try {
      const response = await fetch('/api/ai_office.php?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'Board', text })
      });
      if (response.ok) {
        await fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit boardroom mandate directive
  const handleSendDirective = async (text: string) => {
    setBoardroomProcessing(true);
    try {
      const response = await fetch('/api/ai_office.php?action=boardroom_submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive: text })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit directive');
      }
      await fetchDashboardData(false);
    } catch (err: any) {
      console.error(err);
      throw err;
    } finally {
      setBoardroomProcessing(false);
    }
  };

  // Trigger next step of the agent state machine loop (dispatches GitHub Action)
  const handleTriggerAgentLoop = async () => {
    setRunLoopLoading(true);
    try {
      const response = await fetch('/api/ai_office.php?action=trigger_cycle', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchDashboardData(false);
        alert('GitHub Action runner triggered successfully in the cloud! It will process the next cycle shortly.');
      } else {
        const data = await response.json();
        alert('Trigger failed: ' + (data.error || 'Check Settings for valid GitHub Token.'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error triggering background cycle.');
    } finally {
      setRunLoopLoading(false);
    }
  };

  // Manually override/update task status
  const handleUpdateTaskStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch('/api/ai_office.php?action=update_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (response.ok) {
        await fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger SEO audit check
  const handleTriggerAudit = async () => {
    const response = await fetch('/api/ai_office.php?action=seo_audit');
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'SEO scan failed');
    }
    return response.json();
  };

  // Link view handler to auto-jump from chat to Kanban task card modal
  const handleViewTask = (id: string) => {
    setSelectedTaskId(id);
    setActiveTab('tasks');
  };

  const getActiveTaskCount = () => {
    return tasks.filter(t => t.status !== 'completed').length;
  };

  return (
    <div style={styles.dashboardLayout}>
      {/* Sidebar navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <Layers style={{ color: 'var(--primary, #00f2fe)' }} size={20} />
          <span style={styles.logoText}>Virtual Office</span>
        </div>

        <nav style={styles.sidebarMenu}>
          <div 
            onClick={() => setActiveTab('boardroom')} 
            style={{ ...styles.menuItem, ...(activeTab === 'boardroom' ? styles.menuItemActive : {}) }}
          >
            <Sparkles size={15} />
            <span>Boardroom Table</span>
          </div>
          
          <div 
            onClick={() => setActiveTab('tasks')} 
            style={{ ...styles.menuItem, ...(activeTab === 'tasks' ? styles.menuItemActive : {}) }}
          >
            <KanbanSquare size={15} />
            <span>Kanban Workflows</span>
            {getActiveTaskCount() > 0 && (
              <span style={styles.taskBadge}>{getActiveTaskCount()}</span>
            )}
          </div>

          <div 
            onClick={() => setActiveTab('chat')} 
            style={{ ...styles.menuItem, ...(activeTab === 'chat' ? styles.menuItemActive : {}) }}
          >
            <MessageSquare size={15} />
            <span>Workspace Chat</span>
          </div>

          <div 
            onClick={() => setActiveTab('org')} 
            style={{ ...styles.menuItem, ...(activeTab === 'org' ? styles.menuItemActive : {}) }}
          >
            <Users size={15} />
            <span>Company Staff</span>
          </div>

          <div 
            onClick={() => setActiveTab('seo')} 
            style={{ ...styles.menuItem, ...(activeTab === 'seo' ? styles.menuItemActive : {}) }}
          >
            <Search size={15} />
            <span>Google & SEO</span>
          </div>

          <div 
            onClick={() => setActiveTab('settings')} 
            style={{ ...styles.menuItem, ...(activeTab === 'settings' ? styles.menuItemActive : {}) }}
          >
            <SettingsIcon size={15} />
            <span>Settings</span>
          </div>
        </nav>

        {/* Global Agent loop status button at the footer */}
        <div style={styles.sidebarFooter}>
          <button 
            className="btn-primary" 
            style={styles.runLoopBtn}
            onClick={handleTriggerAgentLoop}
            disabled={runLoopLoading}
          >
            <RefreshCw size={14} className={runLoopLoading ? 'spin' : ''} />
            {runLoopLoading ? 'Dispatching...' : 'Trigger Cloud Cycle'}
          </button>
        </div>
      </aside>

      {/* Main dashboard viewport */}
      <main style={styles.mainViewport}>
        
        {/* Status Indicator banner */}
        <div style={styles.statusBanner} className="glass-card">
          <div style={styles.statusText}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: agents.some(a => a.status !== 'Idle') ? 'var(--primary, #00f2fe)' : 'rgba(255,255,255,0.3)',
              boxShadow: agents.some(a => a.status !== 'Idle') ? '0 0 10px var(--primary, #00f2fe)' : 'none'
            }} />
            <span>
              <strong>Company Status:</strong>{' '}
              {agents.some(a => a.status !== 'Idle') ? (
                <span style={{ color: 'var(--primary, #00f2fe)', fontWeight: 600 }}>
                  Agents actively executing tasks in cloud
                </span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Ready for Board directives</span>
              )}
            </span>
          </div>

          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Serverless Agent Loop Active</span>
          </div>
        </div>

        {/* Display connection errors */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={32} className="spin" style={{ color: 'var(--primary, #00f2fe)' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>Synchronizing Office Database...</span>
          </div>
        ) : (
          <div style={styles.tabContentContainer}>
            {activeTab === 'boardroom' && (
              <Boardroom 
                onSendDirective={handleSendDirective}
                isProcessing={boardroomProcessing}
                agents={agents}
              />
            )}
            
            {activeTab === 'tasks' && (
              <KanbanBoard 
                tasks={tasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onTriggerAgentLoop={handleTriggerAgentLoop}
                selectedTaskId={selectedTaskId}
                onClearSelectedTaskId={() => setSelectedTaskId(null)}
              />
            )}

            {activeTab === 'chat' && (
              <WorkspaceChat 
                chatLogs={chatLogs}
                onSendMessage={handleSendMessage}
                tasks={tasks}
                onViewTask={handleViewTask}
              />
            )}

            {activeTab === 'org' && (
              <OrgChart 
                agents={agents}
                tasks={tasks}
              />
            )}

            {activeTab === 'seo' && (
              <SeoDashboard 
                onTriggerAudit={handleTriggerAudit}
              />
            )}

            {activeTab === 'settings' && (
              <AiSettings 
                config={config}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: {
    display: 'flex',
    gap: '24px',
    minHeight: '600px',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  sidebar: {
    width: '240px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '12px',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '1.05rem',
    fontFamily: 'var(--font-heading)',
    background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    color: 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    background: 'rgba(0, 242, 254, 0.1)',
    color: 'var(--primary, #00f2fe)',
    fontWeight: 600,
  },
  taskBadge: {
    marginLeft: 'auto',
    background: 'rgba(0, 242, 254, 0.15)',
    color: 'var(--primary, #00f2fe)',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '20px',
  },
  runLoopBtn: {
    width: '100%',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    minWidth: 0,
  },
  statusBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  statusText: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    padding: '16px 24px',
    borderRadius: '12px',
    color: '#fecaca',
    fontSize: '0.9rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '80px 0',
  },
  tabContentContainer: {
    flex: 1,
    minHeight: 0,
  }
};
