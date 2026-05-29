import React, { useState } from 'react';
import { Save, Folder, Key, ShieldCheck, RefreshCw } from 'lucide-react';

interface Config {
  websitePath: string;
  deepseekKey: string;
  githubToken?: string;
  isAutomationActive: boolean;
}

interface SettingsProps {
  config: Config;
  onUpdateConfig: (newConfig: Partial<Config>) => Promise<void>;
}

export const AiSettings: React.FC<SettingsProps> = ({ config, onUpdateConfig }) => {
  const [pathInput, setPathInput] = useState(config.websitePath || '');
  const [keyInput, setKeyInput] = useState(config.deepseekKey || '');
  const [githubInput, setGithubInput] = useState(config.githubToken || '');
  const [automationInput, setAutomationInput] = useState(config.isAutomationActive || false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await onUpdateConfig({
        websitePath: pathInput,
        deepseekKey: keyInput,
        githubToken: githubInput,
        isAutomationActive: automationInput
      });
      setSaveStatus('Configurations updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (err) {
      setSaveStatus('Error saving configurations: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const getMaskedKey = (key: string) => {
    if (!key) return 'Not set';
    if (key.length <= 10) return 'Invalid Key';
    return `${key.slice(0, 5)}...${key.slice(-4)}`;
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.card} className="glass-card">
        <h2 style={styles.header}>
          <ShieldCheck size={22} style={{ color: 'var(--primary, #00f2fe)' }} />
          AI Virtual Company Config
        </h2>
        
        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Key size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Deepseek API Key
            </label>
            <input
              type="password"
              style={styles.input}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="sk-d98..."
            />
            <small style={styles.help}>
              Currently configured key: <strong style={{ color: 'var(--primary, #00f2fe)' }}>{getMaskedKey(config.deepseekKey)}</strong>. 
              This key is used by the agents to query the LLM model.
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <ShieldCheck size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> GitHub Personal Access Token (PAT)
            </label>
            <input
              type="password"
              style={styles.input}
              value={githubInput}
              onChange={(e) => setGithubInput(e.target.value)}
              placeholder="ghp_..."
            />
            <small style={styles.help}>
              Currently configured token: <strong style={{ color: 'var(--primary, #00f2fe)' }}>{getMaskedKey(config.githubToken || '')}</strong>. 
              Required to dispatch the GitHub Action background runner immediately when clicking "Run Agent Cycle".
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              <Folder size={14} style={{ color: 'var(--primary, #00f2fe)' }} /> Local Website Path
            </label>
            <input
              type="text"
              style={styles.input}
              value={pathInput}
              onChange={(e) => setPathInput(e.target.value)}
              placeholder="e.g. f:/Codes/web-app/quantum-qbit"
              required
            />
            <small style={styles.help}>
              Local path to your project. Use <code>.</code> or relative path on the server.
            </small>
          </div>

          <div style={styles.formGroupCheck}>
            <label style={styles.labelCheck}>
              <input
                type="checkbox"
                checked={automationInput}
                onChange={(e) => setAutomationInput(e.target.checked)}
                style={styles.checkbox}
              />
              Enable Autonomous Background Loop (No Presence Mode)
            </label>
            <small style={styles.help}>
              When enabled, the agents will automatically run cycles every 6 hours via GitHub Actions. If idle, Marketing will occasionally brainstorm new blog articles to improve Google keywords without your presence.
            </small>
          </div>

          {saveStatus && (
            <div style={{
              ...styles.alert,
              background: saveStatus.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: saveStatus.includes('Error') ? '#ef4444' : '#10b981',
              color: saveStatus.includes('Error') ? '#fca5a5' : '#a7f3d0'
            }}>
              {saveStatus}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={isSaving} style={{ alignSelf: 'flex-start', border: 'none', cursor: 'pointer' }}>
            {isSaving ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
            {isSaving ? 'Saving Configurations...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div style={styles.card} className="glass-card">
        <h3 style={{ ...styles.header, fontSize: '1.2rem', marginBottom: '15px' }}>Serverless Deployment Reference</h3>
        <p style={styles.text}>
          Your production website <strong>quantumqbit.in</strong> is hosted on Hostinger. 
          The backend runs serverless agent loops using GitHub Actions in the background 24x7.
        </p>
        <div style={styles.systemBox}>
          <div style={styles.systemLine}><strong>Website Domain:</strong> <a href="https://quantumqbit.in" target="_blank" rel="noreferrer" style={{ color: 'var(--primary, #00f2fe)', textDecoration: 'none' }}>quantumqbit.in</a></div>
          <div style={styles.systemLine}><strong>Database Sync Path:</strong> <code>/public/api/data/blogs.json</code></div>
          <div style={styles.systemLine}><strong>Local dev dashboard:</strong> <code>localhost:5173/admin</code> (after auth)</div>
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
  card: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  header: {
    fontSize: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '15px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  formGroupCheck: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginTop: '8px',
    marginBottom: '10px',
  },
  labelCheck: {
    fontSize: '0.92rem',
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: 'var(--primary, #00f2fe)',
  },
  input: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '12px 16px',
    borderRadius: '6px',
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
  },
  help: {
    fontSize: '0.8rem',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: '1.4',
  },
  alert: {
    padding: '12px 16px',
    borderRadius: '6px',
    border: '1px solid',
    fontSize: '0.9rem',
  },
  text: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    margin: 0,
  },
  systemBox: {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    fontSize: '0.85rem',
  },
  systemLine: {
    color: 'rgba(255,255,255,0.7)',
  }
};
