import React from 'react';
import { Shield, Lock, HardDrive, Info, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { navigate } from '../utils/router';

interface PrivacyPolicyProps {
  setCurrentPage?: (page: string) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>LEGAL & PRIVACY COMPLIANCE</span>
        </div>
        <h1 style={styles.title}>Privacy Policy</h1>
        <p style={styles.subtitle}>
          Last Updated: September 2026. At Quantum Qbit, client-side privacy is our foundational architecture.
        </p>
      </div>

      {/* Guarantee Hero Card */}
      <div className="liquid-glass-card" style={styles.heroCard}>
        <div style={styles.heroIconWrap}>
          <Shield size={32} style={{ color: 'var(--emerald)' }} />
        </div>
        <div>
          <h2 style={styles.heroTitle}>100% In-Browser Processing Guarantee</h2>
          <p style={styles.heroText}>
            Unlike legacy online utility websites that transfer your photos and documents to remote cloud storage, 
            <strong> Quantum Qbit never uploads your files</strong>. All image operations (cropping, resizing, compression, DPI injection, format conversion) 
            and PDF operations (merging, splitting, OCR, image extraction) execute 100% locally in your device's memory.
          </p>
        </div>
      </div>

      {/* Structured Sections */}
      <div style={styles.sections}>
        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <Lock size={18} style={{ color: 'var(--primary)' }} />
            <span>1. User Data We Do Not Collect or Store</span>
          </h3>
          <p style={styles.text}>
            Because all tools operate client-side in RAM:
          </p>
          <ul style={styles.list}>
            <li>We do NOT collect, inspect, store, or transmit your images, photographs, or graphics.</li>
            <li>We do NOT collect, inspect, store, or transmit your PDF files, contracts, or scanned documents.</li>
            <li>We do NOT require user account creation, logins, passwords, or personal identity verification.</li>
            <li>All memory buffers are instantly wiped when you close the tab or reload the application.</li>
          </ul>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <HardDrive size={18} style={{ color: 'var(--secondary)' }} />
            <span>2. Local Storage and Preferences</span>
          </h3>
          <p style={styles.text}>
            Quantum Qbit uses standard browser <code>localStorage</code> strictly for immediate client-side UI convenience:
          </p>
          <ul style={styles.list}>
            <li><strong>Theme Preference:</strong> Retaining your preferred mode (Light or Dark) across sessions.</li>
            <li>No personal identifiable information (PII) is ever written to your browser storage.</li>
          </ul>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <Info size={18} style={{ color: 'var(--accent)' }} />
            <span>3. Advertising & Cookies (Google AdSense Compliance)</span>
          </h3>
          <p style={styles.text}>
            We partner with Google AdSense to serve ads when you visit our website. Google, as a third-party vendor, uses cookies to serve ads on our site:
          </p>
          <ul style={styles.list}>
            <li>Google's use of advertising cookies enables it and its partners to serve ads to our users based on their visit to our site and/or other sites on the Internet.</li>
            <li>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={styles.link}>Google Ads Settings</a>.</li>
            <li>Alternatively, users can opt out of third-party vendor use of cookies for personalized advertising by visiting <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" style={styles.link}>aboutads.info</a>.</li>
          </ul>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <CheckCircle2 size={18} style={{ color: 'var(--emerald)' }} />
            <span>4. GDPR & CCPA Compliance</span>
          </h3>
          <p style={styles.text}>
            We respect user rights under the General Data Protection Regulation (GDPR) and California Consumer Privacy Act (CCPA). 
            Because we do not collect personal file data, your confidential intellectual property and media are completely isolated on your machine.
          </p>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <Shield size={18} style={{ color: 'var(--primary)' }} />
            <span>5. Contact Privacy Team</span>
          </h3>
          <p style={styles.text}>
            If you have questions regarding this Privacy Policy or our security architecture, please contact us at:
            <br />
            <strong>Email:</strong> <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>contactus@quantumqbit.in</span>
          </p>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <button onClick={() => navigate('/')} className="liquid-glass-btn-secondary">
          <ArrowLeft size={16} />
          <span>Return to Studio Hub</span>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '900px',
    margin: '0 auto',
    padding: '40px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
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
    fontSize: '1rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
  },
  heroCard: {
    padding: '30px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
  },
  heroIconWrap: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    flexShrink: 0,
  },
  heroTitle: {
    fontSize: '1.35rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    marginBottom: '8px',
  },
  heroText: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  sections: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  card: {
    padding: '28px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  text: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  list: {
    listStylePosition: 'inside' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
  },
  link: {
    color: 'var(--primary)',
    textDecoration: 'underline',
  },
};

export default PrivacyPolicy;
