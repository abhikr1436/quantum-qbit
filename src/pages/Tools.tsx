import React, { useState, useEffect } from 'react';
import { Search, Image, FileText, Calculator, ArrowLeft, Sliders, Hash, Percent } from 'lucide-react';
import { ImageEditor } from './tools/ImageEditor';
import { PdfEditor } from './tools/PdfEditor';
import { MathCalculators } from './tools/MathCalculators';
import SquareAd from '../components/Ads';

interface ToolsProps {
  selectedTool: string;
  setSelectedTool: (toolId: string) => void;
  defaultTab?: string;
}

export const Tools: React.FC<ToolsProps> = ({ selectedTool, setSelectedTool, defaultTab }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const toolsList = [
    {
      id: 'image-editor',
      icon: <Image size={22} style={{ color: 'var(--primary)' }} />,
      title: "Image Studio",
      category: "creative",
      description: "Fast, private image editor. Fine-tune brightness, contrast, rotate, crop standard dimensions, and download.",
      keywords: ["edit", "image", "photo", "crop", "rotate", "canvas", "brightness"]
    },
    {
      id: 'pdf-editor',
      icon: <FileText size={22} style={{ color: 'var(--secondary)' }} />,
      title: "PDF Workshop",
      category: "productivity",
      description: "Convert individual or multiple images to PDF. Extract text content from image or document drafts.",
      keywords: ["pdf", "convert", "extract", "images to pdf", "text reader", "ocr"]
    },
    {
      id: 'math-calculators',
      icon: <Calculator size={22} style={{ color: 'var(--primary)' }} />,
      title: "Math Workbench",
      category: "math",
      description: "Interactive calculators including: Scientific Calculator, real-time Binary/Hex/Octal base converter, and Unit adapter.",
      keywords: ["calculator", "math", "hex", "binary", "octal", "base", "unit", "converter"]
    }
  ];

  // Reset search and filters when navigating back to directory
  useEffect(() => {
    if (selectedTool === 'none') {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [selectedTool]);

  const filteredTools = toolsList.filter((tool) => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch = tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.keywords.some(kw => kw.includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Render active tool page
  if (selectedTool === 'image-editor') {
    return (
      <div style={styles.toolContainer}>
        <div style={styles.backBar}>
          <a href="/tools" onClick={(e) => { e.preventDefault(); setSelectedTool('none'); }} style={{ textDecoration: 'none' }}>
            <span style={styles.backBtn}>
              <ArrowLeft size={16} /> Back to Tools Directory
            </span>
          </a>
        </div>
        <ImageEditor defaultTab={defaultTab as any} />
      </div>
    );
  }

  if (selectedTool === 'pdf-editor') {
    return (
      <div style={styles.toolContainer}>
        <div style={styles.backBar}>
          <a href="/tools" onClick={(e) => { e.preventDefault(); setSelectedTool('none'); }} style={{ textDecoration: 'none' }}>
            <span style={styles.backBtn}>
              <ArrowLeft size={16} /> Back to Tools Directory
            </span>
          </a>
        </div>
        <PdfEditor defaultTab={defaultTab as any} />
      </div>
    );
  }

  if (selectedTool === 'math-calculators') {
    return (
      <div style={styles.toolContainer}>
        <div style={styles.backBar}>
          <a href="/tools" onClick={(e) => { e.preventDefault(); setSelectedTool('none'); }} style={{ textDecoration: 'none' }}>
            <span style={styles.backBtn}>
              <ArrowLeft size={16} /> Back to Tools Directory
            </span>
          </a>
        </div>
        <MathCalculators />
      </div>
    );
  }

  return (
    <div style={styles.directory}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>Web Applications & Tools</h1>
          <p style={styles.subtitle}>
            Explore our collection of utility applications. Run completely locally inside your browser with speed and security.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div style={styles.filterSection}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search tools (e.g. crop, pdf, base converter)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.categories}>
            {['all', 'creative', 'productivity', 'math'].map((cat) => (
              <button
                key={cat}
                style={{
                  ...styles.categoryBtn,
                  ...(activeCategory === cat ? styles.activeCategoryBtn : {})
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {filteredTools.length > 0 ? (
          <div style={styles.toolsGrid}>
            {filteredTools.map((tool) => (
              <div key={tool.id} className="glass-card" style={styles.toolCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.iconBox}>{tool.icon}</div>
                  <span style={styles.tag}>{tool.category}</span>
                </div>
                <h3 style={styles.cardTitle}>{tool.title}</h3>
                <p style={styles.cardDesc}>{tool.description}</p>
                <a
                  href={`/tools/${tool.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setSelectedTool(tool.id);
                  }}
                  className="btn-primary"
                  style={{ ...styles.openBtn, textDecoration: 'none', display: 'flex' }}
                >
                  Open Tool
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            <p>No tools matched your search query. Try typing something else!</p>
          </div>
        )}

        {/* Sponsor Ad Section */}
        <div style={{ marginTop: '40px' }}>
          <SquareAd id="tools-directory-square-ad" />
        </div>
      </div>
    </div>
  );
};

const styles = {
  directory: {
    padding: '60px 0 100px 0',
  },
  toolContainer: {
    padding: '40px 0 80px 0',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  backBar: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto 24px auto',
    padding: '0 24px',
  },
  backBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    fontFamily: 'var(--font-heading)',
    transition: 'var(--transition-fast)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '48px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3rem)',
    fontWeight: 700,
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.5,
  },
  filterSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
    marginBottom: '40px',
    flexWrap: 'wrap' as const,
  },
  searchWrapper: {
    position: 'relative' as const,
    flex: '1 1 320px',
    maxWidth: '480px',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '10px',
    padding: '12px 16px 12px 42px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'var(--transition-smooth)',
  },
  categories: {
    display: 'flex',
    gap: '8px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid var(--border-glass)',
    padding: '4px',
    borderRadius: '10px',
  },
  categoryBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-heading)',
    fontSize: '0.9rem',
    fontWeight: 500,
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  activeCategoryBtn: {
    color: 'var(--primary)',
    background: 'rgba(0, 242, 254, 0.06)',
  },
  toolsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  toolCard: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    textAlign: 'left' as const,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tag: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase' as const,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    flexGrow: 1,
  },
  openBtn: {
    marginTop: '8px',
    width: '100%',
    justifyContent: 'center',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px 0',
    color: 'var(--text-secondary)',
  },
};
export default Tools;
