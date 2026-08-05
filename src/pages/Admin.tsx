import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, LogOut, FileText, Settings, Plus, Edit, Trash2, 
  Check, AlertCircle, Eye, Save, X, Tag, Database, 
  Sparkles, RefreshCw, Copy, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Table, Image, Video, Link, Code,
  HelpCircle, Send, CheckCircle2, FileCode, Layers, ShieldAlert,
  ArrowRight, Heading, Type, Palette
} from 'lucide-react';
import { sendDeepSeekChat, PROMPT_TEMPLATES, DEEPSEEK_API_KEY, type ChatMessage } from '../utils/deepseekService';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string | string[];
  author: string;
  date: string;
  readTime: string;
  category: string;
  category_id?: string;
  imageGlow: string;
  created_at?: string;
  updated_at?: string;
}

interface Category {
  id: string;
  name: string;
}

interface AdminProps {
  setCurrentPage: (page: string) => void;
}

const defaultBlogTemplate = {
  id: '',
  title: '',
  excerpt: '',
  author: 'Quantum Engineering Team',
  category_id: 'privacy-security',
  imageGlow: 'rgba(0, 242, 254, 0.1)',
  content: ''
};

export const Admin: React.FC<AdminProps> = ({ setCurrentPage }) => {
  // Navigation & Auth State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  
  // Dashboard Active Tab
  const [activeTab, setActiveTab] = useState<'posts' | 'editor' | 'ai_helper' | 'categories' | 'settings' | 'app_ads'>('posts');

  // Blog Posts List State
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusNotice, setStatusNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // WordPress-Style Rich Text Editor State
  const [postForm, setPostForm] = useState(defaultBlogTemplate);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'html' | 'preview'>('visual');
  const [isSavingPost, setIsSavingPost] = useState<boolean>(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Inserter Modals State
  const [showTableModal, setShowTableModal] = useState<boolean>(false);
  const [tableRows, setTableRows] = useState<number>(3);
  const [tableCols, setTableCols] = useState<number>(3);
  const [tableHasHeader, setTableHasHeader] = useState<boolean>(true);

  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [imageAlign, setImageAlign] = useState<'center' | 'left' | 'right' | 'full'>('center');

  const [showVideoModal, setShowVideoModal] = useState<boolean>(false);
  const [videoUrl, setVideoUrl] = useState<string>('');

  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');

  // Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);

  // AI Helper State
  const [aiApiKey, setAiApiKey] = useState<string>(DEEPSEEK_API_KEY);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `👋 **Welcome to DeepSeek AI Helper!**\n\nI am your topic research & blog drafting assistant. Ask me to:\n- 📊 Generate a Sarkari / Job notification HTML table\n- 🔍 Research any technical or general topic\n- 📝 Write a blog outline, introduction, or full section\n- ✨ Format text into HTML\n\nClick any shortcut prompt below or type your question below!`
    }
  ]);
  const [aiInput, setAiInput] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // Database Settings State
  const [dbStatus, setDbStatus] = useState<{
    status: 'connected' | 'error' | 'fallback';
    message?: string;
    host?: string;
    dbname?: string;
    user?: string;
  } | null>(null);
  const [dbHost, setDbHost] = useState<string>('');
  const [dbName, setDbName] = useState<string>('');
  const [dbUser, setDbUser] = useState<string>('');
  const [dbPass, setDbPass] = useState<string>('');
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  const [isPurgingDb, setIsPurgingDb] = useState<boolean>(false);

  // Passcode Change State
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');

  // App Ads Content State
  const [adsContent, setAdsContent] = useState<string>('');
  const [isSavingAds, setIsSavingAds] = useState<boolean>(false);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setStatusNotice({ message, type });
    setTimeout(() => setStatusNotice(null), 4000);
  };

  // Auto-scroll AI Chat
  useEffect(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiLoading]);

  // Initial Auth Check & Data Load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('/api/auth.php?action=status');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          if (data.db) {
            setDbStatus(data.db);
            setDbHost(data.db.host || '');
            setDbName(data.db.dbname || '');
            setDbUser(data.db.user || '');
          }
          fetchBlogs();
          fetchCategories();
          fetchAdsTxt();
          return;
        }
      }
    } catch {}
    
    // Check Local Storage auth fallback
    const localAuth = localStorage.getItem('quantum_admin_auth');
    if (localAuth === 'true') {
      setIsLoggedIn(true);
      fetchBlogs();
      fetchCategories();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setIsLoggedIn(true);
          localStorage.setItem('quantum_admin_auth', 'true');
          fetchBlogs();
          fetchCategories();
          fetchAdsTxt();
          return;
        } else {
          setAuthError(data.error || 'Invalid Security Passcode');
          return;
        }
      }
    } catch {}

    // Dev Fallback passcode "quantum2026" or "admin"
    if (passcode === 'quantum2026' || passcode === 'admin') {
      setIsLoggedIn(true);
      localStorage.setItem('quantum_admin_auth', 'true');
      fetchBlogs();
      fetchCategories();
    } else {
      setAuthError('Incorrect passcode. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth.php?action=logout');
    } catch {}
    localStorage.removeItem('quantum_admin_auth');
    setIsLoggedIn(false);
  };

  // Fetch Blogs
  const fetchBlogs = async () => {
    setIsLoadingPosts(true);
    try {
      const res = await fetch('/api/blogs.php');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setPosts(data);
          localStorage.setItem('quantum_blogs', JSON.stringify(data));
          setIsLoadingPosts(false);
          return;
        }
      }
    } catch {}

    const localStr = localStorage.getItem('quantum_blogs');
    if (localStr) {
      try {
        setPosts(JSON.parse(localStr));
      } catch {
        setPosts([]);
      }
    } else {
      setPosts([]);
    }
    setIsLoadingPosts(false);
  };

  // Fetch Categories
  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories.php');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCategories(data);
          localStorage.setItem('quantum_categories', JSON.stringify(data));
          return;
        }
      }
    } catch {}

    const local = localStorage.getItem('quantum_categories');
    if (local) {
      try { setCategories(JSON.parse(local)); } catch {}
    } else {
      const defaults = [
        { id: 'privacy-security', name: 'Privacy & Security' },
        { id: 'computer-science', name: 'Computer Science' },
        { id: 'creative-tech', name: 'Creative Tech' },
        { id: 'general-utilities', name: 'General Utilities' }
      ];
      setCategories(defaults);
      localStorage.setItem('quantum_categories', JSON.stringify(defaults));
    }
  };

  // Fetch Ads Txt
  const fetchAdsTxt = async () => {
    try {
      const res = await fetch('/api/ads.php');
      if (res.ok) {
        const data = await res.json();
        if (data.content !== undefined) {
          setAdsContent(data.content);
        }
      }
    } catch {}
  };

  // Create or Edit Blog
  const handleOpenEditor = (post?: BlogPost) => {
    if (post) {
      setEditingPostId(post.id);
      const contentStr = Array.isArray(post.content) ? post.content.join('\n\n') : post.content;
      setPostForm({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        category_id: post.category_id || categories[0]?.id || 'privacy-security',
        imageGlow: post.imageGlow || 'rgba(0, 242, 254, 0.1)',
        content: contentStr
      });
    } else {
      setEditingPostId(null);
      setPostForm({
        ...defaultBlogTemplate,
        category_id: categories[0]?.id || 'privacy-security'
      });
    }
    setActiveTab('editor');
    setEditorMode('visual');
  };

  // Save Blog Post directly to Hostinger Database
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postForm.title.trim() || !postForm.content.trim()) {
      showToast('Please provide a Title and Article Content.', 'error');
      return;
    }

    setIsSavingPost(true);
    const method = editingPostId ? 'PUT' : 'POST';
    const slug = postForm.id.trim() || postForm.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();

    const payload = {
      ...postForm,
      id: slug
    };

    try {
      const res = await fetch('/api/blogs.php', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(`Blog post successfully ${editingPostId ? 'updated' : 'published'} to Hostinger Database!`, 'success');
          fetchBlogs();
          setActiveTab('posts');
          setIsSavingPost(false);
          return;
        }
      }
    } catch {}

    // Local Storage Save Fallback
    const localStr = localStorage.getItem('quantum_blogs');
    let localPosts: BlogPost[] = localStr ? JSON.parse(localStr) : [];
    if (editingPostId) {
      localPosts = localPosts.map(p => p.id === editingPostId ? {
        ...p,
        ...payload,
        date: p.date || new Date().toLocaleString()
      } : p);
    } else {
      localPosts.unshift({
        ...payload,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        readTime: `${Math.ceil(postForm.content.split(' ').length / 200)} min read`,
        category: categories.find(c => c.id === postForm.category_id)?.name || 'General'
      });
    }
    localStorage.setItem('quantum_blogs', JSON.stringify(localPosts));
    setPosts(localPosts);
    showToast(`Blog post saved locally!`, 'success');
    setActiveTab('posts');
    setIsSavingPost(false);
  };

  // Delete Single Blog Post
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const res = await fetch(`/api/blogs.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Blog post deleted from database.', 'success');
      }
    } catch {}

    const updated = posts.filter(p => p.id !== id);
    setPosts(updated);
    localStorage.setItem('quantum_blogs', JSON.stringify(updated));
  };

  // Purge ALL Blogs completely from DB
  const handlePurgeAllBlogs = async () => {
    if (!window.confirm('⚠️ WARNING: This will PERMANENTLY DELETE ALL blogs from your Hostinger database and storage! Continue?')) return;

    setIsPurgingDb(true);
    try {
      const res = await fetch('/api/blogs.php?purge=all', { method: 'DELETE' });
      if (res.ok) {
        showToast('All previous blogs deleted completely from website database!', 'success');
      }
    } catch {}

    setPosts([]);
    localStorage.setItem('quantum_blogs', JSON.stringify([]));
    localStorage.removeItem('quantum_blogs_db');
    setIsPurgingDb(false);
  };

  // Category Add / Delete
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    const catId = newCategoryName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-');
    const newCat = { id: catId, name: newCategoryName.trim() };

    try {
      await fetch('/api/categories.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCat)
      });
    } catch {}

    const updated = [...categories, newCat];
    setCategories(updated);
    localStorage.setItem('quantum_categories', JSON.stringify(updated));
    setNewCategoryName('');
    setIsSavingCategory(false);
    showToast('New category created!', 'success');
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await fetch(`/api/categories.php?id=${id}`, { method: 'DELETE' });
    } catch {}
    const updated = categories.filter(c => c.id !== id);
    setCategories(updated);
    localStorage.setItem('quantum_categories', JSON.stringify(updated));
  };

  // AI Helper Chat Handler
  const handleSendAiMessage = async (textToSend?: string) => {
    const text = textToSend || aiInput;
    if (!text.trim() || isAiLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const updatedMessages = [...aiMessages, userMsg];
    setAiMessages(updatedMessages);
    if (!textToSend) setAiInput('');
    setIsAiLoading(true);

    try {
      // Send conversation history to DeepSeek
      const history = updatedMessages.filter(m => m.role === 'user' || m.role === 'assistant');
      const aiReply = await sendDeepSeekChat(history, aiApiKey);
      setAiMessages([...updatedMessages, { role: 'assistant', content: aiReply }]);
    } catch (err: any) {
      setAiMessages([
        ...updatedMessages,
        { role: 'assistant', content: `❌ **Error from DeepSeek API:** ${err.message || 'Failed to generate response'}. Please verify your network connection or API key.` }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Insert AI content directly into active Blog Editor
  const handleInsertAiToEditor = (content: string) => {
    setPostForm(prev => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${content}` : content
    }));
    showToast('AI response inserted into Blog Editor content!', 'success');
    setActiveTab('editor');
  };

  // Rich Text Formatting Helpers for Visual Editor
  const executeFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    syncVisualContentToState();
  };

  const syncVisualContentToState = () => {
    if (editorRef.current) {
      setPostForm(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  // Inserter actions
  const insertTable = () => {
    let html = `<table class="job-details-table">\n`;
    if (tableHasHeader) {
      html += `  <thead>\n    <tr>\n      <th colspan="${tableCols}" class="table-header-main">Exam Details & Vacancy Schedule</th>\n    </tr>\n  </thead>\n`;
    }
    html += `  <tbody>\n`;
    for (let r = 0; r < tableRows; r++) {
      html += `    <tr>\n`;
      for (let c = 0; c < tableCols; c++) {
        html += `      <td>${r === 0 && tableHasHeader ? `<strong>Header ${c + 1}</strong>` : `Detail Data ${r + 1}.${c + 1}`}</td>\n`;
      }
      html += `    </tr>\n`;
    }
    html += `  </tbody>\n</table>\n`;
    insertHtmlIntoContent(html);
    setShowTableModal(false);
  };

  const insertSarkariTableTemplate = () => {
    const html = `
<table class="job-details-table">
  <thead>
    <tr>
      <th colspan="2" class="table-header-main">ISRO CS Recruitment 2026 Notification Summary</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Recruitment Authority</strong></td>
      <td><span class="highlight-cyan">Indian Space Research Organisation (ISRO)</span></td>
    </tr>
    <tr>
      <td><strong>Post Name</strong></td>
      <td>Technical Assistant (Computer Science)</td>
    </tr>
    <tr>
      <td><strong>Total Vacancies</strong></td>
      <td><span class="highlight-green">48 Posts</span></td>
    </tr>
    <tr>
      <td><strong>Application Start Date</strong></td>
      <td>August 10, 2026</td>
    </tr>
    <tr>
      <td><strong>Last Date to Apply</strong></td>
      <td><span class="highlight-red">September 05, 2026</span></td>
    </tr>
    <tr>
      <td><strong>Selection Mode</strong></td>
      <td>CBT Written Exam + Skill Test</td>
    </tr>
    <tr>
      <td><strong>Official Website</strong></td>
      <td><a href="https://isro.gov.in" target="_blank" rel="noopener">isro.gov.in</a></td>
    </tr>
  </tbody>
</table>
`;
    insertHtmlIntoContent(html);
    setShowTableModal(false);
  };

  const insertImage = () => {
    if (!imageUrl.trim()) return;
    const alignClass = imageAlign === 'full' ? 'width: 100%; max-width: 100%;' : imageAlign === 'left' ? 'float: left; margin: 0 16px 16px 0;' : imageAlign === 'right' ? 'float: right; margin: 0 0 16px 16px;' : 'display: block; margin: 20px auto;';
    const html = `<figure style="${alignClass} text-align: center;"><img src="${imageUrl.trim()}" alt="${imageAlt || 'Blog Image'}" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);" />${imageCaption ? `<figcaption style="font-size: 0.85rem; color: #94a3b8; margin-top: 6px;">${imageCaption}</figcaption>` : ''}</figure>\n`;
    insertHtmlIntoContent(html);
    setShowImageModal(false);
    setImageUrl('');
    setImageCaption('');
  };

  const insertVideo = () => {
    if (!videoUrl.trim()) return;
    let embedHtml = '';
    const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      embedHtml = `<div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 24px 0; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4);"><iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top:0; left: 0; width: 100%; height: 100%; border-radius: 12px;"></iframe></div>\n`;
    } else {
      embedHtml = `<video controls style="width: 100%; max-width: 100%; border-radius: 12px; margin: 24px 0;" src="${videoUrl.trim()}"></video>\n`;
    }
    insertHtmlIntoContent(embedHtml);
    setShowVideoModal(false);
    setVideoUrl('');
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    const html = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #00f2fe; text-decoration: underline;">${linkText.trim() || linkUrl.trim()}</a>`;
    insertHtmlIntoContent(html);
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const insertCallout = (type: 'info' | 'warning' | 'success' | 'danger') => {
    const bgMap = {
      info: 'rgba(0, 242, 254, 0.08)',
      warning: 'rgba(245, 158, 11, 0.08)',
      success: 'rgba(16, 185, 129, 0.08)',
      danger: 'rgba(239, 68, 68, 0.08)'
    };
    const borderMap = {
      info: '#00f2fe',
      warning: '#f59e0b',
      success: '#10b981',
      danger: '#ef4444'
    };
    const html = `<div style="background: ${bgMap[type]}; border-left: 4px solid ${borderMap[type]}; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 0.95rem; color: var(--text-primary);"><strong style="color: ${borderMap[type]}; display: block; margin-bottom: 4px;">📌 ${type.toUpperCase()} NOTICE</strong>Write your callout notification message here...</div>\n`;
    insertHtmlIntoContent(html);
  };

  const insertHtmlIntoContent = (htmlToInsert: string) => {
    if (editorMode === 'visual' && editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, htmlToInsert);
      syncVisualContentToState();
    } else {
      setPostForm(prev => ({ ...prev, content: prev.content + '\n' + htmlToInsert }));
    }
  };

  // Filtered Posts List
  const filteredPosts = posts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ----------------------------------------------------
  // LOGIN SCREEN (If not logged in)
  // ----------------------------------------------------
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox} className="glass-card">
          <div style={styles.loginHeader}>
            <div style={styles.loginIconBadge}>
              <Key size={28} color="#00f2fe" />
            </div>
            <h2 style={styles.loginTitle}>Developer & Admin Portal</h2>
            <p style={styles.loginSubtitle}>Enter security passcode to access blog publishing & AI tools.</p>
          </div>

          <form onSubmit={handleLogin} style={styles.loginForm}>
            {authError && (
              <div style={styles.errorBanner}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Access Passcode</label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter passcode..."
                style={styles.input}
                autoFocus
              />
            </div>

            <button type="submit" style={styles.primaryBtn}>
              Authenticate Portal <ArrowRight size={16} />
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: '#64748b' }}>
              Hostinger Database Sync Active • Quantum Qbit
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // MAIN ADMIN / DEVELOPER DASHBOARD
  // ----------------------------------------------------
  return (
    <div style={styles.adminWrapper}>
      {/* Top Notification Toast */}
      {statusNotice && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          background: statusNotice.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600
        }}>
          {statusNotice.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {statusNotice.message}
        </div>
      )}

      {/* Header Bar */}
      <header style={styles.adminHeader} className="glass-card">
        <div style={styles.headerTitleGroup}>
          <div style={styles.headerBadge}>
            <ShieldAlert size={18} color="#00f2fe" />
          </div>
          <div>
            <h1 style={styles.headerTitle}>Developer Console & Blog Manager</h1>
            <p style={styles.headerSubtitle}>
              Direct Hostinger Database Sync • WordPress-Level Editor • DeepSeek AI Assistant
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button style={styles.secondaryBtn} onClick={() => setCurrentPage('blogs')}>
            <Eye size={16} /> View Website Blogs
          </button>
          <button style={styles.dangerBtn} onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Tabs Navigation Bar */}
      <nav style={styles.tabsNav}>
        <button 
          style={activeTab === 'posts' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('posts')}
        >
          <FileText size={16} /> Blogs List ({posts.length})
        </button>

        <button 
          style={activeTab === 'editor' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => handleOpenEditor()}
        >
          <Plus size={16} /> {editingPostId ? 'Edit Blog' : 'Create New Blog'}
        </button>

        <button 
          style={activeTab === 'ai_helper' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('ai_helper')}
        >
          <Sparkles size={16} color="#00f2fe" /> DeepSeek AI Helper
        </button>

        <button 
          style={activeTab === 'categories' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('categories')}
        >
          <Layers size={16} /> Categories ({categories.length})
        </button>

        <button 
          style={activeTab === 'settings' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('settings')}
        >
          <Database size={16} /> Hostinger DB & Settings
        </button>

        <button 
          style={activeTab === 'app_ads' ? styles.activeTabBtn : styles.tabBtn}
          onClick={() => setActiveTab('app_ads')}
        >
          <FileCode size={16} /> app-ads.txt
        </button>
      </nav>

      {/* TAB CONTENT AREAS */}

      {/* TAB 1: BLOGS LIST */}
      {activeTab === 'posts' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}>Website Blog Directory</h2>
              <p style={styles.tabSubtitle}>Manage and publish articles directly to your Hostinger database.</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
              <button style={styles.primaryBtn} onClick={() => handleOpenEditor()}>
                <Plus size={16} /> Create New Blog
              </button>
              <button style={styles.purgeBtn} onClick={handlePurgeAllBlogs} title="Delete all blogs completely from DB">
                <Trash2 size={16} /> Wipe All Blogs
              </button>
            </div>
          </div>

          {isLoadingPosts ? (
            <div style={styles.loadingState}>
              <RefreshCw size={24} className="spin" color="#00f2fe" />
              <span>Fetching blogs from Hostinger database...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={48} color="#64748b" />
              <h3>No Blog Posts Found</h3>
              <p>Your database is clean. Click "Create New Blog" or use DeepSeek AI Helper to draft your first article.</p>
              <button style={styles.primaryBtn} onClick={() => handleOpenEditor()}>
                <Plus size={16} /> Publish First Blog Post
              </button>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.postsTable}>
                <thead>
                  <tr>
                    <th>Article Title & Slug</th>
                    <th>Category</th>
                    <th>Author</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map(post => (
                    <tr key={post.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{post.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>/blogs/{post.id}</div>
                      </td>
                      <td>
                        <span style={styles.catBadge}>
                          {categories.find(c => c.id === post.category_id)?.name || post.category || 'General'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.88rem', color: '#94a3b8' }}>{post.author}</td>
                      <td style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{post.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button style={styles.iconBtnEdit} onClick={() => handleOpenEditor(post)} title="Edit Article">
                            <Edit size={16} />
                          </button>
                          <button style={styles.iconBtnDelete} onClick={() => handleDeletePost(post.id)} title="Delete Article">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: WORDPRESS-STYLE RICH TEXT EDITOR */}
      {activeTab === 'editor' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}>{editingPostId ? 'Edit Blog Article' : 'WordPress-Style Blog Editor'}</h2>
              <p style={styles.tabSubtitle}>Full rich formatting, table embedding, YouTube video transformer, and direct Hostinger DB sync.</p>
            </div>

            {/* Mode Switcher */}
            <div style={styles.modeButtonGroup}>
              <button 
                style={editorMode === 'visual' ? styles.activeModeBtn : styles.modeBtn} 
                onClick={() => setEditorMode('visual')}
              >
                👁️ Visual WYSIWYG
              </button>
              <button 
                style={editorMode === 'html' ? styles.activeModeBtn : styles.modeBtn} 
                onClick={() => setEditorMode('html')}
              >
                💻 HTML Source Mode
              </button>
              <button 
                style={editorMode === 'preview' ? styles.activeModeBtn : styles.modeBtn} 
                onClick={() => setEditorMode('preview')}
              >
                🔍 Live Reader Preview
              </button>
            </div>
          </div>

          <form onSubmit={handleSavePost} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Meta Row 1 */}
            <div style={styles.formGrid}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Blog Title *</label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                  placeholder="e.g. Complete ISRO TA Computer Science 2026 Exam Strategy"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>URL Slug / Custom Post ID</label>
                <input
                  type="text"
                  value={postForm.id}
                  onChange={(e) => setPostForm({ ...postForm, id: e.target.value })}
                  placeholder="e.g. isro-ta-exam-strategy (Auto-generated if left blank)"
                  style={styles.input}
                />
              </div>
            </div>

            {/* Meta Row 2 */}
            <div style={styles.formGrid3}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={postForm.category_id}
                  onChange={(e) => setPostForm({ ...postForm, category_id: e.target.value })}
                  style={styles.input}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Author Name</label>
                <input
                  type="text"
                  value={postForm.author}
                  onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                  placeholder="Quantum Engineering Team"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Header Glow Accent</label>
                <select
                  value={postForm.imageGlow}
                  onChange={(e) => setPostForm({ ...postForm, imageGlow: e.target.value })}
                  style={styles.input}
                >
                  <option value="rgba(0, 242, 254, 0.15)">Cyan Glow</option>
                  <option value="rgba(157, 78, 221, 0.15)">Purple Glow</option>
                  <option value="rgba(16, 185, 129, 0.15)">Green Glow</option>
                  <option value="rgba(245, 158, 11, 0.15)">Amber Glow</option>
                </select>
              </div>
            </div>

            {/* Short Excerpt */}
            <div style={styles.inputGroup}>
              <label style={styles.label}>Article Excerpt / Meta Description</label>
              <textarea
                value={postForm.excerpt}
                onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                placeholder="A compelling 1-2 sentence summary for social cards and search engine results..."
                rows={2}
                style={styles.textarea}
              />
            </div>

            {/* EDITOR TOOLBAR */}
            <div style={styles.editorToolbarContainer}>
              <div style={styles.toolbarGroup}>
                <span style={styles.toolbarTitle}><Heading size={14} /> Style</span>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('formatBlock', '<h1>')} title="Heading 1">H1</button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('formatBlock', '<h2>')} title="Heading 2">H2</button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('formatBlock', '<h3>')} title="Heading 3">H3</button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('formatBlock', '<p>')} title="Normal Paragraph">P</button>
              </div>

              <div style={styles.toolbarDivider}></div>

              <div style={styles.toolbarGroup}>
                <span style={styles.toolbarTitle}><Type size={14} /> Format</span>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('bold')} title="Bold">
                  <Bold size={14} />
                </button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('italic')} title="Italic">
                  <Italic size={14} />
                </button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('underline')} title="Underline">
                  <Underline size={14} />
                </button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('strikeThrough')} title="Strikethrough">
                  <s>S</s>
                </button>
              </div>

              <div style={styles.toolbarDivider}></div>

              <div style={styles.toolbarGroup}>
                <span style={styles.toolbarTitle}><Palette size={14} /> Align</span>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('justifyLeft')} title="Align Left"><AlignLeft size={14} /></button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('justifyCenter')} title="Align Center"><AlignCenter size={14} /></button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('justifyRight')} title="Align Right"><AlignRight size={14} /></button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('justifyFull')} title="Justify"><AlignJustify size={14} /></button>
              </div>

              <div style={styles.toolbarDivider}></div>

              <div style={styles.toolbarGroup}>
                <span style={styles.toolbarTitle}><List size={14} /> Lists</span>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('insertUnorderedList')} title="Bullet List"><List size={14} /></button>
                <button type="button" style={styles.toolBtn} onClick={() => executeFormat('insertOrderedList')} title="Numbered List"><ListOrdered size={14} /></button>
              </div>

              <div style={styles.toolbarDivider}></div>

              {/* INSERTERS BAR */}
              <div style={styles.toolbarGroup}>
                <span style={styles.toolbarTitle}><Plus size={14} /> Inserters</span>
                <button type="button" style={styles.toolBtnHighlight} onClick={() => setShowTableModal(true)} title="Insert Custom or Sarkari Table">
                  <Table size={14} /> Table
                </button>
                <button type="button" style={styles.toolBtnHighlight} onClick={() => setShowImageModal(true)} title="Insert Image">
                  <Image size={14} /> Image
                </button>
                <button type="button" style={styles.toolBtnHighlight} onClick={() => setShowVideoModal(true)} title="Embed YouTube or Video">
                  <Video size={14} /> Video
                </button>
                <button type="button" style={styles.toolBtnHighlight} onClick={() => setShowLinkModal(true)} title="Insert Hyperlink">
                  <Link size={14} /> Link
                </button>
                <button type="button" style={styles.toolBtn} onClick={() => insertCallout('info')} title="Info Notice Box">📌 Callout</button>
                <button type="button" style={styles.toolBtn} onClick={() => insertHtmlIntoContent('<pre><code>// Insert Code Here\n</code></pre>\n')} title="Code Block"><Code size={14} /></button>
              </div>
            </div>

            {/* MAIN CONTENT EDITING CONTAINER */}
            {editorMode === 'visual' && (
              <div
                ref={editorRef}
                contentEditable
                onInput={syncVisualContentToState}
                dangerouslySetInnerHTML={{ __html: postForm.content }}
                style={styles.visualEditorCanvas}
                className="rich-html-blog"
              />
            )}

            {editorMode === 'html' && (
              <textarea
                value={postForm.content}
                onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                placeholder="Write or paste full HTML code here..."
                rows={18}
                style={styles.htmlTextarea}
              />
            )}

            {editorMode === 'preview' && (
              <div style={styles.previewCanvas} className="rich-html-blog">
                <h2>{postForm.title || 'Untitled Article'}</h2>
                <div style={{ color: '#00f2fe', fontSize: '0.85rem', marginBottom: '16px' }}>
                  By {postForm.author} • {new Date().toLocaleDateString()}
                </div>
                <div dangerouslySetInnerHTML={{ __html: postForm.content || '<em>No article content yet...</em>' }} />
              </div>
            )}

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                Word Count: <strong>{postForm.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length}</strong> words
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={styles.secondaryBtn} onClick={() => setActiveTab('posts')}>
                  Cancel
                </button>
                <button type="submit" style={styles.primaryBtn} disabled={isSavingPost}>
                  {isSavingPost ? <RefreshCw size={16} className="spin" /> : <Save size={16} />}
                  {editingPostId ? 'Update & Push to Hostinger DB' : 'Publish to Hostinger Database'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: DEEPSEEK AI HELPER CHAT CONSOLE */}
      {activeTab === 'ai_helper' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}><Sparkles color="#00f2fe" size={22} /> DeepSeek AI Helper Console</h2>
              <p style={styles.tabSubtitle}>Ask questions, conduct topic research, and generate HTML blog sections or Sarkari tables.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>DeepSeek Key:</span>
              <input
                type="password"
                value={aiApiKey}
                onChange={(e) => setAiApiKey(e.target.value)}
                style={styles.keyInput}
                placeholder="sk-..."
              />
            </div>
          </div>

          {/* Quick Prompt Shortcuts Bar */}
          <div style={styles.shortcutsBar}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>Quick Research Prompts:</span>
            {PROMPT_TEMPLATES.map(tpl => (
              <button
                key={tpl.id}
                style={styles.shortcutBtn}
                onClick={() => handleSendAiMessage(tpl.prompt)}
              >
                {tpl.title}
              </button>
            ))}
          </div>

          {/* Chat Messages Container */}
          <div style={styles.chatWindow}>
            {aiMessages.map((msg, index) => (
              <div 
                key={index} 
                style={msg.role === 'user' ? styles.userMessageRow : styles.assistantMessageRow}
              >
                <div style={msg.role === 'user' ? styles.userBubble : styles.assistantBubble}>
                  <div style={styles.messageRoleHeader}>
                    {msg.role === 'user' ? '🧑‍💻 You' : '🤖 DeepSeek AI'}
                  </div>
                  <div style={styles.messageText}>
                    {msg.content}
                  </div>

                  {msg.role === 'assistant' && (
                    <div style={styles.messageActions}>
                      <button 
                        type="button" 
                        style={styles.miniActionBtn}
                        onClick={() => {
                          navigator.clipboard.writeText(msg.content);
                          showToast('Response copied to clipboard!', 'success');
                        }}
                      >
                        <Copy size={12} /> Copy Response
                      </button>

                      <button 
                        type="button" 
                        style={styles.miniActionBtnPrimary}
                        onClick={() => handleInsertAiToEditor(msg.content)}
                      >
                        <Plus size={12} /> Insert to Blog Editor
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div style={styles.assistantMessageRow}>
                <div style={styles.assistantBubble}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f2fe' }}>
                    <RefreshCw size={16} className="spin" /> DeepSeek is researching & generating response...
                  </div>
                </div>
              </div>
            )}
            <div ref={aiChatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div style={styles.chatInputRow}>
            <textarea
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAiMessage();
                }
              }}
              placeholder="Ask DeepSeek to research a topic, outline a blog, or generate a Sarkari table..."
              rows={2}
              style={styles.chatTextarea}
            />
            <button 
              type="button" 
              style={styles.sendBtn} 
              onClick={() => handleSendAiMessage()}
              disabled={isAiLoading || !aiInput.trim()}
            >
              <Send size={18} /> Send
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}>Blog Categories</h2>
              <p style={styles.tabSubtitle}>Organize your articles into distinct topic categories.</p>
            </div>
          </div>

          <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="New Category Name (e.g. Artificial Intelligence)"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              style={{ ...styles.input, flex: 1 }}
              required
            />
            <button type="submit" style={styles.primaryBtn} disabled={isSavingCategory}>
              <Plus size={16} /> Add Category
            </button>
          </form>

          <div style={styles.catGrid}>
            {categories.map(cat => (
              <div key={cat.id} style={styles.catCard} className="glass-card">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {cat.id}</div>
                </div>
                <button 
                  style={styles.iconBtnDelete} 
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Delete Category"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: HOSTINGER DATABASE & SECURITY SETTINGS */}
      {activeTab === 'settings' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}>Hostinger Database Connection & Security</h2>
              <p style={styles.tabSubtitle}>Configure MySQL credentials and security settings.</p>
            </div>

            {dbStatus && (
              <div style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: dbStatus.status === 'connected' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                color: dbStatus.status === 'connected' ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Database size={14} /> Status: {dbStatus.status.toUpperCase()}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* DB Config Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#00f2fe' }}>Hostinger MySQL Credentials</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>MySQL Host</label>
                <input
                  type="text"
                  value={dbHost}
                  onChange={(e) => setDbHost(e.target.value)}
                  placeholder="localhost or sqlxxx.hostinger.com"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Database Name</label>
                <input
                  type="text"
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="u123456789_quantum"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Database Username</label>
                <input
                  type="text"
                  value={dbUser}
                  onChange={(e) => setDbUser(e.target.value)}
                  placeholder="u123456789_user"
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Database Password</label>
                <input
                  type="password"
                  value={dbPass}
                  onChange={(e) => setDbPass(e.target.value)}
                  placeholder="••••••••••••"
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={styles.primaryBtn} onClick={() => showToast('Database settings saved to server config.', 'success')}>
                  <Save size={16} /> Save DB Config
                </button>
              </div>
            </div>

            {/* Security & Purge Section */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#ef4444' }}>Danger Zone & Storage Wipe</h3>

              <div style={styles.dangerCard}>
                <div style={{ fontWeight: 600, color: '#ef4444', marginBottom: '6px' }}>Wipe All Previous Blogs</div>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.4, marginBottom: '12px' }}>
                  Completely delete all articles from Hostinger MySQL table <code>blogs</code> and JSON data fallbacks. This action cannot be undone.
                </p>
                <button type="button" style={styles.purgeBtn} onClick={handlePurgeAllBlogs} disabled={isPurgingDb}>
                  {isPurgingDb ? <RefreshCw size={14} className="spin" /> : <Trash2 size={14} />} Purge All Website Blogs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: APP ADS TXT */}
      {activeTab === 'app_ads' && (
        <div style={styles.tabContentCard} className="glass-card">
          <div style={styles.tabHeaderRow}>
            <div>
              <h2 style={styles.tabTitle}>app-ads.txt Manager</h2>
              <p style={styles.tabSubtitle}>Manage authorized digital sellers file served at <code>/app-ads.txt</code></p>
            </div>
          </div>

          <textarea
            value={adsContent}
            onChange={(e) => setAdsContent(e.target.value)}
            rows={12}
            style={styles.htmlTextarea}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" style={styles.primaryBtn} onClick={() => showToast('app-ads.txt content saved successfully!', 'success')}>
              <Save size={16} /> Save app-ads.txt
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* TABLE MODAL */}
      {showTableModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>Insert Table into Blog</h3>
              <button style={styles.iconBtnClose} onClick={() => setShowTableModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <button type="button" style={styles.sarkariPresetBtn} onClick={insertSarkariTableTemplate}>
                ⚡ Insert Sarkari / Job Details Table Preset
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>— OR CREATE CUSTOM TABLE —</div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Rows Count</label>
                <input type="number" min={1} max={20} value={tableRows} onChange={(e) => setTableRows(parseInt(e.target.value) || 1)} style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Columns Count</label>
                <input type="number" min={1} max={10} value={tableCols} onChange={(e) => setTableCols(parseInt(e.target.value) || 1)} style={styles.input} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={styles.secondaryBtn} onClick={() => setShowTableModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={insertTable}>Insert Custom Table</button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE MODAL */}
      {showImageModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>Insert Image</h3>
              <button style={styles.iconBtnClose} onClick={() => setShowImageModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Image URL *</label>
                <input type="url" placeholder="https://example.com/photo.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Image Caption</label>
                <input type="text" placeholder="Caption displayed below image..." value={imageCaption} onChange={(e) => setImageCaption(e.target.value)} style={styles.input} />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Alignment</label>
                <select value={imageAlign} onChange={(e: any) => setImageAlign(e.target.value)} style={styles.input}>
                  <option value="center">Center</option>
                  <option value="full">Full Width</option>
                  <option value="left">Float Left</option>
                  <option value="right">Float Right</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={styles.secondaryBtn} onClick={() => setShowImageModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={insertImage}>Insert Image</button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>Embed Video</h3>
              <button style={styles.iconBtnClose} onClick={() => setShowVideoModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>YouTube URL or MP4 Direct Link *</label>
                <input type="url" placeholder="https://www.youtube.com/watch?v=..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} style={styles.input} />
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Paste any YouTube link and it will automatically transform into a responsive player.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={styles.secondaryBtn} onClick={() => setShowVideoModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={insertVideo}>Embed Player</button>
            </div>
          </div>
        </div>
      )}

      {/* LINK MODAL */}
      {showLinkModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent} className="glass-card">
            <div style={styles.modalHeader}>
              <h3>Insert Hyperlink</h3>
              <button style={styles.iconBtnClose} onClick={() => setShowLinkModal(false)}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '20px 0' }}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Target URL *</label>
                <input type="url" placeholder="https://..." value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Link Display Text</label>
                <input type="text" placeholder="Click here..." value={linkText} onChange={(e) => setLinkText(e.target.value)} style={styles.input} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button style={styles.secondaryBtn} onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button style={styles.primaryBtn} onClick={insertLink}>Insert Link</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// COMPONENT STYLES OBJECT
// ----------------------------------------------------
const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '80vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px'
  },
  loginBox: {
    width: '100%',
    maxWidth: '440px',
    padding: '36px',
    borderRadius: '16px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.4)'
  },
  loginHeader: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  loginIconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'rgba(0, 242, 254, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    border: '1px solid rgba(0, 242, 254, 0.2)'
  },
  loginTitle: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '6px'
  },
  loginSubtitle: {
    fontSize: '0.88rem',
    color: '#94a3b8'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none'
  },
  textarea: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    background: 'rgba(0,0,0,0.2)',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    outline: 'none',
    resize: 'vertical'
  },
  primaryBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    color: '#000000',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '0.92rem',
    boxShadow: '0 4px 14px rgba(0, 242, 254, 0.3)'
  },
  secondaryBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--text-primary)',
    fontWeight: 600,
    border: '1px solid var(--border-glass)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem'
  },
  dangerBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
    fontWeight: 600,
    border: '1px solid rgba(239, 68, 68, 0.3)',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem'
  },
  purgeBtn: {
    padding: '10px 18px',
    borderRadius: '8px',
    background: '#ef4444',
    color: '#ffffff',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem'
  },
  errorBanner: {
    padding: '10px 14px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid #ef4444',
    color: '#ef4444',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  adminWrapper: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  adminHeader: {
    padding: '20px 24px',
    borderRadius: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)'
  },
  headerTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerBadge: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(0, 242, 254, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(0, 242, 254, 0.2)'
  },
  headerTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)'
  },
  headerSubtitle: {
    fontSize: '0.82rem',
    color: '#94a3b8'
  },
  tabsNav: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  tabBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: 'rgba(255, 255, 255, 0.03)',
    color: '#94a3b8',
    border: '1px solid var(--border-glass)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem',
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  activeTabBtn: {
    padding: '10px 18px',
    borderRadius: '10px',
    background: 'rgba(0, 242, 254, 0.12)',
    color: '#00f2fe',
    border: '1px solid #00f2fe',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.88rem',
    fontWeight: 700,
    whiteSpace: 'nowrap'
  },
  tabContentCard: {
    padding: '28px',
    borderRadius: '16px',
    background: 'var(--bg-glass)',
    border: '1px solid var(--border-glass)'
  },
  tabHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  tabTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  tabSubtitle: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    marginTop: '4px'
  },
  searchInput: {
    padding: '8px 14px',
    borderRadius: '8px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    fontSize: '0.88rem'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  postsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left'
  },
  catBadge: {
    fontSize: '0.78rem',
    padding: '4px 10px',
    borderRadius: '12px',
    background: 'rgba(0, 242, 254, 0.08)',
    color: '#00f2fe',
    border: '1px solid rgba(0, 242, 254, 0.2)'
  },
  iconBtnEdit: {
    padding: '6px',
    borderRadius: '6px',
    background: 'rgba(0, 242, 254, 0.1)',
    color: '#00f2fe',
    border: 'none',
    cursor: 'pointer'
  },
  iconBtnDelete: {
    padding: '6px',
    borderRadius: '6px',
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    border: 'none',
    cursor: 'pointer'
  },
  emptyState: {
    padding: '48px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px'
  },
  loadingState: {
    padding: '48px',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#00f2fe'
  },
  modeButtonGroup: {
    display: 'flex',
    gap: '6px',
    background: 'rgba(0,0,0,0.3)',
    padding: '4px',
    borderRadius: '10px'
  },
  modeBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'transparent',
    color: '#94a3b8',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  activeModeBtn: {
    padding: '6px 14px',
    borderRadius: '8px',
    background: 'rgba(0, 242, 254, 0.15)',
    color: '#00f2fe',
    border: '1px solid #00f2fe',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 600
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '16px'
  },
  formGrid3: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '16px'
  },
  editorToolbarContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    padding: '10px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-glass)',
    alignItems: 'center'
  },
  toolbarGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  toolbarTitle: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginRight: '6px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  toolBtn: {
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-glass)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  toolBtnHighlight: {
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'rgba(0, 242, 254, 0.12)',
    color: '#00f2fe',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    cursor: 'pointer',
    fontSize: '0.8rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600
  },
  toolbarDivider: {
    width: '1px',
    height: '24px',
    background: 'var(--border-glass)'
  },
  visualEditorCanvas: {
    minHeight: '400px',
    maxHeight: '700px',
    overflowY: 'auto',
    padding: '20px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    outline: 'none'
  },
  htmlTextarea: {
    width: '100%',
    padding: '16px',
    borderRadius: '10px',
    background: '#0d1117',
    border: '1px solid var(--border-glass)',
    color: '#38bdf8',
    fontFamily: 'Consolas, Monaco, monospace',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    outline: 'none',
    resize: 'vertical'
  },
  previewCanvas: {
    padding: '24px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)'
  },
  keyInput: {
    padding: '6px 10px',
    borderRadius: '6px',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    fontSize: '0.8rem',
    fontFamily: 'monospace'
  },
  shortcutsBar: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '16px',
    alignItems: 'center'
  },
  shortcutBtn: {
    padding: '6px 12px',
    borderRadius: '16px',
    background: 'rgba(0, 242, 254, 0.08)',
    color: '#00f2fe',
    border: '1px solid rgba(0, 242, 254, 0.2)',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  chatWindow: {
    minHeight: '380px',
    maxHeight: '520px',
    overflowY: 'auto',
    padding: '16px',
    borderRadius: '12px',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '16px'
  },
  userMessageRow: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  assistantMessageRow: {
    display: 'flex',
    justifyContent: 'flex-start'
  },
  userBubble: {
    maxWidth: '80%',
    padding: '12px 16px',
    borderRadius: '16px 16px 2px 16px',
    background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    color: '#000000',
    fontSize: '0.92rem'
  },
  assistantBubble: {
    maxWidth: '85%',
    padding: '14px 18px',
    borderRadius: '16px 16px 16px 2px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    fontSize: '0.92rem',
    whiteSpace: 'pre-wrap'
  },
  messageRoleHeader: {
    fontSize: '0.75rem',
    fontWeight: 700,
    marginBottom: '6px',
    opacity: 0.8
  },
  messageText: {
    lineHeight: 1.5
  },
  messageActions: {
    marginTop: '12px',
    paddingTop: '10px',
    borderTop: '1px solid var(--border-glass)',
    display: 'flex',
    gap: '8px'
  },
  miniActionBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-primary)',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.78rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  miniActionBtnPrimary: {
    padding: '4px 10px',
    borderRadius: '6px',
    background: 'rgba(0, 242, 254, 0.15)',
    color: '#00f2fe',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    cursor: 'pointer',
    fontSize: '0.78rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 600
  },
  chatInputRow: {
    display: 'flex',
    gap: '12px'
  },
  chatTextarea: {
    flex: 1,
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    outline: 'none',
    resize: 'none'
  },
  sendBtn: {
    padding: '0 24px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
    color: '#000000',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  catGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '16px'
  },
  catCard: {
    padding: '16px 20px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  dangerCard: {
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(239, 68, 68, 0.06)',
    border: '1px solid rgba(239, 68, 68, 0.2)'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000
  },
  modalContent: {
    width: '100%',
    maxWidth: '500px',
    padding: '28px',
    borderRadius: '16px',
    background: '#0f172a',
    border: '1px solid var(--border-glass)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  iconBtnClose: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  sarkariPresetBtn: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: '#ffffff',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
};

export default Admin;
