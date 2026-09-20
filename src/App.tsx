import { useState, useEffect, lazy, Suspense } from 'react';
import LiquidNavbar from './components/LiquidNavbar';
import LiquidFooter from './components/LiquidFooter';
import LiquidGlassBackground from './components/LiquidGlassBackground';
import LandingPage from './pages/LandingPage';
import { usePath, navigate } from './utils/router';
import { updateSEO } from './utils/seo';
import { CONVERTER_SEO_CONFIGS } from './components/SeoConverterLanding';

declare global {
  interface Window {
    showToast?: (message: string, type?: 'success' | 'error') => void;
  }
}

// Lazy load tool workshops, blogs & compliance pages
const Tools = lazy(() => import('./pages/Tools'));
const Blogs = lazy(() => import('./pages/Blogs'));
const AdminBlogs = lazy(() => import('./pages/AdminBlogs'));
const AboutUs = lazy(() => import('./pages/AboutUs'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsAndConditions = lazy(() => import('./pages/TermsAndConditions'));

function App() {
  const rawPath = usePath();
  const path = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    window.showToast = (message: string, type: 'success' | 'error' = 'error') => {
      setToast({ message, type });
      clearTimeout(timer);
      timer = setTimeout(() => {
        setToast(null);
      }, 4000);
    };
    return () => clearTimeout(timer);
  }, []);

  // Performance script loading for Google Analytics & AdSense
  useEffect(() => {
    let loaded = false;
    const loadScripts = () => {
      if (loaded) return;
      loaded = true;

      window.removeEventListener('scroll', loadScripts);
      window.removeEventListener('mousemove', loadScripts);
      window.removeEventListener('touchstart', loadScripts);

      // Google AdSense
      const adScript = document.createElement('script');
      adScript.async = true;
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3643379306547907";
      adScript.crossOrigin = "anonymous";
      document.head.appendChild(adScript);
    };

    const timeoutId = setTimeout(loadScripts, 3500);
    window.addEventListener('scroll', loadScripts, { passive: true });
    window.addEventListener('mousemove', loadScripts, { passive: true });
    window.addEventListener('touchstart', loadScripts, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', loadScripts);
      window.removeEventListener('mousemove', loadScripts);
      window.removeEventListener('touchstart', loadScripts);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Route parser
  let page = 'landing';
  let tool = 'none';
  let toolTab: string | undefined = undefined;
  let toolConvertFormat: 'png' | 'jpeg' | 'webp' | 'bmp' | 'pdf' | 'ico' | 'svg' | undefined = undefined;
  let converterSeo: any = undefined;
  let blogPostId: string | undefined = undefined;

  if (path === '/png-to-ico' || path === '/pngtoico') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'ico';
    converterSeo = CONVERTER_SEO_CONFIGS['png-to-ico'];
  } else if (path === '/heic-to-png' || path === '/heif-to-png' || path === '/heicto-png' || path === '/heifto-png') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'png';
    converterSeo = CONVERTER_SEO_CONFIGS['heic-to-png'];
  } else if (path === '/heic-to-jpg' || path === '/heif-to-jpg' || path === '/heic-to-jpeg' || path === '/heif-to-jpeg') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'jpeg';
    converterSeo = CONVERTER_SEO_CONFIGS['heic-to-jpg'];
  } else if (path === '/png-to-webp' || path === '/pngtowebp') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'webp';
    converterSeo = CONVERTER_SEO_CONFIGS['png-to-webp'];
  } else if (path === '/webp-to-png' || path === '/webptopng') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'png';
    converterSeo = CONVERTER_SEO_CONFIGS['webp-to-png'];
  } else if (path === '/webp-to-jpg' || path === '/webp-to-jpeg' || path === '/webptojpeg' || path === '/webptojpg') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'jpeg';
    converterSeo = CONVERTER_SEO_CONFIGS['webp-to-jpg'];
  } else if (path === '/jpg-to-png' || path === '/jpeg-to-png' || path === '/jpgtopng') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'png';
    converterSeo = CONVERTER_SEO_CONFIGS['jpg-to-png'];
  } else if (path === '/png-to-jpg' || path === '/png-to-jpeg' || path === '/pngtojpg') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'jpeg';
    converterSeo = CONVERTER_SEO_CONFIGS['png-to-jpg'];
  } else if (path === '/svg-to-png' || path === '/svgtopng') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'png';
    converterSeo = CONVERTER_SEO_CONFIGS['svg-to-png'];
  } else if (path === '/image-converter' || path === '/imgconverter' || path === '/convert-image' || path === '/tools/image-converter') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'convert';
    toolConvertFormat = 'png';
    converterSeo = CONVERTER_SEO_CONFIGS['image-converter'];
  } else if (path === '/image-studio' || path === '/image-editor' || path === '/image-transform' || path === '/tools/image-editor' || path === '/tools/image-transform') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'adjust';
  } else if (path === '/image-compressor' || path === '/photo-compressor' || path === '/tools/image-compressor') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'compress';
  } else if (path === '/remove-bg' || path === '/bg-remove' || path === '/remove-background' || path === '/tools/remove-bg') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'bg-remove';
  } else if (path === '/image-crop' || path === '/crop-image' || path === '/tools/image-crop') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'crop';
  } else if (path === '/image-resize' || path === '/resize-image' || path === '/tools/image-resize') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'resize';
  } else if (path === '/image-dpi' || path === '/change-dpi' || path === '/dpi-converter' || path === '/tools/image-dpi') {
    page = 'image-studio';
    tool = 'image-editor';
    toolTab = 'dpi';
  } else if (path === '/pdf-workshop' || path === '/pdf-editor' || path === '/tools/pdf-editor') {
    page = 'pdf-workshop';
    tool = 'pdf-editor';
  } else if (path === '/pdf-compressor' || path === '/tools/pdf-compressor') {
    page = 'pdf-workshop';
    tool = 'pdf-editor';
    toolTab = 'compress';
  } else if (path === '/images-to-pdf' || path === '/tools/images-to-pdf') {
    page = 'pdf-workshop';
    tool = 'pdf-editor';
    toolTab = 'imgToPdf';
  } else if (path === '/convert-to-pdf' || path === '/tools/convert-to-pdf') {
    page = 'pdf-workshop';
    tool = 'pdf-editor';
    toolTab = 'officeToPdf';
  } else if (path === '/pdf-to-word' || path === '/tools/pdf-to-word') {
    page = 'pdf-workshop';
    tool = 'pdf-editor';
    toolTab = 'pdfToWord';
  } else if (path === '/tools') {
    page = 'tools';
    tool = 'none';
  } else if (path.startsWith('/blogs')) {
    page = 'blogs';
    const match = path.match(/^\/blogs\/([^/]+)/);
    if (match) {
      blogPostId = match[1];
    }
  } else if (path === '/admin' || path === '/admin/blogs') {
    page = 'admin-blogs';
  } else if (path === '/about') {
    page = 'about';
  } else if (path === '/contact') {
    page = 'contact';
  } else if (path === '/privacy') {
    page = 'privacy';
  } else if (path === '/terms') {
    page = 'terms';
  }

  // SEO Updates
  useEffect(() => {
    if (converterSeo) {
      const converterSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": converterSeo.headline,
        "description": converterSeo.metaDescription,
        "operatingSystem": "All",
        "applicationCategory": "MultimediaApplication",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      };
      updateSEO(
        converterSeo.title,
        converterSeo.metaDescription,
        `/${converterSeo.slug}`,
        converterSchema
      );
    } else if (page === 'landing') {
      updateSEO(
        "Quantum Qbit | Liquid Glass Media Studio & Local Utilities",
        "Studio-grade media utilities with liquid glass design. Edit photos, compress images, and manage PDFs 100% locally in your browser with zero cloud uploads.",
        "/"
      );
    } else if (page === 'image-studio') {
      updateSEO(
        "Image Studio | Quantum Qbit Liquid Tools",
        "High-performance client-side photo editor. Crop, resize, compress to exact KB targets, adjust DPI, and convert formats 100% in browser memory.",
        "/image-studio"
      );
    } else if (page === 'pdf-workshop') {
      updateSEO(
        "PDF Workshop | Quantum Qbit Liquid Tools",
        "Merge, split, compress, and run client-side OCR on PDFs. Convert photos to PDF and documents without remote server storage.",
        "/pdf-workshop"
      );
    } else if (page === 'tools') {
      updateSEO(
        "Media Utilities Directory | Quantum Qbit",
        "Explore Quantum Qbit's private in-browser tool suite for photos and PDF workflows.",
        "/tools"
      );
    } else if (page === 'blogs') {
      // Blogs manages its own SEO based on active article
    } else if (page === 'about') {
      updateSEO(
        "About Us | Quantum Qbit Liquid Architecture",
        "Discover our mission to return computing power to the client with liquid glass aesthetics and zero data leakage.",
        "/about"
      );
    } else if (page === 'contact') {
      updateSEO(
        "Contact Us | Quantum Qbit Support",
        "Reach out to the Quantum Qbit team with questions, feature requests, or suggestions.",
        "/contact"
      );
    } else if (page === 'privacy') {
      updateSEO(
        "Privacy Policy - 100% Client-Side Safe | Quantum Qbit",
        "Read our privacy policy. Your private files never leave your browser memory.",
        "/privacy"
      );
    } else if (page === 'admin-blogs') {
      updateSEO(
        "Blog Management Studio | Quantum Qbit Admin",
        "Administrative console to publish, edit, batch delete, and manage Quantum Qbit engineering articles using custom XML-like tag markup.",
        "/admin"
      );
    } else if (page === 'terms') {
      updateSEO(
        "Terms and Conditions | Quantum Qbit",
        "Terms of service for utilizing the free tools and utility libraries on the Quantum Qbit platform.",
        "/terms"
      );
    }
  }, [page]);

  const handleNavPage = (p: string) => {
    if (p === 'landing') navigate('/');
    else if (p === 'image-studio') navigate('/image-studio');
    else if (p === 'pdf-workshop') navigate('/pdf-workshop');
    else if (p === 'blogs') navigate('/blogs');
    else if (p === 'admin-blogs' || p === 'admin') navigate('/admin');
    else navigate(`/${p}`);
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage />;
      case 'image-studio':
      case 'pdf-workshop':
      case 'tools':
        return (
          <Tools
            selectedTool={tool}
            setSelectedTool={(newTool) => {
              if (newTool === 'none') {
                navigate('/tools');
              } else if (newTool === 'image-editor') {
                navigate('/image-studio');
              } else if (newTool === 'pdf-editor') {
                navigate('/pdf-workshop');
              } else {
                navigate(`/tools/${newTool}`);
              }
            }}
            defaultTab={toolTab}
            defaultConvertFormat={toolConvertFormat}
            seoData={converterSeo}
          />
        );
      case 'blogs':
        return (
          <Blogs
            postId={blogPostId}
            setPostId={(newPostId) => {
              if (newPostId) {
                navigate(`/blogs/${newPostId}`);
              } else {
                navigate('/blogs');
              }
            }}
          />
        );
      case 'admin-blogs':
        return <AdminBlogs />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'privacy':
        return <PrivacyPolicy setCurrentPage={handleNavPage} />;
      case 'terms':
        return <TermsAndConditions setCurrentPage={handleNavPage} />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <>
      <LiquidGlassBackground />
      <div style={styles.appContainer}>
        <LiquidNavbar
          currentPage={page}
          setCurrentPage={handleNavPage}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main style={styles.mainContent}>
          <Suspense
            fallback={
              <div style={styles.loadingContainer}>
                <div className="liquid-glass-pill">
                  <span>Initialising Liquid Systems...</span>
                </div>
              </div>
            }
          >
            {renderPage()}
          </Suspense>
        </main>

        <LiquidFooter setCurrentPage={handleNavPage} />

        {toast && (
          <div className="toast-animation">
            <div
              className="toast-card"
              style={{
                borderLeft: toast.type === 'error' ? '4px solid #ef4444' : '4px solid #10b981',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>
                {toast.type === 'error' ? '⚠️' : '✨'}
              </span>
              <span>{toast.message}</span>
              <button className="toast-close-btn" onClick={() => setToast(null)}>
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    position: 'relative' as const,
    zIndex: 1,
    width: '100%',
    backgroundColor: 'transparent',
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    fontSize: '1.1rem',
    fontFamily: 'var(--font-heading)',
    color: 'var(--primary)',
  },
};

export default App;
