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

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AdSenseUnit: React.FC<{ slot: string; format?: string; responsive?: string; style?: React.CSSProperties }> = ({
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' }
}) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ignore adsbygoogle errors
    }
  }, []);

  return (
    <div style={{ margin: '24px 0', textAlign: 'center', width: '100%' }}>
      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', marginBottom: '6px', textTransform: 'uppercase' }}>Advertisement</div>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-3643379306547907"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
};

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
      const localStr = localStorage.getItem('quantum_blogs') || localStorage.getItem('quantum_blogs_db');
      if (localStr) {
        try {
          const parsed = JSON.parse(localStr);
          if (Array.isArray(parsed)) {
            setPosts(parsed);
            return;
          }
        } catch (e) {}
      }
      setPosts([]);
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
                    __html: DOMPurify.sanitize(selectedPost.content, {
                      ADD_TAGS: ['iframe', 'video', 'source', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'style', 'figure', 'figcaption', 'span', 'mark', 'code', 'pre', 'u', 's', 'sub', 'sup', 'hr'],
                      ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 'target', 'style', 'class', 'colspan', 'rowspan', 'controls', 'autoplay', 'loop', 'alt', 'width', 'height', 'rel']
                    }) 
                  }} 
                />
              )}
            </div>
            
            <div style={{ marginTop: '40px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
              <AdSenseUnit slot="5938271046" />
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
          <AdSenseUnit slot="8372619405" />
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
