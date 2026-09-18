import React from 'react';
import { Scale, Compass, CheckSquare, AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import { navigate } from '../utils/router';

interface TermsAndConditionsProps {
  setCurrentPage?: (page: string) => void;
}

export const TermsAndConditions: React.FC<TermsAndConditionsProps> = () => {
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>TERMS OF SERVICE</span>
        </div>
        <h1 style={styles.title}>Terms & Conditions</h1>
        <p style={styles.subtitle}>
          Effective date: September 2026. Please review these terms governing the use of Quantum Qbit tools.
        </p>
      </div>

      {/* Intro Card */}
      <div className="liquid-glass-card" style={styles.heroCard}>
        <div style={styles.heroIconWrap}>
          <Scale size={32} style={{ color: 'var(--secondary)' }} />
        </div>
        <div>
          <h2 style={styles.heroTitle}>User Agreement & Acceptance</h2>
          <p style={styles.heroText}>
            By accessing and utilizing Quantum Qbit (<code>quantumqbit.in</code>), you agree to be bound by these Terms & Conditions 
            and our Privacy Policy. If you do not accept these terms, please discontinue using our client-side tools.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div style={styles.sections}>
        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <Compass size={18} style={{ color: 'var(--primary)' }} />
            <span>1. Free License & Permitted Usage</span>
          </h3>
          <p style={styles.text}>
            Quantum Qbit grants you a revocable, non-exclusive, non-transferable license to use the Image Studio and PDF Workshop 
            for personal, educational, or commercial workloads free of charge.
          </p>
          <ul style={styles.list}>
            <li>You may process personal photographs, commercial artwork, and business documents.</li>
            <li>You may not scrape, mirror, or repackage the application's client-side code into commercial third-party wrappers without explicit written permission.</li>
          </ul>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <CheckSquare size={18} style={{ color: 'var(--emerald)' }} />
            <span>2. User Content Responsibility</span>
          </h3>
          <p style={styles.text}>
            Because all file conversions and edits take place strictly on your local machine, you retain 100% ownership and copyright of your media. 
            You are solely responsible for ensuring you have appropriate legal rights to the images and documents you process.
          </p>
        </div>

        <div className="liquid-glass-card" style={styles.card}>
          <h3 style={styles.sectionTitle}>
            <AlertTriangle size={18} style={{ color: 'var(--accent)' }} />
            <span>3. Disclaimer of Warranties</span>
          </h3>
          <p style={styles.text}>
            The services and browser utilities are provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. 
            While our tools undergo rigorous testing, we cannot guarantee that document conversions or image compression will always meet your specific requirements.
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
    background: 'rgba(168, 85, 247, 0.1)',
    border: '1px solid rgba(168, 85, 247, 0.3)',
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
};

export default TermsAndConditions;
