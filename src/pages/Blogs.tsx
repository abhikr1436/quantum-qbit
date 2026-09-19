import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  Sliders, 
  FileText, 
  Image as ImageIcon,
  X
} from 'lucide-react';
import { navigate } from '../utils/router';
import { updateSEO } from '../utils/seo';
import { blogStorage } from '../services/blogStorage';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  summary: string;
  readTime: string;
  date: string;
  publishedAt?: number;
  author: string;
  tags: string[];
  coverImage?: string;
  htmlContent?: string;
  rawMarkup?: string;
  content: {
    intro: string;
    sections: {
      heading: string;
      body: string[];
      tip?: string;
      code?: string;
    }[];
    takeaways: string[];
    relatedTool?: {
      name: string;
      route: string;
      label: string;
    };
  };
}

const DEFAULT_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'why-in-browser-image-editing-is-the-future-of-privacy',
    title: 'Why 100% In-Browser Image Editing is the Future of Digital Privacy',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    summary: 'Explore why uploading confidential documents and photos to remote conversion servers creates massive security liabilities, and how modern Canvas & WebAssembly APIs solve this.',
    readTime: '4 min read',
    date: 'Sep 15, 2026',
    author: 'Quantum Qbit Engineering',
    tags: ['Privacy', 'WebAssembly', 'HTML5 Canvas', 'Data Sovereignty'],
    content: {
      intro: 'In the modern web ecosystem, performing a task as simple as resizing an identity document or converting a photo format has traditionally required transmitting that file to a remote cloud server. This outdated server-bound paradigm poses severe privacy hazards that are no longer necessary.',
      sections: [
        {
          heading: 'The Hidden Risks of Server-Side Media Processing',
          body: [
            'When you upload an image to an online tool, that file is written to cloud storage buckets, logged across HTTP proxies, and processed by backend microservices. Even if a provider promises to delete your files within 1 hour, that data remains vulnerable to breach during transit, retention intervals, and automated server backups.',
            'Furthermore, image metadata—including EXIF GPS geolocation tags, device serial numbers, and timestamp identifiers—is often permanently cached in server request logs.'
          ],
          tip: 'Always check if an online photo editor requires a server upload. If it works offline without an internet connection, your data is 100% safe in your own RAM.'
        },
        {
          heading: 'How In-Browser Execution Solves This at the Architecture Level',
          body: [
            'With the advancement of HTML5 Canvas, OffscreenCanvas, and WebAssembly, modern client browsers can allocate multi-gigabyte memory arrays and perform high-resolution matrix transformations directly on your device GPU and CPU.',
            'When you edit or compress an image in Quantum Qbit, the pixel buffer is decoded into your local browser memory space. The browser executes the bilinear interpolation or quantization algorithm locally, and exports a Blob URL directly to your hard drive. Zero bytes travel across the network.'
          ]
        },
        {
          heading: 'Unmatched Velocity: Eliminating Network Latency',
          body: [
            'Network transfer times represent over 90% of the duration when using cloud utilities. Uploading a 25MB RAW photo on a mobile network can take 15 to 30 seconds, followed by cloud processing queues, followed by re-downloading.',
            'Local processing executes in sub-second timeframes (typically under 100 milliseconds) because there is no network transfer bottleneck.'
          ]
        }
      ],
      takeaways: [
        'Client-side execution provides absolute data sovereignty—files never leave your device.',
        'Eliminates upload/download bandwidth bottlenecks, delivering instantaneous sub-second speeds.',
        'Operates fully offline once loaded into browser cache, immune to server outages.'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Open Image Studio'
      }
    }
  },
  {
    id: '2',
    slug: 'mastering-client-side-pdf-operations-ocr-compression',
    title: 'Mastering Client-Side PDF Operations: Local Merging, OCR & Compression',
    category: 'pdf',
    categoryLabel: 'PDF Workflows',
    summary: 'A deep-dive into how PDF.js, Web Workers, and Tesseract.js empower browser-native document merging, optical character recognition, and multi-megabyte compression.',
    readTime: '5 min read',
    date: 'Sep 12, 2026',
    author: 'Quantum Qbit Engineering',
    tags: ['PDF Tools', 'OCR', 'Tesseract', 'Document Security'],
    content: {
      intro: 'PDFs are the universal standard for legal contracts, academic publications, and corporate records. Managing sensitive multi-page archives locally has historically required bulky desktop software suites. Today, browser-native document pipelines rival native desktop apps.',
      sections: [
        {
          heading: 'Client-Side PDF Merging and Page Extraction',
          body: [
            'Using client-side JavaScript PDF parsers, documents are read as binary ArrayBuffers. The engine inspects the cross-reference tables (XRef), extracts individual page streams, re-indexes dictionary objects, and compiles a clean, standardized PDF binary.',
            'Because this happens directly within the browser tab, you can seamlessly combine dozens of receipts, contracts, and scans into a single cohesive document without waiting for server queues.'
          ],
          tip: 'When merging PDFs locally, page reordering is handled via memory pointers, meaning zero quality loss and negligible memory overhead.'
        },
        {
          heading: 'Extracting Text with In-Memory Tesseract OCR',
          body: [
            'Optical Character Recognition (OCR) enables scanned contracts and non-searchable document photos to be converted into editable text. Quantum Qbit runs a compiled WebAssembly port of the Tesseract OCR engine inside a background Web Worker.',
            'The Worker pre-processes the canvas bitmap using adaptive binarization and thresholding, then feeds character contours into neural network language models to extract high-accuracy text strings in real-time.'
          ]
        },
        {
          heading: 'Smart PDF Compression Techniques',
          body: [
            'Unoptimized PDFs often balloon in size due to uncompressed embedded JPEG artifacts and redundant color profiles. Our local compression engine dynamically recalculates image quality and downsamples high-DPI scans, easily reducing 15MB documents down to under 1.5MB for email attachment limits.'
          ]
        }
      ],
      takeaways: [
        'Web Workers allow multi-page OCR and compression without freezing your browser interface.',
        'Sensitive financial contracts and legal records remain strictly confidential on your machine.',
        'Produce optimized, standards-compliant PDF/A files ready for official submission.'
      ],
      relatedTool: {
        name: 'PDF Workshop',
        route: '/pdf-workshop',
        label: 'Open PDF Workshop'
      }
    }
  },
  {
    id: '3',
    slug: 'understanding-dpi-vs-resolution-passport-exam-portals',
    title: 'DPI vs Resolution: How to Accurately Prepare Photos for Government & Exam Portals',
    category: 'image',
    categoryLabel: 'Image Guides',
    summary: 'Demystifying Dots Per Inch (DPI), Pixel Dimensions, and JFIF/pHYs metadata chunks so your uploaded photos are never rejected by automated government validation portals.',
    readTime: '3 min read',
    date: 'Sep 08, 2026',
    author: 'Quantum Qbit Engineering',
    tags: ['DPI', 'Passports', 'Government Portals', 'Image Resizing'],
    content: {
      intro: 'Nearly every government job application, passport portal, and university admission form requires photos to comply with strict dimensional and density requirements—such as "300 DPI, exactly 35mm x 45mm, under 50 KB". Understanding how DPI works ensures your uploads never get rejected.',
      sections: [
        {
          heading: 'DPI is Density, Not Pixel Count',
          body: [
            'A common misconception is that increasing DPI increases an image\'s pixel resolution. In reality, an image that is 600 × 600 pixels has exactly 360,000 pixels regardless of whether its metadata declares 72 DPI or 300 DPI.',
            'DPI (Dots Per Inch) is simply a physical print instruction header embedded in the file. When a government portal reads your photo, its automated scanner reads the JFIF metadata block in JPEG files or the pHYs chunk in PNG files to verify print density.'
          ],
          tip: 'To change DPI properly, the software must inject binary markers into the file header. Simply changing the file extension will fail portal checks.'
        },
        {
          heading: 'How Quantum Qbit Injects Exact DPI Metadata',
          body: [
            'Our Image Studio provides an automated DPI injector that writes standard APP0 JFIF density bytes (`0x01` unit specifier) directly into JPEG buffers, and inserts a calibrated `pHYs` chunk into PNG binaries.',
            'This guarantees 100% compliance with strict government portals (such as US State Dept, UK Passport Office, India SSC/UPSC, and Schengen visa systems) while keeping file size strictly within their prescribed limits.'
          ]
        }
      ],
      takeaways: [
        'DPI is a metadata header indicating how many pixels correspond to one physical inch of print.',
        'Use Image Studio to simultaneously resize dimensions, inject 300 DPI, and compress below KB caps.',
        'Never re-save photos through social media or messaging apps, as they strip DPI metadata.'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Tune DPI in Image Studio'
      }
    }
  },
  {
    id: '4',
    slug: 'lossless-vs-lossy-compression-guide',
    title: 'Lossless vs Lossy Compression: How to Cut File Sizes by 90% Without Visual Degradation',
    category: 'tech',
    categoryLabel: 'Web Tech',
    summary: 'A deep look at discrete cosine transforms (DCT), chroma subsampling (4:2:0), and modern WebP quantization techniques for lightning-fast web assets.',
    readTime: '4 min read',
    date: 'Sep 02, 2026',
    author: 'Quantum Qbit Engineering',
    tags: ['Compression', 'WebP', 'Performance', 'Media Tech'],
    content: {
      intro: 'Whether you are preparing banners for a web application, sending resumes over email, or archiving family photo albums, file compression is essential. Choosing the right compression strategy allows you to reduce files by over 90% while keeping them visually indistinguishable from the original.',
      sections: [
        {
          heading: 'Lossy vs Lossless: Choosing the Right Trade-off',
          body: [
            'Lossless compression (such as PNG and standard Deflate) preserves every single pixel value with mathematical exactness. It is ideal for logos, screenshots with sharp text, and geometric illustrations.',
            'Lossy compression (such as JPEG and lossy WebP) takes advantage of human visual perception limitations. Human eyes are significantly more sensitive to variations in brightness (luminance) than to subtle variations in color (chrominance). By applying 4:2:0 chroma subsampling and frequency quantization, high-frequency details that the human eye cannot perceive are discarded, yielding massive size reductions.'
          ]
        },
        {
          heading: 'Why Modern WebP is the Optimal Format',
          body: [
            'WebP incorporates advanced spatial predictive coding derived from VP8 video frames. On average, a WebP file is 26% smaller than an equivalent PNG and 25-34% smaller than an equivalent JPEG at identical SSIM quality scores.',
            'Quantum Qbit allows instant 1-click conversion between PNG, JPEG, and WebP, alongside a target KB slider that automatically calculates optimal quantization factors.'
          ]
        }
      ],
      takeaways: [
        'Use WebP or optimized JPEG for photographic assets to save 80-90% file size.',
        'Keep screenshots, charts, and transparent graphics in PNG to prevent text fringing.',
        'Our local compressor lets you define an exact target KB limit (e.g. 50KB or 200KB).'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Compress Images Locally'
      }
    }
  }
];

interface BlogsProps {
  selectedCategory?: string;
  setSelectedCategory?: (category: string) => void;
  postId?: string;
  setPostId?: (postId?: string) => void;
}

export const Blogs: React.FC<BlogsProps> = ({ postId, setPostId }) => {
  const [posts, setPosts] = useState<BlogPost[]>(() => blogStorage.getBlogs());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Subscribe to storage changes from admin
  useEffect(() => {
    return blogStorage.subscribe(() => {
      setPosts(blogStorage.getBlogs());
    });
  }, []);

  // If a postId or slug is specified, open that post
  useEffect(() => {
    if (postId) {
      const found = posts.find((p) => p.id === postId || p.slug === postId);
      if (found) {
        setActivePost(found);
        updateSEO(
          `${found.title} | Quantum Qbit Blog`,
          found.summary,
          `/blogs/${found.slug}`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      setActivePost(null);
      updateSEO(
        "Engineering Blog & Tutorials | Quantum Qbit",
        "Technical articles and deep-dives on client-side privacy, image optimization, DPI metadata, and PDF manipulation 100% in browser memory.",
        "/blogs"
      );
    }
  }, [postId, posts]);

  const handleOpenPost = (post: BlogPost) => {
    setActivePost(post);
    if (setPostId) {
      setPostId(post.slug);
    } else {
      navigate(`/blogs/${post.slug}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToList = () => {
    setActivePost(null);
    if (setPostId) {
      setPostId(undefined);
    } else {
      navigate('/blogs');
    }
  };

  const handleCopyShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q) ||
      (post.categoryLabel && post.categoryLabel.toLowerCase().includes(q)) ||
      (post.tags && post.tags.some(t => t.toLowerCase().includes(q)))
    );
  });

  // =========================================================================
  // VIEW 1: FULL ARTICLE READER
  // =========================================================================
  if (activePost) {
    return (
      <article style={styles.articleContainer}>
        {/* Navigation Breadcrumb Bar */}
        <div style={styles.breadcrumbBar}>
          <button onClick={handleBackToList} style={styles.backBtn} className="liquid-glass-pill">
            <ArrowLeft size={15} />
            <span>Back to All Articles</span>
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCopyShare} style={styles.shareBtn} className="liquid-glass-pill">
              {copiedLink ? <Check size={14} style={{ color: 'var(--emerald)' }} /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Article Header Card */}
        <div className="liquid-glass-card" style={styles.articleHeaderCard}>
          <div style={styles.metaTopRow}>
            <span className="liquid-badge">{activePost.categoryLabel}</span>
            <span style={styles.readTime}>
              <Clock size={13} /> {activePost.readTime}
            </span>
          </div>

          <h1 style={styles.articleTitle}>{activePost.title}</h1>
          <p style={styles.articleSummary}>{activePost.summary}</p>

          <div style={styles.authorBar}>
            <div style={styles.authorAvatar}>
              <User size={16} />
            </div>
            <div>
              <div style={styles.authorName}>{activePost.author}</div>
              <div style={styles.authorDate}>Published on {activePost.date}</div>
            </div>
          </div>
        </div>

        {/* Cover Image if present */}
        {activePost.coverImage && (
          <div style={styles.coverImageContainer}>
            <img
              src={activePost.coverImage}
              alt={activePost.title}
              style={styles.coverImage}
            />
          </div>
        )}

        {/* Article Body Content */}
        <div className="liquid-glass-card" style={styles.articleBodyCard}>
          {activePost.htmlContent ? (
            <div
              className="article-rich-body"
              dangerouslySetInnerHTML={{ __html: activePost.htmlContent }}
            />
          ) : (
            <>
              <p style={styles.introParagraph}>{activePost.content.intro}</p>

              {activePost.content.sections.map((sec, idx) => (
                <section key={idx} style={styles.sectionBlock}>
                  <h2 style={styles.sectionHeading}>{sec.heading}</h2>
                  {sec.body.map((pText, pIdx) => (
                    <p key={pIdx} style={styles.bodyParagraph}>{pText}</p>
                  ))}

                  {sec.tip && (
                    <div style={styles.tipCard}>
                      <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                      <div style={styles.tipText}>
                        <strong>Pro-Tip:</strong> {sec.tip}
                      </div>
                    </div>
                  )}
                </section>
              ))}
            </>
          )}

          {/* Key Takeaways Box */}
          <div style={styles.takeawaysCard}>
            <h3 style={styles.takeawaysTitle}>
              <ShieldCheck size={18} style={{ color: 'var(--emerald)' }} />
              <span>Key Takeaways</span>
            </h3>
            <ul style={styles.takeawaysList}>
              {activePost.content.takeaways.map((item, idx) => (
                <li key={idx} style={styles.takeawayItem}>
                  <Check size={15} style={{ color: 'var(--emerald)', flexShrink: 0, marginTop: '3px' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tags */}
          <div style={styles.tagsRow}>
            {activePost.tags.map((tag, idx) => (
              <span key={idx} className="liquid-glass-pill" style={{ fontSize: '0.78rem' }}>
                <Tag size={11} /> {tag}
              </span>
            ))}
          </div>

          {/* Related Tool CTA */}
          {activePost.content.relatedTool && (
            <div style={styles.relatedToolBanner}>
              <div>
                <h4 style={styles.relatedToolTitle}>Put this into practice</h4>
                <p style={styles.relatedToolDesc}>
                  Experience zero-upload client-side performance right now in {activePost.content.relatedTool.name}.
                </p>
              </div>
              <button
                onClick={() => navigate(activePost.content.relatedTool!.route)}
                className="liquid-glass-btn-primary"
              >
                <span>{activePost.content.relatedTool.label}</span>
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }

  // =========================================================================
  // VIEW 2: BLOG DIRECTORY & ARTICLE LIST
  // =========================================================================
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '12px' }}>
          <BookOpen size={14} style={{ color: 'var(--primary)' }} />
          <span>ENGINEERING JOURNAL & GUIDES</span>
        </div>
        <h1 style={styles.title}>
          Quantum Qbit <span className="liquid-gradient-text">Insights</span>
        </h1>
        <p style={styles.subtitle}>
          Technical deep-dives on browser-native media pipelines, client-side privacy, image optimization, and document engineering.
        </p>

        {/* Search Bar */}
        <div style={styles.filterControls}>
          <div className="liquid-glass-card" style={styles.searchBox}>
            <Search size={17} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by topic, keyword, category, or WebAssembly..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'color 0.2s ease'
                }}
                title="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Blog Cards Grid or Empty Search State */}
      {filteredPosts.length === 0 ? (
        <div className="liquid-glass-card" style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '520px', margin: '20px auto', borderRadius: 'var(--radius-xl)' }}>
          <Search size={36} style={{ color: 'var(--text-muted)', marginBottom: '14px', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>No matching articles</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '18px' }}>
            We couldn't find any articles matching &ldquo;{searchQuery}&rdquo;. Try another keyword, category, or clear your query.
          </p>
          <button onClick={() => setSearchQuery('')} className="liquid-glass-btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Clear Search
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredPosts.map((post) => (
          <div
            key={post.id}
            className="liquid-glass-card liquid-glass-card-interactive"
            style={styles.postCard}
            onClick={() => handleOpenPost(post)}
          >
            <div style={styles.cardHeader}>
              <span className="liquid-badge">{post.categoryLabel}</span>
              <span style={styles.cardReadTime}>
                <Clock size={12} /> {post.readTime}
              </span>
            </div>

            <h2 style={styles.cardTitle}>{post.title}</h2>
            <p style={styles.cardSummary}>{post.summary}</p>

            <div style={styles.cardFooter}>
              <div style={styles.cardDate}>
                <Calendar size={13} />
                <span>{post.date}</span>
              </div>
              <span style={styles.readMoreLink}>
                <span>Read Article</span>
                <ArrowRight size={14} />
              </span>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
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
    fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '680px',
    lineHeight: 1.6,
  },
  filterControls: {
    width: '100%',
    maxWidth: '720px',
    marginTop: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  searchBox: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 22px',
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
  postCard: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    borderRadius: 'var(--radius-xl)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardReadTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    fontWeight: 500,
  },
  cardTitle: {
    fontSize: '1.45rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    lineHeight: 1.3,
  },
  cardSummary: {
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: '18px',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  readMoreLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.88rem',
    fontWeight: 600,
    color: 'var(--primary)',
    fontFamily: 'var(--font-heading)',
  },

  // Article Reader Styles
  articleContainer: {
    width: '100%',
    maxWidth: '860px',
    margin: '0 auto',
    padding: '30px 20px 80px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  breadcrumbBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
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
  shareBtn: {
    border: 'none',
    cursor: 'pointer',
    background: 'transparent',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  articleHeaderCard: {
    padding: '40px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '18px',
  },
  metaTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.84rem',
    color: 'var(--text-muted)',
  },
  articleTitle: {
    fontSize: 'clamp(1.9rem, 3.5vw, 2.7rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    lineHeight: 1.25,
    letterSpacing: '-0.02em',
  },
  articleSummary: {
    fontSize: '1.1rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
  },
  authorBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '6px',
    paddingTop: '18px',
    borderTop: '1px solid var(--glass-border)',
  },
  authorAvatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid var(--glass-border)',
  },
  authorName: {
    fontSize: '0.9rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
  },
  authorDate: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  articleBodyCard: {
    padding: '48px',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
  },
  introParagraph: {
    fontSize: '1.12rem',
    lineHeight: 1.8,
    color: 'var(--text-primary)',
    fontWeight: 400,
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sectionHeading: {
    fontSize: '1.5rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.01em',
    marginTop: '8px',
  },
  bodyParagraph: {
    fontSize: '1rem',
    lineHeight: 1.75,
    color: 'var(--text-secondary)',
  },
  tipCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px 20px',
    background: 'rgba(0, 240, 255, 0.06)',
    border: '1px solid rgba(0, 240, 255, 0.25)',
    borderRadius: 'var(--radius-md)',
    marginTop: '6px',
  },
  tipText: {
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
  },
  takeawaysCard: {
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    background: 'rgba(16, 185, 129, 0.06)',
    border: '1px solid rgba(16, 185, 129, 0.25)',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  takeawaysTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  takeawaysList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  takeawayItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '0.94rem',
    lineHeight: 1.6,
    color: 'var(--text-primary)',
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    paddingTop: '16px',
    borderTop: '1px solid var(--glass-border)',
  },
  relatedToolBanner: {
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: '1px solid var(--glass-border-bright)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '18px',
    marginTop: '12px',
  },
  relatedToolTitle: {
    fontSize: '1.15rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    marginBottom: '4px',
  },
  relatedToolDesc: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  coverImageContainer: {
    width: '100%',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    border: '1px solid var(--border-color)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.4)',
    marginBottom: '20px',
  },
  coverImage: {
    width: '100%',
    maxHeight: '440px',
    objectFit: 'cover' as const,
    display: 'block',
  },
};

export default Blogs;
