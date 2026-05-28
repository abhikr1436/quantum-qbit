import React, { useState, useEffect } from 'react';
import { Cpu, Image as ImageIcon, FileText, Calculator, ShieldCheck, Zap, Lock, BookOpen } from 'lucide-react';
import { navigate } from '../utils/router';
import { ThreeDQbit } from '../components/ThreeDQbit';

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
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Intersection Observer for scroll animations
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // Fallback for environment without IntersectionObserver (e.g. Node/Vitest run)
      const elements = document.querySelectorAll('.reveal-on-scroll');
      elements.forEach(el => el.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.12 });

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach(el => observer.observe(el));
    return () => {
      elements.forEach(el => observer.unobserve(el));
    };
  }, [posts]);

  // Handle mouse move for 3D tilt effect in Hero section
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // range: -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // range: -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const features = [
    {
      icon: <Lock size={22} style={{ color: 'var(--primary)' }} />,
      title: "100% Client-Side Privacy",
      description: "Your files never touch a server. All operations (image resize, PDF conversion, calculations) happen securely in your browser."
    },
    {
      icon: <Zap size={22} style={{ color: 'var(--secondary)' }} />,
      title: "Sub-Second Execution",
      description: "Powered by modern WebAssembly and HTML5 Canvas API. Experience instant processing speeds without network latency."
    },
    {
      icon: <ShieldCheck size={22} style={{ color: 'var(--primary)' }} />,
      title: "Zero Ads & Tracker Free",
      description: "A clean, modern workspace designed for professionals and developers. No login required, no paywalls, just pure tools."
    }
  ];

  // Parallax drift & opacity for the hero backdrop/vortex
  const translateY = scrollY * 0.15;
  const opacity = Math.max(0, 1 - scrollY * 0.0022);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Compute position along the scroll glide-path
  const getQbitPosition = () => {
    if (isMobile) {
      const op = Math.max(0, 1 - scrollY * 0.0035);
      return {
        left: '50%',
        top: '32%',
        transform: `translate(-50%, -50%) scale(${Math.max(0.4, 0.85 - scrollY * 0.001)})`,
        opacity: op,
        pointerEvents: 'none' as const
      };
    }

    const maxScroll = 2200;
    const p = Math.min(scrollY / maxScroll, 1);

    let left = 75; // in vw
    let top = 48;  // in vh
    let scale = 1.0;

    if (p < 0.22) {
      const t = p / 0.22;
      left = 75 + (83 - 75) * t;
      top = 48 + (60 - 48) * t;
      scale = 1.0 - 0.2 * t;
    } else if (p < 0.55) {
      const t = (p - 0.22) / 0.33;
      left = 83 + (18 - 83) * t;
      top = 60 + (45 - 60) * t;
      scale = 0.8 - 0.15 * t;
    } else if (p < 0.82) {
      const t = (p - 0.55) / 0.27;
      left = 18 + (82 - 18) * t;
      top = 45 + (55 - 45) * t;
      scale = 0.65 + 0.2 * t;
    } else {
      const t = (p - 0.82) / 0.18;
      left = 82 + (50 - 82) * t;
      top = 55 + (72 - 55) * t;
      scale = 0.85 - 0.3 * t;
    }

    const op = scrollY > 2600 ? Math.max(0, 1 - (scrollY - 2600) * 0.003) : 1;

    return {
      left: `${left}%`,
      top: `${top}%`,
      transform: `translate(-50%, -50%) scale(${scale})`,
      opacity: op,
      pointerEvents: 'none' as const
    };
  };

  // Generate glowing floating particles surrounding the Qbit core
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const x = Math.sin(i) * 120 + (Math.random() * 20 - 10);
    const y = Math.cos(i) * 120 - 60 + (Math.random() * 20 - 10);
    const z = Math.sin(i * 2) * 50;
    const delay = i * 0.8;
    return (
      <div 
        key={i} 
        className="glow-particle" 
        style={{
          left: `calc(50% + ${x}px)`,
          top: `calc(50% + ${y}px)`,
          animationDelay: `${delay}s`,
          '--x': `${x * 1.6}px`,
          '--y': `${y - 120}px`,
          '--z': `${z}px`
        } as React.CSSProperties}
      />
    );
  });

  return (
    <div style={styles.landing}>
      
      {/* 3D Perspective Cyber Grid Background */}
      <div className="cyber-grid-container">
        <div className="cyber-grid" />
      </div>

      {/* Real-time 3D Bloch Sphere Qbit centerpiece */}
      <div 
        className="qbit-3d-canvas-container"
        style={{
          position: 'fixed',
          width: isMobile ? '280px' : '450px',
          height: isMobile ? '280px' : '450px',
          zIndex: 10,
          transition: 'left 0.75s cubic-bezier(0.16, 1, 0.3, 1), top 0.75s cubic-bezier(0.16, 1, 0.3, 1), transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out',
          ...getQbitPosition()
        }}
      >
        <ThreeDQbit scrollY={scrollY} mousePos={mousePos} />
      </div>


      {/* Hero / Centerpiece Section */}
      <section 
        style={styles.heroSection} 
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container" style={styles.heroGrid}>
          
          {/* Hero Left Content */}
          <div style={{ ...styles.heroContent, opacity: Math.max(0, 1 - scrollY * 0.002) }}>
            <div style={styles.badge} className="animate-fade-in">
              <Cpu size={12} style={{ color: 'var(--primary)' }} />
              <span>Introducing Quantum Qbit v1.0</span>
            </div>
            
            <h1 style={styles.heroTitle} className="animate-fade-in">
              Modern Web Tools,<br />
              <span className="gradient-text">Zero Server Latency.</span>
            </h1>
            
            <p style={styles.heroSubtitle} className="animate-fade-in">
              A curated suite of minimal, high-performance web applications designed with absolute privacy. No uploads, no registrations, completely client-side.
            </p>

            <div style={styles.ctaGroup} className="animate-fade-in">
              <button className="btn-primary" onClick={() => navigate('/tools')}>
                Start Using Tools
              </button>
              <button className="btn-secondary" onClick={() => navigate('/blogs')}>
                <BookOpen size={16} /> Read the Blog
              </button>
            </div>
          </div>

          {/* Hero Right 3D Scene */}
          <div style={{ 
            ...styles.hero3DCol, 
            transform: `translateY(${translateY}px)`, 
            opacity: opacity 
          }}>
            <div className="qbit-3d-scene">
              {/* Spinning Orbital Neon Rings */}
              <div className="qbit-ring qbit-ring-1" />
              <div className="qbit-ring qbit-ring-2" />
              <div className="qbit-ring qbit-ring-3" />
              
              {/* Floating Glowing Particles */}
              {particles}
            </div>
          </div>

          
        </div>
      </section>

      {/* Horizontally Scrollable Tools Frame */}
      <section className="reveal-on-scroll" style={styles.showcaseSection}>
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
                  <ImageIcon size={24} style={{ color: 'var(--primary)' }} />
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
      <section className="reveal-on-scroll" style={styles.blogsSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Latest Blogs and Articles</h2>
            <p style={styles.sectionSubtitle}>Latest updates in technology, engineering, privacy, and guides.</p>
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
      <section className="reveal-on-scroll" style={styles.featuresSection}>
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
      <section className="reveal-on-scroll" style={styles.ctaSection}>
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
    position: 'relative' as const,
  },
  blogsSection: {
    padding: '60px 0',
  },
  heroSection: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px 100px 24px',
    overflow: 'hidden',
    minHeight: '85vh',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 0.9fr',
    gap: '40px',
    alignItems: 'center',
    width: '100%',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '24px',
    textAlign: 'left' as const,
    zIndex: 2,
    transition: 'opacity 0.2s ease-out',
  },
  hero3DCol: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    transition: 'transform 0.1s ease-out, opacity 0.2s ease-out',
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
    fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
    lineHeight: 1.1,
    fontWeight: 800,
    margin: 0,
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 2vw, 1.15rem)',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    maxWidth: '580px',
    margin: 0,
  },
  ctaGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '8px',
    flexWrap: 'wrap' as const,
  },
  featuresSection: {
    padding: '80px 0',
  },
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '40px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
    fontWeight: 700,
    margin: 0,
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1rem',
    maxWidth: '550px',
    margin: 0,
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
    width: '48px',
    height: '48px',
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
    margin: 0,
  },
  featureDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.95rem',
    margin: 0,
  },
  showcaseSection: {
    padding: '60px 0',
  },
  ctaSection: {
    position: 'relative' as const,
    padding: '80px 24px 100px 24px',
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
    margin: 0,
  },
  ctaDesc: {
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    lineHeight: 1.6,
    fontSize: '0.98rem',
    margin: 0,
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
