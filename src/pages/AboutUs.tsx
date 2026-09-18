import React from 'react';
import { Shield, Zap, Sliders, Cpu, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { navigate } from '../utils/router';

export const AboutUs: React.FC = () => {
  const values = [
    {
      icon: <Shield size={22} style={{ color: 'var(--primary)' }} />,
      title: "Pure Data Sovereignty",
      description: "We believe your files belong to you alone. Quantum Qbit processes your images and PDF documents entirely in client-side memory, never sending a single byte to remote cloud servers."
    },
    {
      icon: <Zap size={22} style={{ color: 'var(--secondary)' }} />,
      title: "Sub-Second Execution",
      description: "By leveraging WebAssembly and HTML5 Canvas pipelines directly on your device, our tools operate at raw hardware speed with zero upload or download network waiting."
    },
    {
      icon: <Sliders size={22} style={{ color: 'var(--accent)' }} />,
      title: "Liquid Glass Design",
      description: "Utility tools should be aesthetically inspiring, focused, and intuitive. Our liquid glass interface offers clear tactile controls without bloated distractions."
    }
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>OUR MISSION & ARCHITECTURE</span>
        </div>
        <h1 style={styles.title}>About Quantum Qbit</h1>
        <p style={styles.subtitle}>
          Reimagining media utilities by shifting processing power back to your device. Private, fluid, and instant.
        </p>
      </div>

      {/* Story Section */}
      <div className="liquid-glass-card" style={styles.storyCard}>
        <div style={styles.storyContent}>
          <h2 style={styles.storyTitle}>The In-Browser Computing Shift</h2>
          <p style={styles.storyText}>
            Every day, millions of people upload confidential contracts, family photos, and sensitive documents to unknown third-party cloud servers just to resize an image, convert a format, or merge PDF pages. This legacy model causes latency, incurs costly server overhead, and unnecessarily exposes personal data to security risks.
          </p>
          <p style={styles.storyText}>
            <strong>Quantum Qbit was engineered to eliminate this risk entirely.</strong> Modern web browsers have evolved into desktop-class operating environments. By running WebAssembly and native Canvas pipelines locally, your computer or phone performs the computation. No external servers are involved.
          </p>
          <div style={styles.pointsGrid}>
            <div style={styles.pointItem}>
              <CheckCircle2 size={18} style={{ color: 'var(--emerald)' }} />
              <span>Zero server file uploads, databases, or logs</span>
            </div>
            <div style={styles.pointItem}>
              <CheckCircle2 size={18} style={{ color: 'var(--primary)' }} />
              <span>Full local speed without network bottlenecks</span>
            </div>
            <div style={styles.pointItem}>
              <CheckCircle2 size={18} style={{ color: 'var(--secondary)' }} />
              <span>Unlimited file size processing and no fees</span>
            </div>
          </div>
        </div>
      </div>

      {/* Core Values Grid */}
      <div style={styles.valuesSection}>
        <h2 style={styles.sectionHeading}>Our Architectural Values</h2>
        <div style={styles.valuesGrid}>
          {values.map((val, idx) => (
            <div key={idx} className="liquid-glass-card" style={styles.valueCard}>
              <div style={styles.valueIconCircle}>{val.icon}</div>
              <h3 style={styles.valueTitle}>{val.title}</h3>
              <p style={styles.valueDesc}>{val.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Computing Banner */}
      <div className="liquid-glass-card" style={styles.techBanner}>
        <div style={styles.techIconWrap}>
          <Cpu size={28} style={{ color: 'var(--primary)' }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={styles.techTitle}>Built with Modern Web Standards</h3>
          <p style={styles.techDesc}>
            Powered by WebAssembly, Web Workers, PDF.js, and Tesseract OCR for client-side text recognition. 
            All operations complete in your device's RAM.
          </p>
        </div>
        <button onClick={() => navigate('/image-studio')} className="liquid-glass-btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem' }}>
          <span>Explore Tools</span>
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '40px',
  },
  header: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    fontSize: 'clamp(2.2rem, 4vw, 3.2rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '640px',
  },
  storyCard: {
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
  },
  storyContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  storyTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
  },
  storyText: {
    fontSize: '1rem',
    lineHeight: 1.7,
    color: 'var(--text-secondary)',
  },
  pointsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '14px',
    marginTop: '12px',
  },
  pointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.92rem',
    color: 'var(--text-primary)',
  },
  valuesSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  sectionHeading: {
    fontSize: '1.8rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    textAlign: 'center' as const,
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  valueCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  valueIconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
  },
  valueTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  valueDesc: {
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  techBanner: {
    padding: '30px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    flexWrap: 'wrap' as const,
  },
  techIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 240, 255, 0.08)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
  },
  techTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
    marginBottom: '4px',
  },
  techDesc: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
};

export default AboutUs;
