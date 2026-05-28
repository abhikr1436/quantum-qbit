import React, { useState } from 'react';
import { Users, Info, Shield, CheckCircle } from 'lucide-react';

interface Agent {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  status: string;
}

interface OrgChartProps {
  agents: Agent[];
  tasks: any[];
}

export const OrgChart: React.FC<OrgChartProps> = ({ agents, tasks }) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0] || null);

  const getAgentTasksCount = (name: string) => {
    return tasks.filter(t => t.assignee === name && t.status === 'completed').length;
  };

  const getAgentActiveTasks = (name: string) => {
    return tasks.filter(t => t.assignee === name && t.status !== 'completed');
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.leftCol}>
        <div style={styles.grid}>
          {agents.map((agent) => {
            const isSelected = selectedAgent?.name === agent.name;
            const completedCount = getAgentTasksCount(agent.name);
            const activeTasks = getAgentActiveTasks(agent.name);
            const isActive = agent.status !== 'Idle';

            return (
              <div
                key={agent.name}
                onClick={() => setSelectedAgent(agent)}
                style={{
                  ...styles.card,
                  borderColor: isSelected ? 'var(--primary, #00f2fe)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: isSelected ? '0 0 15px rgba(0, 242, 254, 0.15)' : 'none',
                  background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)'
                }}
                className="preset-card-hover"
              >
                <div style={styles.cardHeader}>
                  <span style={styles.avatar}>{agent.avatar}</span>
                  <div>
                    <h3 style={styles.name}>{agent.name}</h3>
                    <div style={styles.role}>{agent.role}</div>
                  </div>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={styles.statusRow}>
                    <span style={{
                      ...styles.statusDot,
                      backgroundColor: isActive ? 'var(--primary, #00f2fe)' : 'rgba(255,255,255,0.3)',
                      boxShadow: isActive ? '0 0 8px var(--primary, #00f2fe)' : 'none'
                    }} />
                    <span style={styles.statusText}>{agent.status}</span>
                  </div>
                  
                  <div style={styles.stats}>
                    <span>Completed: <strong>{completedCount}</strong></span>
                    {activeTasks.length > 0 && (
                      <span style={{ color: 'var(--primary, #00f2fe)', fontWeight: 500 }}>
                        Active: {activeTasks.length}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={styles.rightCol}>
        {selectedAgent ? (
          <div style={styles.detailCard} className="glass-card">
            <div style={styles.detailHeader}>
              <span style={styles.detailAvatar}>{selectedAgent.avatar}</span>
              <div>
                <h2 style={{ fontSize: '1.8rem', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>{selectedAgent.name}</h2>
                <span style={styles.detailBadge}>{selectedAgent.role}</span>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>
                <Info size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Responsibilities
              </h4>
              <p style={styles.bioText}>{selectedAgent.bio}</p>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>
                <Shield size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> System Status
              </h4>
              <div style={styles.statusBox}>
                <div><strong>Current Activity:</strong> {selectedAgent.status}</div>
                <div><strong>Model Scope:</strong> DeepSeek Chat (deepseek-chat)</div>
                <div><strong>Access Rights:</strong> File read & write operations</div>
              </div>
            </div>

            <div style={styles.detailSection}>
              <h4 style={styles.sectionTitle}>
                <CheckCircle size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> History
              </h4>
              <div style={styles.historyList}>
                {tasks.filter(t => t.assignee === selectedAgent.name || t.reviews.some((r: any) => r.agent === selectedAgent.name)).length === 0 ? (
                  <div style={styles.noHistory}>No audit operations logged yet for this agent.</div>
                ) : (
                  tasks
                    .filter(t => t.assignee === selectedAgent.name || t.reviews.some((r: any) => r.agent === selectedAgent.name))
                    .slice(0, 3)
                    .map((t, idx) => (
                      <div key={idx} style={styles.historyItem}>
                        <span style={styles.historyDot} />
                        <div>
                          <div style={styles.historyTitle}>{t.title}</div>
                          <div style={styles.historyStatus}>
                            Status: <span style={{ color: t.status === 'completed' ? '#10b981' : 'var(--primary, #00f2fe)' }}>{t.status}</span>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.noSelection} className="glass-card">
            <Users size={48} style={{ color: 'rgba(255,255,255,0.3)', marginBottom: '15px' }} />
            Select an employee from the organization chart to view details.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: '1fr 380px',
    gap: '30px',
    alignItems: 'start',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  leftCol: {
    minWidth: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  card: {
    padding: '20px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    transition: 'all 0.2s ease',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  },
  avatar: {
    fontSize: '2rem',
    background: 'rgba(255, 255, 255, 0.05)',
    padding: '10px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '46px',
    height: '46px',
    boxSizing: 'border-box' as const,
  },
  name: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
  },
  role: {
    fontSize: '0.82rem',
    color: 'var(--primary, #00f2fe)',
    fontWeight: 500,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '12px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  rightCol: {
    position: 'sticky' as const,
    top: '100px',
  },
  detailCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  detailHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '20px',
  },
  detailAvatar: {
    fontSize: '3rem',
    background: 'rgba(255, 255, 255, 0.05)',
    width: '70px',
    height: '70px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    background: 'rgba(0, 242, 254, 0.1)',
    color: 'var(--primary, #00f2fe)',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  detailSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  sectionTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    paddingBottom: '5px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  bioText: {
    fontSize: '0.88rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.5',
    margin: 0,
  },
  statusBox: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    padding: '12px 16px',
    borderRadius: '6px',
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.7)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  noHistory: {
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.4)',
    fontStyle: 'italic',
  },
  historyItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    fontSize: '0.82rem',
  },
  historyDot: {
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary, #00f2fe)',
    boxShadow: '0 0 6px var(--primary, #00f2fe)',
  },
  historyTitle: {
    color: '#fff',
    fontWeight: 500,
  },
  historyStatus: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
    marginTop: '2px',
  },
  noSelection: {
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.9rem',
    minHeight: '300px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  }
};
