import React from 'react';
import { ArrowRight, ShieldCheck, Zap, Lock, Sparkles, CheckCircle2, ChevronDown, RefreshCw } from 'lucide-react';
import { navigate } from '../utils/router';

export interface ConverterSeoData {
  slug: string;
  sourceFormat: string;
  targetFormat: 'png' | 'jpeg' | 'webp' | 'bmp' | 'pdf' | 'ico' | 'svg';
  title: string;
  headline: string;
  subheadline: string;
  metaDescription: string;
  badge: string;
  sourceName: string;
  targetName: string;
  whyConvert: string;
  comparisonPoints: { feature: string; source: string; target: string }[];
  faqs: { question: string; answer: string }[];
}

export const CONVERTER_SEO_CONFIGS: Record<string, ConverterSeoData> = {
  'png-to-ico': {
    slug: 'png-to-ico',
    sourceFormat: 'PNG',
    targetFormat: 'ico',
    title: 'Convert PNG to ICO Online Free - High-Quality Favicon Generator | Quantum Qbit',
    headline: 'Convert PNG to ICO Online Free',
    subheadline: 'Generate pixel-perfect multi-resolution Windows icons (.ico) and browser favicons from your PNG logos and graphics in seconds. 100% in-browser with zero cloud uploads.',
    metaDescription: 'Convert PNG to ICO online for free. Create multi-resolution 16x16, 32x32, 48x48, 64x64, 128x128, and 256x256 favicons and Windows desktop icons 100% locally in your browser.',
    badge: 'FAVICON & WINDOWS ICON GENERATOR',
    sourceName: 'PNG (Portable Network Graphics)',
    targetName: 'ICO (Microsoft Icon Format)',
    whyConvert: 'PNG files contain transparent pixels, but modern operating systems, desktop applications, and web browsers require standard .ico container formats with multiple resolutions embedded inside for sharp rendering across taskbars, bookmarks, and desktop shortcuts.',
    comparisonPoints: [
      { feature: 'Alpha Transparency', source: 'Full 32-bit RGBA', target: 'Preserved 32-bit RGBA' },
      { feature: 'Multi-Resolution Container', source: 'No (Single resolution)', target: 'Yes (16px to 256px in 1 file)' },
      { feature: 'Browser Favicon Support', source: 'Partial (HTML5 only)', target: '100% Universal Legacy & Modern' },
      { feature: 'Windows App Compatibility', source: 'Requires Conversion', target: 'Native .exe and Shortcut Icon' }
    ],
    faqs: [
      {
        question: 'How do I convert PNG to ICO for my website favicon?',
        answer: 'Simply drop your transparent PNG file into the Quantum Qbit converter above. Ensure "ICO (.ico)" is selected as the target format, choose the multi-resolution pack, and click Convert Image. Download the output and save it as favicon.ico in your website root.'
      },
      {
        question: 'Does this ICO converter upload my files to any server?',
        answer: 'No. Quantum Qbit processes all image data, canvas resizing, and binary ICO packing entirely on your computer\'s CPU using WebAssembly and Javascript. Your files never touch a remote cloud server.'
      },
      {
        question: 'What icon sizes are included in the generated .ico file?',
        answer: 'Our converter packs standard Microsoft Windows and web favicon dimensions: 16×16 (browser tab), 32×32 (taskbar/shortcuts), 48×48 (desktop icons), 64×64, 128×128, and 256×256 (high-DPI / Retina displays).'
      }
    ]
  },
  'heic-to-png': {
    slug: 'heic-to-png',
    sourceFormat: 'HEIC',
    targetFormat: 'png',
    title: 'Convert HEIC to PNG Online Free - Apple Photos to Lossless PNG | Quantum Qbit',
    headline: 'Convert HEIC to PNG Online Free',
    subheadline: 'Instantly transform Apple iPhone and iPad HEIC/HEIF photos into universal, transparent PNG images directly in your browser. No software installation or cloud uploads required.',
    metaDescription: 'Convert Apple HEIC and HEIF photos to PNG online free without file limits. Fast in-browser decoding with high quality preservation and 100% private client-side processing.',
    badge: 'APPLE HEIC / HEIF DECODER',
    sourceName: 'HEIC (High Efficiency Image Container)',
    targetName: 'PNG (Portable Network Graphics)',
    whyConvert: 'HEIC is the default camera format on iOS and macOS devices, offering great compression, but it cannot be opened by many Windows software suites, older web browsers, or design tools. Converting to PNG ensures universal compatibility with zero quality loss.',
    comparisonPoints: [
      { feature: 'Universal Compatibility', source: 'Apple Ecosystem Focused', target: '100% Universal Across All OS' },
      { feature: 'Web Browser Support', source: 'Limited (No Chrome/Firefox)', target: 'Native in all browsers' },
      { feature: 'Transparency Handling', source: 'Depth map dependent', target: 'Standard 32-bit Alpha Channel' },
      { feature: 'Graphic Design Tools', source: 'Requires Plugins', target: 'Accepted by 100% of editors' }
    ],
    faqs: [
      {
        question: 'How do I convert HEIC photos from my iPhone to PNG?',
        answer: 'Transfer your iPhone .heic file or drag it directly into the Quantum Qbit dropzone above. The browser automatically decodes the HEIC container in local memory and outputs a crisp, lossless PNG file.'
      },
      {
        question: 'Will converting HEIC to PNG decrease photo quality?',
        answer: 'No. Our converter maintains full 24-bit color fidelity and decodes every pixel at maximum resolution without lossy re-quantization.'
      }
    ]
  },
  'heic-to-jpg': {
    slug: 'heic-to-jpg',
    sourceFormat: 'HEIC',
    targetFormat: 'jpeg',
    title: 'Convert HEIC to JPG Online Free - Fast In-Browser Conversion | Quantum Qbit',
    headline: 'Convert HEIC to JPG Online Free',
    subheadline: 'Convert Apple iPhone HEIC and HEIF photos to universal JPG format online for free. Works completely in your browser without uploading to any third-party server.',
    metaDescription: 'Free online HEIC to JPG converter. Transform iPhone HEIC photos into lightweight, universally compatible JPEG images in seconds with zero data tracking.',
    badge: 'IPHONE HEIC TO JPEG',
    sourceName: 'HEIC (High Efficiency Image Container)',
    targetName: 'JPEG / JPG (Joint Photographic Experts Group)',
    whyConvert: 'JPEG is the world\'s most universal photo format. Converting your iPhone HEIC photos to JPG allows you to upload them to social media, government portals, school forms, and view them on any PC.',
    comparisonPoints: [
      { feature: 'Everyday Compatibility', source: 'Apple only', target: 'Universal on all devices and websites' },
      { feature: 'File Size', source: 'Ultra compact', target: 'Compact with adjustable quality' },
      { feature: 'Portal Uploads', source: 'Often rejected', target: '100% accepted on all portals' }
    ],
    faqs: [
      {
        question: 'Can I adjust the quality of the converted JPG?',
        answer: 'Yes. In the sidebar options, you can use the Quality slider to dial in anywhere from 10% to 100% quality to achieve the perfect balance of clarity and file size.'
      }
    ]
  },
  'png-to-webp': {
    slug: 'png-to-webp',
    sourceFormat: 'PNG',
    targetFormat: 'webp',
    title: 'Convert PNG to WEBP Online Free - Cut File Size by 80% | Quantum Qbit',
    headline: 'Convert PNG to WEBP Online Free',
    subheadline: 'Compress and convert PNG images into modern Google WebP format with full alpha transparency. Boost website speed and improve Google PageSpeed scores effortlessly.',
    metaDescription: 'Convert PNG to WEBP online free. Reduce image file size by up to 80% while retaining transparent backgrounds. 100% client-side WebP converter.',
    badge: 'NEXT-GEN WEB OPTIMIZATION',
    sourceName: 'PNG (Portable Network Graphics)',
    targetName: 'WEBP (Google Web Picture)',
    whyConvert: 'WebP files are typically 26% to 80% smaller than equivalent PNGs while preserving transparent backgrounds and high-frequency details, significantly reducing bandwidth and accelerating web load times.',
    comparisonPoints: [
      { feature: 'Average File Size', source: 'Heavy (Uncompressed raster)', target: 'Up to 80% smaller' },
      { feature: 'Alpha Transparency', source: 'Yes', target: 'Yes (Both Lossless & Lossy)' },
      { feature: 'SEO & Core Web Vitals', source: 'Penalized for large LCP', target: 'Recommended by Google Lighthouse' }
    ],
    faqs: [
      {
        question: 'Does WebP support transparent backgrounds like PNG?',
        answer: 'Yes. WebP fully supports 8-bit alpha transparency with both lossless and lossy compression.'
      }
    ]
  },
  'webp-to-png': {
    slug: 'webp-to-png',
    sourceFormat: 'WEBP',
    targetFormat: 'png',
    title: 'Convert WEBP to PNG Online Free - Transparent & High Quality | Quantum Qbit',
    headline: 'Convert WEBP to PNG Online Free',
    subheadline: 'Convert saved WebP web images back into standard transparent PNG format. Perfect for Photoshop, Illustrator, legacy software, and desktop editing.',
    metaDescription: 'Convert WEBP to PNG online for free. Extract lossless PNG files from WebP images with transparency intact. Fast, secure, client-side converter.',
    badge: 'WEBP TO LOSSLESS PNG',
    sourceName: 'WEBP (Google Web Picture)',
    targetName: 'PNG (Portable Network Graphics)',
    whyConvert: 'Many legacy desktop image editors and older operating systems cannot open modern WebP files downloaded from websites. Converting to PNG allows you to edit and share the image anywhere without compatibility hurdles.',
    comparisonPoints: [
      { feature: 'Software Compatibility', source: 'Modern browsers only', target: '100% of all software suites' },
      { feature: 'Editing Support', source: 'Requires Photoshop plugins', target: 'Native in every photo app' }
    ],
    faqs: [
      {
        question: 'Will converting WebP to PNG keep the transparent background?',
        answer: 'Yes. The canvas preserves all alpha channels and exports a true 32-bit RGBA PNG.'
      }
    ]
  },
  'webp-to-jpg': {
    slug: 'webp-to-jpg',
    sourceFormat: 'WEBP',
    targetFormat: 'jpeg',
    title: 'Convert WEBP to JPG Online Free - Universal Image Converter | Quantum Qbit',
    headline: 'Convert WEBP to JPG Online Free',
    subheadline: 'Convert WebP images downloaded from websites into standard JPG format in one click. Instant client-side conversion without file limits.',
    metaDescription: 'Convert WEBP to JPG online for free. Transform web images into universally compatible JPEG photos without server uploads.',
    badge: 'WEBP TO JPEG CONVERTER',
    sourceName: 'WEBP',
    targetName: 'JPEG / JPG',
    whyConvert: 'JPG is the most widely recognized image format in history. Converting WebP to JPG ensures that any viewer, printing service, or older device can open the file immediately.',
    comparisonPoints: [
      { feature: 'Print Compatibility', source: 'Often unsupported', target: 'Industry Standard' }
    ],
    faqs: [
      {
        question: 'Can I batch convert or resize while converting?',
        answer: 'Yes. You can adjust the resize sliders or DPI settings in the same workspace before downloading.'
      }
    ]
  },
  'jpg-to-png': {
    slug: 'jpg-to-png',
    sourceFormat: 'JPG',
    targetFormat: 'png',
    title: 'Convert JPG to PNG Online Free - High Quality Raster Conversion | Quantum Qbit',
    headline: 'Convert JPG to PNG Online Free',
    subheadline: 'Convert JPEG and JPG photos into lossless PNG format with options to remove backgrounds and inject print metadata. 100% private in browser.',
    metaDescription: 'Convert JPG to PNG online free. Transform JPEG images into lossless PNG files with options to add transparency and change DPI.',
    badge: 'JPG TO PNG CONVERTER',
    sourceName: 'JPEG / JPG',
    targetName: 'PNG',
    whyConvert: 'Converting JPG to PNG eliminates further compression generation loss and allows you to apply background transparency and overlays without compression noise.',
    comparisonPoints: [
      { feature: 'Compression Type', source: 'Lossy', target: 'Lossless' },
      { feature: 'Transparency Support', source: 'No', target: 'Yes' }
    ],
    faqs: [
      {
        question: 'Can I make the background transparent after converting JPG to PNG?',
        answer: 'Yes! Simply switch to the "Remove BG" tab, click your background color with the eye-dropper, and export as PNG.'
      }
    ]
  },
  'png-to-jpg': {
    slug: 'png-to-jpg',
    sourceFormat: 'PNG',
    targetFormat: 'jpeg',
    title: 'Convert PNG to JPG Online Free - Reduce File Size Instantly | Quantum Qbit',
    headline: 'Convert PNG to JPG Online Free',
    subheadline: 'Convert heavy PNG graphics and screenshots into lightweight JPG images. Select quality levels to shrink file sizes by up to 90%.',
    metaDescription: 'Convert PNG to JPG online free. Shrink large PNG images into lightweight JPEG photos with customizable compression quality.',
    badge: 'PNG TO JPG CONVERTER',
    sourceName: 'PNG',
    targetName: 'JPEG / JPG',
    whyConvert: 'PNG files for photography and complex graphics can easily exceed 10MB to 20MB. Converting to JPG compresses the file down to a few hundred kilobytes for email and web uploads.',
    comparisonPoints: [
      { feature: 'File Size', source: 'Very Large', target: 'Compact & Lightweight' }
    ],
    faqs: [
      {
        question: 'What happens to transparent pixels when converting PNG to JPG?',
        answer: 'Because JPG does not support alpha channels, transparent pixels will default to clean solid white background.'
      }
    ]
  },
  'svg-to-png': {
    slug: 'svg-to-png',
    sourceFormat: 'SVG',
    targetFormat: 'png',
    title: 'Convert SVG to PNG Online Free - High Resolution Vector Rasterizer | Quantum Qbit',
    headline: 'Convert SVG to PNG Online Free',
    subheadline: 'Rasterize vector SVG files into crisp, high-resolution PNG images with transparent backgrounds at any DPI and dimension.',
    metaDescription: 'Convert SVG to PNG online free with transparent background. High resolution vector rasterizer with customizable width, height, and DPI.',
    badge: 'VECTOR RASTERIZER',
    sourceName: 'SVG (Scalable Vector Graphics)',
    targetName: 'PNG (Portable Network Graphics)',
    whyConvert: 'SVG files are scalable code, but many platforms and social media sites only accept raster images like PNG. Converting SVG to PNG produces a crisp pixel image.',
    comparisonPoints: [
      { feature: 'Format Structure', source: 'XML Vector Math', target: 'Bitmap Raster Pixels' },
      { feature: 'Social Media Sharing', source: 'Rarely Supported', target: 'Universal' }
    ],
    faqs: [
      {
        question: 'Can I upscale SVG to very high resolutions like 4K or 8K?',
        answer: 'Yes. You can define custom pixel dimensions in the Resize tab to rasterize your vector graphic at ultra-high resolutions.'
      }
    ]
  },
  'image-converter': {
    slug: 'image-converter',
    sourceFormat: 'ANY',
    targetFormat: 'webp',
    title: 'Free Online Image Converter - Any Format to Any Format | Quantum Qbit',
    headline: 'All-in-One Online Image Converter',
    subheadline: 'Convert between PNG, JPG, WEBP, ICO, BMP, SVG, HEIC, and PDF formats directly in your browser. Fast, private, and 100% free.',
    metaDescription: 'Free online image converter. Convert any image format to PNG, JPG, WEBP, ICO, BMP, and PDF with zero cloud uploads and full privacy.',
    badge: 'UNIVERSAL FORMAT ENGINE',
    sourceName: 'All Common Image Formats',
    targetName: 'PNG, JPG, WEBP, ICO, BMP, PDF, SVG',
    whyConvert: 'Different operating systems, web frameworks, and printers require different image container formats. Quantum Qbit provides instant client-side conversion between all major graphics formats.',
    comparisonPoints: [
      { feature: 'Server Storage', source: 'Zero (Runs in RAM)', target: 'Zero (Client-Side)' },
      { feature: 'Conversion Latency', source: 'Sub-second', target: 'Instant local export' }
    ],
    faqs: [
      {
        question: 'What image formats can I convert on Quantum Qbit?',
        answer: 'We support input and output for PNG, JPEG/JPG, WEBP, ICO (favicon generator), BMP, PDF, SVG, and Apple HEIC/HEIF photos.'
      }
    ]
  }
};

interface SeoConverterLandingProps {
  config: ConverterSeoData;
}

export const SeoConverterLanding: React.FC<SeoConverterLandingProps> = ({ config }) => {
  const otherConverters = Object.values(CONVERTER_SEO_CONFIGS).filter((c) => c.slug !== config.slug);

  return (
    <section style={styles.container}>
      {/* Informative Content Header */}
      <div style={styles.header}>
        <div className="liquid-glass-pill" style={{ marginBottom: '14px' }}>
          <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          <span>{config.badge}</span>
        </div>
        <h1 style={styles.headline}>
          {config.headline}
        </h1>
        <p style={styles.subheadline}>
          {config.subheadline}
        </p>

        {/* Feature Highlights Pills */}
        <div style={styles.trustBadges}>
          <div className="liquid-glass-pill" style={styles.trustPill}>
            <ShieldCheck size={14} style={{ color: 'var(--emerald)' }} />
            <span>100% Client-Side Privacy</span>
          </div>
          <div className="liquid-glass-pill" style={styles.trustPill}>
            <Zap size={14} style={{ color: 'var(--primary)' }} />
            <span>Instant Zero Network Latency</span>
          </div>
          <div className="liquid-glass-pill" style={styles.trustPill}>
            <Lock size={14} style={{ color: 'var(--accent)' }} />
            <span>No Server Storage or Uploads</span>
          </div>
        </div>
      </div>

      {/* Why Convert Section & Comparison */}
      <div className="liquid-glass-card" style={styles.detailsCard}>
        <h2 style={styles.cardTitle}>Why Convert {config.sourceFormat} to {config.targetFormat.toUpperCase()}?</h2>
        <p style={styles.cardBody}>
          {config.whyConvert}
        </p>

        {config.comparisonPoints && config.comparisonPoints.length > 0 && (
          <div style={{ marginTop: '24px', overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Feature / Specification</th>
                  <th style={styles.th}>{config.sourceName}</th>
                  <th style={styles.th}>{config.targetName}</th>
                </tr>
              </thead>
              <tbody>
                {config.comparisonPoints.map((item, idx) => (
                  <tr key={idx} style={styles.tableRow}>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{item.feature}</td>
                    <td style={{ ...styles.td, color: 'var(--text-secondary)' }}>{item.source}</td>
                    <td style={{ ...styles.td, color: 'var(--primary)', fontWeight: 600 }}>{item.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Step-by-Step Tutorial */}
      <div className="liquid-glass-card" style={styles.stepsCard}>
        <h2 style={styles.cardTitle}>How to Convert {config.sourceFormat} to {config.targetFormat.toUpperCase()} in 3 Simple Steps</h2>
        <div style={styles.stepsGrid}>
          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>1</div>
            <h3 style={styles.stepTitle}>Select or Drop Image</h3>
            <p style={styles.stepDesc}>
              Upload your {config.sourceFormat} file into the workspace above by clicking Select File or dragging it directly into the frame.
            </p>
          </div>

          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>2</div>
            <h3 style={styles.stepTitle}>Confirm Format Options</h3>
            <p style={styles.stepDesc}>
              Target format is pre-configured to <strong>{config.targetFormat.toUpperCase()}</strong>. Fine-tune quality percentage, dimensions, or DPI if desired.
            </p>
          </div>

          <div style={styles.stepItem}>
            <div style={styles.stepNumber}>3</div>
            <h3 style={styles.stepTitle}>Instant Local Download</h3>
            <p style={styles.stepDesc}>
              Click <strong>Convert Image</strong> and download your file. The process executes 100% in your browser RAM with zero server queues.
            </p>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      {config.faqs && config.faqs.length > 0 && (
        <div className="liquid-glass-card" style={styles.faqCard}>
          <h2 style={styles.cardTitle}>Frequently Asked Questions</h2>
          <div style={styles.faqList}>
            {config.faqs.map((faq, idx) => (
              <div key={idx} style={styles.faqItem}>
                <h4 style={styles.faqQuestion}>
                  <CheckCircle2 size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                  <span>{faq.question}</span>
                </h4>
                <p style={styles.faqAnswer}>{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Explore Related Converters */}
      <div style={styles.relatedSection}>
        <h3 style={styles.relatedTitle}>Explore More Free In-Browser Converters</h3>
        <div style={styles.relatedGrid}>
          {otherConverters.slice(0, 8).map((other) => (
            <button
              key={other.slug}
              onClick={() => navigate(`/${other.slug}`)}
              className="liquid-glass-card liquid-glass-card-interactive"
              style={styles.relatedBtn}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} style={{ color: 'var(--primary)' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{other.headline}</span>
              </div>
              <ArrowRight size={14} style={{ color: 'var(--primary)' }} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    maxWidth: '1100px',
    margin: '40px auto 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '32px',
    padding: '0 16px',
  },
  header: {
    textAlign: 'center' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '12px',
  },
  headline: {
    fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)',
    fontWeight: 800,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    margin: 0,
  },
  subheadline: {
    fontSize: '1.05rem',
    color: 'var(--text-secondary)',
    maxWidth: '740px',
    lineHeight: 1.6,
    margin: 0,
  },
  trustBadges: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap' as const,
    gap: '10px',
    marginTop: '12px',
  },
  trustPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '6px 14px',
  },
  detailsCard: {
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
  },
  stepsCard: {
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
  },
  faqCard: {
    padding: '36px',
    borderRadius: 'var(--radius-xl)',
  },
  cardTitle: {
    fontSize: '1.45rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    margin: '0 0 14px 0',
  },
  cardBody: {
    color: 'var(--text-secondary)',
    fontSize: '0.96rem',
    lineHeight: 1.65,
    margin: 0,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '0.9rem',
  },
  tableHeader: {
    borderBottom: '1px solid var(--border-glass-active)',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px 16px',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.82rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-glass)',
  },
  td: {
    padding: '14px 16px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  stepNumber: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.25), rgba(79, 172, 254, 0.15))',
    border: '1px solid var(--primary)',
    color: 'var(--primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
  },
  stepTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    margin: 0,
  },
  stepDesc: {
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.55,
    margin: 0,
  },
  faqList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    marginTop: '16px',
  },
  faqItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    borderBottom: '1px solid var(--border-glass)',
    paddingBottom: '16px',
  },
  faqQuestion: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.02rem',
    fontWeight: 600,
    margin: 0,
    color: 'var(--text-primary)',
  },
  faqAnswer: {
    fontSize: '0.92rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
    margin: '0 0 0 26px',
  },
  relatedSection: {
    marginTop: '16px',
  },
  relatedTitle: {
    fontSize: '1.2rem',
    fontWeight: 700,
    marginBottom: '16px',
    textAlign: 'center' as const,
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '12px',
  },
  relatedBtn: {
    padding: '16px 20px',
    borderRadius: 'var(--radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    border: '1px solid var(--border-glass)',
    background: 'var(--glass-bg)',
    color: 'var(--text-primary)',
    textAlign: 'left' as const,
  },
};
