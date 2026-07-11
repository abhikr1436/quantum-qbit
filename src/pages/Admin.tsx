import React, { useState, useEffect } from 'react';
import { 
  Key, LogOut, FileText, Settings, Plus, Edit, Trash2, 
  Check, AlertCircle, Trash, Eye, EyeOff, Save, X, Tag, Database, Award
} from 'lucide-react';
import { AiOfficeTab } from '../components/ai-office/AiOfficeTab';

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

interface MockTestAttempt {
  id?: number;
  session_id: string;
  candidate_name: string;
  roll_number: string;
  test_name: string;
  start_time: string;
  submitted: boolean | number;
  marks: number | null;
  total_marks: number | null;
  time_spent: string | null;
  submitted_at: string | null;
}

interface AdminProps {
  setCurrentPage: (page: string) => void;
}

const defaultBlogTemplate = {
  title: '',
  excerpt: '',
  author: 'Quantum Engineering Team',
  category_id: 'privacy-security',
  imageGlow: 'rgba(0, 242, 254, 0.1)',
  content: ''
};

export const Admin: React.FC<AdminProps> = ({ setCurrentPage }) => {
  // Navigation & Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [passcode, setPasscode] = useState<string>('');
  const [showPasscode, setShowPasscode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [isLocalMode, setIsLocalMode] = useState<boolean>(false); // Fallback for local Vite dev server
  
  // Dashboard Tabs
  const [activeTab, setActiveTab] = useState<'posts' | 'categories' | 'settings' | 'office' | 'mock_tests' | 'app_ads'>('posts');

  // app-ads.txt state
  const [adsContent, setAdsContent] = useState<string>('');
  const [isAdsLoading, setIsAdsLoading] = useState<boolean>(false);
  const [adsError, setAdsError] = useState<string>('');
  const [adsSuccess, setAdsSuccess] = useState<string>('');
  const [isSavingAds, setIsSavingAds] = useState<boolean>(false);
  const [newAdLine, setNewAdLine] = useState({
    domain: 'google.com',
    pubId: 'pub-',
    relationship: 'DIRECT' as 'DIRECT' | 'RESELLER',
    certId: 'f08c47fec0942fa0'
  });
  
  // Blogs state
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Categories state
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [categoryError, setCategoryError] = useState<string>('');
  const [categorySuccess, setCategorySuccess] = useState<string>('');
  const [isSavingCategory, setIsSavingCategory] = useState<boolean>(false);
  
  // Database status state
  const [dbStatus, setDbStatus] = useState<{
    status: 'connected' | 'error' | 'fallback';
    message?: string;
    host?: string;
    dbname?: string;
    user?: string;
  } | null>(null);
  
  // Database settings inputs
  const [dbHost, setDbHost] = useState<string>('');
  const [dbName, setDbName] = useState<string>('');
  const [dbUser, setDbUser] = useState<string>('');
  const [dbPass, setDbPass] = useState<string>('');
  const [dbSaveSuccess, setDbSaveSuccess] = useState<string>('');
  const [dbSaveError, setDbSaveError] = useState<string>('');
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);
  
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

  // Mock test tracking state
  const [attempts, setAttempts] = useState<MockTestAttempt[]>([]);
  const [isAttemptsLoading, setIsAttemptsLoading] = useState<boolean>(false);
  const [attemptsError, setAttemptsError] = useState<string>('');
  const [attemptsSuccess, setAttemptsSuccess] = useState<string>('');



  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth.php?action=status');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          if (data.db) {
            setDbStatus(data.db);
            setDbHost(data.db.host || '');
            setDbName(data.db.dbname || '');
            setDbUser(data.db.user || '');
          }
          fetchBlogs();
        } else {
          setIsLoggedIn(false);
          setIsLoading(false);
        }
      } else {
        // Not running on PHP server (e.g. local Vite dev server)
        checkLocalSession();
      }
    } catch {
      checkLocalSession();
    }
  };

  const checkLocalSession = () => {
    const isAuth = sessionStorage.getItem('admin_local_auth') === 'true';
    setIsLocalMode(true);
    // Load local DB connection mock settings
    const savedHost = localStorage.getItem('admin_local_db_host') || 'localhost';
    const savedName = localStorage.getItem('admin_local_db_name') || 'quantum_db';
    const savedUser = localStorage.getItem('admin_local_db_user') || 'root';
    setDbHost(savedHost);
    setDbName(savedName);
    setDbUser(savedUser);
    setDbStatus({
      status: 'connected',
      host: savedHost,
      dbname: savedName,
      user: savedUser
    });
    
    if (isAuth) {
      setIsLoggedIn(true);
      fetchLocalBlogs();
    } else {
      setIsLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories.php');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        fetchLocalCategories();
      }
    } catch {
      fetchLocalCategories();
    }
  };

  const fetchLocalCategories = () => {
    const local = localStorage.getItem('quantum_categories');
    if (local) {
      setCategories(JSON.parse(local));
    } else {
      const defaultCats = [
        { id: 'privacy-security', name: 'Privacy & Security' },
        { id: 'computer-science', name: 'Computer Science' },
        { id: 'creative-tech', name: 'Creative Tech' },
        { id: 'general-utilities', name: 'General Utilities' }
      ];
      localStorage.setItem('quantum_categories', JSON.stringify(defaultCats));
      setCategories(defaultCats);
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
    } catch {
      fetchLocalBlogs();
    } finally {
      setIsLoading(false);
    }
  };

  // Check login status and categories on load
  useEffect(() => {
    Promise.resolve().then(() => {
      checkLoginStatus();
      fetchCategories();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      } catch {
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
      } catch {
        setSettingsError('Network error connecting to API.');
      }
    }
  };

  // Mock test attempts actions
  const fetchAttempts = async () => {
    setIsAttemptsLoading(true);
    setAttemptsError('');
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_mock_attempts');
      if (local) {
        setAttempts(JSON.parse(local));
      } else {
        setAttempts([]);
      }
      setIsAttemptsLoading(false);
    } else {
      try {
        const response = await fetch('/api/mock_test_tracker.php?action=list');
        if (response.ok) {
          const data = await response.json();
          setAttempts(data);
        } else {
          // Fallback to local storage
          const local = localStorage.getItem('quantum_mock_attempts');
          setAttempts(local ? JSON.parse(local) : []);
        }
      } catch (err) {
        console.warn('API error fetching attempts, falling back:', err);
        const local = localStorage.getItem('quantum_mock_attempts');
        setAttempts(local ? JSON.parse(local) : []);
      } finally {
        setIsAttemptsLoading(false);
      }
    }
  };

  const handleDeleteAttempt = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to delete this attempt record?')) return;
    setAttemptsError('');
    setAttemptsSuccess('');
    
    if (isLocalMode) {
      const updated = attempts.filter(a => a.session_id !== sessionId);
      localStorage.setItem('quantum_mock_attempts', JSON.stringify(updated));
      setAttempts(updated);
      setAttemptsSuccess('Attempt record deleted locally.');
    } else {
      try {
        const response = await fetch(`/api/mock_test_tracker.php?action=delete&session_id=${encodeURIComponent(sessionId)}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setAttemptsSuccess('Attempt record deleted successfully.');
          fetchAttempts();
        } else {
          const data = await response.json();
          setAttemptsError(data.error || 'Failed to delete attempt record.');
        }
      } catch {
        setAttemptsError('Network error. Deletion failed.');
      }
    }
  };

  const handleClearAllAttempts = async () => {
    if (!window.confirm('WARNING: Are you sure you want to delete ALL mock test attempt records? This action cannot be undone.')) return;
    setAttemptsError('');
    setAttemptsSuccess('');
    
    if (isLocalMode) {
      localStorage.setItem('quantum_mock_attempts', JSON.stringify([]));
      setAttempts([]);
      setAttemptsSuccess('All attempt records cleared locally.');
    } else {
      try {
        const response = await fetch('/api/mock_test_tracker.php?action=clear_all');
        if (response.ok) {
          setAttemptsSuccess('All attempt records cleared successfully.');
          fetchAttempts();
        } else {
          const data = await response.json();
          setAttemptsError(data.error || 'Failed to clear attempts.');
        }
      } catch {
        setAttemptsError('Network error. Failed to clear attempts.');
      }
    }
  };

  const fetchAdsContent = async () => {
    setIsAdsLoading(true);
    setAdsError('');
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_app_ads') || 'google.com, pub-3643379306547907, DIRECT, f08c47fec0942fa0';
      setAdsContent(local);
      setIsAdsLoading(false);
    } else {
      try {
        const response = await fetch('/api/ads.php');
        if (response.ok) {
          const data = await response.json();
          setAdsContent(data.content || '');
        } else {
          const local = localStorage.getItem('quantum_app_ads') || 'google.com, pub-3643379306547907, DIRECT, f08c47fec0942fa0';
          setAdsContent(local);
        }
      } catch (err) {
        console.warn('API error fetching app-ads, falling back:', err);
        const local = localStorage.getItem('quantum_app_ads') || 'google.com, pub-3643379306547907, DIRECT, f08c47fec0942fa0';
        setAdsContent(local);
      } finally {
        setIsAdsLoading(false);
      }
    }
  };

  const handleSaveAds = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdsError('');
    setAdsSuccess('');
    setIsSavingAds(true);

    if (isLocalMode) {
      localStorage.setItem('quantum_app_ads', adsContent);
      setAdsSuccess('app-ads.txt saved locally in simulated dev environment.');
      setIsSavingAds(false);
    } else {
      try {
        const response = await fetch('/api/ads.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: adsContent })
        });
        if (response.ok) {
          setAdsSuccess('app-ads.txt updated successfully on Hostinger server.');
          localStorage.setItem('quantum_app_ads', adsContent);
        } else {
          const data = await response.json();
          setAdsError(data.error || 'Failed to save app-ads.txt.');
        }
      } catch {
        setAdsError('Network error. Failed to save app-ads.txt.');
      } finally {
        setIsSavingAds(false);
      }
    }
  };

  // Fetch attempts or app-ads on tab change
  useEffect(() => {
    if (isLoggedIn) {
      if (activeTab === 'mock_tests') {
        Promise.resolve().then(() => {
          fetchAttempts();
        });
      } else if (activeTab === 'app_ads') {
        Promise.resolve().then(() => {
          fetchAdsContent();
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab]);

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
      } catch {
        alert('Network error. Deletion failed.');
      }
    }
  };

  // Open Form for editing / creating
  const openEditor = (post: BlogPost | null = null) => {
    setEditorError('');
    if (post) {
      setEditingPostId(post.id);
      let contentStr: string;
      if (Array.isArray(post.content)) {
        contentStr = post.content.map(para => `<p>${para}</p>`).join('\n');
      } else {
        contentStr = post.content || '';
      }
      setPostForm({
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        category_id: post.category_id || (post.category ? post.category.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-') : 'privacy-security'),
        imageGlow: post.imageGlow,
        content: contentStr
      });
      setIsEditing(true);
    } else {
      setEditingPostId(null);
      setPostForm({
        title: '',
        excerpt: '',
        author: 'Quantum Engineering Team',
        category_id: categories.length > 0 ? categories[0].id : 'privacy-security',
        imageGlow: 'rgba(0, 242, 254, 0.1)',
        content: ''
      });
      setIsEditing(true);
    }
  };

  // Submit Blog Post Add/Edit
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditorError('');
    
    // Validation
    if (!postForm.title.trim()) return setEditorError('Title is required.');
    if (!postForm.excerpt.trim()) return setEditorError('Excerpt is required.');
    if (!postForm.author.trim()) return setEditorError('Author is required.');
    
    let finalContent = postForm.content.trim();
    if (!finalContent) {
      return setEditorError('Article content is required.');
    }
    
    // Auto wrap plain text in paragraph tags if no HTML tag is present
    if (!/<[a-z][\s\S]*>/i.test(finalContent)) {
      finalContent = finalContent
        .split('\n')
        .filter(line => line.trim())
        .map(line => `<p>${line.trim()}</p>`)
        .join('\n');
    }

    setIsSaving(true);
    
    if (isLocalMode) {
      // Local state modification
      const cleanText = finalContent.replace(/<[^>]*>/g, ' ');
      const wordCount = cleanText.trim().split(/\s+/).filter(Boolean).length;
      const readTime = Math.ceil(wordCount / 200) + ' min read';
      const cleanSlug = postForm.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
      
      let updatedPosts = [...posts];
      const catName = categories.find(c => c.id === postForm.category_id)?.name || 'Privacy & Security';
      
      if (editingPostId) {
        // Edit mode
        updatedPosts = updatedPosts.map(p => {
          if (p.id === editingPostId) {
            return {
              ...p,
              title: postForm.title.trim(),
              excerpt: postForm.excerpt.trim(),
              author: postForm.author.trim(),
              category: catName,
              category_id: postForm.category_id,
              imageGlow: postForm.imageGlow,
              content: finalContent,
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
          category: catName,
          category_id: postForm.category_id,
          imageGlow: postForm.imageGlow,
          content: finalContent,
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
          ? { id: editingPostId, title: postForm.title.trim(), excerpt: postForm.excerpt.trim(), author: postForm.author.trim(), category_id: postForm.category_id, imageGlow: postForm.imageGlow, content: finalContent }
          : { title: postForm.title.trim(), excerpt: postForm.excerpt.trim(), author: postForm.author.trim(), category_id: postForm.category_id, imageGlow: postForm.imageGlow, content: finalContent };
          
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
      } catch {
        setEditorError('Network error while saving post.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError('');
    setCategorySuccess('');
    
    if (!newCategoryName.trim()) {
      setCategoryError('Category name cannot be empty.');
      return;
    }
    
    setIsSavingCategory(true);
    
    if (isLocalMode) {
      const id = newCategoryName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
      if (categories.some(c => c.id === id)) {
        setCategoryError('Category already exists.');
        setIsSavingCategory(false);
        return;
      }
      const newCat = { id, name: newCategoryName.trim() };
      const updated = [...categories, newCat];
      localStorage.setItem('quantum_categories', JSON.stringify(updated));
      setCategories(updated);
      setCategorySuccess('Category added successfully locally.');
      setNewCategoryName('');
      setIsSavingCategory(false);
    } else {
      try {
        const response = await fetch('/api/categories.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCategoryName.trim() })
        });
        
        if (response.ok) {
          setCategorySuccess('Category added successfully.');
          setNewCategoryName('');
          fetchCategories();
        } else {
          const data = await response.json();
          setCategoryError(data.error || 'Failed to add category.');
        }
      } catch {
        setCategoryError('Network error adding category.');
      } finally {
        setIsSavingCategory(false);
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This will delete all blogs in this category.')) return;
    
    setCategoryError('');
    setCategorySuccess('');
    
    if (isLocalMode) {
      const updated = categories.filter(c => c.id !== id);
      localStorage.setItem('quantum_categories', JSON.stringify(updated));
      setCategories(updated);
      
      // Also delete blogs in this category
      const localBlogs = localStorage.getItem('quantum_blogs');
      if (localBlogs) {
        const parsedBlogs: BlogPost[] = JSON.parse(localBlogs);
        const updatedBlogs = parsedBlogs.filter(p => p.category_id !== id && p.category?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-') !== id);
        localStorage.setItem('quantum_blogs', JSON.stringify(updatedBlogs));
        setPosts(updatedBlogs);
      }
      
      setCategorySuccess('Category and its articles deleted locally.');
    } else {
      try {
        const response = await fetch(`/api/categories.php?id=${encodeURIComponent(id)}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setCategorySuccess('Category deleted successfully.');
          fetchCategories();
          fetchBlogs();
        } else {
          const data = await response.json();
          setCategoryError(data.error || 'Failed to delete category.');
        }
      } catch {
        setCategoryError('Network error deleting category.');
      }
    }
  };

  const handleSaveDbConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setDbSaveSuccess('');
    setDbSaveError('');
    
    if (isLocalMode) {
      setDbSaveError('Cannot save configuration in local dev simulation mode.');
      return;
    }
    
    setIsTestingDb(true);
    try {
      const response = await fetch('/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_db_config',
          db_host: dbHost,
          db_name: dbName,
          db_user: dbUser,
          db_pass: dbPass
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDbSaveSuccess(data.message || 'Database settings updated successfully.');
          setDbStatus(data.db);
          setDbPass('');
          fetchBlogs();
          fetchCategories();
        } else {
          setDbSaveError(data.error || 'Failed to connect with these database settings.');
          if (data.db) setDbStatus(data.db);
        }
      } else {
        const data = await response.json();
        setDbSaveError(data.error || 'Server error saving configuration.');
      }
    } catch {
      setDbSaveError('Network error while saving configuration.');
    } finally {
      setIsTestingDb(false);
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

  const getCategoryName = (post: BlogPost) => {
    if (post.category) return post.category;
    if (post.category_id) {
      const found = categories.find(c => c.id === post.category_id);
      if (found) return found.name;
    }
    return 'General';
  };

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
        <div className="admin-tabs-container">
          <button 
            onClick={() => setActiveTab('posts')}
            className={`admin-tab-item ${activeTab === 'posts' ? 'active' : ''}`}
          >
            <FileText size={16} /> Manage Blogs
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`admin-tab-item ${activeTab === 'categories' ? 'active' : ''}`}
          >
            <Tag size={16} /> Manage Categories
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`admin-tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={16} /> Admin Settings
          </button>
          <button 
            onClick={() => setActiveTab('office')}
            className={`admin-tab-item ${activeTab === 'office' ? 'active' : ''}`}
          >
            <Database size={16} /> AI Virtual Office
          </button>
          <button 
            onClick={() => setActiveTab('mock_tests')}
            className={`admin-tab-item ${activeTab === 'mock_tests' ? 'active' : ''}`}
          >
            <Award size={16} /> Mock Test Attempts
          </button>
          <button 
            onClick={() => setActiveTab('app_ads')}
            className={`admin-tab-item ${activeTab === 'app_ads' ? 'active' : ''}`}
          >
            <FileText size={16} /> app-ads.txt
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
                    {[...posts].sort((a, b) => {
                      const ta = a.updated_at || a.created_at || '';
                      const tb = b.updated_at || b.created_at || '';
                      if (ta && tb && ta !== tb) {
                        return tb.localeCompare(ta);
                      }
                      const da = a.date ? new Date(a.date).getTime() : 0;
                      const db = b.date ? new Date(b.date).getTime() : 0;
                      if (da !== db) {
                        return db - da;
                      }
                      return b.id.localeCompare(a.id);
                    }).map((post) => (
                      <div key={post.id} className="glass-card" style={styles.postRow}>
                        <div style={styles.postMeta}>
                          <span style={{ ...styles.categoryBadge, color: 'var(--primary)', borderColor: 'rgba(0, 242, 254, 0.15)' }}>
                            {getCategoryName(post)}
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
                        value={postForm.category_id}
                        onChange={(e) => setPostForm({ ...postForm, category_id: e.target.value })}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
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

                  <div className="form-group">
                    <label className="form-label" htmlFor="blog-content">Article Content (HTML supported)</label>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: '1.4' }}>
                      Write or paste HTML content. Headings (<code>&lt;h1&gt;</code> to <code>&lt;h4&gt;</code>), paragraphs (<code>&lt;p&gt;</code>), tables, lists (<code>&lt;ul&gt;</code>, <code>&lt;ol&gt;</code>), links (<code>&lt;a&gt;</code>), <code>&lt;b&gt;</code>, and <code>&lt;i&gt;</code> will automatically format. Plain text paragraphs will automatically be wrapped in <code>&lt;p&gt;</code> tags.
                    </p>
                    <textarea
                      id="blog-content"
                      className="form-textarea"
                      style={{ minHeight: '280px', fontFamily: 'monospace', fontSize: '0.9rem' }}
                      placeholder="<p>Write your article content here...</p>"
                      value={postForm.content}
                      onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                      required
                    />
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

            <div className="glass-card" style={{ ...styles.settingsCard, marginTop: '24px' }}>
              <h2 style={styles.settingsTitle}>
                <Database size={20} style={{ color: 'var(--primary)' }} /> Database Configuration
              </h2>
              <p style={styles.settingsDesc}>
                Configure your Hostinger MySQL connection. If settings are wrong or empty, the app will fall back to JSON file storage.
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <span style={{
                  fontSize: '0.8rem',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  background: dbStatus?.status === 'connected' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                  border: dbStatus?.status === 'connected' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                  color: dbStatus?.status === 'connected' ? '#10b981' : '#ef4444'
                }}>
                  Status: {dbStatus ? dbStatus.status.toUpperCase() : 'UNKNOWN'}
                </span>
                {dbStatus?.message && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>{dbStatus.message}</p>}
              </div>

              {dbSaveSuccess && (
                <div style={styles.successAlert}>
                  <Check size={16} />
                  <span>{dbSaveSuccess}</span>
                </div>
              )}

              {dbSaveError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{dbSaveError}</span>
                </div>
              )}

              <form onSubmit={handleSaveDbConfig} style={styles.settingsForm}>
                <div className="form-group">
                  <label className="form-label" htmlFor="db-host-input">Database Host</label>
                  <input
                    id="db-host-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. localhost or mysql.hostinger.com"
                    value={dbHost}
                    onChange={(e) => setDbHost(e.target.value)}
                    disabled={isLocalMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="db-name-input">Database Name</label>
                  <input
                    id="db-name-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. u123456789_quantum"
                    value={dbName}
                    onChange={(e) => setDbName(e.target.value)}
                    disabled={isLocalMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="db-user-input">Database Username</label>
                  <input
                    id="db-user-input"
                    type="text"
                    className="form-input"
                    placeholder="e.g. u123456789_user"
                    value={dbUser}
                    onChange={(e) => setDbUser(e.target.value)}
                    disabled={isLocalMode}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="db-pass-input">Database Password</label>
                  <input
                    id="db-pass-input"
                    type="password"
                    className="form-input"
                    placeholder={isLocalMode ? "Disabled in local simulation mode" : "Enter database password"}
                    value={dbPass}
                    onChange={(e) => setDbPass(e.target.value)}
                    disabled={isLocalMode}
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '12px' }} disabled={isTestingDb || isLocalMode}>
                  {isTestingDb ? 'Testing Connection...' : 'Save Database Settings'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES */}
        {activeTab === 'categories' && (
          <div style={styles.tabContent}>
            <div className="glass-card" style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>
                <Tag size={20} style={{ color: 'var(--primary)' }} /> Category Management
              </h2>
              <p style={styles.settingsDesc}>
                Manage categories for blog articles. Deleting a category will delete all associated blogs (cascade delete).
              </p>

              {categorySuccess && (
                <div style={styles.successAlert}>
                  <Check size={16} />
                  <span>{categorySuccess}</span>
                </div>
              )}

              {categoryError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{categoryError}</span>
                </div>
              )}

              <form onSubmit={handleAddCategory} style={{ ...styles.settingsForm, marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="new-category-input">New Category Name</label>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <input
                      id="new-category-input"
                      type="text"
                      className="form-input"
                      placeholder="e.g. Artificial Intelligence"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      required
                    />
                    <button type="submit" className="btn-primary" disabled={isSavingCategory}>
                      {isSavingCategory ? 'Adding...' : <><Plus size={16} /> Add</>}
                    </button>
                  </div>
                </div>
              </form>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                <h3 style={{ ...styles.sectionHeader, marginBottom: '14px', fontSize: '1.1rem' }}>Existing Categories</h3>
                {categories.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No categories found.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {categories.map((cat) => (
                      <div key={cat.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        fontSize: '0.95rem'
                      }}>
                        <span>{cat.name} <code style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>({cat.id})</code></span>
                        <button
                          type="button"
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px'
                          }}
                          onClick={() => handleDeleteCategory(cat.id)}
                          title="Delete Category"
                        >
                          <Trash size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'office' && (
          <div style={styles.tabContent}>
            <AiOfficeTab isLocalMode={isLocalMode} />
          </div>
        )}

        {activeTab === 'mock_tests' && (
          <div style={styles.tabContent}>
            <div style={styles.actionRow}>
              <h2 style={styles.sectionHeader}>Mock Test Attempts ({attempts.length})</h2>
              <button 
                className="btn-secondary" 
                onClick={handleClearAllAttempts}
                disabled={attempts.length === 0}
                style={{ 
                  borderColor: 'rgba(239, 68, 68, 0.3)', 
                  color: '#ef4444',
                  background: 'rgba(239, 68, 68, 0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} /> Clear All Attempts
              </button>
            </div>

            {attemptsError && (
              <div style={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{attemptsError}</span>
              </div>
            )}

            {attemptsSuccess && (
              <div style={styles.successAlert}>
                <Check size={16} />
                <span>{attemptsSuccess}</span>
              </div>
            )}

            {/* Statistics Widgets */}
            <div style={styles.statsRow}>
              <div className="glass-card" style={styles.statItem}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff' }}>{attempts.length}</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Attempts</span>
              </div>
              <div className="glass-card" style={styles.statItem}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {attempts.filter(a => !(Number(a.submitted) === 1 || a.submitted === true)).length}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active / Started</span>
              </div>
              <div className="glass-card" style={styles.statItem}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>
                  {attempts.filter(a => Number(a.submitted) === 1 || a.submitted === true).length}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Submitted / Finished</span>
              </div>
              <div className="glass-card" style={styles.statItem}>
                <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#facc15' }}>
                  {attempts.filter(a => Number(a.submitted) === 1 || a.submitted === true).length > 0 ? (
                    (() => {
                      const completed = attempts.filter(a => Number(a.submitted) === 1 || a.submitted === true);
                      const totalAcc = completed.reduce((acc, a) => {
                        const marks = a.marks || 0;
                        const max = a.total_marks || 80;
                        return acc + (marks / max);
                      }, 0);
                      return Math.round((totalAcc / completed.length) * 100) + '%';
                    })()
                  ) : 'N/A'}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Average Score</span>
              </div>
            </div>

            {isAttemptsLoading ? (
              <div style={styles.loadingState}>Loading attempts database...</div>
            ) : attempts.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                <p style={{ color: 'var(--text-secondary)' }}>No mock test attempts recorded yet.</p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '24px 0', border: '1px solid var(--border-glass)' }}>
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Candidate</th>
                        <th style={styles.th}>Test Name</th>
                        <th style={styles.th}>Started At</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Score</th>
                        <th style={styles.th}>Time Spent</th>
                        <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.map((att) => {
                        const isSubmitted = Number(att.submitted) === 1 || att.submitted === true;
                        return (
                          <tr key={att.session_id}>
                            <td style={styles.td}>
                              <span style={styles.candidateNameText}>{att.candidate_name}</span>
                              <span style={styles.rollText}>Roll: {att.roll_number}</span>
                            </td>
                            <td style={styles.td}>{att.test_name}</td>
                            <td style={styles.td}>
                              {new Date(att.start_time.replace(' ', 'T')).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td style={styles.td}>
                              {isSubmitted ? (
                                <span style={styles.badgeSubmitted}>Submitted</span>
                              ) : (
                                <span style={styles.badgeActive}>In Progress</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              {isSubmitted && att.marks !== null ? (
                                <strong>{att.marks} / {att.total_marks || 80}</strong>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={styles.td}>
                              {isSubmitted && att.time_spent ? (
                                <span>{att.time_spent}</span>
                              ) : (
                                <span style={{ color: 'var(--text-muted)' }}>—</span>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: 'center' }}>
                              <button
                                onClick={() => handleDeleteAttempt(att.session_id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '6px',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'background-color 0.2s'
                                }}
                                title="Delete Attempt Record"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'app_ads' && (
          <div style={styles.tabContent}>
            <div className="glass-card" style={styles.settingsCard}>
              <h2 style={styles.settingsTitle}>
                <FileText size={20} style={{ color: 'var(--primary)' }} /> Manage app-ads.txt
              </h2>
              <p style={styles.settingsDesc}>
                Configure developer verification for Google Play Console, App Store, and Google AdMob. This file is served at the root of the domain.
              </p>

              {adsSuccess && (
                <div style={styles.successAlert}>
                  <Check size={16} />
                  <span>{adsSuccess}</span>
                </div>
              )}

              {adsError && (
                <div style={styles.errorAlert}>
                  <AlertCircle size={16} />
                  <span>{adsError}</span>
                </div>
              )}

              {isAdsLoading ? (
                <div style={styles.loadingState}>Loading app-ads.txt content...</div>
              ) : (
                <form onSubmit={handleSaveAds} style={styles.settingsForm}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="ads-textarea">File Content</label>
                    <textarea
                      id="ads-textarea"
                      className="form-textarea"
                      style={{ minHeight: '200px', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.4' }}
                      placeholder="google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
                      value={adsContent}
                      onChange={(e) => setAdsContent(e.target.value)}
                      required
                    />
                    <p style={styles.hintText}>
                      Each verification line should be: <code>domain, publisher_id, relationship, cert_authority_id</code>.
                    </p>
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={isSavingAds}>
                    {isSavingAds ? 'Saving...' : <><Save size={16} /> Save app-ads.txt</>}
                  </button>
                </form>
              )}
            </div>

            {!isAdsLoading && (
              <div className="glass-card" style={{ ...styles.settingsCard, marginTop: '0px' }}>
                <h2 style={styles.settingsTitle}>
                  <Plus size={20} style={{ color: 'var(--primary)' }} /> Quick Verification Line Helper
                </h2>
                <p style={styles.settingsDesc}>
                  Fill in details to format and append a new line directly to the editor above.
                </p>

                <div style={styles.settingsForm}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="helper-domain">Ad Network Domain</label>
                    <input
                      id="helper-domain"
                      type="text"
                      className="form-input"
                      value={newAdLine.domain}
                      onChange={(e) => setNewAdLine({ ...newAdLine, domain: e.target.value })}
                      placeholder="e.g. google.com"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="helper-pub-id">Publisher ID</label>
                    <input
                      id="helper-pub-id"
                      type="text"
                      className="form-input"
                      value={newAdLine.pubId}
                      onChange={(e) => setNewAdLine({ ...newAdLine, pubId: e.target.value })}
                      placeholder="e.g. pub-3643379306547907"
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="helper-relationship">Relationship</label>
                      <select
                        id="helper-relationship"
                        value={newAdLine.relationship}
                        onChange={(e) => setNewAdLine({ ...newAdLine, relationship: e.target.value as 'DIRECT' | 'RESELLER' })}
                        style={{
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-glass)',
                          background: 'rgba(255, 255, 255, 0.03)',
                          color: '#ffffff',
                          fontFamily: 'inherit'
                        }}
                      >
                        <option value="DIRECT" style={{ background: '#1c1917', color: '#fff' }}>DIRECT</option>
                        <option value="RESELLER" style={{ background: '#1c1917', color: '#fff' }}>RESELLER</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="helper-cert-id">Cert Authority ID (Optional)</label>
                      <input
                        id="helper-cert-id"
                        type="text"
                        className="form-input"
                        value={newAdLine.certId}
                        onChange={(e) => setNewAdLine({ ...newAdLine, certId: e.target.value })}
                        placeholder="e.g. f08c47fec0942fa0"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ alignSelf: 'flex-start', marginTop: '8px' }}
                    onClick={() => {
                      if (!newAdLine.domain.trim() || !newAdLine.pubId.trim()) {
                        alert('Domain and Publisher ID are required.');
                        return;
                      }
                      const formattedLine = `${newAdLine.domain.trim()}, ${newAdLine.pubId.trim()}, ${newAdLine.relationship}${newAdLine.certId.trim() ? `, ${newAdLine.certId.trim()}` : ''}`;
                      const currentContent = adsContent.trim();
                      const separator = currentContent ? '\n' : '';
                      setAdsContent(currentContent + separator + formattedLine);
                      setNewAdLine({
                        domain: 'google.com',
                        pubId: 'pub-',
                        relationship: 'DIRECT',
                        certId: 'f08c47fec0942fa0'
                      });
                    }}
                  >
                    <Plus size={15} /> Format & Append Line
                  </button>
                </div>
              </div>
            )}
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
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  statItem: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    textAlign: 'center' as const,
  },
  tableWrapper: {
    width: '100%',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
    fontSize: '0.92rem',
  },
  th: {
    padding: '16px 12px',
    borderBottom: '1px solid var(--border-glass)',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  td: {
    padding: '16px 12px',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
    color: 'var(--text-secondary)',
    verticalAlign: 'middle',
  },
  candidateNameText: {
    fontWeight: 600,
    color: '#ffffff',
    display: 'block',
  },
  rollText: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    display: 'block',
    marginTop: '2px',
  },
  badgeSubmitted: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    color: '#10b981',
  },
  badgeActive: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 600,
    background: 'rgba(0, 242, 254, 0.06)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    color: 'var(--primary)',
  },
};

export default Admin;
