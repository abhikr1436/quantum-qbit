import React, { useState, useEffect } from 'react';
import { Cpu, Image as ImageIcon, FileText, Calculator, ShieldCheck, Zap, Lock, BookOpen, Award, Sparkles, ArrowRight, Shield } from 'lucide-react';
import { navigate } from '../utils/router';
import { ThreeDQbit } from '../components/ThreeDQbit';
import { QuantumCompanion } from '../components/QuantumCompanion';
import { TiltCard } from '../components/TiltCard';

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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      } catch {
        loadFallbackBlogs();
      }
    };

    const loadDefaultBlogs = () => {
      const defaultPosts: BlogPost[] = [
        {
          id: 'browser-privacy',
          title: "Why Browser-Only Tools Are the Future of Web Utility Apps",
          excerpt: "In an era of rising security concerns, running calculations, converting PDFs, and editing photos locally protects user data from server hazards.",
          author: "Quantum Engineering Team",
          date: "May 18, 2026",
          readTime: "4 min read",
          category: "Privacy & Security",
          imageGlow: 'rgba(43, 122, 143, 0.15)'
        },
        {
          id: 'base-math',
          title: "The Logic Behind Real-Time Cross-Input Number Base Conversions",
          excerpt: "Understanding how computers translate binary, octal, decimal, and hexadecimal representations under the hood to optimize data structures.",
          author: "Dr. Clara Chen",
          date: "May 10, 2026",
          readTime: "5 min read",
          category: "Computer Science",
          imageGlow: 'rgba(99, 102, 241, 0.15)'
        },
        {
          id: 'image-optimization',
          title: "Image Formats Decoded: Choosing Between JPG, PNG, WEBP, and BMP",
          excerpt: "A deep dive into compression algorithms and when to use each format to achieve visual clarity while keeping load times minimal.",
          author: "Marcus Vance",
          date: "May 02, 2026",
          readTime: "4 min read",
          category: "Creative Tech",
          imageGlow: 'rgba(43, 122, 143, 0.15)'
        }
      ];
      setPosts(defaultPosts);
    };

    const loadFallbackBlogs = () => {
      const local = localStorage.getItem('quantum_blogs');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length >= 8) {
            setPosts(parsed.slice(0, 3));
          } else {
            loadDefaultBlogs();
          }
        } catch {
          loadDefaultBlogs();
        }
      } else {
        loadDefaultBlogs();
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

  // Mouse move for 3D hero tilt
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
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

  // Dynamic 3D position of the Bloch Sphere centerpiece along scroll glide path
  const getQbitPosition = () => {
    if (isMobile) {
      const op = Math.max(0, 1 - scrollY * 0.0035);
      return {
        transform: `translate3d(50vw, 30vh, 0) translate(-50%, -50%) scale(${Math.max(0.4, 0.8 - scrollY * 0.001)})`,
        opacity: op,
        pointerEvents: 'none' as const
      };
    }

    const maxScroll = 2200;
    const p = Math.min(scrollY / maxScroll, 1);

    let left: number;
    let top: number;
    let scale: number;

    if (p < 0.22) {
      const t = p / 0.22;
      left = 76 + (82 - 76) * t;
      top = 46 + (58 - 46) * t;
      scale = 1.0 - 0.2 * t;
    } else if (p < 0.55) {
      const t = (p - 0.22) / 0.33;
      left = 82 + (18 - 82) * t;
      top = 58 + (46 - 58) * t;
      scale = 0.8 - 0.15 * t;
    } else if (p < 0.82) {
      const t = (p - 0.55) / 0.27;
      left = 18 + (82 - 18) * t;
      top = 46 + (54 - 46) * t;
      scale = 0.65 + 0.2 * t;
    } else {
      const t = (p - 0.82) / 0.18;
      left = 82 + (50 - 82) * t;
      top = 54 + (70 - 54) * t;
      scale = 0.85 - 0.3 * t;
    }

    const op = scrollY > 2600 ? Math.max(0, 1 - (scrollY - 2600) * 0.003) : 1;

    return {
      transform: `translate3d(${left}vw, ${top}vh, 0) translate(-50%, -50%) scale(${scale})`,
      opacity: op,
      pointerEvents: 'auto' as const
    };
  };

  // Parallax calculations for hero backdrop
  const translateY = scrollY * 0.12;
  const heroOpacity = Math.max(0, 1 - scrollY * 0.0022);

  return (
    <div style={styles.landing}>
      {/* 3D Bloch Sphere Canvas Centerpiece */}
      <div
        className="qbit-3d-canvas-container"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: isMobile ? '280px' : '440px',
          height: isMobile ? '280px' : '440px',
          zIndex: 8,
          transition: 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease-out',
          ...getQbitPosition()
        }}
      >
        <ThreeDQbit scrollY={scrollY} mousePos={mousePos} />
      </div>

      {/* Hero Section */}
      <section
        style={styles.heroSection}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container" style={styles.heroGrid}>
          {/* Hero Left Content */}
          <div style={{ ...styles.heroContent, opacity: heroOpacity }}>
            {/* 3D Badge */}
            <div style={styles.badge} className="animate-fade-in">
              <Cpu size={14} style={{ color: 'var(--primary)' }} />
              <span>Quantum Qbit v2.0 • 100% Client-Side</span>
            </div>

            <h1 style={styles.heroTitle} className="animate-fade-in">
              Zero Server Latency.<br />
              <span className="gradient-text">Absolute Privacy.</span>
            </h1>

            <p style={styles.heroSubtitle} className="animate-fade-in">
              Experience the next generation of web utility applications. Transform digital photos, convert complex PDFs, and compute math formulas directly in your browser without uploading files to remote servers.
            </p>

            {/* Quick Action Buttons */}
            <div style={styles.ctaGroup} className="animate-fade-in">
              <button className="btn-primary" onClick={() => navigate('/tools')}>
                <Sparkles size={16} /> Explore Tools
              </button>
              <button className="btn-secondary" onClick={() => navigate('/blogs')}>
                <BookOpen size={16} /> Read Articles
              </button>
            </div>

            {/* Trust Highlights / Privacy Guarantees */}
            <div style={styles.trustRow}>
              <div style={styles.trustItem}>
                <Shield size={16} style={{ color: 'var(--primary)' }} />
                <span>Zero File Uploads</span>
              </div>
              <div style={styles.trustItem}>
                <Zap size={16} style={{ color: 'var(--secondary)' }} />
                <span>Sub-Second WASM</span>
              </div>
              <div style={styles.trustItem}>
                <Award size={16} style={{ color: 'var(--accent)' }} />
                <span>Open & Free</span>
              </div>
            </div>
          </div>

          {/* Hero Right Column: Interactive 3D Mascot & Scene */}
          <div
            style={{
              ...styles.hero3DCol,
              transform: `translateY(${translateY}px) perspective(1000px) rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 8}deg)`,
              opacity: heroOpacity
            }}
          >
            {/* Interactive Animated Mascot Qbi */}
            <div style={styles.companionWrapper}>
              <QuantumCompanion mousePos={mousePos} />
            </div>
          </div>
        </div>
      </section>

      {/* Horizontally Scrollable / 3D Tilt Tools Directory */}
      <section className="reveal-on-scroll" style={styles.showcaseSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <div style={styles.sectionBadge}>
              <Sparkles size={14} /> Local Utilities
            </div>
            <h2 style={styles.sectionTitle}>Quantum Utilities Directory</h2>
            <p style={styles.sectionSubtitle}>Select an offline-first utility application to start instant in-browser processing.</p>
          </div>

          <div className="horizontal-scroll-row">
            {/* Card 1: Image Studio */}
            <TiltCard className="glass-card horizontal-scroll-card" maxTilt={8} scale={1.02}>
              <div className="scroll-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="scroll-card-title">
                    <div style={styles.cardIconBox}>
                      <ImageIcon size={22} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span>Image Studio</span>
                  </h3>
                  <span style={styles.categoryPill}>Canvas API</span>
                </div>
                <p className="scroll-card-desc">
                  Edit, compress, crop, and convert digital images locally in high definition without server lag or quality loss.
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
            </TiltCard>

            {/* Card 2: PDF Workshop */}
            <TiltCard className="glass-card horizontal-scroll-card" maxTilt={8} scale={1.02}>
              <div className="scroll-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="scroll-card-title">
                    <div style={{ ...styles.cardIconBox, background: 'var(--secondary-glow)' }}>
                      <FileText size={22} style={{ color: 'var(--secondary)' }} />
                    </div>
                    <span>PDF Workshop</span>
                  </h3>
                  <span style={{ ...styles.categoryPill, color: 'var(--secondary)' }}>PDF.js Core</span>
                </div>
                <p className="scroll-card-desc">
                  Shrink PDF sizes, convert images to standard documents, and parse text offline with absolute safety.
                </p>
                <div className="scroll-card-links-grid">
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/pdf-compressor')}>Compressor</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/images-to-pdf')}>Images to PDF</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/convert-to-pdf')}>Office to PDF</button>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/tools/pdf-to-word')}>PDF to Word</button>
                </div>
              </div>
            </TiltCard>

            {/* Card 3: Math Calculator */}
            <TiltCard className="glass-card horizontal-scroll-card" maxTilt={8} scale={1.02}>
              <div className="scroll-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="scroll-card-title">
                    <div style={styles.cardIconBox}>
                      <Calculator size={22} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span>Math Calculator</span>
                  </h3>
                  <span style={styles.categoryPill}>Math Engine</span>
                </div>
                <p className="scroll-card-desc">
                  High-precision scientific computation, hexadecimal/binary radix conversion, unit adapter, and equation solver.
                </p>
                <div className="scroll-card-links-grid">
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-scientific')}>Scientific</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-base')}>Base Radix</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-unit')}>Unit Adapter</button>
                  <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-solver')}>Equation Solver</button>
                  <button className="scroll-card-link-btn" style={{ gridColumn: 'span 2' }} onClick={() => navigate('/tools/math-plotter')}>2D Graph Plotter</button>
                </div>
              </div>
            </TiltCard>

            {/* Card 4: PYQ Mock Tests */}
            <TiltCard className="glass-card horizontal-scroll-card" maxTilt={8} scale={1.02}>
              <div className="scroll-card-content">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 className="scroll-card-title">
                    <div style={{ ...styles.cardIconBox, background: 'var(--secondary-glow)' }}>
                      <Award size={22} style={{ color: 'var(--secondary)' }} />
                    </div>
                    <span>PYQ Mock Tests</span>
                  </h3>
                  <span style={{ ...styles.categoryPill, color: 'var(--secondary)' }}>CBT Simulator</span>
                </div>
                <p className="scroll-card-desc">
                  Practice standard Technical Assistant and Engineer competitive exams with genuine Computer Based Test interfaces.
                </p>
                <div className="scroll-card-links-grid">
                  <a
                    href="/isro-ta-computer-science-pyq/"
                    className="scroll-card-link-btn btn-purple"
                    style={{ gridColumn: 'span 2', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    ISRO TA CS Mock Test <ArrowRight size={14} />
                  </a>
                  <button className="scroll-card-link-btn btn-purple" onClick={() => navigate('/mock-tests')} style={{ gridColumn: 'span 2' }}>
                    Browse All Mock Tests
                  </button>
                </div>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="reveal-on-scroll" style={styles.featuresSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <div style={styles.sectionBadge}>
              <ShieldCheck size={14} /> Architecture
            </div>
            <h2 style={styles.sectionTitle}>Engineered for Speed & Security</h2>
            <p style={styles.sectionSubtitle}>We reimagined web utility tools to put user privacy and desktop-level performance first.</p>
          </div>
          <div style={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <TiltCard key={idx} className="glass-card" style={styles.featureCard} maxTilt={6}>
                <div style={styles.featureIconContainer}>
                  {feature.icon}
                </div>
                <h3 style={styles.featureTitle}>{feature.title}</h3>
                <p style={styles.featureDesc}>{feature.description}</p>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Blogs & Articles Section */}
      <section className="reveal-on-scroll" style={styles.blogsSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <div style={styles.sectionBadge}>
              <BookOpen size={14} /> Knowledge Base
            </div>
            <h2 style={styles.sectionTitle}>Latest Engineering Articles</h2>
            <p style={styles.sectionSubtitle}>Stay informed with in-depth guides on privacy, cryptography, web performance, and math.</p>
          </div>

          <div className="horizontal-scroll-row">
            {posts.map((post) => (
              <TiltCard key={post.id} className="glass-card blog-scroll-card" maxTilt={6} scale={1.02}>
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
                    style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    Read <ArrowRight size={12} />
                  </button>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="reveal-on-scroll" style={styles.ctaSection}>
        <TiltCard className="glass-card" style={styles.ctaCard} maxTilt={4}>
          <div style={styles.ctaIconBadge}>
            <Sparkles size={24} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={styles.ctaTitle}>Ready to experience privacy-first web utilities?</h2>
          <p style={styles.ctaDesc}>
            All tools run 100% locally in your browser. No file tracking, zero server latency, completely free to use.
          </p>
          <div style={styles.ctaButtons}>
            <button className="btn-primary" onClick={() => navigate('/tools')}>
              <Sparkles size={16} /> Open Web Utilities
            </button>
            <button className="btn-secondary" onClick={() => navigate('/about')}>
              Learn About Our Mission
            </button>
          </div>
        </TiltCard>
      </section>
    </div>
  );
};

const styles = {
  landing: {
    paddingBottom: '80px',
    position: 'relative' as const,
  },
  heroSection: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '70px 24px 90px 24px',
    overflow: 'hidden',
    minHeight: '82vh',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.85fr',
    gap: '40px',
    alignItems: 'center',
    width: '100%',
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '22px',
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
  companionWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    background: 'var(--bg-card)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--border-glass-active)',
    borderRadius: '28px',
    padding: '24px 28px',
    boxShadow: 'var(--shadow-card)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-glass-active)',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
  },
  heroTitle: {
    fontSize: 'clamp(2.4rem, 5.2vw, 4.0rem)',
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    letterSpacing: '-0.03em',
  },
  heroSubtitle: {
    fontSize: 'clamp(1rem, 1.8vw, 1.12rem)',
    color: 'var(--text-secondary)',
    lineHeight: 1.65,
    maxWidth: '560px',
    margin: 0,
  },
  ctaGroup: {
    display: 'flex',
    gap: '14px',
    marginTop: '6px',
    flexWrap: 'wrap' as const,
  },
  trustRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    marginTop: '10px',
    paddingTop: '16px',
    borderTop: '1px solid var(--border-glass)',
    flexWrap: 'wrap' as const,
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  showcaseSection: {
    padding: '60px 0',
  },
  sectionHeader: {
    textAlign: 'center' as const,
    marginBottom: '36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    alignItems: 'center',
  },
  sectionBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.78rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: 'var(--primary)',
    background: 'var(--primary-glow)',
    padding: '4px 12px',
    borderRadius: '100px',
    marginBottom: '4px',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8rem, 3.8vw, 2.4rem)',
    fontWeight: 700,
    margin: 0,
  },
  sectionSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '0.98rem',
    maxWidth: '540px',
    margin: 0,
    lineHeight: 1.55,
  },
  cardIconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '10px',
    background: 'var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPill: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: 'var(--primary)',
    background: 'var(--bg-card)',
    border: '1px solid var(--border-glass)',
    padding: '3px 8px',
    borderRadius: '6px',
  },
  featuresSection: {
    padding: '70px 0',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    padding: '32px',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  featureIconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'var(--primary-glow)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    margin: 0,
  },
  featureDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.94rem',
    margin: 0,
  },
  blogsSection: {
    padding: '60px 0',
  },
  ctaSection: {
    position: 'relative' as const,
    padding: '60px 24px 80px 24px',
    display: 'flex',
    justifyContent: 'center',
  },
  ctaCard: {
    maxWidth: '880px',
    width: '100%',
    padding: '54px 36px',
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '18px',
  },
  ctaIconBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--primary-glow)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '6px',
  },
  ctaTitle: {
    fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)',
    fontWeight: 700,
    margin: 0,
  },
  ctaDesc: {
    color: 'var(--text-secondary)',
    maxWidth: '580px',
    lineHeight: 1.6,
    fontSize: '0.96rem',
    margin: 0,
  },
  ctaButtons: {
    display: 'flex',
    gap: '14px',
    marginTop: '8px',
    flexWrap: 'wrap' as const,
    justifyContent: 'center',
  },
};

export default LandingPage;
