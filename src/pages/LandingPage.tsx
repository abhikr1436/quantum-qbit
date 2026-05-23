import React from 'react';
import { Cpu, Image, FileText, Calculator, ShieldCheck, Zap, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { navigate } from '../utils/router';

export const LandingPage: React.FC = () => {
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

  const toolsShowcase = [
    {
      id: 'image-editor',
      icon: <Image size={24} style={{ color: 'var(--primary)' }} />,
      title: "Image Studio",
      tag: "Creative",
      description: "Crop, rotate, adjust colors, apply filters, and resize images locally in high definition."
    },
    {
      id: 'pdf-editor',
      icon: <FileText size={24} style={{ color: 'var(--secondary)' }} />,
      title: "PDF Workshop",
      tag: "Productivity",
      description: "Convert photos directly to PDF and extract text data from documents instantly."
    },
    {
      id: 'math-calculators',
      icon: <Calculator size={24} style={{ color: 'var(--primary)' }} />,
      title: "Math Workbench",
      tag: "Scientific",
      description: "Scientific solver, hexadecimal-binary base converters, and comprehensive unit adapters."
    }
  ];

  const handleToolClick = (toolId: string) => {
    navigate(`/tools/${toolId}`);
  };

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
          <div style={styles.ctaGroup}>
            <button className="btn-primary" onClick={() => navigate('/tools')}>
              Explore Tools <ArrowRight size={16} />
            </button>
            <button className="btn-secondary" onClick={() => navigate('/about')}>
              Learn Our Mission
            </button>
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

      {/* Tools Showcase */}
      <section style={styles.showcaseSection}>
        <div className="container">
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Featured Utilities</h2>
            <p style={styles.sectionSubtitle}>A look at some of the tools built directly into the Quantum Qbit shell.</p>
          </div>
          <div style={styles.toolsGrid}>
            {toolsShowcase.map((tool) => (
              <div key={tool.id} className="glass-card" style={styles.toolCard}>
                <div style={styles.toolCardHeader}>
                  <div style={styles.toolIconWrapper}>{tool.icon}</div>
                  <span style={{
                    ...styles.toolTag,
                    color: tool.tag === 'Creative' ? 'var(--primary)' : 'var(--secondary)',
                    borderColor: tool.tag === 'Creative' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(157, 78, 221, 0.15)',
                    background: tool.tag === 'Creative' ? 'rgba(0, 242, 254, 0.02)' : 'rgba(157, 78, 221, 0.02)'
                  }}>{tool.tag}</span>
                </div>
                <h3 style={styles.toolTitle}>{tool.title}</h3>
                <p style={styles.toolDesc}>{tool.description}</p>
                <a
                  href={`/tools/${tool.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToolClick(tool.id);
                  }}
                  style={{ ...styles.toolBtn, textDecoration: 'none' }}
                >
                  Open Application <ArrowRight size={14} style={styles.btnArrow} />
                </a>
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
  heroSection: {
    position: 'relative' as const,
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '120px 24px 80px 24px',
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
    marginBottom: '50px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
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
    padding: '80px 0',
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
