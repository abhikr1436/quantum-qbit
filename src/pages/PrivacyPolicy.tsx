import React from 'react';
import { Shield, Lock, Eye, HardDrive, Info } from 'lucide-react';

interface PrivacyPolicyProps {
  setCurrentPage: (page: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ setCurrentPage }) => {
  const handleBackToHome = () => {
    setCurrentPage('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.policyPage}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.badge}>Privacy Center</span>
          <h1 style={styles.title}>Privacy Policy</h1>
          <p style={styles.subtitle}>
            Last updated: May 22, 2026. At Quantum Qbit, your privacy is our architectural foundation.
          </p>
        </div>

        {/* Highlight Card */}
        <div className="glass-card" style={styles.highlightCard}>
          <div style={styles.glowBg}></div>
          <div style={styles.highlightContent}>
            <Shield size={36} style={{ color: 'var(--primary)', marginBottom: '16px' }} />
            <h2 style={styles.highlightTitle}>100% Local Processing Guarantee</h2>
            <p style={styles.highlightText}>
              Unlike traditional utility websites that upload your files to remote cloud servers for editing, compressing, or calculating, <strong>Quantum Qbit does not upload your files anywhere</strong>. All operations on images, PDFs, math inputs, and converters are processed entirely inside your browser's memory using client-side execution.
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div style={styles.sectionsContainer}>
          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <Lock size={18} style={styles.icon} />
              1. Information We Do Not Collect
            </h3>
            <p style={styles.text}>
              Because all tools run 100% locally on your computer or device, we do not have access to, store, or share:
            </p>
            <ul style={styles.list}>
              <li>Images, photographs, or graphics you crop, scale, or edit.</li>
              <li>PDF files, documents, or presentations you compress or manipulate.</li>
              <li>Values, mathematical formulas, equations, or numbers you input into our calculators and base converters.</li>
              <li>Private text inputs or files processed by other modules on this site.</li>
            </ul>
            <p style={styles.text}>
              All file buffers and inputs are destroyed as soon as you close the browser tab or reload the application page.
            </p>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <HardDrive size={18} style={styles.icon} />
              2. Browser Storage & Cache
            </h3>
            <p style={styles.text}>
              We use standard browser storage options (like LocalStorage) strictly to improve your immediate user experience:
            </p>
            <ul style={styles.list}>
              <li><strong>Theme Preferences:</strong> Storing your selected color theme (Light Mode vs. Dark Mode) so it persists on subsequent visits.</li>
              <li><strong>Blog Cache:</strong> Periodically caching blog content locally to speed up navigation.</li>
            </ul>
            <p style={styles.text}>
              You can clear your browser cache and site data at any time to delete these stored parameters.
            </p>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <Eye size={18} style={styles.icon} />
              3. Server Logs and Hosting
            </h3>
            <p style={styles.text}>
              Our website is hosted on Hostinger. Like most web servers, Hostinger automatically compiles standard web server logs when you visit the site. These logs may include your IP address, browser type, referral paths, and timestamps.
            </p>
            <p style={styles.text}>
              These logs are used purely for security purposes, network performance monitoring, and server diagnostics. They are not linked to any personal files, since no file uploads occur.
            </p>
          </div>

          <div className="glass-card" style={styles.sectionCard}>
            <h3 style={styles.sectionTitle}>
              <Info size={18} style={styles.icon} />
              4. Contact & Correspondence
            </h3>
            <p style={styles.text}>
              If you contact us directly via email (e.g., at <a href="mailto:abhijeetkumar.workonly@gmail.com" style={{ color: 'var(--primary)' }}>abhijeetkumar.workonly@gmail.com</a>) or through our contact page, we receive the details you choose to share (such as your name, email address, and inquiry content). We use this information solely to respond to your request and never share it with third-party advertisers.
            </p>
          </div>
        </div>

        {/* Back Button */}
        <div style={styles.backContainer}>
          <button className="btn-primary" onClick={handleBackToHome}>
            Return to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  policyPage: {
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
  highlightCard: {
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
    background: 'radial-gradient(circle, rgba(0, 242, 254, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  highlightContent: {
    position: 'relative' as const,
    zIndex: 2,
  },
  highlightTitle: {
    fontSize: '1.5rem',
    fontWeight: 700,
    marginBottom: '12px',
  },
  highlightText: {
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
    color: 'var(--primary)',
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

export default PrivacyPolicy;
