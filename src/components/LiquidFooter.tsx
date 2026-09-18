import React from 'react';
import { ShieldCheck, Cpu, ArrowUpRight, Heart } from 'lucide-react';

interface LiquidFooterProps {
  setCurrentPage: (page: string) => void;
}

export const LiquidFooter: React.FC<LiquidFooterProps> = ({ setCurrentPage }) => {
  return (
    <footer style={styles.footerWrapper}>
      <div style={styles.footerCard} className="liquid-glass-card">
        <div style={styles.grid}>
          {/* Brand & Mission */}
          <div style={styles.brandCol}>
            <div style={styles.brandHeader}>
              <img src="/favicon_qq.png" alt="Quantum Qbit" style={styles.logoImg} />
              <span style={styles.brandTitle} className="liquid-gradient-text">Quantum Qbit</span>
            </div>
            <p style={styles.brandDesc}>
              A pure client-side media workshop engineered with liquid glass aesthetics.
              All image manipulation and PDF rendering run 100% locally in your device's memory.
            </p>
            <div style={styles.badgeRow}>
              <span className="liquid-glass-pill" style={styles.specBadge}>
                <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
                <span>Zero Server Uploads</span>
              </span>
              <span className="liquid-glass-pill" style={styles.specBadge}>
                <Cpu size={14} style={{ color: 'var(--primary)' }} />
                <span>WebAssembly Speed</span>
              </span>
            </div>
          </div>

          {/* Quick Tools */}
          <div style={styles.linkCol}>
            <h4 style={styles.linkTitle}>Media Tools</h4>
            <ul style={styles.linkList}>
              <li>
                <button onClick={() => setCurrentPage('image-studio')} style={styles.linkBtn}>
                  Image Studio <ArrowUpRight size={13} />
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('pdf-workshop')} style={styles.linkBtn}>
                  PDF Workshop <ArrowUpRight size={13} />
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('image-studio')} style={styles.linkBtn}>
                  Photo Compressor & DPI
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('pdf-workshop')} style={styles.linkBtn}>
                  Merge & Split PDFs
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('blogs')} style={styles.linkBtn}>
                  Articles & Guides <ArrowUpRight size={13} />
                </button>
              </li>
            </ul>
          </div>

          {/* Trust & Company (Crucial for AdSense & Compliance) */}
          <div style={styles.linkCol}>
            <h4 style={styles.linkTitle}>Trust & Policies</h4>
            <ul style={styles.linkList}>
              <li>
                <button onClick={() => setCurrentPage('about')} style={styles.linkBtn}>
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('contact')} style={styles.linkBtn}>
                  Contact Support
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('privacy')} style={styles.linkBtn}>
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('terms')} style={styles.linkBtn}>
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentPage('admin')} style={{ ...styles.linkBtn, color: 'var(--text-muted)' }}>
                  Admin Console
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={styles.bottomBar}>
          <div style={styles.copyText}>
            © {new Date().getFullYear()} Quantum Qbit. Built with liquid glass precision.
          </div>
          <div style={styles.signature}>
            <span>Crafted for privacy and performance</span>
            <Heart size={13} style={{ color: 'var(--accent)', fill: 'var(--accent)' }} />
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footerWrapper: {
    width: '100%',
    padding: '40px 16px 24px 16px',
    display: 'flex',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  footerCard: {
    width: '100%',
    maxWidth: '1240px',
    padding: '40px 32px 24px 32px',
    borderRadius: 'var(--radius-xl)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '36px',
    marginBottom: '32px',
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    gridColumn: 'span 2',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  logoImg: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
  },
  brandDesc: {
    fontSize: '0.9rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    maxWidth: '460px',
  },
  badgeRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '4px',
  },
  specBadge: {
    fontSize: '0.78rem',
    padding: '4px 12px',
  },
  linkCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  linkTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.02em',
  },
  linkList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  linkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontSize: '0.88rem',
    cursor: 'pointer',
    padding: 0,
    textAlign: 'left' as const,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'var(--transition-fast)',
  },
  bottomBar: {
    borderTop: '1px solid var(--glass-border)',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  copyText: {
    color: 'var(--text-muted)',
  },
  signature: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};

export default LiquidFooter;
