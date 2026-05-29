import React, { useState, useEffect } from 'react';
import { Calendar, User, Clock, ArrowLeft, BookOpenText } from 'lucide-react';
import DOMPurify from 'dompurify';
import { updateSEO } from '../utils/seo';

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

interface BlogsProps {
  selectedCategory?: string;
  setSelectedCategory?: (cat: string) => void;
  postId?: string;
  setPostId?: (id: string | null) => void;
}

export const Blogs: React.FC<BlogsProps> = ({
  selectedCategory = 'all',
  setSelectedCategory,
  postId,
  setPostId
}) => {
  const [localPostId, setLocalPostId] = useState<string | null>(null);
  const activePostId = postId !== undefined ? postId : localPostId;


  const setActivePostId = (id: string | null) => {
    if (setPostId) {
      setPostId(id);
    } else {
      setLocalPostId(id);
    }
  };

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories.php');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          loadFallbackCategories();
        }
      } catch {
        loadFallbackCategories();
      }
    };

    const loadFallbackCategories = () => {
      const local = localStorage.getItem('quantum_categories');
      if (local) {
        setCategories(JSON.parse(local));
      } else {
        const defaultCategories: Category[] = [
          { id: 'privacy-security', name: 'Privacy & Security' },
          { id: 'computer-science', name: 'Computer Science' },
          { id: 'creative-tech', name: 'Creative Tech' },
          { id: 'general-utilities', name: 'General Utilities' }
        ];
        localStorage.setItem('quantum_categories', JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
      }
    };

    const fetchBlogs = async () => {
      try {
        const response = await fetch('/api/blogs.php');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          loadFallbackBlogs();
        }
      } catch {
        loadFallbackBlogs();
      } finally {
        setIsLoading(false);
      }
    };

    const loadFallbackBlogs = () => {
      const local = localStorage.getItem('quantum_blogs');
      if (local) {
        setPosts(JSON.parse(local));
      } else {
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
    };

    fetchCategories();
    fetchBlogs();
  }, []);

  const selectedPost = posts.find(p => p.id === activePostId);

  // Dynamic SEO Updates for Blogs page or individual blog post
  useEffect(() => {
    if (selectedPost) {
      updateSEO(
        `${selectedPost.title} | Quantum Qbit Blog`,
        selectedPost.excerpt,
        `/blogs/${selectedPost.id}`
      );
    } else {
      const catObj = categories.find(c => c.id === selectedCategory);
      const categoryText = catObj ? ` - ${catObj.name}` : '';
      updateSEO(
        `Quantum Qbit Blog${categoryText} - Blogs & Articles`,
        "Explore blogs and articles on privacy-first web utilities, local browser tools, and client-side technology written by the Quantum Engineering Team.",
        `/blogs`
      );
    }
  }, [selectedPost, selectedCategory, categories]);

  const getCategoryName = (post: BlogPost) => {
    if (post.category_id) {
      const cat = categories.find(c => c.id === post.category_id);
      if (cat) return cat.name;
    }
    if (post.category) return post.category;
    if (post.category_id) {
      return post.category_id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    return 'General';
  };

  // Render Single Blog Post Reader View
  if (selectedPost) {
    return (
      <div className="container" style={styles.readerFlexWrapper}>
        <div style={styles.articleCol}>
          <button style={styles.backBtn} onClick={() => setActivePostId(null)}>
            <ArrowLeft size={16} /> Back to Blog List
          </button>

          <article style={styles.article}>
            <div style={{ ...styles.articleGlow, background: `radial-gradient(circle, ${selectedPost.imageGlow} 0%, transparent 70%)` }}></div>
            <span style={styles.articleTag}>{getCategoryName(selectedPost)}</span>
            <h1 style={styles.articleTitle}>{selectedPost.title}</h1>

            {/* Author/Date Header */}
            <div style={styles.articleMeta}>
              <div style={styles.metaItem}>
                <User size={14} />
                <span>{selectedPost.author}</span>
              </div>
              <div style={styles.metaItem}>
                <Calendar size={14} />
                <span>{selectedPost.date}</span>
              </div>
              <div style={styles.metaItem}>
                <Clock size={14} />
                <span>{selectedPost.readTime}</span>
              </div>
            </div>

            <div style={styles.articleDivider}></div>

            {/* Article Text Content */}
            <div style={styles.articleBody}>
              {Array.isArray(selectedPost.content) ? (
                selectedPost.content.map((paragraph, index) => (
                  <p key={index} style={styles.paragraph}>
                    {paragraph}
                  </p>
                ))
              ) : (
                <div 
                  className="rich-html-blog"
                  dangerouslySetInnerHTML={{ 
                    __html: DOMPurify.sanitize(selectedPost.content) 
                  }} 
                />
              )}
            </div>
          </article>
        </div>

        {/* Sidebar Column */}
        <aside className="ad-sidebar-col" style={styles.sidebarCol}>
          <div style={sidebarStickyCardStyle} className="glass-card">
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px', fontFamily: 'var(--font-heading)' }}>Quantum Utilities</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              Try our offline-first local image studio and PDF compressor apps directly in your browser.
            </p>
          </div>
        </aside>
      </div>
    );
  }

  const sortedPosts = [...posts].sort((a, b) => {
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
  });

  const filteredPosts = selectedCategory !== 'all'
    ? sortedPosts.filter(post => post.category_id === selectedCategory || post.category === selectedCategory)
    : sortedPosts;

  return (
    <div style={styles.blogFeed}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Quantum Qbit Blogs & Articles</h1>
          <p style={styles.subtitle}>
            Blogs, articles, and technical breakdowns about web tools, data security, and client-side processing.
          </p>
        </div>

        {/* Category filter banner */}
        {selectedCategory !== 'all' && (
          <div className="blog-filter-banner">
            <div className="blog-filter-text">
              Showing articles in <strong>{
                categories.find(c => c.id === selectedCategory)?.name || 
                selectedCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
              }</strong>
            </div>
            {setSelectedCategory && (
              <button 
                className="clear-filter-btn"
                onClick={() => setSelectedCategory('all')}
              >
                Clear Filter
              </button>
            )}
          </div>
        )}

        {/* Blog Post List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            Loading blogs and articles database...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            No blogs or articles found in this category.
          </div>
        ) : (
          <div style={styles.postsGrid}>
            {filteredPosts.map((post) => (
              <div key={post.id} className="glass-card" style={styles.postCard}>
                {/* Dynamic glowing ambient backing */}
                <div style={{
                  ...styles.cardGlowBg,
                  background: `radial-gradient(circle at top right, ${post.imageGlow} 0%, transparent 60%)`
                }}></div>
                
                <div style={styles.cardInfo}>
                  <span style={styles.postCategory}>{getCategoryName(post)}</span>
                  <h2 style={styles.postTitle} onClick={() => setActivePostId(post.id)}>
                    {post.title}
                  </h2>
                  <p style={styles.postExcerpt}>{post.excerpt}</p>
                  
                  <div style={styles.cardFooter}>
                    <div style={styles.metaGroup}>
                      <Clock size={13} />
                      <span>{post.readTime}</span>
                    </div>
                    <button
                      style={styles.readMoreBtn}
                      onClick={() => setActivePostId(post.id)}
                    >
                      Read Article <BookOpenText size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const sidebarStickyCardStyle = {
  padding: '24px 20px',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-lg)',
  position: 'sticky' as const,
  top: '100px',
  background: 'var(--bg-card)',
};

const styles = {
  blogFeed: {
    padding: '60px 0 100px 0',
  },
  readerContainer: {
    padding: '40px 24px 100px 24px',
    maxWidth: '800px',
    margin: '0 auto',
    position: 'relative' as const,
  },
  readerFlexWrapper: {
    padding: '40px 24px 100px 24px',
    maxWidth: '1140px',
    margin: '0 auto',
    display: 'flex',
    gap: '40px',
    position: 'relative' as const,
  },
  articleCol: {
    flex: 1,
    minWidth: 0,
  },
  sidebarCol: {
    width: '300px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    paddingTop: '64px',
  },
  backBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.95rem',
    fontWeight: 500,
    marginBottom: '32px',
    transition: 'var(--transition-fast)',
    padding: 0,
  },
  article: {
    position: 'relative' as const,
    zIndex: 2,
  },
  articleGlow: {
    position: 'absolute' as const,
    top: '-80px',
    right: '-80px',
    width: '320px',
    height: '320px',
    pointerEvents: 'none' as const,
    zIndex: -1,
  },
  articleTag: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--primary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  articleTitle: {
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    fontWeight: 700,
    lineHeight: 1.2,
    marginTop: '12px',
    marginBottom: '20px',
  },
  articleMeta: {
    display: 'flex',
    gap: '20px',
    color: 'var(--text-muted)',
    fontSize: '0.88rem',
    flexWrap: 'wrap' as const,
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  articleDivider: {
    height: '1px',
    background: 'var(--border-glass)',
    margin: '24px 0 32px 0',
  },
  articleBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  paragraph: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    lineHeight: '1.75',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '54px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
  postsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  postCard: {
    padding: '30px',
    position: 'relative' as const,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  cardGlowBg: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    width: '150px',
    height: '150px',
    pointerEvents: 'none' as const,
  },
  cardInfo: {
    position: 'relative' as const,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    gap: '14px',
  },
  postCategory: {
    fontSize: '0.78rem',
    color: 'var(--primary)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  postTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    lineHeight: 1.3,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  postExcerpt: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.6,
    flexGrow: 1,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid var(--border-glass)',
    paddingTop: '14px',
    marginTop: '6px',
  },
  metaGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
  },
  readMoreBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.88rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-fast)',
    padding: 0,
  },
};

export default Blogs;
