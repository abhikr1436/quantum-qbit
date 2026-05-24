import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  Wrench, 
  BookOpen, 
  Home, 
  Calculator, 
  Image, 
  FileText, 
  Info, 
  Phone,
  Compass
} from 'lucide-react';
import { navigate } from '../utils/router';

interface Category {
  id: string;
  name: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  selectedTool: string;
  setSelectedTool: (toolId: string) => void;
  selectedCategory: string;
  setSelectedCategory: (catId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  currentPage,
  setCurrentPage,
  selectedTool,
  setSelectedTool,
  selectedCategory,
  setSelectedCategory
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [toolsExpanded, setToolsExpanded] = useState<boolean>(true);
  const [blogsExpanded, setBlogsExpanded] = useState<boolean>(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories.php');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          loadFallback();
        }
      } catch (err) {
        loadFallback();
      }
    };

    const loadFallback = () => {
      const local = localStorage.getItem('quantum_categories');
      if (local) {
        setCategories(JSON.parse(local));
      } else {
        const defaultCategories: Category[] = [
          { id: 'privacy-security', name: 'Privacy & Security' },
          { id: 'computer-science', name: 'Computer Science' },
          { id: 'creative-tech', name: 'Creative Tech' },
          { id: 'general-utilities', name: 'General Utilities' }
        ];
        setCategories(defaultCategories);
      }
    };

    fetchCategories();
  }, []);

  const handleNav = (pageId: string) => {
    setCurrentPage(pageId);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolNav = (toolId: string) => {
    setCurrentPage('tools');
    setSelectedTool(toolId);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryNav = (catId: string) => {
    setCurrentPage('blogs');
    setSelectedCategory(catId);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        style={{
          ...styles.backdrop,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none'
        }}
        onClick={onClose}
      />

      {/* Sliding Sidebar Panel */}
      <aside
        style={{
          ...styles.panel,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Header Area */}
        <div style={styles.header}>
          <div style={styles.logoTitle}>
            <span style={styles.quantumTag}>QUANTUM</span>
            <span style={styles.navTag}>WORKSPACE</span>
          </div>
          <button 
            onClick={onClose} 
            style={styles.closeBtn}
            title="Close Menu"
          >
            <X size={18} />
          </button>
        </div>

        <div style={styles.divider}></div>

        {/* Scrollable Navigation Items */}
        <div style={styles.scrollArea}>
          {/* Home option */}
          <a 
            href="/"
            className={`sidebar-nav-item ${currentPage === 'landing' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNav('landing'); }}
            style={{ textDecoration: 'none' }}
          >
            <Home size={18} />
            <span>Home</span>
          </a>

          {/* Tools options with suboptions */}
          <div style={styles.groupContainer}>
            <button 
              className={`sidebar-nav-item ${currentPage === 'tools' ? 'active' : ''}`}
              onClick={() => setToolsExpanded(!toolsExpanded)}
            >
              <Wrench size={18} />
              <span style={{ flexGrow: 1 }}>Tools</span>
              {toolsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {toolsExpanded && (
              <div style={styles.subItemsContainer}>
                <a 
                  href="/tools/image-transform"
                  className={`sidebar-sub-item ${currentPage === 'tools' && selectedTool === 'image-editor' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); navigate('/tools/image-transform'); onClose(); }}
                  style={{ textDecoration: 'none' }}
                >
                  <Image size={15} />
                  <span>Image Studio</span>
                </a>
                <a 
                  href="/tools/pdf-editor"
                  className={`sidebar-sub-item ${currentPage === 'tools' && selectedTool === 'pdf-editor' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleToolNav('pdf-editor'); }}
                  style={{ textDecoration: 'none' }}
                >
                  <FileText size={15} />
                  <span>PDF Workshop</span>
                </a>
                <a 
                  href="/tools/math-calculators"
                  className={`sidebar-sub-item ${currentPage === 'tools' && selectedTool === 'math-calculators' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleToolNav('math-calculators'); }}
                  style={{ textDecoration: 'none' }}
                >
                  <Calculator size={15} />
                  <span>Math Workbench</span>
                </a>
              </div>
            )}
          </div>

          {/* Blogs options with suboptions */}
          <div style={styles.groupContainer}>
            <button 
              className={`sidebar-nav-item ${currentPage === 'blogs' ? 'active' : ''}`}
              onClick={() => setBlogsExpanded(!blogsExpanded)}
            >
              <BookOpen size={18} />
              <span style={{ flexGrow: 1 }}>Blog</span>
              {blogsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {blogsExpanded && (
              <div style={styles.subItemsContainer}>
                <a 
                  href="/blogs"
                  className={`sidebar-sub-item ${currentPage === 'blogs' && selectedCategory === 'all' ? 'active' : ''}`}
                  onClick={(e) => { e.preventDefault(); handleCategoryNav('all'); }}
                  style={{ textDecoration: 'none' }}
                >
                  <Compass size={15} />
                  <span>All Articles</span>
                </a>
                
                {categories.map((cat) => (
                  <a 
                    key={cat.id}
                    href="/blogs"
                    className={`sidebar-sub-item ${currentPage === 'blogs' && selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={(e) => { e.preventDefault(); handleCategoryNav(cat.id); }}
                    style={{ textDecoration: 'none' }}
                  >
                    <BookOpen size={15} style={{ opacity: 0.6 }} />
                    <span style={styles.subItemText}>{cat.name}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* About option */}
          <a 
            href="/about"
            className={`sidebar-nav-item ${currentPage === 'about' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNav('about'); }}
            style={{ textDecoration: 'none' }}
          >
            <Info size={18} />
            <span>About Us</span>
          </a>

          {/* Contact option */}
          <a 
            href="/contact"
            className={`sidebar-nav-item ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={(e) => { e.preventDefault(); handleNav('contact'); }}
            style={{ textDecoration: 'none' }}
          >
            <Phone size={18} />
            <span>Contact Us</span>
          </a>
        </div>

        {/* Sidebar Footer info */}
        <div style={styles.footer}>
          <span>SECURED // OFFLINE_FIRST</span>
        </div>
      </aside>
    </>
  );
};

const styles = {
  backdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(2, 3, 6, 0.7)',
    backdropFilter: 'blur(5px)',
    WebkitBackdropFilter: 'blur(5px)',
    zIndex: 1100,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  panel: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '300px',
    maxWidth: '85vw',
    height: '100%',
    backgroundColor: 'rgba(5, 6, 11, 0.98)',
    backdropFilter: 'blur(25px)',
    WebkitBackdropFilter: 'blur(25px)',
    borderRight: '1px solid var(--border-glass-active)',
    boxShadow: '10px 0 40px rgba(0, 0, 0, 0.9), 0 0 30px var(--primary-glow)',
    zIndex: 1200,
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '40px',
  },
  logoTitle: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  quantumTag: {
    fontFamily: 'var(--font-heading)',
    fontSize: '1.1rem',
    fontWeight: 800,
    letterSpacing: '0.1em',
    color: 'var(--primary)',
    textShadow: '0 0 8px var(--primary-glow)',
  },
  navTag: {
    fontFamily: 'monospace',
    fontSize: '0.62rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  closeBtn: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-glass)',
    borderRadius: '6px',
    color: 'var(--text-secondary)',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'var(--transition-fast)',
  },
  divider: {
    height: '1px',
    background: 'var(--border-glass)',
    margin: '20px 0',
  },
  scrollArea: {
    flexGrow: 1,
    overflowY: 'auto' as const,
    paddingRight: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  groupContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  subItemsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    paddingLeft: '4px',
    borderLeft: '1px solid var(--border-glass)',
    marginLeft: '24px',
    marginBefore: '2px',
    marginAfter: '6px',
  },
  subItemText: {
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden' as const,
    textOverflow: 'ellipsis' as const,
  },
  footer: {
    paddingTop: '20px',
    borderTop: '1px solid var(--border-glass)',
    marginTop: '20px',
    textAlign: 'center' as const,
    fontSize: '0.62rem',
    fontFamily: 'monospace',
    color: 'var(--text-muted)',
    letterSpacing: '0.1em',
  },
};

export default Sidebar;
