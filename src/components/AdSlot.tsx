import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShieldAlert } from 'lucide-react';

interface AdSlotProps {
  id: string;
  type: 'sidebar' | 'banner' | 'popup';
  adClient?: string;
  adSlotId?: string;
  className?: string;
  style?: React.CSSProperties;
}

const SHOW_ADS = true; // Set to true when ready to show ads

export const AdSlot: React.FC<AdSlotProps> = ({
  id,
  type,
  adClient,
  adSlotId,
  className = '',
  style
}) => {
  if (!SHOW_ADS) return null;

  const [isVisible, setIsVisible] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // For popup delay and session check
  useEffect(() => {
    if (type !== 'popup') return;

    // Check if popup was already shown in this session
    const popupShown = sessionStorage.getItem(`quantum_popup_shown_${id}`);
    if (popupShown) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 4000); // Show popup after 4 seconds

    return () => clearTimeout(timer);
  }, [type, id]);

  // Countdown timer for popup close button
  useEffect(() => {
    if (!showPopup || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [showPopup, countdown]);

  // Google AdSense loading trigger
  useEffect(() => {
    if (adClient && adSlotId && isVisible && (type !== 'popup' || showPopup)) {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (err) {
        console.warn('AdSense initialization failed:', err);
      }
    }
  }, [adClient, adSlotId, isVisible, showPopup, type]);

  const handleClose = () => {
    setIsVisible(false);
    if (type === 'popup') {
      sessionStorage.setItem(`quantum_popup_shown_${id}`, 'true');
    }
  };

  if (!isVisible) return null;

  // Render Google AdSense Unit
  const renderAdSense = () => (
    <div style={adSenseContainerStyle}>
      <span style={sponsorTextStyle}>SPONSOR AD</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', textDecoration: 'none' }}
        data-ad-client={adClient}
        data-ad-slot={adSlotId}
        data-ad-format={type === 'sidebar' ? 'vertical' : 'horizontal'}
        data-full-width-responsive="true"
      />
    </div>
  );

  // Render Cyber-Promo Fallback
  const renderFallbackPromo = () => {
    switch (type) {
      case 'sidebar':
        return (
          <div style={sidebarFallbackStyle} className="glass-card">
            <span style={sponsorTextStyle}>PROMOTED CONTENT</span>
            <div style={glowBgStyle}></div>
            <div style={contentContainerStyle}>
              <ShieldAlert size={36} style={{ color: 'var(--primary)', marginBottom: '10px' }} />
              <h4 style={titleStyle}>QUANTUM SHIELD</h4>
              <p style={descriptionStyle}>
                Encrypt, split, and backup files locally with zero-server vulnerability. 100% offline-first.
              </p>
              <a href="#/tools" style={buttonStyle}>
                Try Tool <ExternalLink size={12} />
              </a>
            </div>
            <div style={taglineStyle}>SECURED // LOCAL_ONLY</div>
          </div>
        );

      case 'banner':
        return (
          <div style={bannerFallbackStyle} className="glass-card">
            <div style={bannerGlowStyle}></div>
            <div style={bannerFlexStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={bannerBadgeStyle}>SPONSOR</span>
                <div>
                  <h4 style={bannerTitleStyle}>QUANTUM CONVERTER PRO</h4>
                  <p style={bannerDescStyle}>Optimize JPG, PNG, WebP & PDFs locally inside your browser cache.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <a href="#/tools" style={bannerBtnStyle}>
                  Launch App
                </a>
                <button onClick={handleClose} style={closeBtnStyle} title="Dismiss Ad">
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        );

      case 'popup':
        if (!showPopup) return null;
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

      default:
        return null;
    }
  };

  return (
    <div id={id} className={`${className}`} style={{ ...wrapperStyle, ...style }}>
      {adClient && adSlotId ? renderAdSense() : renderFallbackPromo()}
    </div>
  );
};

// CSS Inline styles for compatibility and stability
const wrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  zIndex: 10,
};

const adSenseContainerStyle: React.CSSProperties = {
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
};

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

// 1. Sidebar Styles
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
};

const glowBgStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-40px',
  right: '-40px',
  width: '120px',
  height: '120px',
  background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
  pointerEvents: 'none',
  zIndex: 1,
};

const contentContainerStyle: React.CSSProperties = {
  position: 'relative',
  zIndex: 2,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  flexGrow: 1,
  justifyContent: 'center',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.15rem',
  fontWeight: 700,
  letterSpacing: '0.05em',
  color: 'var(--text-primary)',
  marginBottom: '8px',
  fontFamily: 'var(--font-heading)',
};

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--text-secondary)',
  lineHeight: 1.5,
  marginBottom: '16px',
};

const buttonStyle: React.CSSProperties = {
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

const taglineStyle: React.CSSProperties = {
  fontSize: '0.62rem',
  fontFamily: 'monospace',
  color: 'var(--text-muted)',
  textAlign: 'center',
  borderTop: '1px solid var(--border-glass)',
  paddingTop: '10px',
  marginTop: '10px',
};

// 2. Banner/Bottom Sticky Styles
const bannerFallbackStyle: React.CSSProperties = {
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

const bannerTitleStyle: React.CSSProperties = {
  fontSize: '0.92rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
};

const bannerDescStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  color: 'var(--text-secondary)',
  margin: '2px 0 0 0',
};

const bannerBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--primary)',
  color: 'var(--primary)',
  fontSize: '0.8rem',
  fontWeight: 500,
  padding: '6px 14px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  textDecoration: 'none',
  fontFamily: 'var(--font-heading)',
  transition: 'var(--transition-fast)',
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

// 3. Interstitial Popup/Modal Styles
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

export default AdSlot;
