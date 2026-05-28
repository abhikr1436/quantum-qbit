import React, { useEffect, useRef } from 'react';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  taskId?: string;
}

interface WorkspaceChatProps {
  chatLogs: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  tasks: any[];
  onViewTask: (id: string) => void;
}

export const WorkspaceChat: React.FC<WorkspaceChatProps> = ({ chatLogs, onSendMessage, tasks, onViewTask }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = React.useState('');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    await onSendMessage(text);
  };

  const getAgentColor = (sender: string) => {
    switch (sender) {
      case 'Sophia': return 'var(--accent, #9d4edd)';
      case 'Alex': return 'var(--primary, #00f2fe)';
      case 'Mark': return '#10b981';
      case 'Sarah': return '#f59e0b';
      case 'Codey': return '#60a5fa';
      case 'Deployer': return '#f43f5e';
      case 'Harper': return '#c084fc';
      case 'System': return 'rgba(255,255,255,0.4)';
      case 'Board': return '#e2e8f0';
      default: return '#fff';
    }
  };

  const getAgentAvatar = (sender: string) => {
    switch (sender) {
      case 'Sophia': return '💼';
      case 'Alex': return '📋';
      case 'Mark': return '✍️';
      case 'Sarah': return '🐦';
      case 'Codey': return '💻';
      case 'Deployer': return '🚀';
      case 'Harper': return '🤝';
      case 'Board': return '👑';
      case 'System': return '⚙️';
      default: return '🤖';
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.chatArea} className="glass-card">
        <div style={styles.chatHeader}>
          <MessageSquare size={18} style={{ color: 'var(--primary, #00f2fe)' }} />
          <span>#quantum-hq-workspace</span>
          <span style={styles.headerSubtitle}>• Collaborative AI Agent Feed</span>
        </div>

        <div style={styles.messagesList} className="chat-messages-scroll">
          {chatLogs.map((msg) => {
            const isSystem = msg.sender === 'System';
            const color = getAgentColor(msg.sender);
            const avatar = getAgentAvatar(msg.sender);

            if (isSystem) {
              return (
                <div key={msg.id} style={styles.systemMessage}>
                  <span style={styles.systemIcon}>{avatar}</span>
                  <span style={styles.systemText}>{msg.text}</span>
                  <span style={styles.systemTime}>{formatTime(msg.timestamp)}</span>
                </div>
              );
            }

            // Link to task if present
            const associatedTask = msg.taskId ? tasks.find(t => t.id === msg.taskId) : null;

            return (
              <div key={msg.id} style={styles.messageRow}>
                <span style={styles.messageAvatar}>{avatar}</span>
                <div style={styles.messageContent}>
                  <div style={styles.messageMeta}>
                    <span style={{ ...styles.messageSender, color }}>{msg.sender}</span>
                    <span style={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                  </div>
                  <p style={styles.messageText}>{msg.text}</p>
                  
                  {associatedTask && (
                    <div 
                      style={styles.taskLink} 
                      onClick={() => onViewTask(msg.taskId!)}
                      className="preset-card-hover"
                    >
                      <span>Task:</span> <strong style={{ color: '#fff' }}>{associatedTask.title}</strong>
                      <span style={styles.taskLinkBadge}>View Details</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSubmit} style={styles.chatInputRow}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Send a message to the workspace chat feed..."
            style={styles.chatInput}
          />
          <button type="submit" style={styles.sendBtn} className="preset-card-hover">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 200px)',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  chatArea: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  chatHeader: {
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontWeight: 600,
    fontSize: '1rem',
    fontFamily: 'var(--font-heading)',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.82rem',
    fontWeight: 400,
  },
  messagesList: {
    flexGrow: 1,
    padding: '24px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  messageRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
  },
  messageAvatar: {
    fontSize: '1.5rem',
    background: 'rgba(255, 255, 255, 0.03)',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255, 255, 255, 0.08)',
  },
  messageContent: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  messageMeta: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
  },
  messageSender: {
    fontWeight: 600,
    fontSize: '0.92rem',
  },
  messageTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '0.9rem',
    lineHeight: '1.45',
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
  },
  systemMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 16px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
  },
  systemIcon: {
    fontSize: '1rem',
  },
  systemText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.82rem',
    fontStyle: 'italic',
    flexGrow: 1,
  },
  systemTime: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: '0.75rem',
  },
  taskLink: {
    marginTop: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    background: 'rgba(0, 242, 254, 0.03)',
    border: '1px dashed rgba(0, 242, 254, 0.2)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 'fit-content',
    transition: 'all 0.2s ease',
  },
  taskLinkBadge: {
    background: 'rgba(0, 242, 254, 0.1)',
    color: 'var(--primary, #00f2fe)',
    padding: '2px 6px',
    borderRadius: '3px',
    fontSize: '0.72rem',
    fontWeight: 600,
    marginLeft: '6px',
  },
  chatInputRow: {
    padding: '20px 24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    gap: '12px',
    boxSizing: 'border-box' as const,
  },
  chatInput: {
    flexGrow: 1,
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px 16px',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.9rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  sendBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.8)',
    width: '44px',
    height: '44px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    padding: 0,
    boxSizing: 'border-box' as const,
  }
};
