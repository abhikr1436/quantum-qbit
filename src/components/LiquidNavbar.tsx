import React, { useState, useEffect } from 'react';
import { Sun, Moon, Sparkles, Image as ImageIcon, FileText, Menu, X, ShieldCheck, BookOpen } from 'lucide-react';

interface LiquidNavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  currentPage,
  setCurrentPage,
  theme,
  toggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (page: string) => {
    setCurrentPage(page);
    setMobileMenuOpen(false);
  };

  return (
    <header style={{
      ...styles.headerWrapper,
      paddingTop: isScrolled ? '12px' : '20px',
    }}>
      <div style={{
        ...styles.navPill,
        background: isScrolled
          ? (theme === 'dark' ? 'rgba(12, 16, 26, 0.75)' : 'rgba(255, 255, 255, 0.82)')
          : 'var(--glass-bg)',
      }}>
        {/* Brand Logo & Name */}
        <div
          style={styles.brand}
          onClick={() => handleNavClick('landing')}
          role="button"
          tabIndex={0}
          aria-label="Quantum Qbit Home"
        >
          <div style={styles.logoWrapper}>
            <img
              src="/favicon_qq.png"
              alt="Quantum Qbit Logo"
              style={styles.logoImg}
            />
          </div>
          <div style={styles.brandTextContainer}>
            <span style={styles.brandTitle} className="liquid-gradient-text">Quantum Qbit</span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={styles.desktopNav} aria-label="Main Navigation">
          <button
            onClick={() => handleNavClick('landing')}
            style={{
              ...styles.navItem,
              ...(currentPage === 'landing' ? styles.navItemActive : {}),
            }}
          >
            <Sparkles size={16} />
            <span>Studio Hub</span>
          </button>

          <button
            onClick={() => handleNavClick('image-studio')}
            style={{
              ...styles.navItem,
              ...(currentPage === 'image-studio' ? styles.navItemActive : {}),
            }}
          >
            <ImageIcon size={16} />
            <span>Image Studio</span>
          </button>

          <button
            onClick={() => handleNavClick('pdf-workshop')}
            style={{
              ...styles.navItem,
              ...(currentPage === 'pdf-workshop' ? styles.navItemActive : {}),
            }}
          >
            <FileText size={16} />
            <span>PDF Workshop</span>
          </button>

          <button
            onClick={() => handleNavClick('blogs')}
            style={{
              ...styles.navItem,
              ...(currentPage === 'blogs' ? styles.navItemActive : {}),
            }}
          >
            <BookOpen size={16} />
            <span>Articles</span>
          </button>
        </nav>

        {/* Right Actions: Local Privacy Badge & Theme Switcher */}
        <div style={styles.rightActions}>
          <div style={styles.privacyBadge} title="All image and PDF processing occurs 100% locally in your browser memory">
            <span style={styles.pulseDot} />
            <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
            <span style={styles.privacyText}>100% Local</span>
          </div>

          <button
            onClick={toggleTheme}
            style={styles.iconButton}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={18} style={{ color: '#FDB813' }} />
            ) : (
              <Moon size={18} style={{ color: '#6366F1' }} />
            )}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={styles.mobileMenuBtn}
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileDropdown} className="liquid-glass-card">
          <button
            onClick={() => handleNavClick('landing')}
            style={{
              ...styles.mobileNavItem,
              ...(currentPage === 'landing' ? styles.mobileNavItemActive : {}),
            }}
          >
            <Sparkles size={18} />
            <span>Studio Hub</span>
          </button>
          <button
            onClick={() => handleNavClick('image-studio')}
            style={{
              ...styles.mobileNavItem,
              ...(currentPage === 'image-studio' ? styles.mobileNavItemActive : {}),
            }}
          >
            <ImageIcon size={18} />
            <span>Image Studio</span>
          </button>
          <button
            onClick={() => handleNavClick('pdf-workshop')}
            style={{
              ...styles.mobileNavItem,
              ...(currentPage === 'pdf-workshop' ? styles.mobileNavItemActive : {}),
            }}
          >
            <FileText size={18} />
            <span>PDF Workshop</span>
          </button>
          <button
            onClick={() => handleNavClick('blogs')}
            style={{
              ...styles.mobileNavItem,
              ...(currentPage === 'blogs' ? styles.mobileNavItemActive : {}),
            }}
          >
            <BookOpen size={18} />
            <span>Articles</span>
          </button>

          <div style={styles.mobileDivider} />

          <div style={styles.mobileFooterLinks}>
            <button onClick={() => handleNavClick('about')} style={styles.mobileSubLink}>About</button>
            <button onClick={() => handleNavClick('contact')} style={styles.mobileSubLink}>Contact</button>
            <button onClick={() => handleNavClick('privacy')} style={styles.mobileSubLink}>Privacy</button>
            <button onClick={() => handleNavClick('terms')} style={styles.mobileSubLink}>Terms</button>
          </div>
        </div>
      )}
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  headerWrapper: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    paddingLeft: '16px',
    paddingRight: '16px',
    transition: 'var(--transition-smooth)',
  },
  navPill: {
    width: '100%',
    maxWidth: '1240px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    borderRadius: 'var(--radius-full)',
    backdropFilter: 'blur(28px) saturate(190%)',
    WebkitBackdropFilter: 'blur(28px) saturate(190%)',
    border: '1px solid var(--glass-border)',
    boxShadow: 'var(--shadow-glass)',
    transition: 'var(--transition-smooth)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    userSelect: 'none',
  },
  logoWrapper: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 0 15px var(--primary-glow)',
    overflow: 'hidden',
  },
  logoImg: {
    width: '28px',
    height: '28px',
    objectFit: 'contain',
  },
  brandTextContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    lineHeight: 1.1,
  },
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  brandTag: {
    fontSize: '0.62rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: 'var(--text-muted)',
  },
  desktopNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  navItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'var(--transition-fast)',
  },
  navItemActive: {
    background: 'var(--glass-bg-hover)',
    color: 'var(--primary)',
    border: '1px solid var(--border-glass-active)',
    boxShadow: '0 0 16px var(--primary-glow)',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  privacyBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    borderRadius: 'var(--radius-full)',
    padding: '4px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--emerald)',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--emerald)',
    boxShadow: '0 0 8px var(--emerald)',
  },
  privacyText: {
    letterSpacing: '0.02em',
  },
  iconButton: {
    background: 'var(--glass-bg)',
    border: '1px solid var(--glass-border)',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'var(--transition-fast)',
  },
  mobileMenuBtn: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '4px',
  },
  mobileDropdown: {
    width: '100%',
    maxWidth: '1240px',
    marginTop: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    animation: 'liquidFloat 0.3s ease',
  },
  mobileNavItem: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textAlign: 'left' as const,
  },
  mobileNavItemActive: {
    background: 'var(--glass-bg-hover)',
    color: 'var(--primary)',
    border: '1px solid var(--border-glass-active)',
  },
  mobileDivider: {
    height: '1px',
    background: 'var(--glass-border)',
    margin: '8px 0',
  },
  mobileFooterLinks: {
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: '6px',
  },
  mobileSubLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};

// Add CSS media query for mobile toggle
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @media (max-width: 860px) {
      header nav[aria-label="Main Navigation"] {
        display: none !important;
      }
      header button[aria-label="Toggle mobile menu"] {
        display: flex !important;
      }
      .privacy-badge-hide-mobile {
        display: none !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

export default LiquidNavbar;
