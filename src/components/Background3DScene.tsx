import React, { useEffect, useState, useRef } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

export const Background3DScene: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const auraRef = useRef<HTMLDivElement | null>(null);
  const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const currentPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [scrollY, setScrollY] = useState(0);

  // Mouse move listener with lerp for ambient glow
  useEffect(() => {
    let animId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      setMousePos({
        x: (e.clientX / window.innerWidth) - 0.5,
        y: (e.clientY / window.innerHeight) - 0.5
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const loop = () => {
      // Smooth lerp
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      if (auraRef.current) {
        auraRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0) translate(-50%, -50%)`;
      }

      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Global click shockwave handler
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Avoid interrupting interactive button clicks while still creating the ripple
      const colors = ['rgba(56, 189, 248, 0.35)', 'rgba(129, 140, 248, 0.35)', 'rgba(43, 122, 143, 0.3)'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const newRipple: Ripple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
        color: randomColor
      };

      setRipples((prev) => [...prev.slice(-8), newRipple]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 1000);
    };

    window.addEventListener('click', handleClick, { passive: true });
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Parallax offsets based on mouse and scroll
  const offsetX1 = mousePos.x * 25;
  const offsetY1 = mousePos.y * 25 + scrollY * 0.05;

  const offsetX2 = mousePos.x * -35;
  const offsetY2 = mousePos.y * -35 - scrollY * 0.08;

  const offsetX3 = mousePos.x * 15;
  const offsetY3 = mousePos.y * 15 + scrollY * 0.03;

  return (
    <div
      className="background-3d-scene"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}
      aria-hidden="true"
    >
      {/* 1. Interactive Ambient Mouse Aura Orb */}
      <div
        ref={auraRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--primary-glow) 0%, rgba(99, 102, 241, 0.04) 40%, transparent 70%)',
          filter: 'blur(30px)',
          willChange: 'transform',
          opacity: 0.85
        }}
      />

      {/* 2. Soft Eye-friendly Mesh Gradient Blobs */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          left: '15%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)',
          filter: 'blur(50px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.05) 0%, transparent 70%)',
          filter: 'blur(60px)'
        }}
      />

      {/* 3. Floating 3D Geometric Vector 1: Isometric Rotating Polyhedron (Top-Right) */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '8%',
          transform: `translate3d(${offsetX1}px, ${offsetY1}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.1, 0.5, 0.1, 1)',
          opacity: 0.55
        }}
      >
        <svg width="180" height="180" viewBox="0 0 100 100" fill="none">
          {/* Wireframe Icosahedron / Octahedron Projection */}
          <polygon
            points="50,15 85,35 85,65 50,85 15,65 15,35"
            stroke="var(--primary)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
            opacity="0.6"
            className="vector-spin-slow"
          />
          <polygon
            points="50,25 75,40 75,60 50,75 25,60 25,40"
            stroke="var(--secondary)"
            strokeWidth="1"
            opacity="0.5"
            className="vector-spin-reverse"
          />
          <line x1="50" y1="15" x2="50" y2="85" stroke="var(--primary)" strokeWidth="0.8" opacity="0.4" />
          <line x1="15" y1="35" x2="85" y2="65" stroke="var(--primary)" strokeWidth="0.8" opacity="0.4" />
          <line x1="15" y1="65" x2="85" y2="35" stroke="var(--primary)" strokeWidth="0.8" opacity="0.4" />
          <circle cx="50" cy="50" r="4" fill="var(--primary)" opacity="0.5" />
        </svg>
      </div>

      {/* 4. Floating 3D Geometric Vector 2: Quantum Gate Circuit Glyphs (Bottom-Left) */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '6%',
          transform: `translate3d(${offsetX2}px, ${offsetY2}px, 0)`,
          transition: 'transform 0.2s cubic-bezier(0.1, 0.5, 0.1, 1)',
          opacity: 0.5
        }}
      >
        <svg width="220" height="140" viewBox="0 0 220 140" fill="none">
          {/* Circuit Lines */}
          <line x1="10" y1="40" x2="210" y2="40" stroke="var(--border-glass-active)" strokeWidth="1.5" />
          <line x1="10" y1="100" x2="210" y2="100" stroke="var(--border-glass-active)" strokeWidth="1.5" />

          {/* Hadamard Gate Box [H] */}
          <rect x="50" y="24" width="32" height="32" rx="6" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="1.2" />
          <text x="66" y="45" fill="var(--primary)" fontSize="14" fontFamily="monospace" fontWeight="bold" textAnchor="middle">H</text>

          {/* Entanglement Control Knot */}
          <circle cx="120" cy="40" r="4" fill="var(--secondary)" />
          <line x1="120" y1="40" x2="120" y2="100" stroke="var(--secondary)" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Target NOT Gate (Pauli-X) */}
          <circle cx="120" cy="100" r="10" stroke="var(--secondary)" strokeWidth="1.5" fill="var(--bg-card)" />
          <line x1="120" y1="92" x2="120" y2="108" stroke="var(--secondary)" strokeWidth="1.5" />
          <line x1="112" y1="100" x2="128" y2="100" stroke="var(--secondary)" strokeWidth="1.5" />

          {/* Measurement / Meter Box */}
          <rect x="160" y="84" width="32" height="32" rx="6" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="1.2" />
          <path d="M168 106 A10 10 0 0 1 184 106 L182 94" stroke="var(--primary)" strokeWidth="1.2" fill="none" />
        </svg>
      </div>

      {/* 5. Floating Dirac / Quantum Symbols (Middle depth layers) */}
      <div
        style={{
          position: 'absolute',
          top: '45%',
          left: '12%',
          transform: `translate3d(${offsetX3}px, ${offsetY3}px, 0)`,
          transition: 'transform 0.25s ease-out',
          opacity: 0.4
        }}
      >
        <svg width="70" height="70" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke="var(--primary)" strokeWidth="1" strokeDasharray="2 3" />
          <text x="30" y="36" fill="var(--primary)" fontSize="16" fontFamily="var(--font-heading)" fontWeight="600" textAnchor="middle">
            |0⟩
          </text>
        </svg>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '60%',
          right: '12%',
          transform: `translate3d(${offsetX1 * 0.8}px, ${offsetY1 * 0.8}px, 0)`,
          transition: 'transform 0.25s ease-out',
          opacity: 0.4
        }}
      >
        <svg width="70" height="70" viewBox="0 0 60 60" fill="none">
          <circle cx="30" cy="30" r="24" stroke="var(--secondary)" strokeWidth="1" strokeDasharray="2 3" />
          <text x="30" y="36" fill="var(--secondary)" fontSize="16" fontFamily="var(--font-heading)" fontWeight="600" textAnchor="middle">
            |1⟩
          </text>
        </svg>
      </div>

      {/* Wavefunction Psi floating vector */}
      <div
        style={{
          position: 'absolute',
          top: '25%',
          left: '42%',
          transform: `translate3d(${offsetX2 * 0.5}px, ${offsetY2 * 0.5}px, 0)`,
          transition: 'transform 0.3s ease-out',
          opacity: 0.35
        }}
      >
        <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
          <text x="25" y="32" fill="var(--text-muted)" fontSize="24" fontFamily="serif" fontStyle="italic" textAnchor="middle">
            |Ψ⟩
          </text>
        </svg>
      </div>

      {/* 6. Click Ripple Wavefronts */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="quantum-click-ripple"
          style={{
            position: 'absolute',
            left: ripple.x,
            top: ripple.y,
            borderColor: ripple.color
          }}
        />
      ))}
    </div>
  );
};

export default Background3DScene;
