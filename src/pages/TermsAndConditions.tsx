import React from 'react';
import { Scale, Compass, HelpCircle, AlertTriangle, CheckSquare } from 'lucide-react';

interface TermsAndConditionsProps {
  setCurrentPage: (page: string) => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ setCurrentPage }) => {
  const handleBackToHome = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.termsPage}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.badge}>User Agreement</span>
          <h1 style={styles.title}>Terms & Conditions</h1>
          <p style={styles.subtitle}>
            Effective date: May 22, 2026. Please read this agreement before using our local-first tools.
          </p>
        </div>

        {/* Introduction Card */}
        <div className="glass-card" style={styles.introCard}>
          <div style={styles.glowBg}></div>
          <div style={styles.introContent}>
            <Scale size={36} style={{ color: 'var(--secondary)', marginBottom: '16px' }} />
            <h2 style={styles.introTitle}>Acceptance of Terms</h2>
            <p style={styles.introText}>
              By accessing and using Quantum Qbit (located at `quantumqbit.in`), you acknowledge that you have read, understood, and agreed to be bound by these Terms & Conditions and our accompanying Privacy Policy. If you do not agree, please discontinue using our site.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div style={styles.sectionsContainer}>
          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <Compass size={18} style={styles.icon} />
              1. License and Scope of Use
            </h3>
            <p style={styles.text}>
              Quantum Qbit provides high-performance, client-side utility applications (including but not limited to the Image Studio, PDF Compressor, Base Converter, and Math Workbench) completely free of charge.
            </p>
            <ul style={styles.list}>
              <li><strong>Free License:</strong> You are granted a non-exclusive, non-transferable, revocable license to utilize the tools for personal, educational, or commercial workloads.</li>
              <li><strong>Source Integrity:</strong> You must not reverse-engineer, mirror, or repackage our assets for commercial resale or distribute malicious wrappers of the application.</li>
              <li><strong>No Installation:</strong> Our applications compile directly in standard modern web browsers. No additional downloads or software extensions are required.</li>
            </ul>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <CheckSquare size={18} style={styles.icon} />
              2. User Content & Local Responsibility
            </h3>
            <p style={styles.text}>
              Because all computational workflows run on your local device CPU/GPU and inside browser memory caches:
            </p>
            <ul style={styles.list}>
              <li>You retain sole ownership, copyright, and responsibility for all files (documents, sheets, canvas drawings, graphics) you import or process.</li>
              <li>We do not monitor, store, intercept, or review the files you work with.</li>
              <li>You represent that your files do not infringe third-party intellectual property or contain malware designed to harm your local runtime environment.</li>
            </ul>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <AlertTriangle size={18} style={styles.icon} />
              3. Disclaimer of Warranties
            </h3>
            <p style={styles.text}>
              The website and all utilities are provided on an <strong>"AS IS" and "AS AVAILABLE" basis</strong> without any express or implied warranties. While we make every effort to optimize calculations and preserve file integrity (e.g., maintaining PDF layouts and pixel compression clarity):
            </p>
            <p style={styles.text}>
              We do not warrant that the calculators are free of mathematical rounding anomalies, that the PDF compressor will compress all documents without exception, or that the application will function uninterrupted during server maintenance or browser updates.
            </p>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <HelpCircle size={18} style={styles.icon} />
              4. Limitation of Liability
            </h3>
            <p style={styles.text}>
              In no event shall Quantum Qbit, its developers, or its hosting partners be liable for any direct, indirect, incidental, special, or consequential damages (including, but not limited to, loss of data, loss of business profits, computer failure, or processing latency) arising out of the use or inability to use the tools, even if advised of the possibility of such damage.
            </p>
          </div>
        </div>

        {/* Return to Homepage Button */}
        <div style={styles.backContainer}>
          <button className="btn-primary" onClick={handleBackToHome}>
            I Agree, Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  termsPage: {
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
    background: 'rgba(157, 78, 221, 0.05)',
    border: '1px solid rgba(157, 78, 221, 0.15)',
    padding: '4px 12px',
    borderRadius: '100px',
    color: 'var(--secondary)',
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
  introCard: {
    padding: '40px',
    position: 'relative' as const,
    overflow: 'hidden',
    marginBottom: '48px',
  },
  glowBg: {
    position: 'absolute' as const,
    bottom: '-100px',
    right: '-100px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(157, 78, 221, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  introContent: {
    position: 'relative' as const,
    zIndex: 2,
  },
  introTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '12px',
  },
  introText: {
    color: 'var(--text-primary)',
    lineHeight: 1.7,
    fontSize: '1.05rem',
  },
  sectionsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '30px',
  },
  sectionCard: {
    padding: '30px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'var(--text-primary)',
  },
  icon: {
    color: 'var(--secondary)',
  },
  text: {
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    fontSize: '0.96rem',
    marginBottom: '12px',
  },
  list: {
    paddingLeft: '24px',
    marginBottom: '16px',
    color: 'var(--text-secondary)',
    lineHeight: 1.7,
    fontSize: '0.96rem',
  },
  backContainer: {
    marginTop: '48px',
    display: 'flex',
    justifyContent: 'center',
  },
};

export default TermsAndConditions;
