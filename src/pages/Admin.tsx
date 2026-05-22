import React, { useState, useEffect } from 'react';
import { 
  Key, LogOut, FileText, Settings, Plus, Edit, Trash2, 
  Check, AlertCircle, Trash, Eye, EyeOff, Save, X 
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string[];
  author: string;
  date: string;
  readTime: string;
  category: string;
  imageGlow: string;
}

interface AdminProps {
  setCurrentPage: (page: string) => void;
}

const defaultBlogTemplate = {
  title: '',
  excerpt: '',
  author: 'Quantum Engineering Team',
  category: 'Privacy & Security',
  imageGlow: 'rgba(0, 242, 254, 0.1)',
  content: ['']
};

export const Admin: React.FC<AdminProps> = ({ setCurrentPage }) => {
  // Navigation & Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false); // Fallback for local Vite dev server
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'posts' | 'settings'>('posts');
  
  // Blogs state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Editor state (Modal / Form)
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postForm, setPostForm] = useState(defaultBlogTemplate);
  const [editorError, setEditorError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Passcode Settings state
  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmPass, setConfirmPass] = useState<string>('');
  const [settingsSuccess, setSettingsSuccess] = useState<string>('');
  const [settingsError, setSettingsError] = useState<string>('');

  // Check login status on load
  useEffect(() => {
    checkLoginStatus();
  }, []);

  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth.php?action=status');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          fetchBlogs();
        } else {
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      } else {
        // Not running on PHP server (e.g. local Vite dev server)
        checkLocalSession();
      }
    } catch (e) {
      checkLocalSession();
    }
  };

  const checkLocalSession = () => {
    const isAuth = sessionStorage.getItem('admin_local_auth') === 'true';
    setIsLocalMode(true);
    if (isAuth) {
      setIsLoggedIn(true);
      fetchLocalBlogs();
    } else {
      setIsLoading(false);
    }
  };

  // Fetch blogs from PHP backend
  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/blogs.php');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else {
        fetchLocalBlogs();
      }
    } catch (e) {
      fetchLocalBlogs();
    } finally {
      setIsLoading(false);
    }
  };

  // Local storage blogs fallback
  const fetchLocalBlogs = () => {
    const local = localStorage.getItem('quantum_blogs');
    if (local) {
      setPosts(JSON.parse(local));
    } else {
      // Initialize with default posts
      const defaultPosts: BlogPost[] = [
        {
          id: 'browser-privacy',
          title: "Why Browser-Only Tools Are the Future of Web Utility Apps",
          excerpt: "In an era of rising security concerns, running calculations, converting PDFs, and editing photos locally protects user data from server hazards.",
          author: "Quantum Engineering Team",
          date: "May 18, 2026",
          readTime: "4 min read",
          category: "Privacy & Security",
          imageGlow: 'rgba(0, 242, 254, 0.1)',
          content: [
            "In the early days of the web, performing complex file manipulations—like resizing high-resolution images or compiling documents—required powerful servers. Files were uploaded, processed remotely, and then sent back. While this worked, it introduced two major pain points: server network latency and privacy vulnerabilities.",
            "Today, modern web browser standards have changed the game. Technologies like WebAssembly, HTML5 Canvas, and File System APIs allow modern browsers to execute high-performance desktop-grade code directly on the user's CPU.",
            "By keeping operations 100% client-side, utility applications ensure that private photos and intellectual document drafts never touch a server database. There are no data leaks, no server costs to pass down as paywalls, and execution is sub-second, running completely offline.",
            "At Quantum Qbit, our entire architectural design centers on local-first processing. When you convert images to PDF or apply canvas color filters in our Image Studio, all computations happen inside your browser memory cache. It is safe, clean, and instant."
          ]
        },
        {
          id: 'base-math',
          title: "The Logic Behind Real-Time Cross-Input Number Base Conversions",
          excerpt: "Understanding how computers translate binary, octal, decimal, and hexadecimal representations under the hood to optimize data structures.",
          author: "Dr. Clara Chen",
          date: "May 10, 2026",
          readTime: "5 min read",
          category: "Computer Science",
          imageGlow: 'rgba(157, 78, 221, 0.1)',
          content: [
            "To humans, numbers are decimal (base 10). To transistors, numbers are binary (base 2). To developers analyzing memory offsets or color palettes, numbers are hexadecimal (base 16). How do we bridge these bases without cognitive friction?",
            "A base converter relies on positional notation. Each digit in a number represents a coefficient multiplied by the base raised to the power of its position index. For example, the binary sequence 1011 equates to (1 × 2³) + (0 × 2²) + (1 × 2¹) + (1 × 2⁰) = 11 in decimal.",
            "Cross-input real-time conversion requires a reactive state tree. By standardizing any input base to a common central format (typically a standard base-10 JavaScript floating-point integer), we can instantly derive and output the other bases using native conversion algorithms.",
            "For example, JavaScript's Number.toString(base) simplifies base translation in our Math Workbench. Typing in any text box updates the central decimal state, which immediately re-renders the remaining inputs, making base translation effortless and educational."
          ]
        },
        {
          id: 'image-optimization',
          title: "Image Formats Decoded: Choosing Between JPG, PNG, and WEBP",
          excerpt: "A deep dive into compression algorithms and when to use each format to achieve visual clarity while keeping load times minimal.",
          author: "Marcus Vance",
          date: "May 02, 2026",
          readTime: "3 min read",
          category: "Creative Tech",
          imageGlow: 'rgba(0, 242, 254, 0.1)',
          content: [
            "Web optimization depends heavily on visual assets. An unoptimized image can slow a web page to a crawl, harming SEO rankings and driving visitors away. Choosing the correct file format is the first line of defense.",
            "JPEG (Joint Photographic Experts Group) uses lossy compression. It discards minor color data to compress natural scenery and photography into small file sizes, though it lacks transparency support.",
            "PNG (Portable Network Graphics) uses lossless compression. It preserves every single pixel, making it ideal for logos, screenshots, and graphics requiring transparent backgrounds (alpha channel), albeit at the cost of larger file sizes.",
            "WEBP, developed by Google, represents the modern standard. It provides both lossy and lossless compression, rendering files up to 30% smaller than JPEGs and PNGs while retaining comparable quality and alpha transparency. When using Quantum Qbit's Image Studio, saving as PNG is excellent for details, while converting to WEBP ensures your web app runs blazing fast."
          ]
        }
      ];
      localStorage.setItem('quantum_blogs', JSON.stringify(defaultPosts));
      setPosts(defaultPosts);
    }
    setIsLoading(false);
  };

  // Submit passcode
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!passcode) {
      setAuthError('Please enter a passcode.');
      return;
    }

    if (isLocalMode) {
      // Local development login logic
      const savedPass = localStorage.getItem('admin_local_passcode') || 'quantumqbit2026';
      if (passcode === savedPass) {
        setIsLoggedIn(true);
        sessionStorage.setItem('admin_local_auth', 'true');
        fetchLocalBlogs();
      } else {
        setAuthError('Invalid passcode in local fallback mode.');
      }
    } else {
      // PHP server login logic
      try {
        const response = await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', passcode })
        });
        
        if (response.ok) {
          setIsLoggedIn(true);
          fetchBlogs();
        } else {
          const data = await response.json();
          setAuthError(data.error || 'Invalid passcode.');
        }
      } catch (err) {
        // Fall back to local mode automatically if api behaves unexpectedly
        console.warn('API error, falling back to local simulation:', err);
        setIsLocalMode(true);
        const savedPass = localStorage.getItem('admin_local_passcode') || 'quantumqbit2026';
        if (passcode === savedPass) {
          setIsLoggedIn(true);
          sessionStorage.setItem('admin_local_auth', 'true');
          fetchLocalBlogs();
        } else {
          setAuthError('Invalid passcode (Connection failed & fallback evaluated).');
        }
      }
    }
  };

  // Logout
  const handleLogout = async () => {
    if (isLocalMode) {
      sessionStorage.removeItem('admin_local_auth');
      setIsLoggedIn(false);
    } else {
      try {
        await fetch('/api/auth.php?action=logout');
      } catch (e) {
        console.error(e);
      } finally {
        sessionStorage.removeItem('admin_local_auth');
        setIsLoggedIn(false);
      }
    }
  };

  // Change passcode
  const handleChangePasscode = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSuccess('');
    setSettingsError('');

    if (!newPass || !confirmPass) {
      setSettingsError('Please fill in all passcode fields.');
      return;
    }

    if (newPass !== confirmPass) {
      setSettingsError('New passcode and confirmation do not match.');
      return;
    }

    if (newPass.length < 6) {
      setSettingsError('New passcode must be at least 6 characters long.');
      return;
    }

    if (isLocalMode) {
      // Check current local pass
      const savedPass = localStorage.getItem('admin_local_passcode') || 'quantumqbit2026';
      if (currentPass !== savedPass) {
        setSettingsError('Current passcode is incorrect.');
        return;
      }
      localStorage.setItem('admin_local_passcode', newPass);
      setSettingsSuccess('Passcode successfully changed locally.');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      try {
        const response = await fetch('/api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'change_passcode',
            current_passcode: currentPass, 
            new_passcode: newPass 
          })
        });
        
        if (response.ok) {
          setSettingsSuccess('Passcode successfully changed.');
          setCurrentPass('');
          setNewPass('');
          setConfirmPass('');
        } else {
          const data = await response.json();
          setSettingsError(data.error || 'Failed to change passcode.');
        }
      } catch (err) {
        setSettingsError('Network error connecting to API.');
      }
    }
  };

  // Blog management actions
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;
    
    if (isLocalMode) {
      const updated = posts.filter(p => p.id !== id);
      localStorage.setItem('quantum_blogs', JSON.stringify(updated));
      setPosts(updated);
    } else {
      try {
        const response = await fetch(`/api/blogs.php?id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchBlogs();
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to delete post.');
        }
      } catch (e) {
        alert('Network error. Deletion failed.');
      }
    }
  };

  // Open Form for editing / creating
  const openEditor = (post: BlogPost | null = null) => {
    setEditorError('');
    if (post) {
      setEditingPostId(post.id);
      setPostForm({
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        category: post.category,
        imageGlow: post.imageGlow,
        content: [...post.content]
      });
      setIsEditing(true);
    } else {
      setEditingPostId(null);
      setPostForm({
        title: '',
        excerpt: '',
        author: 'Quantum Engineering Team',
        category: 'Privacy & Security',
        imageGlow: 'rgba(0, 242, 254, 0.1)',
        content: ['']
      });
      setIsEditing(true);
    }
  };

  const handleParagraphChange = (index: number, val: string) => {
    const updated = [...postForm.content];
    updated[index] = val;
    setPostForm({ ...postForm, content: updated });
  };

  const addParagraph = () => {
    setPostForm({ ...postForm, content: [...postForm.content, ''] });
  };

  const removeParagraph = (index: number) => {
    if (postForm.content.length <= 1) return;
    const updated = postForm.content.filter((_, idx) => idx !== index);
    setPostForm({ ...postForm, content: updated });
  };

  // Submit Blog Post Add/Edit
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError('');
    
    // Validation
    if (!postForm.title.trim()) return setEditorError('Title is required.');
    if (!postForm.excerpt.trim()) return setEditorError('Excerpt is required.');
    if (!postForm.author.trim()) return setEditorError('Author is required.');
    
    const filteredContent = postForm.content.map(p => p.trim()).filter(Boolean);
    if (filteredContent.length === 0) {
      return setEditorError('Please provide at least one text paragraph.');
    }

    setIsSaving(true);
    
    if (isLocalMode) {
      // Local state modification
      const wordCount = filteredContent.join(' ').split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200) + ' min read';
      const cleanSlug = postForm.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
      
      let updatedPosts = [...posts];
      
      if (editingPostId) {
        // Edit mode
        updatedPosts = updatedPosts.map(p => {
          if (p.id === editingPostId) {
            return {
              ...p,
              title: postForm.title.trim(),
              excerpt: postForm.excerpt.trim(),
              author: postForm.author.trim(),
              category: postForm.category,
              imageGlow: postForm.imageGlow,
              content: filteredContent,
              readTime
            };
          }
          return p;
        });
      } else {
        // Create mode
        let finalId = cleanSlug;
        let counter = 1;
        while (updatedPosts.some(p => p.id === finalId)) {
          finalId = `${cleanSlug}-${counter}`;
          counter++;
        }
        
        const newPost: BlogPost = {
          id: finalId,
          title: postForm.title.trim(),
          excerpt: postForm.excerpt.trim(),
          author: postForm.author.trim(),
          category: postForm.category,
          imageGlow: postForm.imageGlow,
          content: filteredContent,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          readTime
        };
        updatedPosts.unshift(newPost);
      }
      
      localStorage.setItem('quantum_blogs', JSON.stringify(updatedPosts));
      setPosts(updatedPosts);
      setIsSaving(false);
      setIsEditing(false);
    } else {
      // PHP backend modification
      try {
        const url = '/api/blogs.php';
        const method = editingPostId ? 'PUT' : 'POST';
        const bodyData = editingPostId 
          ? { id: editingPostId, ...postForm, content: filteredContent }
          : { ...postForm, content: filteredContent };
          
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
        
        if (response.ok) {
          setIsEditing(false);
          fetchBlogs();
        } else {
          const data = await response.json();
          setEditorError(data.error || 'Failed to save blog post.');
        }
      } catch (err) {
        setEditorError('Network error while saving post.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  // RENDER LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginGlow}></div>
        <div className="glass-card" style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <Key size={30} style={styles.loginIcon} />
            <h1 style={styles.loginTitle}>Admin Portal</h1>
            <p style={styles.loginSubtitle}>
              Quantum Qbit Dashboard Authenticator.
            </p>
          </div>

          {authError && (
            <div style={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={styles.loginForm}>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label" htmlFor="passcode-input">Enter Passcode</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  id="passcode-input"
                  type={showPasscode ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '44px' }}
                  placeholder="Enter administrator passcode"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  style={styles.eyeBtn}
                  aria-label="Toggle passcode visibility"
                >
                  {showPasscode ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p style={styles.hintText}>
                {isLocalMode 
                  ? 'Dev Fallback: Passcode simulated in LocalStorage.' 
                  : 'Passcode is securely checked on Hostinger server.'
                }
              </p>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
              Authenticate Portal
            </button>
          </form>

          <button onClick={() => setCurrentPage('landing')} style={styles.cancelBtn}>
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  // RENDER MAIN DASHBOARD
  return (
    <div style={styles.adminPage}>
      <div className="container">
        {/* Top Navbar */}
        <div style={styles.topHeader}>
          <div>
            <span style={styles.modeBadge}>
              {isLocalMode ? 'Local Dev Simulation Mode' : 'Connected to Hostinger PHP Server'}
            </span>
            <h1 style={styles.title}>Admin Panel</h1>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Log Out <LogOut size={16} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={styles.tabContainer}>
          <button 
            onClick={() => setActiveTab('posts')}
            style={{ ...styles.tabItem, ...(activeTab === 'posts' ? styles.activeTab : {}) }}
          >
            <FileText size={16} /> Manage Blogs
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            style={{ ...styles.tabItem, ...(activeTab === 'settings' ? styles.activeTab : {}) }}
          >
            <Settings size={16} /> Admin Settings
          </button>
        </div>

        {/* TAB 1: MANAGE POSTS */}
        {activeTab === 'posts' && (
          <div style={styles.tabContent}>
            {!isEditing ? (
              <>
                <div style={styles.actionRow}>
                  <h2 style={styles.sectionHeader}>Blog Articles ({posts.length})</h2>
                  <button className="btn-primary" onClick={() => openEditor(null)}>
                    <Plus size={16} /> Create Blog Post
                  </button>
                </div>

                {isLoading ? (
                  <div style={styles.loadingState}>Loading articles database...</div>
                ) : posts.length === 0 ? (
                  <div className="glass-card" style={styles.emptyCard}>
                    <p style={{ color: 'var(--text-secondary)' }}>No articles found in database. Seed blogs initialized on client side.</p>
                  </div>
                ) : (
                  <div style={styles.postsList}>
                    {posts.map((post) => (
                      <div key={post.id} className="glass-card" style={styles.postRow}>
                        <div style={styles.postMeta}>
                          <span style={{ ...styles.categoryBadge, color: 'var(--primary)', borderColor: 'rgba(0, 242, 254, 0.15)' }}>
                            {post.category}
                          </span>
                          <h3 style={styles.postRowTitle}>{post.title}</h3>
                          <p style={styles.postRowExcerpt}>{post.excerpt}</p>
                          <div style={styles.postSubInfo}>
                            <span>By <strong>{post.author}</strong></span>
                            <span>•</span>
                            <span>{post.date}</span>
                            <span>•</span>
                            <span style={{ color: 'var(--primary)' }}>{post.readTime}</span>
                          </div>
                        </div>
                        <div style={styles.rowActions}>
                          <button 
                            style={styles.editBtn} 
                            onClick={() => openEditor(post)}
                            title="Edit Blog"
                          >
                            <Edit size={16} /> Edit
                          </button>
                          <button 
                            style={styles.deleteBtn} 
                            onClick={() => handleDeletePost(post.id)}
                            title="Delete Blog"
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* EDITOR FORM */
              <div className="glass-card" style={styles.editorCard}>
                <div style={styles.editorHeader}>
                  <h2 style={styles.editorTitle}>
                    {editingPostId ? 'Edit Article' : 'Create New Article'}
                  </h2>
                  <button style={styles.closeBtn} onClick={() => setIsEditing(false)}>
                    <X size={20} />
                  </button>
                </div>

                {editorError && (
                  <div style={styles.errorAlert}>
                    <AlertCircle size={16} />
                    <span>{editorError}</span>
                  </div>
                )}

                <form onSubmit={handleSavePost} style={styles.editorForm}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="blog-title">Article Title</label>
                    <input
                      id="blog-title"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Navigating Privacy Laws in client side web applications"
                      value={postForm.title}
                      onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="blog-category">Category</label>
                      <select
                        id="blog-category"
                        value={postForm.category}
                        onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                      >
                        <option value="Privacy & Security">Privacy & Security</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Creative Tech">Creative Tech</option>
                        <option value="General Utilities">General Utilities</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="blog-glow">Aesthetic Accent Glow</label>
                      <select
                        id="blog-glow"
                        value={postForm.imageGlow}
                        onChange={(e) => setPostForm({ ...postForm, imageGlow: e.target.value })}
                      >
                        <option value="rgba(0, 242, 254, 0.1)">Cyan Accent (Privacy/Core)</option>
                        <option value="rgba(157, 78, 221, 0.1)">Purple Accent (Math/Logic)</option>
                        <option value="rgba(255, 0, 127, 0.1)">Magenta Accent (Visuals/Creative)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="blog-author">Author Name</label>
                    <input
                      id="blog-author"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Marcus Vance"
                      value={postForm.author}
                      onChange={(e) => setPostForm({ ...postForm, author: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="blog-excerpt">Brief Excerpt</label>
                    <textarea
                      id="blog-excerpt"
                      className="form-textarea"
                      placeholder="A short 1-2 sentence description summarizing the article for the grid view feed..."
                      value={postForm.excerpt}
                      onChange={(e) => setPostForm({ ...postForm, excerpt: e.target.value })}
                      required
                    />
                  </div>

                  <div style={styles.paragraphHeaderRow}>
                    <label className="form-label">Article Text Content (Paragraphs)</label>
                    <button type="button" style={styles.addParaBtn} onClick={addParagraph}>
                      <Plus size={13} /> Add Paragraph
                    </button>
                  </div>

                  <div style={styles.paragraphsList}>
                    {postForm.content.map((para, idx) => (
                      <div key={idx} style={styles.paraWrapper}>
                        <div style={styles.paraIndex}>P{idx + 1}</div>
                        <textarea
                          className="form-textarea"
                          style={{ flex: 1, minHeight: '80px' }}
                          placeholder={`Write paragraph ${idx + 1} details here...`}
                          value={para}
                          onChange={(e) => handleParagraphChange(idx, e.target.value)}
                        />
                        <button
                          type="button"
                          style={styles.deleteParaBtn}
                          disabled={postForm.content.length <= 1}
                          onClick={() => removeParagraph(idx)}
                          title="Remove paragraph"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={styles.editorActions}>
                    <button type="button" style={styles.cancelFormBtn} onClick={() => setIsEditing(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary" disabled={isSaving}>
                      {isSaving ? 'Saving...' : <><Save size={16} /> Save Blog Post</>}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SETTINGS (PASSCODE CHANGE) */}
        {activeTab === 'settings' && (
          <div style={styles.tabContent}>
            <div className="glass-card" style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>
                <Key size={20} style={{ color: 'var(--primary)' }} /> Update Access Passcode
              </h2>
              <p style={styles.settingsDesc}>
                Change the passcode used to log into this administrative panel.
              </p>

              {settingsSuccess && (
                <div style={styles.successAlert}>
                  <Check size={16} />
                  <span>{settingsSuccess}</span>
                </div>
              )}

              {settingsError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{settingsError}</span>
                </div>
              )}

              <form onSubmit={handleChangePasscode} style={styles.settingsForm}>
                <div className="form-group">
                  <label className="form-label" htmlFor="current-passcode-input">Current Passcode</label>
                  <input
                    id="current-passcode-input"
                    type="password"
                    className="form-input"
                    placeholder="Enter current passcode"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="new-passcode-input">New Passcode</label>
                  <input
                    id="new-passcode-input"
                    type="password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-passcode-input">Confirm New Passcode</label>
                  <input
                    id="confirm-passcode-input"
                    type="password"
                    className="form-input"
                    placeholder="Verify new passcode"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }}>
                  Update Passcode
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  loginContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'calc(100vh - 170px)',
    padding: '40px 24px',
    position: 'relative' as const,
  },
  loginGlow: {
    position: 'absolute' as const,
    width: '320px',
    height: '320px',
    background: 'radial-gradient(circle, rgba(0, 242, 254, 0.06) 0%, transparent 70%)',
    zIndex: -1,
  },
  loginCard: {
    maxWidth: '420px',
    width: '100%',
    padding: '36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  loginHeader: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'center',
  },
  loginIcon: {
    color: 'var(--primary)',
    filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))',
  },
  loginTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
  },
  loginSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: '1.4',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
  },
  hintText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    alignSelf: 'center',
    fontFamily: 'var(--font-heading)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    color: '#ef4444',
    padding: '12px 16px',
    fontSize: '0.88rem',
  },
  successAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '8px',
    color: '#10b981',
    padding: '12px 16px',
    fontSize: '0.88rem',
    marginBottom: '16px',
  },
  adminPage: {
    padding: '50px 0 100px 0',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
    marginBottom: '40px',
  },
  modeBadge: {
    fontSize: '0.75rem',
    background: 'rgba(0, 242, 254, 0.06)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    padding: '4px 10px',
    borderRadius: '100px',
    color: 'var(--primary)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '2.2rem',
    fontWeight: 700,
    marginTop: '6px',
  },
  logoutBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(239, 68, 68, 0.05)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '8px',
    color: '#ef4444',
    padding: '10px 18px',
    fontFamily: 'var(--font-heading)',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid var(--border-glass)',
    marginBottom: '32px',
    gap: '8px',
  },
  tabItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '1rem',
    fontWeight: 600,
    padding: '12px 20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '2px solid transparent',
    transition: 'var(--transition-fast)',
  },
  activeTab: {
    color: 'var(--primary)',
    borderBottomColor: 'var(--primary)',
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionHeader: {
    fontSize: '1.4rem',
    fontWeight: 600,
  },
  loadingState: {
    textAlign: 'center' as const,
    padding: '60px 0',
    color: 'var(--text-secondary)',
    fontSize: '1rem',
  },
  emptyCard: {
    padding: '60px',
    textAlign: 'center' as const,
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  postRow: {
    padding: '24px 30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  postMeta: {
    flex: 1,
    minWidth: '280px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  categoryBadge: {
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    alignSelf: 'flex-start',
    border: '1px solid',
    borderRadius: '4px',
    padding: '2px 8px',
  },
  postRowTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  postRowExcerpt: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  postSubInfo: {
    display: 'flex',
    gap: '10px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    alignItems: 'center',
  },
  rowActions: {
    display: 'flex',
    gap: '10px',
  },
  editBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0, 242, 254, 0.03)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    borderRadius: '6px',
    color: 'var(--primary)',
    padding: '8px 14px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  deleteBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(239, 68, 68, 0.03)',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    borderRadius: '6px',
    color: '#ef4444',
    padding: '8px 14px',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  editorCard: {
    padding: '36px',
  },
  editorHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '18px',
    marginBottom: '24px',
  },
  editorTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
  },
  editorForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap' as const,
  },
  paragraphHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '10px',
  },
  addParaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0, 242, 254, 0.06)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    color: 'var(--primary)',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
  },
  paragraphsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  paraWrapper: {
    display: 'flex',
    gap: '14px',
    alignItems: 'flex-start',
  },
  paraIndex: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    background: 'var(--border-glass)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginTop: '6px',
  },
  deleteParaBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '6px',
    border: '1px solid rgba(239, 68, 68, 0.15)',
    background: 'rgba(239, 68, 68, 0.03)',
    color: '#ef4444',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginTop: '6px',
  },
  editorActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '16px',
    marginTop: '20px',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '24px',
  },
  cancelFormBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '10px 20px',
    fontFamily: 'var(--font-heading)',
  },
  settingsCard: {
    padding: '36px',
    maxWidth: '540px',
  },
  settingsTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  settingsDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: '1.5',
    marginBottom: '24px',
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
};

export default Admin;
