import React, { useState, useRef, useEffect } from 'react';
import { Zap, ShieldCheck, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const HoldToAccelerate: React.FC = () => {
  const [progress, setProgress] = useState(0); // 0 to 100
  const [isHolding, setIsHolding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const HOLD_DURATION = 1500; // ms to reach full charge

  const startHold = () => {
    if (isCompleted) {
      setIsCompleted(false);
      setProgress(0);
    }
    setIsHolding(true);
    startTimeRef.current = performance.now() - (progress / 100) * HOLD_DURATION;
  };

  const endHold = () => {
    setIsHolding(false);
  };

  useEffect(() => {
    const updateLoop = () => {
      if (isHolding && !isCompleted) {
        const elapsed = performance.now() - startTimeRef.current;
        const newProgress = Math.min(100, (elapsed / HOLD_DURATION) * 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          setIsCompleted(true);
          setIsHolding(false);
          try {
            confetti({
              particleCount: 70,
              spread: 60,
              origin: { y: 0.7 },
              colors: ['#FF2E93', '#8B1E5A', '#FFB3D9', '#FFFFFF']
            });
          } catch {
            // ignore if unavailable
          }
        }
      } else if (!isHolding && !isCompleted && progress > 0) {
        setProgress((prev) => Math.max(0, prev - 4));
      }

      animationFrameRef.current = requestAnimationFrame(updateLoop);
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isHolding, isCompleted, progress]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="hold-accelerator-card glass-card"
      style={{
        padding: '36px 32px',
        borderRadius: 'var(--radius-xl)',
        background: 'linear-gradient(135deg, rgba(26, 11, 22, 0.7) 0%, rgba(11, 15, 25, 0.9) 100%)',
        border: '1px solid var(--border-glass-active)',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: isHolding
          ? '0 0 45px rgba(255, 46, 147, 0.35), inset 0 0 30px rgba(255, 46, 147, 0.15)'
          : 'var(--shadow-card)',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px'
      }}
    >
      {/* Monospace Badge */}
      <div className="mono-badge" style={{ gap: '8px' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
        INTERACTIVE WASM ACCELERATOR • TOUCH & HOLD
      </div>

      <h3 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.85rem)', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
        Experience Sub-Second <span className="cerebrium-highlight">Client-Side Speed</span>
      </h3>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', maxWidth: '540px', lineHeight: 1.6, margin: 0 }}>
        Press and hold the core below to trigger local multi-threaded WebAssembly compilation right inside your browser memory.
      </p>

      {/* Circular Touch-and-Hold Button */}
      <div
        style={{
          position: 'relative',
          width: '140px',
          height: '140px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '12px 0',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
      >
        {/* Progress SVG Ring */}
        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}>
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="6"
            fill="none"
          />
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="url(#holdGrad)"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
          <defs>
            <linearGradient id="holdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2E93" />
              <stop offset="100%" stopColor="#FFA0D0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center Trigger Orb */}
        <div
          style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: isCompleted
              ? 'linear-gradient(135deg, #FF2E93, #8B1E5A)'
              : isHolding
              ? 'linear-gradient(135deg, #FF2E93 0%, #3D0B26 100%)'
              : 'rgba(255, 255, 255, 0.04)',
            border: `2px solid ${isHolding || isCompleted ? '#FF2E93' : 'rgba(255, 255, 255, 0.15)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isHolding ? '0 0 30px #FF2E93' : 'none',
            transform: isHolding ? 'scale(0.94)' : 'scale(1)',
            transition: 'transform 0.15s ease, background 0.3s ease'
          }}
        >
          {isCompleted ? (
            <CheckCircle2 size={32} style={{ color: '#FFFFFF' }} />
          ) : (
            <>
              <Zap size={28} style={{ color: isHolding ? '#FFFFFF' : 'var(--primary)' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, marginTop: '4px', letterSpacing: '0.04em' }}>
                {isHolding ? `${Math.round(progress)}%` : 'HOLD'}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Live Benchmark Readout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          width: '100%',
          maxWidth: '560px',
          marginTop: '8px'
        }}
      >
        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>COLD START</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {isCompleted ? '0.02s' : isHolding ? '0.08s' : '0.05s'}
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>CLOUD UPLOAD</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981', marginTop: '4px' }}>
            0 KB
          </div>
        </div>

        <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>PARALLEL CORES</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>
            {isCompleted ? '8 THREADS' : isHolding ? '4 THREADS' : 'READY'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoldToAccelerate;
