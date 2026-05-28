import React, { useState } from 'react';
import { Send, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface BoardroomProps {
  onSendDirective: (text: string) => Promise<void>;
  isProcessing: boolean;
  agents: any[];
}

export const Boardroom: React.FC<BoardroomProps> = ({ onSendDirective, isProcessing, agents }) => {
  const [directiveText, setDirectiveText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directiveText.trim()) return;
    setErrorMessage(null);
    try {
      await onSendDirective(directiveText);
      setDirectiveText('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit directive.');
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
  }
};
