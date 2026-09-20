import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Terminal,
  Code2,
  Key,
  Shield,
  Send,
  ExternalLink,
  Sparkles,
  FileCode,
  Cpu,
  Bot
} from 'lucide-react';
import { AI_PROMPT_TEMPLATE } from '../utils/blogMarkupParser';

interface BlogApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
}

export const BlogApiModal: React.FC<BlogApiModalProps> = ({ isOpen, onClose, onOpenAdmin }) => {
  const [activeTab, setActiveTab] = useState<'mcp' | 'format' | 'curl' | 'python' | 'json'>('mcp');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  const mcpUrlExample = `https://quantumqbit.in/api/mcp.php?api_key=YOUR_SECRET_API_KEY`;

  const mcpConfigExample = `{
  "mcpServers": {
    "quantum-qbit-blogs": {
      "url": "https://quantumqbit.in/api/mcp.php?api_key=YOUR_SECRET_API_KEY"
    }
  }
}`;

  const mcpPromptExample = `You are connected to the Quantum Qbit Blog MCP server.
When asked to create an article:
1. Optionally call get_blog_format_template to review formatting rules.
2. Draft a rigorous, SEO-optimized technical article with headings, tables, and <tip> tags.
3. Call publish_blog to publish the article live on https://quantumqbit.in.`;

  const curlExample = `curl -X POST https://quantumqbit.in/api/publish.php \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_SECRET_API_KEY" \\
  -d '{
    "format": "<title>Your Article Title</title>\\n<category>Technology</category>\\n<summary>Short hook summary...</summary>\\n<body><p>Article body content here...</p></body>"
  }'`;

  const pythonExample = `import requests

API_URL = "https://quantumqbit.in/api/publish.php"
API_KEY = "YOUR_SECRET_API_KEY"  # Obtain from /admin

payload = {
    "format": """<title>Next-Gen Browser Computing</title>
<category>Privacy & Security</category>
<summary>How modern client-side engines execute heavy tasks in RAM.</summary>
<cover_image>https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe</cover_image>
<tags>Privacy, WebAssembly, Security</tags>
<body>
  <p>Exploring the frontier of browser-native client processing...</p>
  <h2>Zero Server Footprint</h2>
  <p>All memory allocations remain local to the user session.</p>
  <tip>Pro-Tip: Always verify zero network payload transit via DevTools.</tip>
</body>"""
}

headers = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY
}

response = requests.post(API_URL, json=payload, headers=headers)
print("Status:", response.status_code)
print("Response:", response.json())`;

  const jsonExample = `{
  "title": "Article Title",
  "category": "Technology",
  "summary": "Short two-sentence summary hook...",
  "cover_image": "https://images.unsplash.com/... (optional)",
  "tags": ["Technology", "Browser", "Security"],
  "slug": "custom-url-slug", 
  "content": "<p>Article HTML paragraphs, headings, and tables...</p>"
}`;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()} className="liquid-glass-card">
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <div style={styles.iconBadge}>
              <Terminal size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={styles.modalTitleRow}>
                <h3 style={styles.modalTitle}>Remote Blog Publishing API</h3>
                <span className="liquid-glass-pill" style={styles.badgeLive}>
                  <span style={styles.pulseDot}></span> Live Endpoint
                </span>
              </div>
              <p style={styles.modalSub}>
                Publish articles from any device, terminal, AI agent, or custom webhook.
              </p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Endpoint Callout */}
        <div style={styles.endpointCard}>
          <div style={styles.endpointMeta}>
            <span style={styles.httpMethod}>POST</span>
            <code style={styles.endpointUrl}>https://quantumqbit.in/api/publish.php</code>
          </div>
          <button
            onClick={() => handleCopy('https://quantumqbit.in/api/publish.php', 'url')}
            style={styles.btnSmCopy}
          >
            {copiedSection === 'url' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copiedSection === 'url' ? 'Copied' : 'Copy URL'}</span>
          </button>
        </div>

        {/* Security / API Key info banner */}
        <div style={styles.securityBanner}>
          <Key size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
          <div style={styles.securityText}>
            <strong>Where do I get my API Key?</strong>
            <span>
              Your secret <code>X-API-Key</code> is stored inside the{' '}
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  if (onOpenAdmin) onOpenAdmin();
                }}
                style={styles.securityLink}
              >
                Admin Console (/admin)
              </a>
              . Only authorized administrators can view or regenerate publishing keys.
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          <button
            onClick={() => setActiveTab('mcp')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'mcp' ? styles.tabBtnActive : {})
            }}
          >
            <Cpu size={15} />
            <span>MCP Server (AI Agent)</span>
          </button>
          <button
            onClick={() => setActiveTab('format')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'format' ? styles.tabBtnActive : {})
            }}
          >
            <Sparkles size={15} />
            <span>AI Tag Format</span>
          </button>
          <button
            onClick={() => setActiveTab('curl')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'curl' ? styles.tabBtnActive : {})
            }}
          >
            <Terminal size={15} />
            <span>cURL Command</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'python' ? styles.tabBtnActive : {})
            }}
          >
            <Code2 size={15} />
            <span>Python Script</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'json' ? styles.tabBtnActive : {})
            }}
          >
            <FileCode size={15} />
            <span>Direct JSON</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.codeContainer}>
          {activeTab === 'mcp' && (
            <div>
              <div style={styles.codeHeader}>
                <span style={styles.codeLabel}>Model Context Protocol (MCP) Configuration</span>
                <button
                  onClick={() => handleCopy(mcpUrlExample, 'mcpUrl')}
                  style={styles.codeCopyBtn}
                >
                  {copiedSection === 'mcpUrl' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedSection === 'mcpUrl' ? 'Copied URL' : 'Copy MCP URL'}</span>
                </button>
              </div>
              <div style={{ padding: '16px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    REMOTE MCP SERVER URL (Compatible with Claude Desktop, Cursor, Antigravity)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <code style={{ ...styles.endpointUrl, flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {mcpUrlExample}
                    </code>
                    <button
                      onClick={() => handleCopy(mcpUrlExample, 'mcpUrl2')}
                      style={styles.btnSmCopy}
                    >
                      {copiedSection === 'mcpUrl2' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      CLAUDE DESKTOP / CURSOR CONFIG (claude_desktop_config.json)
                    </label>
                    <button
                      onClick={() => handleCopy(mcpConfigExample, 'mcpConfig')}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {copiedSection === 'mcpConfig' ? 'Copied Config!' : 'Copy Config'}
                    </button>
                  </div>
                  <pre style={{ ...styles.codeBlock, maxHeight: '140px', borderRadius: '8px', background: 'rgba(0,0,0,0.45)' }}>{mcpConfigExample}</pre>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      AI AGENT INSTRUCTION PROMPT
                    </label>
                    <button
                      onClick={() => handleCopy(mcpPromptExample, 'mcpPrompt')}
                      style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {copiedSection === 'mcpPrompt' ? 'Copied Prompt!' : 'Copy Prompt'}
                    </button>
                  </div>
                  <pre style={{ ...styles.codeBlock, maxHeight: '110px', borderRadius: '8px', background: 'rgba(0,0,0,0.45)', whiteSpace: 'pre-wrap' }}>{mcpPromptExample}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'format' && (
            <div>
              <div style={styles.codeHeader}>
                <span style={styles.codeLabel}>Custom Tag Format (Ready for AI Agents)</span>
                <button
                  onClick={() => handleCopy(AI_PROMPT_TEMPLATE, 'format')}
                  style={styles.codeCopyBtn}
                >
                  {copiedSection === 'format' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedSection === 'format' ? 'Copied to Clipboard' : 'Copy Format'}</span>
                </button>
              </div>
              <pre style={styles.codeBlock}>{AI_PROMPT_TEMPLATE}</pre>
            </div>
          )}

          {activeTab === 'curl' && (
            <div>
              <div style={styles.codeHeader}>
                <span style={styles.codeLabel}>Terminal / Bash Request</span>
                <button
                  onClick={() => handleCopy(curlExample, 'curl')}
                  style={styles.codeCopyBtn}
                >
                  {copiedSection === 'curl' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedSection === 'curl' ? 'Copied' : 'Copy cURL'}</span>
                </button>
              </div>
              <pre style={styles.codeBlock}>{curlExample}</pre>
            </div>
          )}

          {activeTab === 'python' && (
            <div>
              <div style={styles.codeHeader}>
                <span style={styles.codeLabel}>Python 3 (requests)</span>
                <button
                  onClick={() => handleCopy(pythonExample, 'python')}
                  style={styles.codeCopyBtn}
                >
                  {copiedSection === 'python' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedSection === 'python' ? 'Copied' : 'Copy Python'}</span>
                </button>
              </div>
              <pre style={styles.codeBlock}>{pythonExample}</pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div>
              <div style={styles.codeHeader}>
                <span style={styles.codeLabel}>Standard JSON Payload</span>
                <button
                  onClick={() => handleCopy(jsonExample, 'json')}
                  style={styles.codeCopyBtn}
                >
                  {copiedSection === 'json' ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedSection === 'json' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>
              <pre style={styles.codeBlock}>{jsonExample}</pre>
            </div>
          )}
        </div>

        {/* Feature Highlights / Rules Footer */}
        <div style={styles.footerRules}>
          <div style={styles.ruleItem}>
            <span style={styles.ruleBullet}>✓</span>
            <span><strong>Author:</strong> Automatically locked to <em>Quantum Qbit Team</em>.</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleBullet}>✓</span>
            <span><strong>Date &amp; Read Time:</strong> Timestamp and reading minutes calculated automatically.</span>
          </div>
          <div style={styles.ruleItem}>
            <span style={styles.ruleBullet}>✓</span>
            <span><strong>Instant Deployment:</strong> Article appears in real time on the live site upon 201 response.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(5, 7, 15, 0.78)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    borderRadius: '24px',
    padding: '28px',
    background: 'linear-gradient(135deg, rgba(20, 26, 43, 0.95), rgba(12, 16, 28, 0.98))',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 40px rgba(0, 242, 254, 0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px'
  },
  titleGroup: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center'
  },
  iconBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '14px',
    background: 'rgba(0, 242, 254, 0.1)',
    border: '1px solid rgba(0, 242, 254, 0.25)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  modalTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap'
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em'
  },
  badgeLive: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px'
  },
  pulseDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    display: 'inline-block'
  },
  modalSub: {
    margin: '4px 0 0 0',
    fontSize: '0.86rem',
    color: 'var(--text-muted)'
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  endpointCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '10px'
  },
  endpointMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  httpMethod: {
    fontSize: '0.72rem',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '6px',
    background: '#3b82f6',
    color: '#ffffff',
    letterSpacing: '0.05em'
  },
  endpointUrl: {
    fontSize: '0.88rem',
    color: '#38bdf8',
    fontFamily: 'monospace'
  },
  btnSmCopy: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.07)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    color: '#e2e8f0',
    fontSize: '0.78rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  securityBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'rgba(245, 158, 11, 0.09)',
    border: '1px solid rgba(245, 158, 11, 0.28)',
    marginBottom: '18px'
  },
  securityText: {
    fontSize: '0.83rem',
    color: '#fef3c7',
    lineHeight: 1.4
  },
  securityLink: {
    color: '#fbbf24',
    textDecoration: 'underline',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tabsRow: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    paddingBottom: '10px',
    marginBottom: '14px',
    overflowX: 'auto'
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    padding: '7px 14px',
    borderRadius: '10px',
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  },
  tabBtnActive: {
    background: 'rgba(0, 242, 254, 0.12)',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    color: '#00f2fe'
  },
  codeContainer: {
    position: 'relative',
    background: '#090d16',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '14px',
    overflow: 'hidden',
    marginBottom: '18px'
  },
  codeHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
  },
  codeLabel: {
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'var(--text-muted)'
  },
  codeCopyBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer'
  },
  codeBlock: {
    margin: 0,
    padding: '16px',
    fontSize: '0.82rem',
    fontFamily: "'Fira Code', 'Courier New', monospace",
    lineHeight: 1.55,
    color: '#93c5fd',
    overflowX: 'auto',
    maxHeight: '260px'
  },
  footerRules: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    padding: '14px 16px',
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    fontSize: '0.78rem',
    color: 'var(--text-muted)'
  },
  ruleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  ruleBullet: {
    color: 'var(--emerald)',
    fontWeight: 800
  }
};
