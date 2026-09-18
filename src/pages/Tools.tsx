import React, { useState } from 'react';
import { Search, Image as ImageIcon, FileText, ArrowLeft, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { navigate } from '../utils/router';

const ImageEditor = React.lazy(() => import('./tools/ImageEditor').then(m => ({ default: m.ImageEditor })));
const PdfEditor = React.lazy(() => import('./tools/PdfEditor').then(m => ({ default: m.PdfEditor })));

interface ToolsProps {
  selectedTool: string;
  setSelectedTool: (toolId: string) => void;
  defaultTab?: string;
}

export const Tools: React.FC<ToolsProps> = ({ selectedTool, setSelectedTool, defaultTab }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const toolsList = [
    {
      id: 'image-editor',
      icon: <ImageIcon size={26} style={{ color: 'var(--primary)' }} />,
      badge: 'CREATIVE SUITE',
      title: 'Image Studio',
      description: 'Ultra-fast, private image editor. Crop, resize, compress to exact KB/MB sizes, change DPI for passports/portals, remove backdrops, and convert formats.',
      keywords: ['edit', 'image', 'photo', 'crop', 'rotate', 'compress', 'dpi', 'resize', 'background', 'convert'],
      tabCount: '7 Specialized Tools',
      action: () => setSelectedTool('image-editor'),
    },
    {
      id: 'pdf-editor',
      icon: <FileText size={26} style={{ color: 'var(--secondary)' }} />,
      badge: 'DOCUMENT SUITE',
      title: 'PDF Workshop',
      description: 'Comprehensive client-side PDF document manipulation. Merge multiple files, extract pages, convert images to PDF, run local OCR, and convert Office docs.',
      keywords: ['pdf', 'merge', 'split', 'convert', 'extract', 'ocr', 'images to pdf', 'compress'],
      tabCount: '6 Document Utilities',
      action: () => setSelectedTool('pdf-editor'),
    },
  ];

  const filteredTools = toolsList.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.keywords.some((kw) => kw.includes(searchQuery.toLowerCase()))
  );

  // Active Tool: Image Studio
  if (selectedTool === 'image-editor') {
    return (
      <div style={styles.toolContainer}>
        <React.Suspense fallback={<div style={styles.toolLoading}>Initialising Image Studio...</div>}>
          <ImageEditor defaultTab={defaultTab as any} />
        </React.Suspense>
      </div>
    );
  }

  // Active Tool: PDF Workshop
  if (selectedTool === 'pdf-editor') {
    return (
      <div style={styles.toolContainer}>
        <React.Suspense fallback={<div style={styles.toolLoading}>Initialising PDF Workshop...</div>}>
          <PdfEditor defaultTab={defaultTab as any} />
        </React.Suspense>
      </div>
    );
  }

  // Directory Overview (Both tools)
  return (
    <div style={styles.directoryWrapper}>
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>LIQUID WORKSHOP DIRECTORY</span>
        </div>
        <h1 style={styles.title}>
          Select a <span className="liquid-gradient-text">Liquid Utility</span>
        </h1>
        <p style={styles.subtitle}>
          Private, instant tools that run purely on your machine. Choose an engine below to start.
        </p>

        {/* Search Box */}
        <div style={styles.searchWrapper}>
          <div className="liquid-glass-card" style={styles.searchCard}>
            <Search size={18} style={{ color: 'var(--primary)' }} />
            <input
              type="text"
              placeholder="Search tools, features, crop, compress, ocr, pdf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
        </div>
      </div>

      {/* Tools Cards */}
      <div style={styles.grid}>
        {filteredTools.map((tool) => (
          <div
            key={tool.id}
            className="liquid-glass-card liquid-glass-card-interactive"
            style={styles.card}
            onClick={tool.action}
          >
            <div style={styles.cardTop}>
              <div style={styles.iconCircle}>{tool.icon}</div>
              <span className="liquid-badge">{tool.badge}</span>
            </div>

            <h2 style={styles.cardTitle}>{tool.title}</h2>
            <p style={styles.cardDesc}>{tool.description}</p>

            <div style={styles.cardFooter}>
              <span style={styles.tabCount}>{tool.tabCount}</span>
              <button className="liquid-glass-btn-primary" style={styles.openBtn}>
                <span>Launch</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  toolContainer: {
    width: '100%',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  stickyHeader: {
    position: 'sticky',
    top: '74px',
    zIndex: 900,
    width: '100%',
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  stickyHeaderInner: {
    width: '100%',
    maxWidth: '1240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 14px',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(20px)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-full)',
    boxShadow: 'var(--shadow-pill)',
  },
  backBtn: {
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  toolSwitcherPill: {
    padding: '4px',
    display: 'flex',
    gap: '4px',
  },
  switchBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.84rem',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-fast)',
  },
  switchBtnActive: {
    background: 'var(--glass-bg-hover)',
    color: 'var(--primary)',
    boxShadow: '0 0 12px var(--primary-glow)',
  },
  privacyIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  toolLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    fontSize: '1.2rem',
    fontFamily: 'var(--font-heading)',
    color: 'var(--primary)',
  },
  directoryWrapper: {
    width: '100%',
    maxWidth: '1240px',
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
    fontSize: 'clamp(2rem, 4vw, 3.2rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
  },
  searchWrapper: {
    width: '100%',
    maxWidth: '560px',
    marginTop: '16px',
  },
  searchCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    borderRadius: 'var(--radius-full)',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    fontFamily: 'var(--font-body)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '24px',
  },
  card: {
    padding: '36px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
    borderRadius: 'var(--radius-xl)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
  },
  cardTitle: {
    fontSize: '1.8rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
  },
  cardDesc: {
    fontSize: '0.95rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: '20px',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabCount: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  openBtn: {
    padding: '8px 18px',
    fontSize: '0.88rem',
  },
};

export default Tools;
