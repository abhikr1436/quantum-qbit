import React, { useState, useEffect } from 'react';
import { Cpu, Image, FileText, Calculator, ShieldCheck, Zap, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { navigate } from '../utils/router';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  imageGlow: string;
}

export const LandingPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('/api/blogs.php');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          loadFallbackBlogs();
        }
      } catch (err) {
        loadFallbackBlogs();
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
            imageGlow: 'rgba(0, 242, 254, 0.1)'
          },
          {
            id: 'base-math',
            title: "The Logic Behind Real-Time Cross-Input Number Base Conversions",
            excerpt: "Understanding how computers translate binary, octal, decimal, and hexadecimal representations under the hood to optimize data structures.",
            author: "Dr. Clara Chen",
            date: "May 10, 2026",
            readTime: "5 min read",
            category: "Computer Science",
            imageGlow: 'rgba(157, 78, 221, 0.1)'
          },
          {
            id: 'image-optimization',
            title: "Image Formats Decoded: Choosing Between JPG, PNG, and WEBP",
            excerpt: "A deep dive into compression algorithms and when to use each format to achieve visual clarity while keeping load times minimal.",
            author: "Marcus Vance",
            date: "May 02, 2026",
            readTime: "3 min read",
            category: "Creative Tech",
            imageGlow: 'rgba(0, 242, 254, 0.1)'
          }
        ];
        localStorage.setItem('quantum_blogs', JSON.stringify(defaultPosts));
        setPosts(defaultPosts);
      }
    };

    fetchBlogs();
  }, []);

  const features = [
    {
      icon: <Lock size={20} style={{ color: 'var(--primary)' }} />,
      title: "100% Client-Side Privacy",
      description: "Your files never touch a server. All operations (image resize, PDF conversion, calculations) happen securely in your browser."
    },
    {
      icon: <Zap size={20} style={{ color: 'var(--secondary)' }} />,
      title: "Sub-Second Execution",
      description: "Powered by modern WebAssembly and HTML5 Canvas API. Experience instant processing speeds without network latency."
    },
    {
      icon: <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />,
      title: "Zero Ads & Tracker Free",
      description: "A clean, modern workspace designed for professionals and developers. No login required, no paywalls, just pure tools."
    }
  ];

  return (
    <div style={styles.landing}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.heroGlow1}></div>
        <div style={styles.heroGlow2}></div>
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <Cpu size={12} style={{ color: 'var(--primary)' }} />
            <span>Introducing Quantum Qbit v1.0</span>
          </div>
          <h1 style={styles.heroTitle}>
            Modern Web Tools,<br />
            <span className="gradient-text">Zero Server Latency.</span>
          </h1>
          <p style={styles.heroSubtitle}>
            A curated suite of minimal, high-performance web applications designed with absolute privacy. No uploads, no registrations, completely client-side.
          </p>
        </div>
      </section>

      {/* Horizontally Scrollable Tools Frame */}
      <section style={styles.showcaseSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Quantum Utilities Directory</h2>
            <p style={styles.sectionSubtitle}>Select a utility app below to begin client-side processing immediately.</p>
          </div>
          
          <div className="horizontal-scroll-row">
            {/* Card 1: Image Studio */}
            <div className="glass-card horizontal-scroll-card">
              <div className="scroll-card-glow" style={{ background: 'radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, transparent 70%)' }}></div>
              <div className="scroll-card-content">
                <h3 className="scroll-card-title">
                  <Image size={24} style={{ color: 'var(--primary)' }} />
                  <span>Image Studio</span>
                </h3>
                <p className="scroll-card-desc">
                  Edit, compress, crop, and transform digital images locally in high definition without server latency.
                </p>
                <div className="scroll-card-links-grid">
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-editor')}>Editor</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-compressor')}>Compressor</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-transform')}>Transform</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/remove-bg')}>BG Removal</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-crop')}>Crop</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-resize')}>Resize</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-dpi')}>DPI Settings</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-converter')}>Converter</button>
                </div>
              </div>
            </div>

            {/* Card 2: PDF Workshop */}
            <div className="glass-card horizontal-scroll-card">
              <div className="scroll-card-glow" style={{ background: 'radial-gradient(circle, rgba(157, 78, 221, 0.12) 0%, transparent 70%)' }}></div>
              <div className="scroll-card-content">
                <h3 className="scroll-card-title">
                  <FileText size={24} style={{ color: 'var(--secondary)' }} />
                  <span>PDF Workshop</span>
                </h3>
                <p className="scroll-card-desc">
                  Shrink PDF file sizes client-side or compile image sequences directly to standard PDF pages offline.
                </p>
                <div className="scroll-card-links-grid">
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/pdf-compressor')}>Compressor</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/images-to-pdf')}>Images to PDF</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/convert-to-pdf')}>Office to PDF</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/pdf-to-word')}>PDF to Word</button>
                </div>
              </div>
            </div>

            {/* Card 3: Math Calculator */}
            <div className="glass-card horizontal-scroll-card">
              <div className="scroll-card-glow" style={{ background: 'radial-gradient(circle, rgba(0, 242, 254, 0.12) 0%, transparent 70%)' }}></div>
              <div className="scroll-card-content">
                <h3 className="scroll-card-title">
                  <Calculator size={24} style={{ color: 'var(--primary)' }} />
                  <span>Math Calculator</span>
                </h3>
                <p className="scroll-card-desc">
                  Scientific notation calculator, real-time hexadecimal/binary base converter, and equation solver.
                </p>
                <div className="scroll-card-links-grid">
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-scientific')}>Scientific</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-base')}>Base Converter</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-unit')}>Unit Adapter</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-solver')}>Equation Solver</button>
                  <button className="scroll-card-link-btn" style={{ gridColumn: 'span 2' }} onClick={() => navigate('/tools/math-plotter')}>Graph Plotter</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontally Scrollable Blogs Section */}
      <section style={styles.blogsSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Latest Publications & Guides</h2>
            <p style={styles.sectionSubtitle}>Learn security tips, browser performance tricks, and utility tutorials.</p>
          </div>
          
          <div className="horizontal-scroll-row">
            {posts.map((post) => (
              <div key={post.id} className="glass-card blog-scroll-card">
                <div className="scroll-card-glow" style={{ background: `radial-gradient(circle at top right, ${post.imageGlow} 0%, transparent 75%)` }}></div>
                <div className="blog-body">
                  <span style={{
                    fontSize: '0.78rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>{post.category}</span>
                  <h3 className="blog-title" onClick={() => navigate(`/blogs/${post.id}`)}>
                    {post.title}
                  </h3>
                  <p className="blog-excerpt">{post.excerpt}</p>
                </div>
                <div className="blog-footer">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.readTime}</span>
                  <button 
                    className="scroll-card-link-btn" 
                    onClick={() => navigate(`/blogs/${post.id}`)}
                    style={{ padding: '6px 12px' }}
                  >
                    Read
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={styles.featuresSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Engineered for Speed & Security</h2>
            <p style={styles.sectionSubtitle}>We reimagined utility tools to put privacy and desktop-level performance first.</p>
          </div>
          <div style={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <div key={idx} className="glass-card" style={styles.featureCard}>
                <div style={styles.featureIconContainer}>
                  {feature.icon}
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaGlow}></div>
        <div className="glass-card" style={styles.ctaCard}>
          <h2 style={styles.ctaTitle}>Ready to experience the quantum leap?</h2>
          <p style={styles.ctaDesc}>
            All tools are free to use. Learn how we respect your data or browse articles on how to maximize your workflow on our blog.
          </p>
          <div style={styles.ctaButtons}>
            <button className="btn-primary" onClick={() => navigate('/tools')}>
              Start Using Tools
            </button>
            <button className="btn-secondary" onClick={() => navigate('/blogs')}>
              <BookOpen size={16} /> Read the Blog
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const styles = {
  landing: {
    paddingBottom: '80px',
  },
  blogsSection: {
    padding: '20px 0',
  },
  heroSection: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '45px 24px 10px 24px',
    overflow: 'hidden',
  },
  heroGlow1: {
    position: 'absolute' as const,
    top: '20%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(0, 242, 254, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  heroGlow2: {
    position: 'absolute' as const,
    bottom: '20%',
    left: '50%',
    transform: 'translate(-50%, 50%)',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(157, 78, 221, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  heroContent: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '24px',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    lineHeight: 1.1,
    fontWeight: 800,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.2rem)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '650px',
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
  featuresSection: {
    padding: '80px 0',
  },
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    fontWeight: 700,
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    maxWidth: '550px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '36px',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  featureIconContainer: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  featureDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.95rem',
  },
  showcaseSection: {
    padding: '20px 0',
  },
  toolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  toolCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    textAlign: 'left' as const,
  },
  toolCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toolIconWrapper: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolTag: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    padding: '4px 10px',
    borderRadius: '100px',
    border: '1px solid',
  },
  toolTitle: {
    fontSize: '1.3rem',
    fontWeight: 600,
    marginTop: '6px',
  },
  toolDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    flexGrow: 1,
  },
  toolBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 0',
    width: 'fit-content',
    transition: 'var(--transition-fast)',
  },
  btnArrow: {
    transition: 'transform 0.2s ease',
  },
  ctaSection: {
    position: 'relative' as const,
    padding: '100px 24px',
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ctaGlow: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(157, 78, 221, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
    zIndex: 1,
  },
  ctaCard: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '900px',
    width: '100%',
    padding: '60px 40px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '20px',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.01) 0%, rgba(255, 255, 255, 0.03) 100%)',
  },
  ctaTitle: {
    fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)',
    fontWeight: 700,
  },
  ctaDesc: {
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    lineHeight: 1.6,
    fontSize: '0.98rem',
  },
  ctaButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '10px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
};

export default LandingPage;
