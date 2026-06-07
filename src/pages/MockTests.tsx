import React, { useState } from 'react';
import { Search, Award, Calendar, BookOpen, Clock, Play } from 'lucide-react';

interface MockTestItem {
  id: string;
  title: string;
  category: string;
  questions: number;
  duration: string;
  description: string;
  link: string;
  isAvailable: boolean;
  tag?: string;
}

export const MockTests: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const mockTestsList: MockTestItem[] = [
    {
      id: 'isro-ta-cs-pyq',
      title: "ISRO Technical Assistant (TA) Computer Science PYQ Test",
      category: "isro",
      questions: 80,
      duration: "90 Mins",
      description: "Attempt the Indian Space Research Organisation (ISRO) Technical Assistant Computer Science Previous Year Question (PYQ) Mock Test in a high-fidelity Computer Based Test (CBT) practice portal.",
      link: "/isro-ta-computer-science-pyq/",
      isAvailable: true,
      tag: "PYQ"
    },
    {
      id: 'isro-scientist-cs-pyq',
      title: "ISRO Scientist/Engineer 'SC' Computer Science Mock Test",
      category: "isro",
      questions: 80,
      duration: "120 Mins",
      description: "Complete previous year questions mock exam practice for ISRO Scientist/Engineer 'SC' Recruitment Exam. Real exam CBT mode.",
      link: "#",
      isAvailable: false,
      tag: "Coming Soon"
    },
    {
      id: 'gate-cs-mock',
      title: "GATE Computer Science & IT Full Length Mock Test",
      category: "gate",
      questions: 65,
      duration: "180 Mins",
      description: "Comprehensive full syllabus mock practice test for GATE CS aspirants featuring high-quality multiple choice and numerical questions.",
      link: "#",
      isAvailable: false,
      tag: "Coming Soon"
    }
  ];

  const categoryLabels: Record<string, string> = {
    all: 'All Exams',
    isro: 'ISRO Exams',
    gate: 'GATE Exams'
  };

  const filteredTests = mockTestsList.filter((test) => {
    const matchesCategory = activeCategory === 'all' || test.category === activeCategory;
    const matchesSearch = test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div style={styles.directory}>
      <div className="container">
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            Competitive Exam <span className="gradient-text">Mock Tests</span>
          </h1>
          <p style={styles.subtitle}>
            Practice with real-time Computer Based Test (CBT) mock exam simulators. Track your speed, marks, and detailed question performance.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div style={styles.filterSection}>
          <div style={styles.searchWrapper}>
            <Search size={18} style={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search mock tests (e.g. ISRO, GATE)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.categories}>
            {['all', 'isro', 'gate'].map((cat) => (
              <button
                key={cat}
                style={{
                  ...styles.categoryBtn,
                  ...(activeCategory === cat ? styles.activeCategoryBtn : {})
                }}
                onClick={() => setActiveCategory(cat)}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Directory Grid */}
        {filteredTests.length > 0 ? (
          <div style={styles.testsGrid}>
            {filteredTests.map((test) => (
              <div 
                key={test.id} 
                className="glass-card" 
                style={{
                  ...styles.testCard,
                  opacity: test.isAvailable ? 1 : 0.75
                }}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.iconBox}>
                    <Award size={22} style={{ color: test.isAvailable ? 'var(--secondary)' : 'var(--text-muted)' }} />
                  </div>
                  {test.tag && (
                    <span 
                      style={{
                        ...styles.tag,
                        backgroundColor: test.isAvailable ? 'rgba(157, 78, 221, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: test.isAvailable ? 'var(--secondary)' : 'var(--text-muted)',
                        border: test.isAvailable ? '1px solid rgba(157, 78, 221, 0.3)' : '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      {test.tag}
                    </span>
                  )}
                </div>
                
                <h3 style={styles.cardTitle}>{test.title}</h3>
                
                <div style={styles.metaRow}>
                  <div style={styles.metaItem}>
                    <Clock size={14} style={{ color: 'var(--primary)' }} />
                    <span>{test.duration}</span>
                  </div>
                  <div style={styles.metaItem}>
                    <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                    <span>{test.questions} MCQs</span>
                  </div>
                </div>

                <p style={styles.cardDesc}>{test.description}</p>
                
                {test.isAvailable ? (
                  <a
                    href={test.link}
                    className="btn-primary"
                    style={{ 
                      ...styles.openBtn, 
                      textDecoration: 'none', 
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Play size={14} fill="currentColor" /> Start CBT Mock Test
                  </a>
                ) : (
                  <button
                    disabled
                    className="btn-secondary"
                    style={{ ...styles.openBtn, cursor: 'not-allowed', opacity: 0.6 }}
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.noResults}>
            <p>No mock tests matched your search query. Try typing something else!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  directory: {
    padding: '60px 0 100px 0',
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
    color: '#ffffff',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '1.05rem',
    maxWidth: '650px',
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
    color: 'var(--secondary)',
    background: 'rgba(157, 78, 221, 0.06)',
  },
  testsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  testCard: {
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
    padding: '4px 10px',
    borderRadius: '100px',
    fontWeight: 600,
    letterSpacing: '0.02em',
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#ffffff',
    lineHeight: 1.4,
    margin: 0,
  },
  metaRow: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  cardDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: 1.5,
    flexGrow: 1,
    margin: 0,
  },
  openBtn: {
    marginTop: '8px',
    width: '100%',
  },
  noResults: {
    textAlign: 'center' as const,
    padding: '40px 0',
    color: 'var(--text-secondary)',
  },
};

export default MockTests;
