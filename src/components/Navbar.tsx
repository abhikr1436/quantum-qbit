import React, { useState } from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentPage, 
  setCurrentPage, 
  theme, 
  toggleTheme,
  setSidebarOpen
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'landing', label: 'Home' },
    { id: 'tools', label: 'Tools' },
    { id: 'blogs', label: 'Blog' },
    { id: 'about', label: 'About Us' },
    { id: 'contact', label: 'Contact Us' },
  ];

  const getHref = (id: string) => id === 'landing' ? '/' : `/${id}`;

  const handleNavClick = (pageId: string) => {
    setCurrentPage(pageId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {currentPage !== 'admin' && (
            <button
              onClick={() => setSidebarOpen(true)}
              style={styles.sidebarToggleBtn}
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
              className="theme-toggle-btn"
            >
              <Menu size={20} />
            </button>
          )}
          <a href="/" onClick={(e) => { e.preventDefault(); handleNavClick('landing'); }} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <div style={styles.logoContainer}>
              <img src="/logo.png" alt="Quantum Qbit Logo" className="logo-img" width="63" height="34" />
            </div>
          </a>
        </div>

        {/* Right Area (Desktop navigation, Theme Toggle, Mobile Hamburger) */}
        <div style={styles.rightContainer}>
          {/* Desktop Navigation */}
          <div className="desktop-nav" style={styles.desktopNav}>
            {navItems.map((item) => (
              <a
                key={item.id}
                href={getHref(item.id)}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                style={{
                  ...styles.navLink,
                  display: 'inline-block',
                  textDecoration: 'none',
                  textAlign: 'center',
                  ...(currentPage === item.id ? styles.activeNavLink : {}),
                }}
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            style={styles.themeToggleBtn}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-toggle"
            style={styles.mobileToggle}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div style={styles.mobileDrawer}>
          {navItems.map((item) => (
            <a
              key={item.id}
              href={getHref(item.id)}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              style={{
                ...styles.mobileNavLink,
                display: 'block',
                textDecoration: 'none',
                ...(currentPage === item.id ? styles.mobileActiveNavLink : {}),
              }}
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 100,
    backgroundColor: 'var(--bg-nav)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid var(--border-glass)',
    height: '70px',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.1), rgba(157, 78, 221, 0.1))',
    border: '1px solid rgba(0, 242, 254, 0.2)',
  },
  logoIcon: {
    color: 'var(--primary)',
    filter: 'drop-shadow(0 0 5px rgba(0, 242, 254, 0.5))',
  },
  logoText: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.25rem',
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  logoAccent: {
    background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  rightContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  desktopNav: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  navLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.95rem',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  activeNavLink: {
    color: 'var(--primary)',
    background: 'rgba(0, 242, 254, 0.05)',
    boxShadow: 'inset 0 0 0 1px rgba(0, 242, 254, 0.15)',
  },
  themeToggleBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  sidebarToggleBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    color: 'var(--text-primary)',
    borderRadius: '8px',
    width: '38px',
    height: '38px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  mobileToggle: {
    display: 'none',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  mobileDrawer: {
    position: 'absolute' as const,
    top: '70px',
    left: 0,
    width: '100%',
    backgroundColor: 'var(--bg-drawer)',
    borderBottom: '1px solid var(--border-glass)',
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
  },
  mobileNavLink: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 500,
    padding: '10px 16px',
    width: '100%',
    textAlign: 'left' as const,
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  mobileActiveNavLink: {
    color: 'var(--primary)',
    background: 'rgba(0, 242, 254, 0.05)',
  },
};

// Add responsive stylesheet behavior via style inject or use native media queries in css.
// We will write a small utility CSS block in index.css to make sure desktopNav / mobileToggle handles viewports correctly.
// E.g.
// @media (max-width: 768px) {
//   .desktopNav { display: none !important; }
//   .mobileToggle { display: block !important; }
// }
// Let's add this to index.css in our next steps or later.
export default Navbar;
