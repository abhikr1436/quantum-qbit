import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

const SHOW_SQUARE_AD = false; // Toggle to enable Square Ads
const SHOW_BANNER_AD = true; // Toggle to enable Banner Ads
const SHOW_SIDEBAR_AD = false; // Toggle to enable Sidebar Ads
const SHOW_POPUP_AD = false; // Toggle to enable Popup Ads

// ==========================================
// 1. SQUARE AD (Google AdSense Slot 9567651830)
// ==========================================
interface SquareAdProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SquareAd: React.FC<SquareAdProps> = ({ id, className = '', style }) => {
  if (!SHOW_SQUARE_AD) return null;

  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense push error (non-critical):', err);
    }
  }, []);

  return (
    <div id={id} className={className} style={{ width: '100%', margin: '20px auto', display: 'flex', justifyContent: 'center', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: '336px' }}
        data-ad-client="ca-pub-6096598752695949"
        data-ad-slot="9567651830"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
};

// ==========================================
// 2. BANNER AD (HilltopAds / Sticky Bottom)
// ==========================================
interface BannerAdProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export const BannerAd: React.FC<BannerAdProps> = ({ id, className = '', style }) => {
  if (!SHOW_BANNER_AD) return null;

  const [isVisible, setIsVisible] = useState(true);
  const [hasContent, setHasContent] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !bannerRef.current) return;
    
    const container = bannerRef.current;
    container.innerHTML = '';
    
    // Set up MutationObserver to detect when actual ad content is injected
    const observer = new MutationObserver(() => {
      const children = Array.from(container.childNodes);
      const hasAdElements = children.some(node => node.nodeName !== 'SCRIPT');
      if (hasAdElements) {
        setHasContent(true);
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    
    const script = document.createElement('script');
    script.src = "//prizefamily.com/b/X.V-sOdXG/l/0/YeWece/jeEmo9/uuZ/UwlskfPYTkcIw/NDj/gJ0IO-DAEDtGNczzAE2/OTDUQp4/NBQS";
    script.async = true;
    script.referrerPolicy = 'no-referrer-when-downgrade';
    // @ts-ignore
    script.settings = {};
    
    container.appendChild(script);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  const containerStyle: React.CSSProperties = hasContent
    ? { ...bannerAdStyle, ...style }
    : { position: 'fixed', left: '-9999px', bottom: '-9999px', opacity: 0, pointerEvents: 'none', width: '100%', maxWidth: '900px' };

  return (
    <div 
      id={id} 
      className={hasContent ? `glass-card ${className}` : className} 
      style={containerStyle}
    >
      <div style={hasContent ? bannerGlowStyle : { display: 'none' }}></div>
      <div style={hasContent ? bannerFlexStyle : { display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexGrow: 1, justifyContent: 'center' }}>
          <span style={hasContent ? bannerBadgeStyle : { display: 'none' }}>SPONSOR AD</span>
          
          {/* Keep the loading indicator outside of the ref'd container, to avoid React DOM reconciliation crashes when the script injects items */}
          {!hasContent && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loading ad...</span>}
          
          <div 
            ref={bannerRef} 
            style={{ 
              display: hasContent ? 'flex' : 'none', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '60px', 
              width: '100%', 
              maxWidth: '728px' 
            }} 
          />
        </div>
        <div style={hasContent ? { display: 'flex', alignItems: 'center', gap: '15px' } : { display: 'none' }}>
          <button onClick={handleClose} style={closeBtnStyle} title="Dismiss Ad">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. SIDEBAR AD (Google AdSense / Vertical)
// ==========================================
interface SidebarAdProps {
  id: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SidebarAd: React.FC<SidebarAdProps> = ({ id, className = '', style }) => {
  if (!SHOW_SIDEBAR_AD) return null;

  const adRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    try {
      if (adRef.current && !adRef.current.hasAttribute('data-adsbygoogle-status')) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense sidebar push error (non-critical):', err);
    }
  }, []);

  return (
    <div id={id} className={className} style={{ width: '100%', margin: '20px auto', display: 'flex', justifyContent: 'center', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', width: '100%', maxWidth: '300px' }}
        data-ad-client="ca-pub-6096598752695949"
        data-ad-slot="1928374650"
        data-ad-format="vertical"
        data-full-width-responsive="true"
      />
    </div>
  );
};

// ==========================================
// 4. POPUP INTERSTITIAL AD (Promo Modal)
// ==========================================
interface PopupAdProps {
  id: string;
  delayMs?: number;
}

export const PopupAd: React.FC<PopupAdProps> = ({ id, delayMs = 4000 }) => {
  if (!SHOW_POPUP_AD) return null;

  const [isVisible, setIsVisible] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem(`quantum_popup_shown_${id}`);
    if (popupShown) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [id, delayMs]);

  useEffect(() => {
    if (!showPopup || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopup, countdown]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem(`quantum_popup_shown_${id}`, 'true');
  };

  if (!isVisible || !showPopup) return null;

  return (
    <div style={popupOverlayStyle}>
      <div style={popupContentStyle} className="glass-card">
        <div style={popupGlowStyle}></div>
        
        {/* Close Button Header */}
        <div style={popupHeaderStyle}>
          <span style={sponsorTextStyle}>SECURE SPONSOR PROMOTION</span>
          {countdown > 0 ? (
            <span style={countdownStyle}>Dismiss in {countdown}s...</span>
          ) : (
            <button onClick={handleClose} style={popupCloseBtnStyle}>
              <X size={18} />
            </button>
          )}
        </div>

        {/* Main Promo Area */}
        <div style={popupBodyStyle}>
          <div style={iconContainerStyle}>Q</div>
          <h3 style={popupTitleStyle}>QUANTUM PREMIUM UTILITIES</h3>
          <p style={popupDescStyle}>
            Enjoyed our local PDF compression and image workbench tools? Support the project and unlock early access to our offline-first AI translation sandbox.
          </p>

          <div style={popupFeaturesStyle}>
            <div style={featureItemStyle}>✦ No Cloud Data Interception</div>
            <div style={featureItemStyle}>✦ Sub-second Browser Rendering</div>
            <div style={featureItemStyle}>✦ Zero Cookies & Ad Trackers</div>
          </div>

          <div style={popupActionsStyle}>
            <button onClick={handleClose} style={popupActionPrimaryStyle}>
              Unlock Premium Features
            </button>
            <button 
              onClick={handleClose} 
              disabled={countdown > 0}
              style={{
                ...popupActionSecondaryStyle,
                opacity: countdown > 0 ? 0.4 : 1,
                cursor: countdown > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              Keep Free Version
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// CSS STYLING & PALETTES
// ==========================================
const sponsorTextStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  color: 'var(--primary)',
  letterSpacing: '0.15em',
  fontWeight: 600,
  fontFamily: 'var(--font-heading)',
  marginBottom: '10px',
  opacity: 0.8,
  textShadow: '0 0 8px var(--primary-glow)',
};

const taglineStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontFamily: 'monospace',
  color: 'var(--text-muted)',
  textAlign: 'center',
  borderTop: '1px solid var(--border-glass)',
  paddingTop: '10px',
  marginTop: '10px',
};

// 1. Square Ad CSS
const squareAdContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  background: 'rgba(10, 12, 22, 0.45)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border-glass-active)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-card), 0 0 25px rgba(0, 242, 254, 0.08), inset 0 0 12px rgba(157, 78, 221, 0.05)',
  transition: 'var(--transition-smooth)',
  maxWidth: '340px',
  width: '100%',
  margin: '25px auto',
  position: 'relative',
};

const squareFallbackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 20px',
  background: 'rgba(10, 12, 22, 0.45)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border-glass-active)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  position: 'relative',
  aspectRatio: '1/1',
  maxWidth: '320px',
  width: '100%',
  margin: '20px auto',
  justifyContent: 'space-between',
  boxShadow: 'var(--shadow-card), 0 0 15px rgba(0, 242, 254, 0.05)',
  transition: 'var(--transition-smooth)',
};

const squareGlowBgStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-20px',
  left: '-20px',
  width: '100px',
  height: '100px',
  background: 'radial-gradient(circle, var(--secondary-glow) 0%, transparent 70%)',
  pointerEvents: 'none',
  zIndex: 1,
};

const squareContentContainerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flexGrow: 1,
  justifyContent: 'center',
};

const squareTitleStyle: React.CSSProperties = {
  fontSize: '1rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: 'var(--text-primary)',
  marginBottom: '6px',
  fontFamily: 'var(--font-heading)',
};

const squareDescStyle: React.CSSProperties = {
  fontSize: '0.8rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.4,
  marginBottom: '14px',
};

const squareBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
  color: '#05060B',
  fontSize: '0.75rem',
  fontWeight: 600,
  padding: '6px 12px',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  boxShadow: '0 0 10px var(--primary-glow)',
  transition: 'var(--transition-fast)',
};

// 2. Banner Ad CSS
const bannerAdStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '20px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 40px)',
  maxWidth: '900px',
  padding: '12px 24px',
  border: '1px solid var(--border-glass-active)',
  background: 'rgba(10, 12, 22, 0.85)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.8), var(--shadow-glow)',
  backdropFilter: 'blur(20px)',
  zIndex: 1000,
  overflow: 'hidden',
  transition: 'var(--transition-smooth)',
};

const bannerGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '50%',
  left: '0',
  width: '200px',
  height: '100px',
  background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

const bannerFlexStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '15px',
};

const bannerBadgeStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontWeight: 700,
  fontFamily: 'var(--font-heading)',
  color: 'var(--primary)',
  border: '1px solid var(--primary)',
  padding: '2px 6px',
  borderRadius: '4px',
  textTransform: 'uppercase',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

// 3. Sidebar Ad CSS
const sidebarAdContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '16px',
  background: 'rgba(10, 12, 22, 0.4)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border-glass-active)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  boxShadow: 'var(--shadow-card), 0 0 15px rgba(0, 242, 254, 0.05)',
  transition: 'var(--transition-smooth)',
  width: '100%',
};

const sidebarFallbackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 20px',
  background: 'rgba(10, 12, 22, 0.4)',
  backdropFilter: 'blur(12px)',
  border: '1px solid var(--border-glass-active)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  position: 'relative',
  minHeight: '280px',
  justifyContent: 'space-between',
  boxShadow: 'var(--shadow-card), 0 0 15px rgba(0, 242, 254, 0.05)',
  transition: 'var(--transition-smooth)',
  width: '100%',
};

const sidebarGlowBgStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-40px',
  right: '-40px',
  width: '120px',
  height: '120px',
  background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
  pointerEvents: 'none',
  zIndex: 1,
};

const sidebarContentContainerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flexGrow: 1,
  justifyContent: 'center',
};

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: 'var(--text-primary)',
  marginBottom: '8px',
  fontFamily: 'var(--font-heading)',
};

const sidebarDescStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  marginBottom: '16px',
};

const sidebarBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  background: 'var(--primary)',
  color: '#05060B',
  fontSize: '0.82rem',
  fontWeight: 600,
  padding: '8px 16px',
  borderRadius: 'var(--radius-sm)',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  boxShadow: '0 0 15px var(--primary-glow)',
  transition: 'var(--transition-fast)',
};

// 4. Popup Interstitial CSS
const popupOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  backgroundColor: 'rgba(2, 3, 6, 0.85)',
  backdropFilter: 'blur(8px)',
  zIndex: 2000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
};

const popupContentStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '540px',
  background: 'rgba(5, 6, 11, 0.95)',
  border: '1px solid var(--border-glass-active)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), var(--shadow-glow)',
  overflow: 'hidden',
  position: 'relative',
};

const popupGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-10%',
  left: '50%',
  width: '280px',
  height: '280px',
  background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 75%)',
  transform: 'translateX(-50%)',
  pointerEvents: 'none',
};

const popupHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--border-glass)',
  padding: '16px 24px',
  position: 'relative',
  zIndex: 2,
};

const countdownStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  color: 'var(--text-muted)',
  fontFamily: 'monospace',
};

const popupCloseBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-secondary)',
  cursor: 'pointer',
  padding: '4px',
  display: 'flex',
};

const popupBodyStyle: React.CSSProperties = {
  padding: '30px 24px 35px 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  position: 'relative',
  zIndex: 2,
};

const iconContainerStyle: React.CSSProperties = {
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  border: '2px solid var(--primary)',
  boxShadow: '0 0 15px var(--primary-glow)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.6rem',
  fontWeight: 800,
  color: 'var(--primary)',
  fontFamily: 'var(--font-heading)',
  marginBottom: '20px',
};

const popupTitleStyle: React.CSSProperties = {
  fontSize: '1.4rem',
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: '10px',
  fontFamily: 'var(--font-heading)',
};

const popupDescStyle: React.CSSProperties = {
  fontSize: '0.9rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.6,
  marginBottom: '20px',
};

const popupFeaturesStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'flex-start',
  alignSelf: 'stretch',
  background: 'rgba(255, 255, 255, 0.01)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-md)',
  padding: '16px 20px',
  marginBottom: '28px',
};

const featureItemStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  color: 'var(--text-secondary)',
  fontFamily: 'var(--font-body)',
};

const popupActionsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  gap: '12px',
};

const popupActionPrimaryStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
  color: '#05060B',
  border: 'none',
  padding: '14px',
  borderRadius: 'var(--radius-md)',
  fontWeight: 600,
  fontSize: '0.92rem',
  cursor: 'pointer',
  width: '100%',
  boxShadow: '0 4px 15px rgba(0, 242, 254, 0.3)',
  fontFamily: 'var(--font-heading)',
};

const popupActionSecondaryStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border-glass)',
  color: 'var(--text-secondary)',
  padding: '12px',
  borderRadius: 'var(--radius-md)',
  fontSize: '0.88rem',
  width: '100%',
  fontFamily: 'var(--font-heading)',
};

// Default export
export default SquareAd;
