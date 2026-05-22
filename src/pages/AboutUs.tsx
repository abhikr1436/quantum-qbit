import React from 'react';
import { Shield, Zap, Sliders, Cpu, Heart, CheckCircle2 } from 'lucide-react';

export const AboutUs: React.FC = () => {
  const values = [
    {
      icon: <Shield size={22} style={{ color: 'var(--primary)' }} />,
      title: "Data Sovereignty",
      description: "We believe your files belong to you. By architecture, Quantum Qbit processes visual assets and files locally, avoiding remote server uploads."
    },
    {
      icon: <Zap size={22} style={{ color: 'var(--secondary)' }} />,
      title: "Sub-Second Velocity",
      description: "Using standard WebAssembly compilers, canvas layers, and hardware acceleration, we optimize performance to be faster than cloud processors."
    },
    {
      icon: <Sliders size={22} style={{ color: 'var(--primary)' }} />,
      title: "Minimal Design",
      description: "Utility tools should be clean, focused, and free of clutter. We focus on premium, dark obsidian styling designed for active workloads."
    }
  ];

  return (
    <div style={styles.aboutPage}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.badge}>Our Mission</span>
          <h1 style={styles.title}>About Quantum Qbit</h1>
          <p style={styles.subtitle}>
            Reimagining utility software by shifting the processing power back to the client. Modern, private, and instant.
          </p>
        </div>

        {/* Story Section */}
        <div className="glass-card" style={styles.storyCard}>
          <div style={styles.storyGlow}></div>
          <div style={styles.storyContent}>
            <h2 style={styles.storyTitle}>Shifting the Paradigm</h2>
            <p style={styles.storyText}>
              Every day, millions of users upload private images, financial documents, and textual files to unknown cloud servers just to perform basic edits—like cropping a photo or merging a PDF. This model introduces latency, raises server maintenance overhead, and compromises personal security.
            </p>
            <p style={styles.storyText}>
              <strong>Quantum Qbit was built to solve this.</strong> By leveraging the processing capabilities of modern web browsers, we compile desktop-grade algorithms directly inside client-side modules. Your device is the engine; we simply provide the controls.
            </p>
            <div style={styles.featurePoints}>
              <div style={styles.pointItem}>
                <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                <span>Zero server storage, logs, or databases</span>
              </div>
              <div style={styles.pointItem}>
                <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                <span>Runs offline once loaded in cache</span>
              </div>
              <div style={styles.pointItem}>
                <CheckCircle2 size={16} style={{ color: 'var(--primary)' }} />
                <span>Completely ad-free professional workflow</span>
              </div>
            </div>
          </div>
        </div>

        {/* Core Values Grid */}
        <div style={styles.valuesSection}>
          <h2 style={styles.valuesTitle}>Our Core Values</h2>
          <div style={styles.valuesGrid}>
            {values.map((val, idx) => (
              <div key={idx} className="glass-card" style={styles.valueCard}>
                <div style={styles.valueIconCircle}>
                  {val.icon}
                </div>
                <h3 style={styles.valueCardTitle}>{val.title}</h3>
                <p style={styles.valueCardDesc}>{val.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Banner */}
        <div className="glass-card" style={styles.techBanner}>
          <Cpu size={32} style={styles.techIcon} />
          <div>
            <h3 style={styles.techTitle}>Powered by Edge Computing</h3>
            <p style={styles.techDesc}>
              We compile code to utilize modern JS runtimes, Canvas APIs, and browser memory states to process file transformations instantaneously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  aboutPage: {
    padding: '60px 0 100px 0',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '54px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    alignItems: 'center',
  },
  badge: {
    fontSize: '0.8rem',
    background: 'rgba(0, 242, 254, 0.05)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    padding: '4px 12px',
    borderRadius: '100px',
    color: 'var(--primary)',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    maxWidth: '600px',
    lineHeight: 1.5,
  },
  storyCard: {
    padding: '48px',
    position: 'relative' as const,
    overflow: 'hidden',
    marginBottom: '80px',
  },
  storyGlow: {
    position: 'absolute' as const,
    bottom: '-50px',
    right: '-50px',
    width: '250px',
    height: '250px',
    background: 'radial-gradient(circle, rgba(157, 78, 221, 0.05) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  storyContent: {
    position: 'relative' as const,
    zIndex: 2,
    maxWidth: '800px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  storyTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    marginBottom: '6px',
  },
  storyText: {
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    fontSize: '1.02rem',
  },
  featurePoints: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    marginTop: '12px',
  },
  pointItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontWeight: 500,
  },
  valuesSection: {
    marginBottom: '80px',
  },
  valuesTitle: {
    fontSize: '1.75rem',
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: '40px',
  },
  valuesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
  },
  valueCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    textAlign: 'left' as const,
  },
  valueIconCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  valueCardDesc: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.92rem',
  },
  techBanner: {
    display: 'flex',
    alignItems: 'center',
    padding: '30px',
    gap: '24px',
    background: 'linear-gradient(135deg, rgba(255,255,255,0.01) 0%, rgba(255,255,255,0.03) 100%)',
    flexWrap: 'wrap' as const,
  },
  techIcon: {
    color: 'var(--primary)',
    filter: 'drop-shadow(0 0 8px rgba(0, 242, 254, 0.4))',
  },
  techTitle: {
    fontSize: '1.2rem',
    fontWeight: 600,
    marginBottom: '4px',
  },
  techDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    maxWidth: '700px',
  },
};

export default AboutUs;
