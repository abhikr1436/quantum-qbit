import React, { useState } from 'react';
import { Cpu, Mail, Send } from 'lucide-react';

interface FooterProps {
  setCurrentPage: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentPage }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <div style={styles.grid}>
          {/* Brand Info */}
          <div style={styles.brandCol}>
            <div style={styles.logo} onClick={() => handleNavClick('landing')}>
              <img src="/logo.png" alt="Quantum Qbit Logo" className="logo-img" />
            </div>
            <p style={styles.description}>
              Empowering developers, designers, and students with high-performance,
              client-side web tools. No server uploads, total privacy, instant results.
            </p>
            <div style={styles.socials}>
              <a href="#" aria-label="Github" style={styles.socialLink}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>
              <a href="#" aria-label="Twitter" style={styles.socialLink}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" aria-label="LinkedIn" style={styles.socialLink}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* Site Links */}
          <div style={styles.linksCol}>
            <h4 style={styles.colTitle}>Navigation</h4>
            <ul style={styles.linksList}>
              <li><button onClick={() => handleNavClick('landing')} style={styles.footerBtn}>Home</button></li>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>Web Tools</button></li>
              <li><button onClick={() => handleNavClick('blogs')} style={styles.footerBtn}>Blog Articles</button></li>
              <li><button onClick={() => handleNavClick('about')} style={styles.footerBtn}>About Our Mission</button></li>
              <li><button onClick={() => handleNavClick('contact')} style={styles.footerBtn}>Get in Touch</button></li>
            </ul>
          </div>

          {/* Quick Tools Links */}
          <div style={styles.linksCol}>
            <h4 style={styles.colTitle}>Popular Tools</h4>
            <ul style={styles.linksList}>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>Image Editor</button></li>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>PDF Converter</button></li>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>Scientific Calculator</button></li>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>Base Number Converter</button></li>
              <li><button onClick={() => handleNavClick('tools')} style={styles.footerBtn}>Unit Calculator</button></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div style={styles.newsletterCol}>
            <h4 style={styles.colTitle}>Stay Updated</h4>
            <p style={styles.newsletterText}>
              Subscribe to get notified when we release new free tools and resources.
            </p>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.submitBtn} aria-label="Subscribe">
                <Send size={14} />
              </button>
            </form>
            {subscribed && (
              <span style={styles.successMsg}>✓ Subscribed successfully!</span>
            )}
            <div style={styles.contactEmailRow}>
              <Mail size={14} style={{ color: 'var(--primary)' }} />
              <a href="mailto:abhijeetkumar.workonly@gmail.com" style={styles.emailLink}>
                abhijeetkumar.workonly@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div style={styles.divider}></div>

        <div style={styles.footerBottom}>
          <p style={styles.copyright}>
            © {new Date().getFullYear()} Quantum Qbit. Built with privacy and speed in mind.
          </p>
          <div style={styles.bottomLinks}>
            <button onClick={() => handleNavClick('privacy')} style={styles.bottomLinkBtn}>Privacy Policy</button>
            <button onClick={() => handleNavClick('terms')} style={styles.bottomLinkBtn}>Terms & Conditions</button>
            <button onClick={() => handleNavClick('admin')} style={styles.bottomLinkBtn}>Admin Portal</button>
          </div>
        </div>
      </div>
    </footer>
  );
};

const styles = {
  footer: {
    backgroundColor: 'var(--bg-darker)',
    borderTop: '1px solid var(--border-glass)',
    padding: '60px 0 30px 0',
    marginTop: 'auto',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '40px',
    marginBottom: '40px',
  },
  brandCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    maxWidth: '300px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  logoIcon: {
    color: 'var(--primary)',
    filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.4))',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#ffffff',
  },
  logoAccent: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  description: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  socials: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
  },
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-secondary)',
    transition: 'var(--transition-smooth)',
  },
  linksCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  colTitle: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ffffff',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  linksList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  footerBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.9rem',
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
    padding: 0,
  },
  newsletterCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  newsletterText: {
    color: 'var(--text-secondary)',
    fontSize: '0.9rem',
    lineHeight: '1.5',
  },
  form: {
    display: 'flex',
    borderRadius: '8px',
    border: '1px solid var(--border-glass)',
    overflow: 'hidden',
    background: 'rgba(255, 255, 255, 0.01)',
    transition: 'var(--transition-smooth)',
    marginTop: '6px',
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '0.85rem',
    padding: '10px 14px',
    outline: 'none',
  },
  submitBtn: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    border: 'none',
    color: '#020306',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  successMsg: {
    color: '#10b981',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  contactEmailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '12px',
    fontSize: '0.85rem',
  },
  emailLink: {
    color: 'var(--text-secondary)',
    transition: 'var(--transition-fast)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)',
    margin: '30px 0 20px 0',
  },
  footerBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  copyright: {
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
  },
  bottomLinks: {
    display: 'flex',
    gap: '20px',
  },
  bottomLinkBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'var(--transition-fast)',
    padding: 0,
  },
};

// CSS updates for footer links is added to index.css for hover state
export default Footer;
