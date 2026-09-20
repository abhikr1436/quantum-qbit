import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Search,
  ExternalLink,
  Shield,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Code,
  Eye,
  Sliders,
  CheckSquare,
  Square,
  Wand2,
  Lock,
  Unlock,
  EyeOff,
  Key,
  Tag,
  Terminal
} from 'lucide-react';
import type { BlogPost } from './Blogs';
import { blogStorage } from '../services/blogStorage';
import {
  AI_PROMPT_TEMPLATE,
  parseBlogMarkup,
  blogToMarkup,
  getAutoPublishedDate
} from '../utils/blogMarkupParser';
import { sendDeepSeekChat } from '../utils/deepseekService';
import { navigate } from '../utils/router';

export const AdminBlogs: React.FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>(() => blogStorage.getBlogs());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Editor states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [markupInput, setMarkupInput] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  // Security & Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('qq_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showChangePassModal, setShowChangePassModal] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');

  // Remote Publishing API Key states
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [isApiKeyRevealed, setIsApiKeyRevealed] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [isRegeneratingKey, setIsRegeneratingKey] = useState<boolean>(false);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState<boolean>(false);

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiTopicInput, setAiTopicInput] = useState('');
  const [showAiTopicModal, setShowAiTopicModal] = useState(false);

  // Confirmation Modals
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

  // Check server auth status on mount
  useEffect(() => {
    fetch('/api/auth.php?action=status', { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setIsAuthenticated(true);
          sessionStorage.setItem('qq_admin_auth', 'true');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch remote publishing API key when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/auth.php?action=get_api_key', { credentials: 'include' })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.api_key) {
            setApiKey(data.api_key);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const handleRegenerateApiKey = async () => {
    setIsRegeneratingKey(true);
    try {
      const res = await fetch('/api/auth.php?action=regenerate_api_key', {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.api_key) {
        setApiKey(data.api_key);
        setShowRegenerateConfirm(false);
        window.showToast?.('Remote API Key regenerated successfully!', 'success');
      } else {
        window.showToast?.(data.error || 'Failed to rotate API key.', 'error');
      }
    } catch (e) {
      window.showToast?.('Error communicating with server.', 'error');
    } finally {
      setIsRegeneratingKey(false);
    }
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) {
      setLoginError('Please enter your admin passcode.');
      return;
    }
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const res = await fetch('/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ passcode: passcode.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          sessionStorage.setItem('qq_admin_auth', 'true');
          setIsAuthenticated(true);
          window.showToast?.('Welcome back, Admin!', 'success');
          setIsLoggingIn(false);
          return;
        }
      }
    } catch (err) {}

    // Fallback for local development or custom configured passcode
    const savedLocalPass = localStorage.getItem('qq_admin_passcode') || 'quantumqbit2026';
    if (passcode.trim() === savedLocalPass || passcode.trim() === 'quantumqbit2026') {
      sessionStorage.setItem('qq_admin_auth', 'true');
      setIsAuthenticated(true);
      window.showToast?.('Authenticated successfully!', 'success');
    } else {
      setLoginError('Incorrect passcode. Access denied.');
    }
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    sessionStorage.removeItem('qq_admin_auth');
    setIsAuthenticated(false);
    setPasscode('');
    try {
      await fetch('/api/auth.php?action=logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {}
    window.showToast?.('Locked admin session securely.', 'success');
  };

  const handleChangePasscode = async () => {
    if (!newPasscode.trim() || newPasscode.trim().length < 6) {
      window.showToast?.('New passcode must be at least 6 characters long.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/auth.php?action=change_passcode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ new_passcode: newPasscode.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('qq_admin_passcode', newPasscode.trim());
          setShowChangePassModal(false);
          setNewPasscode('');
          window.showToast?.('Admin passcode updated successfully on server!', 'success');
          return;
        }
      }
    } catch (err) {}

    // Local fallback
    localStorage.setItem('qq_admin_passcode', newPasscode.trim());
    setShowChangePassModal(false);
    setNewPasscode('');
    window.showToast?.('Admin passcode updated locally.', 'success');
  };

  // Live parsed preview
  const parsedPreview = useMemo(() => {
    if (!markupInput.trim()) return null;
    return parseBlogMarkup(markupInput, editingBlogId || undefined);
  }, [markupInput, editingBlogId]);

  // Subscribe to storage changes
  useEffect(() => {
    return blogStorage.subscribe(() => {
      setBlogs(blogStorage.getBlogs());
    });
  }, []);

  // Dynamic Categories from existing articles
  const availableCategories = useMemo(() => {
    const map = new Map<string, { key: string; label: string; count: number }>();
    blogs.forEach((b) => {
      const key = b.category || 'general';
      const label = b.categoryLabel || b.category || 'General';
      const existing = map.get(key);
      if (existing) {
        existing.count++;
      } else {
        map.set(key, { key, label, count: 1 });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [blogs]);

  // Filtered blogs for table
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const matchesQuery =
        !searchQuery.trim() ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.categoryLabel && b.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === 'all' ||
        b.category === selectedCategoryFilter ||
        b.categoryLabel?.toLowerCase() === selectedCategoryFilter.toLowerCase();

      return matchesQuery && matchesCat;
    });
  }, [blogs, searchQuery, selectedCategoryFilter]);

  // Dynamic stats
  const stats = useMemo(() => {
    const total = blogs.length;
    const uniqueCategories = new Set(blogs.map((b) => b.categoryLabel || b.category).filter(Boolean)).size;
    const tagsCount = new Set(blogs.flatMap((b) => b.tags || []).filter(Boolean)).size;
    return { total, uniqueCategories, tagsCount };
  }, [blogs]);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredBlogs.length && filteredBlogs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredBlogs.map((b) => b.id));
    }
  };

  // Open editor for new blog
  const handleOpenNewBlog = () => {
    setEditingBlogId(null);
    setMarkupInput(`<title>Title of Your Article</title>
<category>Your Custom Category</category>
<summary>A concise two-sentence overview highlighting key benefits and insights.</summary>
<tags>Browser Privacy, Client-Side, Security</tags>
<body>
  <p>In modern web computing, handling data locally delivers superior user privacy and zero latency...</p>

  <h2>Technical Architecture</h2>
  <p>Detailed explanation of client-side execution algorithms and hardware acceleration.</p>

  <tip>Pro-Tip: Always allocate static memory buffers in WebAssembly to prevent garbage collection pauses.</tip>

  <h2>Performance Benchmarks</h2>
  <table>
    <thead>
      <tr>
        <th>Processing Engine</th>
        <th>Network Latency</th>
        <th>Data Security</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Quantum Qbit Local RAM</strong></td>
        <td>0 ms (Instant)</td>
        <td>100% Private (No upload)</td>
      </tr>
      <tr>
        <td><strong>Legacy Cloud Servers</strong></td>
        <td>15-30 seconds</td>
        <td>High third-party retention risk</td>
      </tr>
    </tbody>
  </table>

  <takeaways>
    <li>Client-side pipelines maintain absolute data sovereignty on device.</li>
    <li>Eliminates bandwidth upload bottlenecks for instant results.</li>
    <li>Guaranteed compliance with zero remote server logging.</li>
  </takeaways>
</body>`);
    setIsEditorOpen(true);
  };

  // Open editor for existing blog
  const handleOpenEditBlog = (blog: BlogPost) => {
    setEditingBlogId(blog.id);
    setMarkupInput(blogToMarkup(blog));
    setIsEditorOpen(true);
  };

  // Save / Publish
  const handlePublish = () => {
    if (!parsedPreview || !parsedPreview.isValid || !parsedPreview.parsedBlog) {
      window.showToast?.(
        parsedPreview?.errors[0] || 'Please fix markup errors before publishing.',
        'error'
      );
      return;
    }

    const blogToSave = parsedPreview.parsedBlog;
    // Ensure author is ALWAYS Quantum Qbit Team
    blogToSave.author = 'Quantum Qbit Team';

    // Auto timestamp
    if (!editingBlogId) {
      const { displayDate, timestamp } = getAutoPublishedDate();
      blogToSave.date = displayDate;
      blogToSave.publishedAt = timestamp;
    }

    blogStorage.saveBlog(blogToSave);
    setIsEditorOpen(false);
    setEditingBlogId(null);
    setMarkupInput('');
    window.showToast?.(
      editingBlogId ? 'Article updated successfully!' : 'Article published successfully!',
      'success'
    );
  };

  // Single delete
  const handleConfirmSingleDelete = () => {
    if (confirmDeleteId) {
      blogStorage.deleteBlog(confirmDeleteId);
      setSelectedIds((prev) => prev.filter((id) => id !== confirmDeleteId));
      setConfirmDeleteId(null);
      window.showToast?.('Article deleted.', 'success');
    }
  };

  // Batch delete
  const handleConfirmBatchDelete = () => {
    if (selectedIds.length > 0) {
      blogStorage.deleteBatchBlogs(selectedIds);
      setSelectedIds([]);
      setShowBatchDeleteConfirm(false);
      window.showToast?.(`${selectedIds.length} articles deleted.`, 'success');
    }
  };

  // Delete all
  const handleConfirmDeleteAll = () => {
    blogStorage.deleteAllBlogs();
    setSelectedIds([]);
    setShowDeleteAllConfirm(false);
    window.showToast?.('All articles have been deleted.', 'success');
  };

  // Reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm('Reset articles back to the 4 default official guides? This will overwrite existing articles.')) {
      blogStorage.resetToDefaults();
      setSelectedIds([]);
      window.showToast?.('Restored default official articles.', 'success');
    }
  };

  // Export JSON
  const handleExportJson = () => {
    const jsonStr = blogStorage.exportBlogsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum_qbit_blogs_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast?.('Articles exported to JSON file.', 'success');
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = blogStorage.importBlogsJson(content);
      if (res.success) {
        window.showToast?.(`Imported ${res.count} articles successfully!`, 'success');
      } else {
        window.showToast?.(res.error || 'Failed to parse JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Copy tag format template
  const handleCopyAiPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
    window.showToast?.('Format structure copied to clipboard!', 'success');
  };

  // Optional: Generate with DeepSeek using the user's stored key
  const handleGenerateWithDeepSeek = async () => {
    if (!aiTopicInput.trim()) {
      window.showToast?.('Please enter an article topic.', 'error');
      return;
    }
    setIsGeneratingAi(true);
    try {
      const prompt = `Write an exhaustive, authoritative, deeply researched long-form analytical blog article about "${aiTopicInput}".

CRITICAL MANDATORY INSTRUCTIONS:
1. WORD COUNT (2,000+ WORDS REQUIRED):
   - The total body of the article MUST be AT LEAST 2,000+ WORDS.
   - Do NOT write a short summary or brief overview. Expand every section with extensive depth, historical/industry context, underlying technical/strategic mechanics, empirical data points, and real-world case studies.
   - Organize the article into 6 to 9 detailed <h2> and <h3> sections with multiple long, informative paragraphs (<p>) under every single heading.

2. DYNAMIC CONTEXTUAL CALLOUTS (DO NOT REPEAT "PRO-TIP"):
   - Choose a context-aware highlight label for <tip>...</tip> directly matched to the subject matter of the article:
     * For Geopolitics, Diplomacy & International Relations: use <tip>Strategic Insight: [insight]</tip> or <tip>Diplomatic Context: [analysis]</tip>
     * For Gaming & Entertainment: use <tip>Gamer's Intel: [advice, platform note, or pricing guidance]</tip>
     * For Privacy, Security & AI Safety: use <tip>Security Advisory: [risk mitigation or technical factor]</tip>
     * For Finance, Economy & Trade: use <tip>Market Signal: [economic implication]</tip>
     * For Web Tech, Software & Performance: use <tip>Engineering Advisory: [architectural best practice]</tip>
   - NEVER duplicate prefixes (do NOT output "Pro-Tip: Pro-Tip:").

You MUST output the article using the following XML-like custom tag structure with NO markdown fences around outer tags:

<title>Put an engaging, SEO-optimized title here</title>
<category>Select or define a relevant category</category>
<summary>Concise 2-sentence summary hook explaining what this article covers and why it matters.</summary>
<cover_image>https://images.unsplash.com/... (optional valid Unsplash URL)</cover_image>
<tags>Tag1, Tag2, Tag3, Tag4, Tag5</tags>
<body>
  <p>Compelling introductory analysis establishing the problem landscape, historical background, or technological paradigm...</p>
  <p>Expanding the setup and framing the core questions...</p>

  <h2>[Section 1: Foundation & Historical Landscape]</h2>
  <p>Exhaustive multi-paragraph examination...</p>
  <p>Deeper contextual nuances...</p>

  <tip>[Contextual Label matched to topic]: High-value takeaway or strategic consideration.</tip>

  <h2>[Section 2: Deep Technical / Strategic Architecture]</h2>
  <p>Detailed analysis of mechanisms, protocols, and workflows...</p>

  <table>
    <thead><tr><th>Dimension</th><th>Approach A</th><th>Approach B</th></tr></thead>
    <tbody><tr><td>Security & Isolation</td><td>Client-Side RAM</td><td>Remote Cloud Servers</td></tr></tbody>
  </table>

  <h2>[Section 3: Empirical Benchmarks & Case Studies]</h2>
  <p>Detailed real-world examples and evidentiary breakdowns...</p>

  <h2>[Section 4: Implementation Nuances & Trade-Offs]</h2>
  <p>In-depth discussion of edge cases, security considerations, and operational realities...</p>

  <h2>[Section 5: Future Trajectory & Outlook]</h2>
  <p>Predictive analysis and industry implications...</p>

  <takeaways>
    <li>Comprehensive takeaway point 1</li>
    <li>Comprehensive takeaway point 2</li>
    <li>Comprehensive takeaway point 3</li>
    <li>Comprehensive takeaway point 4</li>
  </takeaways>
</body>`;

      const response = await sendDeepSeekChat([
        { role: 'user', content: prompt }
      ]);

      setMarkupInput(response.trim());
      setShowAiTopicModal(false);
      setAiTopicInput('');
      window.showToast?.('2000+ word article generated by DeepSeek! Review and publish.', 'success');
    } catch (err: any) {
      window.showToast?.(err.message || 'DeepSeek generation failed.', 'error');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Tag helper inserter for the textarea
  const handleInsertTag = (tagType: string) => {
    let snippet = '';
    switch (tagType) {
      case 'table':
        snippet = `\n  <table>\n    <thead>\n      <tr>\n        <th>Feature</th>\n        <th>Client-Side</th>\n        <th>Cloud Server</th>\n      </tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td>Data Privacy</td>\n        <td>100% In RAM</td>\n        <td>Stored Remotely</td>\n      </tr>\n    </tbody>\n  </table>\n`;
        break;
      case 'tip':
        snippet = `\n  <tip>Strategic Insight: Write your topic-specific recommendation or advisory here.</tip>\n`;
        break;
      case 'image':
        snippet = `\n  <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe" alt="Descriptive Alt Text" />\n`;
        break;
      case 'video':
        snippet = `\n  <video src="https://example.com/demo.mp4" controls></video>\n`;
        break;
      case 'takeaways':
        snippet = `\n  <takeaways>\n    <li>First key takeaway</li>\n    <li>Second key takeaway</li>\n  </takeaways>\n`;
        break;
      case 'h2':
        snippet = `\n  <h2>New Section Heading</h2>\n  <p>Section explanation...</p>\n`;
        break;
    }
    setMarkupInput((prev) => prev + snippet);
  };

  // Lock Screen view when not authenticated
  if (!isAuthenticated) {
    return (
      <div style={styles.lockPageWrapper}>
        <div className="liquid-glass-card" style={styles.lockCard}>
          <div style={styles.lockIconWrapper}>
            <Lock size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="liquid-glass-pill" style={{ margin: '0 auto 12px', fontSize: '0.76rem' }}>
            <Shield size={12} style={{ color: 'var(--primary)' }} />
            <span>AUTHENTICATION GATEWAY</span>
          </div>
          <h2 style={styles.lockTitle}>Admin Studio Locked</h2>
          <p style={styles.lockSubtitle}>
            Restricted access. Please enter your administrative passcode to manage Quantum Qbit articles.
          </p>

          <form onSubmit={handleLogin} style={styles.lockForm}>
            <div style={styles.lockInputWrapper}>
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setLoginError('');
                }}
                placeholder="Enter passcode..."
                style={styles.lockInput}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                style={styles.eyeBtn}
                tabIndex={-1}
                aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
              >
                {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {loginError && (
              <div style={styles.lockError}>
                <AlertTriangle size={15} style={{ flexShrink: 0 }} />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="liquid-glass-btn-primary"
              style={styles.unlockBtn}
              disabled={isLoggingIn}
            >
              <Unlock size={16} />
              <span>{isLoggingIn ? 'Verifying...' : 'Unlock Admin Console'}</span>
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <button
              onClick={() => navigate('/blogs')}
              style={styles.backLink}
            >
              ← Return to Public Blog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      {/* Top Breadcrumb & Controls Header */}
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <button
            onClick={() => navigate('/blogs')}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={14} />
            <span>View Public Blog</span>
          </button>
          <div className="liquid-glass-pill" style={{ fontSize: '0.78rem' }}>
            <Shield size={12} style={{ color: 'var(--emerald)' }} />
            <span>AUTHENTICATED OPERATOR</span>
          </div>
        </div>

        <div style={styles.topBarRight}>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.35)' }}
            title="View and manage secret Remote Publishing API Key"
          >
            <Terminal size={14} />
            <span>Publishing API Key</span>
          </button>

          <button
            onClick={() => setShowChangePassModal(true)}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Change administrative passcode"
          >
            <Key size={14} />
            <span>Change Passcode</span>
          </button>

          <button
            onClick={handleLogout}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#EF4444' }}
            title="Lock and end admin session"
          >
            <Lock size={14} />
            <span>Lock Console</span>
          </button>

          <button
            onClick={handleExportJson}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Download JSON backup"
          >
            <Download size={14} />
            <span>Export JSON</span>
          </button>

          <label
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}
            title="Import articles from JSON file"
          >
            <Upload size={14} />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJson}
              style={{ display: 'none' }}
            />
          </label>

          <button
            onClick={handleResetDefaults}
            className="liquid-glass-btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            title="Reset articles to default 4 guides"
          >
            <RefreshCw size={14} />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={styles.container}>
        {/* Title Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            Blog Management <span className="liquid-gradient-text">Console</span>
          </h1>
          <p style={styles.subtitle}>
            Publish, edit, and organize Quantum Qbit articles using our structured XML-like format.
            Articles are authored as <strong>Quantum Qbit Team</strong> with automatic timestamps.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={styles.statsGrid}>
          <div className="liquid-glass-card" style={styles.statCard}>
            <div style={styles.statIconWrapper}>
              <FileText size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.total}</div>
              <div style={styles.statLabel}>Total Articles</div>
            </div>
          </div>

          <div className="liquid-glass-card" style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(16, 185, 129, 0.15)' }}>
              <Layers size={20} style={{ color: 'var(--emerald)' }} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.uniqueCategories}</div>
              <div style={styles.statLabel}>Active Categories</div>
            </div>
          </div>

          <div className="liquid-glass-card" style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(168, 85, 247, 0.15)' }}>
              <Tag size={20} style={{ color: '#A855F7' }} />
            </div>
            <div>
              <div style={styles.statValue}>{stats.tagsCount}</div>
              <div style={styles.statLabel}>Tags Indexed</div>
            </div>
          </div>

          <div className="liquid-glass-card" style={styles.statCard}>
            <div style={{ ...styles.statIconWrapper, background: 'rgba(0, 242, 254, 0.15)' }}>
              <Shield size={20} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ ...styles.statValue, fontSize: '1.3rem' }}>Live API</div>
              <div style={styles.statLabel}>Hostinger Cloud Sync</div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="liquid-glass-card" style={styles.toolbarCard}>
          <div style={styles.toolbarLeft}>
            <button
              onClick={handleOpenNewBlog}
              className="liquid-glass-btn-primary"
              style={{ padding: '10px 18px' }}
            >
              <Plus size={16} />
              <span>Add New Article</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={() => setShowBatchDeleteConfirm(true)}
                className="liquid-glass-btn-secondary"
                style={{
                  padding: '10px 18px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  color: '#EF4444'
                }}
              >
                <Trash2 size={16} />
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            )}

            {blogs.length > 0 && (
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="liquid-glass-btn-secondary"
                style={{
                  padding: '10px 16px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem'
                }}
              >
                <Trash2 size={14} />
                <span>Delete All</span>
              </button>
            )}
          </div>

          <div style={styles.toolbarRight}>
            {/* Search */}
            <div style={styles.searchBox}>
              <Search size={15} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search articles by title, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            {/* Dynamic Category Filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              style={styles.categorySelect}
            >
              <option value="all">All Categories ({blogs.length})</option>
              {availableCategories.map((cat) => (
                <option key={cat.key} value={cat.key}>
                  {cat.label} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table of Articles */}
        <div className="liquid-glass-card" style={styles.tableCard}>
          {filteredBlogs.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>No articles found</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                {searchQuery ? 'Try clearing your search query.' : 'Click "Add New Article" to publish your first post!'}
              </p>
              <button onClick={handleOpenNewBlog} className="liquid-glass-btn-primary">
                <Plus size={15} />
                <span>Write New Article</span>
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={{ ...styles.th, width: '44px', textAlign: 'center' }}>
                      <button
                        onClick={handleSelectAll}
                        style={styles.checkboxBtn}
                        aria-label="Select all"
                      >
                        {selectedIds.length === filteredBlogs.length && filteredBlogs.length > 0 ? (
                          <CheckSquare size={17} style={{ color: 'var(--primary)' }} />
                        ) : (
                          <Square size={17} style={{ color: 'var(--text-muted)' }} />
                        )}
                      </button>
                    </th>
                    <th style={styles.th}>Article Details</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Published Date</th>
                    <th style={styles.th}>Read Time</th>
                    <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlogs.map((b) => {
                    const isSelected = selectedIds.includes(b.id);
                    return (
                      <tr
                        key={b.id}
                        style={{
                          ...styles.tr,
                          background: isSelected ? 'rgba(0, 240, 255, 0.04)' : undefined
                        }}
                      >
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          <button
                            onClick={() => handleToggleSelect(b.id)}
                            style={styles.checkboxBtn}
                            aria-label={`Select ${b.title}`}
                          >
                            {isSelected ? (
                              <CheckSquare size={17} style={{ color: 'var(--primary)' }} />
                            ) : (
                              <Square size={17} style={{ color: 'var(--text-muted)' }} />
                            )}
                          </button>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.articleTitleCell}>
                            <div style={styles.articleTitleText}>{b.title}</div>
                            <div style={styles.articleSlugText}>
                              <span>/blogs/{b.slug}</span>
                              <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>•</span>
                              <span>by <strong>{b.author || 'Quantum Qbit Team'}</strong></span>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span className="liquid-glass-pill" style={getCategoryPillStyle(b.category)}>
                            {b.categoryLabel}
                          </span>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.metaCell}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{b.date}</span>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <div style={styles.metaCell}>
                            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{b.readTime}</span>
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'right' }}>
                          <div style={styles.actionsGroup}>
                            <button
                              onClick={() => navigate(`/blogs/${b.slug}`)}
                              className="liquid-glass-btn-secondary"
                              style={styles.actionIconBtn}
                              title="View published article"
                            >
                              <ExternalLink size={14} />
                            </button>

                            <button
                              onClick={() => handleOpenEditBlog(b)}
                              className="liquid-glass-btn-secondary"
                              style={styles.actionIconBtn}
                              title="Edit in tag editor"
                            >
                              <Edit3 size={14} />
                            </button>

                            <button
                              onClick={() => setConfirmDeleteId(b.id)}
                              className="liquid-glass-btn-secondary"
                              style={{ ...styles.actionIconBtn, color: '#EF4444' }}
                              title="Delete article"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* EDITOR MODAL / DRAWER (THE ONLY WAY TO ADD/EDIT)                     */}
      {/* =================================================================== */}
      {isEditorOpen && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.editorModal}>
            {/* Modal Header */}
            <div style={styles.editorHeader}>
              <div>
                <div className="liquid-glass-pill" style={{ marginBottom: '6px', fontSize: '0.78rem' }}>
                  <Code size={12} style={{ color: 'var(--primary)' }} />
                  <span>STRUCTURED TAG FORMAT COMPILER</span>
                </div>
                <h2 style={styles.editorTitle}>
                  {editingBlogId ? 'Edit Article' : 'Publish New Article'}
                </h2>
              </div>

              <div style={styles.editorHeaderActions}>
                <button
                  onClick={() => setShowAiTopicModal(true)}
                  className="liquid-glass-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--primary)' }}
                  title="Generate article draft directly using DeepSeek"
                >
                  <Wand2 size={14} />
                  <span>AI Autopilot</span>
                </button>

                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="liquid-glass-btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  Cancel
                </button>

                <button
                  onClick={handlePublish}
                  className="liquid-glass-btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.88rem' }}
                  disabled={!parsedPreview || !parsedPreview.isValid}
                >
                  <Check size={16} />
                  <span>{editingBlogId ? 'Update & Save' : 'Publish Article'}</span>
                </button>
              </div>
            </div>

            {/* Editor Body Grid: Left Input + Right AI Prompt Box */}
            <div style={styles.editorGrid}>
              {/* Left: Raw Tag Input */}
              <div style={styles.editorLeftCol}>
                {/* Tag Quick Inserters */}
                <div style={styles.quickTagsBar}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Insert:</span>
                  <button onClick={() => handleInsertTag('table')} style={styles.tagChip}>
                    &lt;table&gt;
                  </button>
                  <button onClick={() => handleInsertTag('tip')} style={styles.tagChip}>
                    &lt;tip&gt;
                  </button>
                  <button onClick={() => handleInsertTag('image')} style={styles.tagChip}>
                    &lt;img&gt;
                  </button>
                  <button onClick={() => handleInsertTag('video')} style={styles.tagChip}>
                    &lt;video&gt;
                  </button>
                  <button onClick={() => handleInsertTag('takeaways')} style={styles.tagChip}>
                    &lt;takeaways&gt;
                  </button>
                  <button onClick={() => handleInsertTag('h2')} style={styles.tagChip}>
                    &lt;h2&gt;
                  </button>
                </div>

                <textarea
                  value={markupInput}
                  onChange={(e) => setMarkupInput(e.target.value)}
                  placeholder="Paste your XML-like article markup here..."
                  style={styles.markupTextarea}
                  spellCheck={false}
                />

                {/* Validation Status Bar */}
                <div style={styles.validationBar}>
                  {parsedPreview?.isValid ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--emerald)' }}>
                      <Check size={16} />
                      <span>Valid Quantum Qbit markup: <strong>{parsedPreview.parsedBlog?.title}</strong> ({parsedPreview.parsedBlog?.readTime})</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#EF4444' }}>
                      <AlertTriangle size={16} />
                      <span>{parsedPreview?.errors[0] || 'Incomplete markup format.'}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Custom Tag Format Box */}
              <div style={styles.editorRightCol}>
                <div className="liquid-glass-card" style={styles.aiPromptCard}>
                  <div style={styles.aiPromptHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '0.9rem' }}>Required Tag Format</strong>
                    </div>

                    <button
                      onClick={handleCopyAiPrompt}
                      className="liquid-glass-btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                    >
                      {copiedPrompt ? <Check size={13} /> : <Copy size={13} />}
                      <span>{copiedPrompt ? 'Copied!' : 'Copy Format'}</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '8px 0 12px' }}>
                    Copy this structure and ask any AI agent to write your article using this exact format:
                  </p>

                  <pre style={styles.aiPromptBox}>
                    <code>{AI_PROMPT_TEMPLATE}</code>
                  </pre>
                </div>

                {/* Live Preview Card */}
                {parsedPreview?.parsedBlog && (
                  <div className="liquid-glass-card" style={styles.previewCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Eye size={15} style={{ color: 'var(--primary)' }} />
                      <strong style={{ fontSize: '0.88rem' }}>Live Parser Output</strong>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <div><strong>Title:</strong> {parsedPreview.parsedBlog.title}</div>
                      <div><strong>Category:</strong> {parsedPreview.parsedBlog.categoryLabel}</div>
                      <div><strong>Slug:</strong> /blogs/{parsedPreview.parsedBlog.slug}</div>
                      <div><strong>Summary:</strong> {parsedPreview.parsedBlog.summary.slice(0, 100)}...</div>
                      <div><strong>Writer:</strong> Quantum Qbit Team (Auto)</div>
                      <div><strong>Published:</strong> {parsedPreview.parsedBlog.date} (Auto)</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* AI TOPIC MODAL (DEEPSEEK ONE-CLICK GENERATOR)                       */}
      {/* =================================================================== */}
      {showAiTopicModal && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Wand2 size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Generate with DeepSeek AI</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Enter the topic or title you want to write about. DeepSeek will format the entire article with
              tables, tips, and takeaways using your configured API key.
            </p>

            <input
              type="text"
              placeholder="e.g. Browser-based OCR using Tesseract WebAssembly"
              value={aiTopicInput}
              onChange={(e) => setAiTopicInput(e.target.value)}
              style={styles.topicInput}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setShowAiTopicModal(false)}
                className="liquid-glass-btn-secondary"
                disabled={isGeneratingAi}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithDeepSeek}
                className="liquid-glass-btn-primary"
                disabled={isGeneratingAi || !aiTopicInput.trim()}
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw size={15} className="spin-animation" />
                    <span>Writing Article...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={15} />
                    <span>Generate Draft</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* CONFIRMATION MODALS (DELETE SINGLE / BATCH / ALL)                   */}
      {/* =================================================================== */}
      {confirmDeleteId && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <AlertTriangle size={32} style={{ color: '#EF4444', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Delete this article?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
              This action cannot be undone. The article will be immediately removed from the blog directory.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setConfirmDeleteId(null)} className="liquid-glass-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmSingleDelete}
                className="liquid-glass-btn-primary"
                style={{ background: '#EF4444', borderColor: '#EF4444' }}
              >
                Delete Article
              </button>
            </div>
          </div>
        </div>
      )}

      {showBatchDeleteConfirm && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <AlertTriangle size={32} style={{ color: '#EF4444', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
              Delete {selectedIds.length} articles?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Are you sure you want to delete all {selectedIds.length} selected articles?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowBatchDeleteConfirm(false)} className="liquid-glass-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                className="liquid-glass-btn-primary"
                style={{ background: '#EF4444', borderColor: '#EF4444' }}
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <AlertTriangle size={36} style={{ color: '#EF4444', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#EF4444' }}>
              Delete ALL Articles?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
              This will completely wipe every article from local storage. You can restore default articles at any
              time using the "Reset Defaults" button.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowDeleteAllConfirm(false)} className="liquid-glass-btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAll}
                className="liquid-glass-btn-primary"
                style={{ background: '#EF4444', borderColor: '#EF4444' }}
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* CHANGE PASSCODE MODAL                                               */}
      {/* =================================================================== */}
      {showChangePassModal && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Key size={22} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Change Admin Passcode</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '18px' }}>
              Set a new secure administrative passcode. This will update your server credentials on Hostinger.
            </p>

            <input
              type="password"
              placeholder="Enter new passcode (min 6 characters)..."
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              style={styles.topicInput}
              autoFocus
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowChangePassModal(false);
                  setNewPasscode('');
                }}
                className="liquid-glass-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePasscode}
                className="liquid-glass-btn-primary"
                disabled={!newPasscode.trim() || newPasscode.trim().length < 6}
              >
                Save New Passcode
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* REMOTE PUBLISHING API KEY MODAL                                     */}
      {/* =================================================================== */}
      {showApiKeyModal && (
        <div style={styles.modalOverlay} onClick={() => setShowApiKeyModal(false)}>
          <div
            className="liquid-glass-card"
            style={{ ...styles.confirmModal, maxWidth: '640px', textAlign: 'left' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <Terminal size={20} style={{ color: '#38bdf8' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#ffffff' }}>Remote Publishing API Key</h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Publish articles from any terminal, AI agent, or device</span>
                </div>
              </div>
              <button
                onClick={() => setShowApiKeyModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '14px', lineHeight: 1.5 }}>
              This secret key allows you or any automated AI agent to publish blogs directly into Quantum Qbit without browser logins.
              Author is automatically locked to <strong>Quantum Qbit Team</strong>.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                SECRET API KEY (X-API-Key)
              </label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={isApiKeyRevealed ? 'text' : 'password'}
                    readOnly
                    value={apiKey || 'Loading secret key...'}
                    style={{
                      ...styles.topicInput,
                      fontFamily: 'monospace',
                      fontSize: '0.88rem',
                      letterSpacing: isApiKeyRevealed ? '0.02em' : '0.2em',
                      paddingRight: '40px',
                      color: '#38bdf8',
                      background: 'rgba(0, 0, 0, 0.4)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiKeyRevealed(!isApiKeyRevealed)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                    title={isApiKeyRevealed ? 'Hide secret key' : 'Reveal secret key'}
                  >
                    {isApiKeyRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="liquid-glass-btn-primary"
                  style={{ padding: '10px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                  disabled={!apiKey}
                >
                  {copiedKey ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                </button>
              </div>
            </div>

            {/* Ready-to-copy cURL tester */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  READY-TO-USE cURL COMMAND (Pre-authenticated)
                </span>
                <button
                  onClick={() => {
                    const cmd = `curl -X POST https://quantumqbit.in/api/publish.php \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -d '{\\n    "format": "<title>My Remote Article</title>\\\\n<category>Technology</category>\\\\n<body><p>Article content...</p></body>"\\n  }'`;
                    navigator.clipboard.writeText(cmd);
                    window.showToast?.('cURL command copied to clipboard!', 'success');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Copy cURL
                </button>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: '12px',
                  borderRadius: '10px',
                  background: '#090d16',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#93c5fd',
                  overflowX: 'auto',
                  lineHeight: 1.45
                }}
              >
{`curl -X POST https://quantumqbit.in/api/publish.php \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey || 'YOUR_KEY'}" \\
  -d '{
    "format": "<title>My Remote Article</title>\\n<category>Technology</category>\\n<body><p>Article content...</p></body>"
  }'`}
              </pre>
            </div>

            {/* Model Context Protocol (MCP) Server for AI Agents */}
            <div style={{ marginBottom: '16px', padding: '14px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.04)', border: '1px solid rgba(0, 240, 255, 0.15)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} /> MODEL CONTEXT PROTOCOL (MCP) LINK FOR AI AGENTS
                </span>
                <button
                  onClick={() => {
                    const mcpUrl = `https://quantumqbit.in/api/mcp.php?api_key=${apiKey}`;
                    navigator.clipboard.writeText(mcpUrl);
                    window.showToast?.('Pre-authenticated MCP Server URL copied!', 'success');
                  }}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
                >
                  Copy MCP URL
                </button>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 8px 0', lineHeight: 1.4 }}>
                Connect directly into Claude Desktop, Cursor, Antigravity, or custom LLM agents to let the AI write, format, and publish articles with tool calling:
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <code style={{ fontSize: '0.78rem', color: '#00f2fe', fontFamily: 'monospace', flex: 1, padding: '8px 10px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                  {`https://quantumqbit.in/api/mcp.php?api_key=${apiKey || 'YOUR_KEY'}`}
                </code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                onClick={() => setShowRegenerateConfirm(true)}
                className="liquid-glass-btn-secondary"
                style={{ fontSize: '0.8rem', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.3)' }}
              >
                <RefreshCw size={13} />
                <span>Rotate / Regenerate Key</span>
              </button>

              <button
                onClick={() => setShowApiKeyModal(false)}
                className="liquid-glass-btn-secondary"
                style={{ fontSize: '0.85rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REGENERATE API KEY CONFIRMATION MODAL */}
      {showRegenerateConfirm && (
        <div style={styles.modalOverlay}>
          <div className="liquid-glass-card" style={styles.confirmModal}>
            <AlertTriangle size={36} style={{ color: '#f59e0b', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px', color: '#f59e0b' }}>
              Rotate Publishing API Key?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px', lineHeight: 1.5 }}>
              Rotating this key will immediately revoke the current key. Any external AI agents, scripts, or shortcuts using the previous key will be denied access until updated with the new key.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="liquid-glass-btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateApiKey}
                className="liquid-glass-btn-primary"
                style={{ background: '#f59e0b', borderColor: '#f59e0b' }}
                disabled={isRegeneratingKey}
              >
                {isRegeneratingKey ? 'Regenerating...' : 'Yes, Generate New Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getCategoryPillStyle(cat: string): React.CSSProperties {
  switch (cat) {
    case 'privacy':
      return { borderColor: 'rgba(16, 185, 129, 0.3)', color: 'var(--emerald)', fontSize: '0.75rem' };
    case 'image':
      return { borderColor: 'rgba(168, 85, 247, 0.3)', color: '#C084FC', fontSize: '0.75rem' };
    case 'pdf':
      return { borderColor: 'rgba(249, 115, 22, 0.3)', color: '#FB923C', fontSize: '0.75rem' };
    default:
      return { borderColor: 'rgba(0, 240, 255, 0.3)', color: 'var(--primary)', fontSize: '0.75rem' };
  }
}

const styles: Record<string, React.CSSProperties> = {
  // Lock Screen Styles
  lockPageWrapper: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  lockCard: {
    maxWidth: '480px',
    width: '100%',
    padding: '36px 32px',
    borderRadius: '24px',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
  },
  lockIconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    background: 'rgba(0, 240, 255, 0.12)',
    border: '1px solid rgba(0, 240, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    boxShadow: '0 0 24px rgba(0, 240, 255, 0.2)',
  },
  lockTitle: {
    fontSize: '1.6rem',
    fontWeight: 800,
    marginBottom: '8px',
    letterSpacing: '-0.02em',
  },
  lockSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    marginBottom: '24px',
  },
  lockForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  lockInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  lockInput: {
    width: '100%',
    padding: '14px 44px 14px 18px',
    background: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockError: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#EF4444',
    fontSize: '0.85rem',
    padding: '8px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(239, 68, 68, 0.25)',
  },
  unlockBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '0.95rem',
    fontWeight: 600,
    justifyContent: 'center',
  },
  backLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  pageWrapper: {
    minHeight: '100vh',
    paddingBottom: '80px',
  },
  topBar: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 20px 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap',
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 20px',
  },
  header: {
    marginBottom: '28px',
  },
  title: {
    fontSize: '2.4rem',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '780px',
    lineHeight: 1.5,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRadius: '16px',
  },
  statIconWrapper: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'rgba(0, 240, 255, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
  },
  statLabel: {
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    marginTop: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  toolbarCard: {
    padding: '16px 20px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    marginBottom: '20px',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  toolbarRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(0, 0, 0, 0.25)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '8px 14px',
    width: '260px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.88rem',
    width: '100%',
  },
  categorySelect: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    padding: '8px 12px',
    outline: 'none',
    cursor: 'pointer',
  },
  tableCard: {
    padding: '4px',
    borderRadius: '18px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  tableHeaderRow: {
    borderBottom: '1px solid var(--border-color)',
    background: 'rgba(0, 240, 255, 0.03)',
  },
  th: {
    padding: '14px 18px',
    color: 'var(--text-muted)',
    fontSize: '0.78rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  tr: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '16px 18px',
    verticalAlign: 'middle',
  },
  checkboxBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  articleTitleCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  articleTitleText: {
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
  },
  articleSlugText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
  },
  metaCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-secondary)',
    fontSize: '0.82rem',
  },
  actionsGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  actionIconBtn: {
    padding: '7px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },

  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(5, 8, 16, 0.75)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  editorModal: {
    width: '100%',
    maxWidth: '1240px',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: '24px',
    padding: '24px',
    overflow: 'hidden',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingBottom: '18px',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '16px',
  },
  editorTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    margin: 0,
  },
  editorHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  editorGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
    gap: '20px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '6px',
  },
  editorLeftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  quickTagsBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
  },
  tagChip: {
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.2)',
    borderRadius: '8px',
    color: 'var(--primary)',
    fontSize: '0.75rem',
    padding: '3px 8px',
    cursor: 'pointer',
    fontFamily: 'monospace',
  },
  markupTextarea: {
    width: '100%',
    height: '420px',
    background: 'rgba(7, 11, 20, 0.85)',
    border: '1px solid var(--border-color)',
    borderRadius: '14px',
    color: '#E2E8F0',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '0.88rem',
    lineHeight: 1.5,
    padding: '14px',
    outline: 'none',
    resize: 'vertical',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)',
  },
  validationBar: {
    fontSize: '0.82rem',
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
  },
  editorRightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  aiPromptCard: {
    padding: '16px',
    borderRadius: '16px',
  },
  aiPromptHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiPromptBox: {
    background: 'rgba(0, 0, 0, 0.45)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '12px',
    fontSize: '0.72rem',
    lineHeight: 1.45,
    color: '#94A3B8',
    maxHeight: '260px',
    overflowY: 'auto',
    whiteSpace: 'pre-wrap',
    fontFamily: 'monospace',
  },
  previewCard: {
    padding: '16px',
    borderRadius: '16px',
  },
  confirmModal: {
    maxWidth: '460px',
    width: '100%',
    padding: '28px',
    borderRadius: '20px',
    textAlign: 'center',
  },
  topicInput: {
    width: '100%',
    padding: '12px 16px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
  }
};

export default AdminBlogs;
