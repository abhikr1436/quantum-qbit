import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Lock, 
  ArrowRight, 
  UploadCloud, 
  Sliders, 
  Crop, 
  Maximize2, 
  FileCheck, 
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { navigate } from '../utils/router';
import { AnimatedStudioDemo } from '../components/AnimatedStudioDemo';

export const LandingPage: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (file.type.includes('pdf')) {
      navigate('/pdf-workshop');
    } else {
      navigate('/image-studio');
    }
  };

  return (
    <div style={styles.container}>
      {/* Hero Section */}
      <section style={styles.heroSection}>
        <div style={styles.badgeWrapper}>
          <div className="liquid-glass-pill" style={styles.pillBadge}>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <span>IN-BROWSER WORKSHOP • 100% PRIVATE</span>
          </div>
        </div>

        <h1 style={styles.heroTitle}>
          Studio-Grade Media Utilities. <br />
          <span className="liquid-gradient-text">Zero Cloud Uploads.</span>
        </h1>

        <p style={styles.heroSubtitle}>
          Run high-performance image editing, dimension tuning, smart compression, and 
          multi-document PDF workflows 100% locally in your browser’s engine.
          Zero files sent to remote servers. Uncompromising privacy.
        </p>

        {/* Primary CTAs */}
        <div style={styles.ctaGroup}>
          <button 
            onClick={() => navigate('/image-studio')} 
            className="liquid-glass-btn-primary"
            style={styles.primaryCta}
          >
            <ImageIcon size={18} />
            <span>Launch Image Studio</span>
            <ArrowRight size={16} />
          </button>

          <button 
            onClick={() => navigate('/pdf-workshop')} 
            className="liquid-glass-btn-secondary"
            style={styles.secondaryCta}
          >
            <FileText size={18} />
            <span>Open PDF Workshop</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Liquid Trust Metrics Bar */}
        <div style={styles.metricsBar}>
          <div style={styles.metricItem}>
            <Lock size={15} style={{ color: 'var(--emerald)' }} />
            <span>100% Client-Side Privacy</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <Zap size={15} style={{ color: 'var(--primary)' }} />
            <span>Instant WebAssembly Speed</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <Layers size={15} style={{ color: 'var(--secondary)' }} />
            <span>No File Size Restrictions</span>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <ShieldCheck size={15} style={{ color: 'var(--accent)' }} />
            <span>Zero Sign-Up Required</span>
          </div>
        </div>
      </section>

      {/* Animated Interactive Studio Demo Window */}
      <section style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
        <AnimatedStudioDemo />
      </section>

      {/* Interactive Liquid Dropzone */}
      <section style={styles.dropSection}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="liquid-glass-card liquid-glass-card-interactive"
          style={{
            ...styles.dropZone,
            borderColor: isDragging ? 'var(--primary)' : 'var(--glass-border)',
            boxShadow: isDragging ? '0 0 35px var(--primary-glow)' : 'var(--shadow-glass)',
            background: isDragging ? 'var(--glass-bg-hover)' : 'var(--glass-bg)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileInputChange}
          />
          <div style={styles.dropIconRing}>
            <UploadCloud size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <div style={styles.dropTextGroup}>
            <h3 style={styles.dropTitle}>Drag & drop an image or PDF here</h3>
            <p style={styles.dropSub}>
              Instantly launches the corresponding Studio • Processed locally in memory
            </p>
          </div>
          <div className="liquid-glass-pill" style={styles.browsePill}>
            <span>Browse Device</span>
          </div>
        </div>
      </section>

      {/* Two Master Pillars Showcase */}
      <section style={styles.pillarsSection}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>
            Two Powerful Pillars. <span className="liquid-gradient-text">Pure Local Power.</span>
          </h2>
          <p style={styles.sectionDesc}>
            Everything you need for creative image editing and document management without subscription walls.
          </p>
        </div>

        <div style={styles.pillarsGrid}>
          {/* Image Studio Bento Card */}
          <div 
            className="liquid-glass-card liquid-glass-card-interactive" 
            style={styles.pillarCard}
            onClick={() => navigate('/image-studio')}
          >
            <div style={styles.pillarTop}>
              <div className="liquid-badge">
                <ImageIcon size={13} />
                <span>Creative Studio</span>
              </div>
              <div style={styles.launchIcon}>
                <ArrowRight size={18} />
              </div>
            </div>

            <h3 style={styles.pillarCardTitle}>Image Studio</h3>
            <p style={styles.pillarCardDesc}>
              A comprehensive browser-native photo editor and processing laboratory.
              Fine-tune colors, resize to pixel-exact boundaries, compress photos under target KB sizes, 
              adjust DPI for government/exam portals, crop with custom aspect ratios, and remove backdrops.
            </p>

            {/* Feature Pills */}
            <div style={styles.chipsRow}>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Crop size={13} style={{ color: 'var(--primary)' }} /> Crop & Aspect Ratios
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Maximize2 size={13} style={{ color: 'var(--secondary)' }} /> Pixel-Exact Resize
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Sliders size={13} style={{ color: 'var(--accent)' }} /> Smart KB Compressor
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <RefreshCw size={13} style={{ color: 'var(--emerald)' }} /> DPI Metadata Injector
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Sparkles size={13} style={{ color: 'var(--primary)' }} /> AI Background Remover
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <FileCheck size={13} style={{ color: 'var(--secondary)' }} /> Multi-Format Transcoder
              </span>
            </div>

            <div style={styles.pillarFooter}>
              <span style={styles.pillarActionText}>Enter Image Studio</span>
              <ArrowRight size={16} style={{ color: 'var(--primary)' }} />
            </div>
          </div>

          {/* PDF Workshop Bento Card */}
          <div 
            className="liquid-glass-card liquid-glass-card-interactive" 
            style={styles.pillarCard}
            onClick={() => navigate('/pdf-workshop')}
          >
            <div style={styles.pillarTop}>
              <div className="liquid-badge liquid-badge-secondary">
                <FileText size={13} />
                <span>Document Engine</span>
              </div>
              <div style={styles.launchIcon}>
                <ArrowRight size={18} />
              </div>
            </div>

            <h3 style={styles.pillarCardTitle}>PDF Workshop</h3>
            <p style={styles.pillarCardDesc}>
              Industrial-grade client-side PDF document manipulation.
              Merge disparate PDFs with intuitive page ordering, split multi-page archives,
              synthesize high-resolution photo albums into PDFs, extract crystal-clear images, 
              and perform client-side Tesseract OCR text recognition.
            </p>

            {/* Feature Pills */}
            <div style={styles.chipsRow}>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Layers size={13} style={{ color: 'var(--secondary)' }} /> Merge Multiple PDFs
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Crop size={13} style={{ color: 'var(--primary)' }} /> Extract & Split Pages
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <ImageIcon size={13} style={{ color: 'var(--emerald)' }} /> Images to PDF Maker
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <FileCheck size={13} style={{ color: 'var(--accent)' }} /> PDF to Image Export
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Sparkles size={13} style={{ color: 'var(--secondary)' }} /> Tesseract OCR Scanner
              </span>
              <span className="liquid-glass-pill" style={styles.chip}>
                <Lock size={13} style={{ color: 'var(--primary)' }} /> 100% Confidential
              </span>
            </div>

            <div style={styles.pillarFooter}>
              <span style={styles.pillarActionText}>Enter PDF Workshop</span>
              <ArrowRight size={16} style={{ color: 'var(--secondary)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Liquid Security & Architecture Grid */}
      <section style={styles.featuresSection}>
        <div style={styles.featuresGrid}>
          <div className="liquid-glass-card" style={styles.featureCard}>
            <div style={styles.featureIconWrap}>
              <Lock size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <h4 style={styles.featureTitle}>Absolute Data Privacy</h4>
            <p style={styles.featureText}>
              Unlike typical online file conversion websites that upload your personal documents to external cloud servers,
              Quantum Qbit executes calculations 100% in your browser memory via WebAssembly and HTML5 Canvas.
            </p>
          </div>

          <div className="liquid-glass-card" style={styles.featureCard}>
            <div style={styles.featureIconWrap}>
              <Zap size={22} style={{ color: 'var(--secondary)' }} />
            </div>
            <h4 style={styles.featureTitle}>Zero Latency Execution</h4>
            <p style={styles.featureText}>
              No waiting in conversion queues or dealing with network bandwidth upload/download bottlenecks.
              Transform gigabytes of images and documents at the native raw speed of your device hardware.
            </p>
          </div>

          <div className="liquid-glass-card" style={styles.featureCard}>
            <div style={styles.featureIconWrap}>
              <ShieldCheck size={22} style={{ color: 'var(--emerald)' }} />
            </div>
            <h4 style={styles.featureTitle}>Free Forever & No Account</h4>
            <p style={styles.featureText}>
              No email signups, no credit cards, no watermark penalties, and no rate limits.
              Open the workshop, drop your files, get high-quality results, and continue your day.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Engineering Articles Section */}
      <section style={styles.articlesSection}>
        <div style={styles.sectionHeader}>
          <div className="liquid-glass-pill" style={{ alignSelf: 'center', marginBottom: '8px' }}>
            <BookOpen size={13} style={{ color: 'var(--primary)' }} />
            <span>KNOWLEDGE BASE & GUIDES</span>
          </div>
          <h2 style={styles.sectionTitle}>
            Engineering <span className="liquid-gradient-text">Insights</span>
          </h2>
          <p style={styles.sectionDesc}>
            Explore our deep-dives into browser memory management, image compression algorithms, and client-side privacy.
          </p>
        </div>

        <div style={styles.articlesGrid}>
          <div
            className="liquid-glass-card liquid-glass-card-interactive"
            style={styles.articleCard}
            onClick={() => navigate('/blogs/why-in-browser-image-editing-is-the-future-of-privacy')}
          >
            <span className="liquid-badge">Privacy & Security</span>
            <h3 style={styles.articleCardTitle}>Why 100% In-Browser Image Editing is the Future of Digital Privacy</h3>
            <p style={styles.articleCardSummary}>
              Explore why uploading confidential documents and photos to remote cloud servers creates massive security liabilities, and how Canvas & WebAssembly solve this.
            </p>
            <span style={styles.articleCardLink}>
              <span>Read Full Article</span>
              <ArrowRight size={14} />
            </span>
          </div>

          <div
            className="liquid-glass-card liquid-glass-card-interactive"
            style={styles.articleCard}
            onClick={() => navigate('/blogs/mastering-client-side-pdf-operations-ocr-compression')}
          >
            <span className="liquid-badge liquid-badge-secondary">PDF Workflows</span>
            <h3 style={styles.articleCardTitle}>Mastering Client-Side PDF Operations: Local Merging, OCR & Compression</h3>
            <p style={styles.articleCardSummary}>
              A technical breakdown of how PDF.js, Web Workers, and Tesseract.js empower browser-native document compilation and character recognition.
            </p>
            <span style={styles.articleCardLink}>
              <span>Read Full Article</span>
              <ArrowRight size={14} />
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            onClick={() => navigate('/blogs')}
            className="liquid-glass-btn-secondary"
            style={{ padding: '10px 24px', fontSize: '0.9rem' }}
          >
            <BookOpen size={16} />
            <span>Browse All Engineering Articles</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1240px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '64px',
  },
  heroSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    paddingTop: '24px',
    gap: '24px',
  },
  badgeWrapper: {
    marginBottom: '8px',
  },
  pillBadge: {
    fontSize: '0.8rem',
    letterSpacing: '0.08em',
    padding: '8px 20px',
  },
  heroTitle: {
    fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    maxWidth: '960px',
  },
  heroSubtitle: {
    fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    maxWidth: '740px',
    margin: '0 auto',
  },
  ctaGroup: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
    marginTop: '12px',
  },
  primaryCta: {
    minWidth: '220px',
  },
  secondaryCta: {
    minWidth: '220px',
  },
  metricsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
    marginTop: '24px',
    padding: '14px 24px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-full)',
    boxShadow: 'var(--shadow-pill)',
  },
  metricItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.84rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
  },
  metricDivider: {
    width: '1px',
    height: '14px',
    background: 'var(--glass-border)',
  },
  dropSection: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  dropZone: {
    width: '100%',
    maxWidth: '960px',
    padding: '48px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    gap: '16px',
    borderStyle: 'dashed',
    borderWidth: '2px',
    borderRadius: 'var(--radius-xl)',
  },
  dropIconRing: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    boxShadow: '0 0 25px var(--primary-glow)',
  },
  dropTextGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  dropTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  dropSub: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  browsePill: {
    marginTop: '4px',
    fontSize: '0.82rem',
    color: 'var(--primary)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
  },
  pillarsSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '36px',
  },
  sectionHeader: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  sectionTitle: {
    fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  sectionDesc: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '620px',
    margin: '0 auto',
  },
  pillarsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  pillarCard: {
    padding: '36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    borderRadius: 'var(--radius-xl)',
  },
  pillarTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  launchIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-muted)',
    transition: 'var(--transition-fast)',
  },
  pillarCardTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  pillarCardDesc: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  chipsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    margin: '8px 0',
  },
  chip: {
    fontSize: '0.8rem',
    padding: '5px 12px',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  pillarFooter: {
    marginTop: 'auto',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillarActionText: {
    fontSize: '0.95rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  featuresSection: {
    width: '100%',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  featureCard: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    borderRadius: 'var(--radius-lg)',
  },
  featureIconWrap: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
  },
  featureTitle: {
    fontSize: '1.15rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  featureText: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  articlesSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  articlesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  articleCard: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    borderRadius: 'var(--radius-xl)',
  },
  articleCardTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    lineHeight: 1.35,
  },
  articleCardSummary: {
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  articleCardLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--primary)',
    marginTop: 'auto',
    paddingTop: '12px',
    borderTop: '1px solid var(--glass-border)',
  },
};

export default LandingPage;
