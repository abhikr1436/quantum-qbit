import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import Tools from './pages/Tools';
import Blogs from './pages/Blogs';
import AboutUs from './pages/AboutUs';
import ContactUs from './pages/ContactUs';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import Admin from './pages/Admin';
import AdSlot from './components/AdSlot';
import Sidebar from './components/Sidebar';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('landing');
  const [selectedTool, setSelectedTool] = useState<string>('none');
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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage 
            setCurrentPage={setCurrentPage} 
            setSelectedTool={setSelectedTool} 
          />
        );
      case 'tools':
        return (
          <Tools 
            selectedTool={selectedTool} 
            setSelectedTool={setSelectedTool} 
          />
        );
      case 'blogs':
        return (
          <Blogs 
            selectedCategory={blogCategory} 
            setSelectedCategory={setBlogCategory} 
          />
        );
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      case 'privacy':
        return <PrivacyPolicy setCurrentPage={setCurrentPage} />;
      case 'terms':
        return <TermsAndConditions setCurrentPage={setCurrentPage} />;
      case 'admin':
        return <Admin setCurrentPage={setCurrentPage} />;
      default:
        return (
          <LandingPage 
            setCurrentPage={setCurrentPage} 
            setSelectedTool={setSelectedTool} 
          />
        );
    }
  };

  return (
    <div style={styles.appContainer}>
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        theme={theme} 
        toggleTheme={toggleTheme} 
        setSidebarOpen={setSidebarOpen}
      />
      
      {currentPage !== 'admin' && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          selectedCategory={blogCategory}
          setSelectedCategory={setBlogCategory}
        />
      )}
      
      <main style={styles.mainContent}>
        {renderPage()}
      </main>

      <Footer setCurrentPage={setCurrentPage} />

      {/* Dynamic Ad Slots (excluding Admin workspace for a clean portal experience) */}
      {currentPage !== 'admin' && (
        <>
          <AdSlot id="bottom-sticky-banner-ad" type="banner" />
          <AdSlot id="interstitial-popup-ad" type="popup" />
        </>
      )}
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
