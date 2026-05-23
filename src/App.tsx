import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { usePath, navigate } from './utils/router';
import { updateSEO } from './utils/seo';

// Static imports for initial/lightweight pages to avoid waterfall & layout shifts
import LandingPage from './pages/LandingPage';
import Tools from './pages/Tools';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

// Lazy load heavier features that use external libraries
const Blogs = lazy(() => import('./pages/Blogs'));
const Admin = lazy(() => import('./pages/Admin'));

function App() {
  const rawPath = usePath();
  const path = rawPath.endsWith('/') && rawPath.length > 1 ? rawPath.slice(0, -1) : rawPath;

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [blogCategory, setBlogCategory] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Google AdSense script on delay or first interaction to maximize PageSpeed score
  useEffect(() => {
    let loaded = false;
    const loadAdSense = () => {
      if (loaded) return;
      loaded = true;
      
      // Clean up event listeners
      window.removeEventListener('scroll', loadAdSense);
      window.removeEventListener('mousemove', loadAdSense);
      window.removeEventListener('touchstart', loadAdSense);
      
      const script = document.createElement('script');
      script.async = true;
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6096598752695949";
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    // Load after 3.5 seconds delay or on first interaction (whichever comes first)
    const timeoutId = setTimeout(loadAdSense, 3500);

    window.addEventListener('scroll', loadAdSense, { passive: true });
    window.addEventListener('mousemove', loadAdSense, { passive: true });
    window.addEventListener('touchstart', loadAdSense, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', loadAdSense);
      window.removeEventListener('mousemove', loadAdSense);
      window.removeEventListener('touchstart', loadAdSense);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Route parser
  let page = 'landing';
  let tool = 'none';
  let toolTab: any = undefined;
  let blogPostId: string | undefined = undefined;

  if (path.startsWith('/tools')) {
    page = 'tools';
    const subpath = path.substring(6); // e.g. "/pdf-editor", "/pdf-compressor"
    if (subpath === '/image-editor') {
      tool = 'image-editor';
    } else if (subpath === '/image-compressor' || subpath === '/photo-compressor') {
      tool = 'image-editor';
      toolTab = 'compress';
    } else if (subpath === '/pdf-editor') {
      tool = 'pdf-editor';
    } else if (subpath === '/pdf-compressor') {
      tool = 'pdf-editor';
      toolTab = 'compress';
    } else if (subpath === '/images-to-pdf') {
      tool = 'pdf-editor';
      toolTab = 'imgToPdf';
    } else if (subpath === '/convert-to-pdf') {
      tool = 'pdf-editor';
      toolTab = 'officeToPdf';
    } else if (subpath === '/pdf-to-word') {
      tool = 'pdf-editor';
      toolTab = 'pdfToWord';
    } else if (subpath === '/math-calculators') {
      tool = 'math-calculators';
    } else if (subpath === '' || subpath === '/') {
      tool = 'none';
    }
  } else if (path.startsWith('/blogs')) {
    page = 'blogs';
    const match = path.match(/^\/blogs\/([^/]+)/);
    if (match) {
      blogPostId = match[1];
    }
  } else if (path === '/about') {
    page = 'about';
  } else if (path === '/contact') {
    page = 'contact';
  } else if (path === '/privacy') {
    page = 'privacy';
  } else if (path === '/terms') {
    page = 'terms';
  } else if (path === '/admin') {
    page = 'admin';
  }

  // Toggle body class for admin page to hide the traditional sticky bottom ad
  useEffect(() => {
    if (page === 'admin') {
      document.body.classList.add('page-admin');
    } else {
      document.body.classList.remove('page-admin');
    }
  }, [page]);

  // Dynamic SEO Updates for main pages (Tools and Blogs update their own metadata)
  useEffect(() => {
    if (page === 'landing') {
      updateSEO(
        "Quantum Qbit - Free Client-Side Web Utility Tools",
        "Free, offline-first developer, designer, and student productivity tools. PDF editor, image compressor, Base/Math converters, and unit utilities. 100% private.",
        "/",
        {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://quantumqbit.in/#website",
              "url": "https://quantumqbit.in/",
              "name": "Quantum Qbit",
              "description": "Free Client-Side Web Utility Tools"
            },
            {
              "@type": "Organization",
              "@id": "https://quantumqbit.in/#organization",
              "name": "Quantum Qbit",
              "url": "https://quantumqbit.in/",
              "logo": {
                "@type": "ImageObject",
                "@id": "https://quantumqbit.in/#logo",
                "url": "https://quantumqbit.in/favicon_qq.png",
                "caption": "Quantum Qbit Logo"
              },
              "image": {
                "@id": "https://quantumqbit.in/#logo"
              }
            }
          ]
        }
      );
    } else if (page === 'tools' && tool === 'none') {
      updateSEO(
        "Web Applications & Tools Directory | Quantum Qbit",
        "Browse our collection of free client-side utility applications. Compress images, merge/convert PDFs, and perform base math offline.",
        "/tools"
      );
    } else if (page === 'about') {
      updateSEO(
        "About Our Mission - Privacy-First Web Utilities | Quantum Qbit",
        "Learn about Quantum Qbit's offline-first architecture. All calculation, image resizing, and PDF editing happen 100% in your browser.",
        "/about"
      );
    } else if (page === 'contact') {
      updateSEO(
        "Contact Us - Quantum Qbit Support",
        "Get in touch with the Quantum Qbit development team. Send suggestions, feature requests, or business inquiries.",
        "/contact"
      );
    } else if (page === 'privacy') {
      updateSEO(
        "Privacy Policy - 100% Client-Side Safe | Quantum Qbit",
        "Read our privacy policy. Since all tools process data locally on your device, your private files never touch a remote server.",
        "/privacy"
      );
    } else if (page === 'terms') {
      updateSEO(
        "Terms and Conditions - Quantum Qbit",
        "Terms of service for utilizing the free tools and utility libraries on the Quantum Qbit workspace.",
        "/terms"
      );
    } else if (page === 'admin') {
      updateSEO(
        "Admin Portal | Quantum Qbit",
        "Management interface for blogging categories and publishing content.",
        "/admin"
      );
    }
  }, [page, tool]);

  const handleSetCurrentPage = (p: string) => {
    if (p === 'landing') navigate('/');
    else navigate(`/${p}`);
  };

  const renderPage = () => {
    switch (page) {
      case 'landing':
        return <LandingPage />;
      case 'tools':
        return (
          <Tools 
            selectedTool={tool} 
            setSelectedTool={(newTool) => {
              if (newTool === 'none') {
                navigate('/tools');
              } else {
                navigate(`/tools/${newTool}`);
              }
            }} 
            defaultTab={toolTab}
          />
        );
      case 'blogs':
        return (
          <Blogs 
            selectedCategory={blogCategory} 
            setSelectedCategory={setBlogCategory} 
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
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'privacy':
        return <PrivacyPolicy setCurrentPage={handleSetCurrentPage} />;
      case 'terms':
        return <TermsAndConditions setCurrentPage={handleSetCurrentPage} />;
      case 'admin':
        return <Admin setCurrentPage={handleSetCurrentPage} />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div style={styles.appContainer}>
      <Navbar 
        currentPage={page} 
        setCurrentPage={handleSetCurrentPage} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        setSidebarOpen={setSidebarOpen}
      />
      
      {page !== 'admin' && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPage={page}
          setCurrentPage={handleSetCurrentPage}
          selectedTool={tool}
          setSelectedTool={(t) => {
            if (t === 'none') navigate('/tools');
            else navigate(`/tools/${t}`);
          }}
          selectedCategory={blogCategory}
          setSelectedCategory={setBlogCategory}
        />
      )}
      
      <div className="content-layout">
        <main style={styles.mainContent} className="main-content-area">
          <Suspense fallback={
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              color: 'var(--primary)',
              fontSize: '1.1rem',
              fontFamily: 'var(--font-heading)',
              textShadow: '0 0 10px var(--primary-glow)',
              letterSpacing: '0.05em'
            }}>
              Loading Quantum Systems...
            </div>
          }>
            {renderPage()}
          </Suspense>
        </main>
      </div>

      <Footer setCurrentPage={handleSetCurrentPage} />

    </div>
  );
}

const styles = {
  appContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
    position: 'relative' as const,
  },
  mainContent: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },

};

export default App;
