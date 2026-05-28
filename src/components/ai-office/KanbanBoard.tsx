import React, { useState } from 'react';
import { Calendar, User, FileText, CheckCircle, RefreshCw, X, ArrowRight } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  type: string;
  assignee: string;
  status: string;
  draftContent: any;
  reviews: any[];
  createdAt: string;
  updatedAt: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTaskStatus: (id: string, newStatus: string) => Promise<void>;
  onTriggerAgentLoop: () => Promise<void>;
  selectedTaskId: string | null;
  onClearSelectedTaskId: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onUpdateTaskStatus,
  onTriggerAgentLoop,
  selectedTaskId,
  onClearSelectedTaskId
}) => {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // If a task is selected from outside (like chat link), open it
  React.useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setActiveTask(task);
      }
    }
  }, [selectedTaskId, tasks]);

  const handleCloseModal = () => {
    setActiveTask(null);
    onClearSelectedTaskId();
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(t => t.status === status);
  };

  const getTaskBadgeClass = (status: string) => {
    switch (status) {
      case 'todo': return 'badge-todo';
      case 'inprogress': return 'badge-progress';
      case 'manager_review': return 'badge-review';
      case 'ceo_approval': return 'badge-approval';
      case 'completed': return 'badge-completed';
      default: return 'badge-todo';
    }
  };

  const getTaskBadgeLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'To Do';
      case 'inprogress': return 'In Progress';
      case 'manager_review': return 'Manager Review';
      case 'ceo_approval': return 'CEO Approval';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const renderDraftContent = (task: Task) => {
    const draft = task.draftContent;
    if (!draft) return <div style={styles.noDraft}>No draft submitted yet. Task is in progress.</div>;

    if (typeof draft === 'string') {
      return <div style={styles.draftText}>{draft}</div>;
    }

    if (task.type === 'blog') {
      return (
        <div style={styles.blogPreview} className="glass-card">
          <div style={{ ...styles.previewGlow, background: `radial-gradient(circle, ${draft.imageGlow || 'rgba(0,242,254,0.1)'} 0%, transparent 70%)` }}></div>
          <span style={styles.previewCategory}>Category ID: {draft.category_id || 'privacy-security'}</span>
          <h3 style={styles.previewTitle}>{draft.title || task.title}</h3>
          <p style={styles.previewExcerpt}><em>{draft.excerpt}</em></p>
          <div style={styles.previewDivider}></div>
          <div style={styles.previewBody} dangerouslySetInnerHTML={{ __html: draft.content || '' }} />
        </div>
      );
    }

    if (task.type === 'social') {
      return (
        <div style={styles.socialPreview} className="glass-card">
          <div style={styles.socialPlatform}>Platform: {draft.platform || 'Twitter/LinkedIn'}</div>
          <div style={styles.socialText}>{draft.postText}</div>
          {draft.recommendations && (
            <div style={styles.socialRecs}>
              <strong>Audience Recommendation:</strong> {draft.recommendations}
            </div>
          )}
        </div>
      );
    }

    return (
      <pre style={styles.jsonPreview}>
        {JSON.stringify(draft, null, 2)}
      </pre>
    );
  };

  const columns = [
    { key: 'todo', label: 'To Do / Backlog' },
    { key: 'inprogress', label: 'In Progress' },
    { key: 'manager_review', label: 'Manager Review' },
    { key: 'ceo_approval', label: 'CEO Approval' },
    { key: 'completed', label: 'Completed' }
  ];

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)' }}>Task Workflows</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Track, audit, and approve agent activities</p>
        </div>
        <button className="btn-primary" onClick={onTriggerAgentLoop} style={{ gap: '8px', cursor: 'pointer', border: 'none' }}>
          <RefreshCw size={14} /> Run Agent Cycle
        </button>
      </div>

      <div style={styles.board} className="kanban-board-scroll">
        {columns.map(col => {
          const colTasks = getTasksByStatus(col.key);
          return (
            <div key={col.key} style={styles.column} className="glass-card">
              <div style={styles.columnHeader}>
                <span style={styles.columnLabel}>{col.label}</span>
                <span style={styles.columnCount}>{colTasks.length}</span>
              </div>
              <div style={styles.columnCardsList}>
                {colTasks.length === 0 ? (
                  <div style={styles.emptyCol}>No tasks</div>
                ) : (
                  colTasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setActiveTask(t)}
                      style={styles.taskCard}
                      className="preset-card-hover"
                    >
                      <div style={styles.taskCardHeader}>
                        <span style={styles.typeBadge}>{t.type}</span>
                        <span style={styles.cardId}>#{t.id.slice(-4)}</span>
                      </div>
                      <h4 style={styles.taskCardTitle}>{t.title}</h4>
                      <div style={styles.taskCardFooter}>
                        <span style={styles.assigneeText}>👤 {t.assignee}</span>
                        <span style={styles.dateText}>{new Date(t.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      {activeTask && (
        <div style={styles.modalOverlay} onClick={handleCloseModal}>
          <div style={styles.modalCard} className="glass-card animate-fade-in" onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.statusBadge}>
                  {getTaskBadgeLabel(activeTask.status)}
                </span>
                <h2 style={{ marginTop: '8px', fontSize: '1.6rem', margin: '8px 0 0 0', fontFamily: 'var(--font-heading)' }}>{activeTask.title}</h2>
              </div>
              <button style={styles.closeBtn} onClick={handleCloseModal} aria-label="Close details">
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody} className="chat-messages-scroll">
              <div style={styles.modalGrid}>
                <div style={styles.modalMain}>
                  <div style={styles.detailsGroup}>
                    <h3 style={styles.sectionHeader}>Description</h3>
                    <p style={styles.descText}>{activeTask.description}</p>
                  </div>

                  <div style={styles.detailsGroup}>
                    <h3 style={styles.sectionHeader}>Submitted Work Draft</h3>
                    {renderDraftContent(activeTask)}
                  </div>
                </div>

                <div style={styles.modalSidebar}>
                  <div style={styles.sidebarSection}>
                    <h4 style={styles.sidebarHeader}>Task Details</h4>
                    <div style={styles.sidebarInfoRow}>
                      <User size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Assignee: <strong>{activeTask.assignee}</strong>
                    </div>
                    <div style={styles.sidebarInfoRow}>
                      <FileText size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Type: <span style={{ textTransform: 'uppercase', fontWeight: 600 }}>{activeTask.type}</span>
                    </div>
                    <div style={styles.sidebarInfoRow}>
                      <Calendar size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Updated: <span>{new Date(activeTask.updatedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={styles.sidebarSection}>
                    <h4 style={styles.sidebarHeader}>Reviews & Approvals</h4>
                    {activeTask.reviews.length === 0 ? (
                      <div style={styles.noReviewText}>Pending review by Manager & CEO.</div>
                    ) : (
                      <div style={styles.reviewsList}>
                        {activeTask.reviews.map((r, idx) => (
                          <div key={idx} style={styles.reviewItem}>
                            <div style={styles.reviewMeta}>
                              <span style={styles.reviewAgent}>👤 {r.agent}</span>
                              <span style={{
                                ...styles.reviewStatus,
                                color: r.decision === 'approved' ? '#10b981' : '#ef4444'
                              }}>
                                {r.decision === 'approved' ? 'Approved' : 'Rejected'}
                              </span>
                            </div>
                            <p style={styles.reviewText}>{r.reviewText}</p>
                            <span style={styles.reviewTime}>{new Date(r.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Overrides for testing */}
                  <div style={styles.sidebarSection}>
                    <h4 style={styles.sidebarHeader}>Manual Override</h4>
                    <div style={styles.actionButtons}>
                      {activeTask.status === 'todo' && (
                        <button
                          className="btn-primary"
                          style={styles.actionBtn}
                          onClick={() => {
                            onUpdateTaskStatus(activeTask.id, 'inprogress');
                            handleCloseModal();
                          }}
                        >
                          Start Task <ArrowRight size={14} />
                        </button>
                      )}
                      {activeTask.status === 'inprogress' && (
                        <button
                          className="btn-primary"
                          style={styles.actionBtn}
                          onClick={() => {
                            onUpdateTaskStatus(activeTask.id, 'manager_review');
                            handleCloseModal();
                          }}
                        >
                          Submit Draft <ArrowRight size={14} />
                        </button>
                      )}
                      {activeTask.status === 'manager_review' && (
                        <button
                          className="btn-primary"
                          style={styles.actionBtn}
                          onClick={() => {
                            onUpdateTaskStatus(activeTask.id, 'ceo_approval');
                            handleCloseModal();
                          }}
                        >
                          Manager Approve <ArrowRight size={14} />
                        </button>
                      )}
                      {activeTask.status === 'ceo_approval' && (
                        <button
                          className="btn-primary"
                          style={styles.actionBtn}
                          onClick={() => {
                            onUpdateTaskStatus(activeTask.id, 'completed');
                            handleCloseModal();
                          }}
                        >
                          CEO Approve & Publish <CheckCircle size={14} />
                        </button>
                      )}
                      {activeTask.status !== 'completed' && (
                        <button
                          className="btn-primary"
                          style={{ ...styles.actionBtn, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444' }}
                          onClick={() => {
                            onUpdateTaskStatus(activeTask.id, 'completed');
                            handleCloseModal();
                          }}
                        >
                          Force Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    height: '100%',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '20px',
    height: 'calc(100vh - 240px)',
    minHeight: '480px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '16px',
    height: '100%',
    overflow: 'hidden',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxSizing: 'border-box' as const,
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '8px',
  },
  columnLabel: {
    fontWeight: 600,
    fontSize: '0.88rem',
    color: '#fff',
  },
  columnCount: {
    background: 'rgba(255,255,255,0.06)',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.6)',
  },
  columnCardsList: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    paddingRight: '2px',
  },
  emptyCol: {
    textAlign: 'center' as const,
    padding: '30px 0',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.78rem',
    border: '1px dashed rgba(255,255,255,0.08)',
    borderRadius: '6px',
  },
  taskCard: {
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    transition: 'all 0.2s ease',
  },
  taskCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    background: 'rgba(0, 242, 254, 0.1)',
    color: 'var(--primary, #00f2fe)',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  cardId: {
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.3)',
  },
  taskCardTitle: {
    fontSize: '0.88rem',
    color: '#fff',
    lineHeight: '1.3',
    fontWeight: 500,
    margin: 0,
  },
  taskCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: 'rgba(255,255,255,0.5)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '8px',
    marginTop: '4px',
  },
  assigneeText: {
    fontWeight: 500,
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(3, 5, 10, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalCard: {
    width: '900px',
    maxWidth: '90%',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '30px',
    overflow: 'hidden',
    background: 'rgba(20, 24, 33, 0.95)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  statusBadge: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    background: 'rgba(0, 242, 254, 0.12)',
    color: 'var(--primary, #00f2fe)',
    padding: '4px 10px',
    borderRadius: '12px',
    border: '1px solid rgba(0, 242, 254, 0.2)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    flexGrow: 1,
    overflowY: 'auto' as const,
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '30px',
  },
  modalMain: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  modalSidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
    paddingLeft: '24px',
  },
  detailsGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  sectionHeader: {
    fontSize: '1rem',
    fontWeight: 600,
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: '5px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  descText: {
    fontSize: '0.9rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: '1.5',
    margin: 0,
  },
  noDraft: {
    padding: '20px',
    background: 'rgba(255,255,255,0.01)',
    borderRadius: '6px',
    border: '1px dashed rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.4)',
    fontSize: '0.88rem',
    textAlign: 'center' as const,
  },
  draftText: {
    background: 'rgba(0,0,0,0.3)',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '0.88rem',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
  },
  blogPreview: {
    padding: '24px',
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
  },
  previewGlow: {
    position: 'absolute' as const,
    top: '-40px',
    right: '-40px',
    width: '200px',
    height: '200px',
    pointerEvents: 'none' as const,
  },
  previewCategory: {
    fontSize: '0.75rem',
    color: 'var(--primary, #00f2fe)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  previewTitle: {
    fontSize: '1.4rem',
    marginTop: '8px',
    marginBottom: '10px',
    fontFamily: 'var(--font-heading)',
  },
  previewExcerpt: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: '15px',
    margin: '8px 0 15px 0',
  },
  previewDivider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '15px 0',
  },
  previewBody: {
    fontSize: '0.9rem',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: '1.6',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  socialPreview: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
  },
  socialPlatform: {
    fontSize: '0.8rem',
    color: 'var(--primary, #00f2fe)',
    fontWeight: 600,
  },
  socialText: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '16px',
    borderRadius: '6px',
    fontSize: '0.92rem',
    lineHeight: '1.4',
    color: '#fff',
  },
  socialRecs: {
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  jsonPreview: {
    background: 'rgba(0,0,0,0.2)',
    padding: '16px',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '0.82rem',
    overflowX: 'auto' as const,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  sidebarHeader: {
    fontSize: '0.88rem',
    fontWeight: 600,
    color: '#fff',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '5px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  sidebarInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  noReviewText: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  reviewItem: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '10px 12px',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  reviewMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
  },
  reviewAgent: {
    fontWeight: 600,
  },
  reviewStatus: {
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    fontSize: '0.72rem',
  },
  reviewText: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.3',
    margin: 0,
  },
  reviewTime: {
    fontSize: '0.7rem',
    color: 'rgba(255,255,255,0.4)',
    alignSelf: 'flex-end',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  actionBtn: {
    width: '100%',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
  }
};
