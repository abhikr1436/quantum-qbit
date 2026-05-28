import React, { useState, useEffect } from 'react';
import { ShieldAlert, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

interface SeoIssue {
  severity: 'high' | 'medium' | 'low';
  type: string;
  desc: string;
}

interface SeoDashboardProps {
  onTriggerAudit: () => Promise<any>;
}

export const SeoDashboard: React.FC<SeoDashboardProps> = ({ onTriggerAudit }) => {
  const [loading, setLoading] = useState(false);
  const [seoData, setSeoData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Keyword Rankings state
  const [rankData, setRankData] = useState<any[]>([]);
  const [ranksLoading, setRanksLoading] = useState(false);
  const [rankError, setRankError] = useState<string | null>(null);

  const fetchRanks = async () => {
    setRanksLoading(true);
    setRankError(null);
    try {
      const response = await fetch('/api/ai_office.php?action=seo_ranks');
      if (response.ok) {
        const data = await response.json();
        setRankData(data.ranks || []);
      } else {
        setRankError('Failed to retrieve organic keyword positions.');
      }
    } catch (err: any) {
      setRankError('Error connecting to rank checker API.');
    } finally {
      setRanksLoading(false);
    }
  };

  const fetchAudit = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await onTriggerAudit();
      setSeoData(data);
      // Automatically refresh rankings on audit rescans
      fetchRanks();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete SEO audit.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    fetchRanks();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="animate-fade-in" style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h2 style={{ fontSize: '1.4rem', margin: 0, fontFamily: 'var(--font-heading)' }}>Google Rankings & SEO Audit</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>Automated analysis of live files and index pages</p>
        </div>
        <button className="btn-primary" onClick={fetchAudit} disabled={loading} style={{ border: 'none', cursor: 'pointer' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Auditing Files...' : 'Re-Scan SEO'}
        </button>
      </div>

      {errorMsg ? (
        <div style={styles.errorBox} className="glass-card">
          <ShieldAlert size={32} style={{ color: '#ef4444' }} />
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>SEO Crawler Error</h4>
            <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{errorMsg}</p>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', margin: '8px 0 0 0' }}>
              Ensure your database config and website pathways are set correctly.
            </p>
          </div>
        </div>
      ) : seoData ? (
        <div style={styles.grid}>
          
          {/* Main metrics */}
          <div style={styles.leftCol}>
            
            <div style={styles.scoreRow} className="glass-card">
              <div style={styles.scoreDialContainer}>
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={getScoreColor(seoData.score)}
                    strokeWidth="10"
                    strokeDasharray="314"
                    strokeDashoffset={314 - (314 * seoData.score) / 100}
                    strokeLinecap="round"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s' }}
                  />
                  <text x="60" y="66" textAnchor="middle" fill="#fff" fontSize="24" fontWeight="bold" fontFamily="var(--font-heading)">
                    {seoData.score}
                  </text>
                </svg>
                <div style={styles.scoreLabel}>SEO Health Score</div>
              </div>

              <div style={styles.quickStats}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Indexed Blogs</div>
                  <div style={styles.statVal}>{seoData.blogsCount}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Domain Check</div>
                  <div style={{ ...styles.statVal, fontSize: '1rem', color: 'var(--primary, #00f2fe)', fontWeight: 600 }}>quantumqbit.in</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Hosting Status</div>
                  <div style={{ ...styles.statVal, fontSize: '1rem', color: '#fff' }}>Hostinger Live</div>
                </div>
              </div>
            </div>

            {/* Audit Issues list */}
            <div style={styles.issuesCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Technical Audit Checklist</h3>
              <div style={styles.issuesList}>
                {seoData.issues && seoData.issues.length === 0 ? (
                  <div style={styles.cleanAudit}>
                    <CheckCircle size={28} style={{ color: '#10b981' }} />
                    <div>
                      <h4 style={{ color: '#fff', margin: 0 }}>Perfect Score Checklist!</h4>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', margin: '4px 0 0 0' }}>All required title tags, meta descriptions, image alts, and article databases are healthy.</p>
                    </div>
                  </div>
                ) : (
                  seoData.issues && seoData.issues.map((issue: SeoIssue, idx: number) => (
                    <div key={idx} style={styles.issueRow}>
                      <span style={{
                        ...styles.severityBadge,
                        background: issue.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: issue.severity === 'high' ? '#ef4444' : '#f59e0b',
                        borderColor: issue.severity === 'high' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'
                      }}>
                        {issue.severity}
                      </span>
                      <div>
                        <div style={styles.issueType}>{issue.type}</div>
                        <div style={styles.issueDesc}>{issue.desc}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Keyword organic rankings check */}
            <div style={styles.issuesCard} className="glass-card">
              <h3 style={styles.sectionTitle}>Google Keyword Rankings</h3>
              {ranksLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.7)' }}>
                  <RefreshCw size={20} className="spin" style={{ color: 'var(--primary, #00f2fe)', marginBottom: '8px' }} />
                  <div>Querying organic keyword indexing positions...</div>
                </div>
              ) : rankError ? (
                <div style={{ color: '#ef4444', fontSize: '0.88rem' }}>{rankError}</div>
              ) : rankData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.4)' }}>
                  No ranking data fetched. Re-Scan to query Google.
                </div>
              ) : (
                <div style={styles.tableWrapper}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Target Keyword</th>
                        <th style={styles.th}>Search Engine</th>
                        <th style={styles.th}>Google Rank Position</th>
                        <th style={styles.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankData.map((r: any, idx: number) => {
                        const rankNum = typeof r.rank === 'number' ? r.rank : parseInt(r.rank);
                        const isTopTen = !isNaN(rankNum) && rankNum <= 10;
                        const isTopFifty = !isNaN(rankNum) && rankNum <= 50;

                        return (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.td}><strong>"{r.keyword}"</strong></td>
                            <td style={styles.td}>Google Organic</td>
                            <td style={{
                              ...styles.td,
                              color: isTopTen ? '#10b981' : isTopFifty ? 'var(--primary, #00f2fe)' : 'rgba(255,255,255,0.7)',
                              fontWeight: 700
                            }}>
                              {r.rank === '50+' ? 'Page 5+ (50+)' : `Position #${r.rank}`}
                            </td>
                            <td style={styles.td}>
                              <span style={{
                                ...styles.rankBadge,
                                backgroundColor: isTopTen ? 'rgba(16,185,129,0.1)' : isTopFifty ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.02)',
                                color: isTopTen ? '#10b981' : isTopFifty ? 'var(--primary, #00f2fe)' : 'rgba(255,255,255,0.4)'
                              }}>
                                {isTopTen ? 'Top 10 Rank' : isTopFifty ? 'Page 2-5' : 'Needs Optimization'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Marketing suggestions */}
          <div style={styles.rightCol} className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary, #00f2fe)' }} />
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontFamily: 'var(--font-heading)' }}>Rank Booster Plan</h3>
            </div>
            
            <div style={styles.boosterSteps}>
              <div style={styles.boosterStep}>
                <div style={styles.stepNum}>1</div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Target Low-Competition Keywords</strong>
                  <p style={styles.stepText}>Write articles targeting 'offline pdf compressor' and 'client side calculations privacy'.</p>
                </div>
              </div>

              <div style={styles.boosterStep}>
                <div style={styles.stepNum}>2</div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Expand Article Volume</strong>
                  <p style={styles.stepText}>Ensure your website has at least 5 blog posts to trigger Google's deep crawling spiders.</p>
                </div>
              </div>

              <div style={styles.boosterStep}>
                <div style={styles.stepNum}>3</div>
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>Alt Tag Corrections</strong>
                  <p style={styles.stepText}>Update logo files in <code>LandingPage.tsx</code> to contain readable descriptions for screenreaders.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.4)' }}>
          Scan not run yet. Click Re-Scan to analyze folders.
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorBox: {
    padding: '30px',
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '30px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
    minWidth: 0,
  },
  scoreRow: {
    padding: '30px',
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  scoreDialContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
  },
  scoreLabel: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
  },
  quickStats: {
    flexGrow: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px',
  },
  statBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center' as const,
  },
  statLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: '6px',
  },
  statVal: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#fff',
  },
  issuesCard: {
    padding: '30px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
  },
  sectionTitle: {
    fontSize: '1.1rem',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '10px',
    margin: 0,
    fontFamily: 'var(--font-heading)',
  },
  issuesList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  cleanAudit: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
    background: 'rgba(16, 185, 129, 0.04)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '8px',
  },
  issueRow: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  severityBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    border: '1px solid',
  },
  issueType: {
    fontWeight: 600,
    fontSize: '0.88rem',
    color: '#fff',
    marginBottom: '2px',
  },
  issueDesc: {
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.4',
  },
  rightCol: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    position: 'sticky' as const,
    top: '100px',
    height: 'fit-content',
  },
  boosterSteps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  boosterStep: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
  },
  stepNum: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: 'rgba(0, 242, 254, 0.12)',
    border: '1px solid rgba(0, 242, 254, 0.3)',
    color: 'var(--primary, #00f2fe)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  stepText: {
    fontSize: '0.82rem',
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: '1.4',
    marginTop: '4px',
    margin: '4px 0 0 0',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    marginTop: '10px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
    fontSize: '0.88rem',
  },
  th: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '12px 16px',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: 600,
  },
  tr: {
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  td: {
    padding: '12px 16px',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  rankBadge: {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '0.72rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
  }
};
