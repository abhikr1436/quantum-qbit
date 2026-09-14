import React, { useState, useEffect, useRef } from 'react';

interface QuantumCompanionProps {
  mousePos: { x: number; y: number }; // normalized -0.5 to 0.5 or absolute coords
}

const DIALOGUES = [
  "100% Client-Side! Your data never leaves this device. 🔒",
  "Sub-second local processing powered by WebAssembly! ⚡",
  "No accounts, no paywalls, no tracking—just pure utility. 🛡️",
  "Bloch sphere quantum state precessing smoothly! 🌌",
  "Need to resize photos or convert PDFs? Check the tools below! ✨",
  "Zero latency: computation happens right inside your browser! 🚀"
];

export const QuantumCompanion: React.FC<QuantumCompanionProps> = ({ mousePos }) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [showDialogue, setShowDialogue] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isWinking, setIsWinking] = useState(false);
  const botRef = useRef<HTMLDivElement | null>(null);

  // Compute eye look offset based on mouse position (-1 to 1 range)
  const eyeOffsetX = Math.max(-5, Math.min(5, mousePos.x * 12));
  const eyeOffsetY = Math.max(-4, Math.min(4, mousePos.y * 10));

  const handleClick = () => {
    setIsSpinning(true);
    setIsWinking(true);
    setShowDialogue(true);
    setDialogueIndex((prev) => (prev + 1) % DIALOGUES.length);

    setTimeout(() => setIsSpinning(false), 800);
    setTimeout(() => setIsWinking(false), 1200);
  };

  // Auto hide dialogue after 5 seconds
  useEffect(() => {
    if (showDialogue) {
      const timer = setTimeout(() => setShowDialogue(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showDialogue, dialogueIndex]);

  return (
    <div
      ref={botRef}
      className="quantum-companion-container"
      onClick={handleClick}
      title="Click me to interact with Qbi, your Quantum Assistant!"
      style={{
        position: 'relative',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.3s ease'
      }}
    >
      {/* Speech Bubble Dialog */}
      {showDialogue && (
        <div
          className="qbi-dialogue-bubble"
          style={{
            position: 'absolute',
            bottom: '105%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--bg-card)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--border-glass-active)',
            borderRadius: '16px',
            padding: '10px 16px',
            fontSize: '0.86rem',
            fontWeight: 500,
            color: 'var(--text-primary)',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.08), 0 0 16px var(--primary-glow)',
            whiteSpace: 'nowrap',
            zIndex: 20,
            animation: 'bubble-pop 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
          }}
        >
          <span>{DIALOGUES[dialogueIndex]}</span>
          {/* Arrow */}
          <div
            style={{
              position: 'absolute',
              bottom: '-6px',
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: '12px',
              height: '12px',
              background: 'var(--bg-card)',
              borderRight: '1px solid var(--border-glass-active)',
              borderBottom: '1px solid var(--border-glass-active)'
            }}
          />
        </div>
      )}

      {/* SVG Character Model "Qbi" */}
      <div
        className={`qbi-bot-body ${isSpinning ? 'qbi-spin' : ''}`}
        style={{
          width: '140px',
          height: '150px',
          filter: 'drop-shadow(0 10px 20px var(--primary-glow))'
        }}
      >
        <svg
          viewBox="0 0 160 170"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Faded Metallic Gradients */}
            <linearGradient id="qbiBodyGrad" x1="20" y1="20" x2="140" y2="160" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#e8f0f8" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#d5e2ef" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="qbiVisorGrad" x1="40" y1="45" x2="120" y2="95" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="qbiAccentGrad" x1="30" y1="30" x2="130" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>

            <filter id="qbiGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Floating Quantum Aura Rings */}
          <ellipse
            cx="80"
            cy="158"
            rx="38"
            ry="7"
            fill="var(--primary)"
            opacity="0.2"
            className="qbi-shadow"
          />

          {/* Antenna Rod & Orb */}
          <path
            d="M80 40 L80 18"
            stroke="#94a3b8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle
            cx="80"
            cy="14"
            r="7"
            fill="url(#qbiAccentGrad)"
            filter="url(#qbiGlow)"
            className="qbi-antenna-orb"
          />
          <circle cx="80" cy="14" r="3" fill="#ffffff" />

          {/* Ear Horns / Quantum Dampeners */}
          <rect x="25" y="55" width="8" height="24" rx="4" fill="url(#qbiAccentGrad)" />
          <rect x="127" y="55" width="8" height="24" rx="4" fill="url(#qbiAccentGrad)" />

          {/* Head & Body Chassis */}
          <rect
            x="30"
            y="35"
            width="100"
            height="72"
            rx="30"
            fill="url(#qbiBodyGrad)"
            stroke="var(--border-glass-active)"
            strokeWidth="1.5"
          />

          {/* Gloss highlight on head */}
          <path
            d="M45 42 Q80 37 115 42"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Glass Visor Screen */}
          <rect
            x="42"
            y="47"
            width="76"
            height="48"
            rx="18"
            fill="url(#qbiVisorGrad)"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* Visor Glare Reflex */}
          <path
            d="M48 53 L70 53 Q58 68 48 78 Z"
            fill="#ffffff"
            opacity="0.08"
          />

          {/* Expressive LED Eyes with Tracking */}
          <g transform={`translate(${eyeOffsetX}, ${eyeOffsetY})`}>
            {/* Left Eye */}
            {isWinking ? (
              <path
                d="M54 71 Q61 63 68 71"
                stroke="#38bdf8"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            ) : (
              <circle
                cx="61"
                cy="69"
                r="7"
                fill="#38bdf8"
                filter="url(#qbiGlow)"
              >
                <animate
                  attributeName="r"
                  values="7;7;0.8;7;7"
                  keyTimes="0;0.48;0.5;0.52;1"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </circle>
            )}

            {/* Right Eye */}
            <circle
              cx="99"
              cy="69"
              r="7"
              fill="#38bdf8"
              filter="url(#qbiGlow)"
            >
              <animate
                attributeName="r"
                values="7;7;0.8;7;7"
                keyTimes="0;0.48;0.5;0.52;1"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Pupil Specular Reflection */}
            {!isWinking && (
              <>
                <circle cx="59" cy="67" r="2.2" fill="#ffffff" />
                <circle cx="97" cy="67" r="2.2" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Subtle LED Cheeks */}
          <ellipse cx="49" cy="79" rx="3.5" ry="2" fill="#f43f5e" opacity="0.35" />
          <ellipse cx="111" cy="79" rx="3.5" ry="2" fill="#f43f5e" opacity="0.35" />

          {/* Torso / Repulsor Base */}
          <path
            d="M52 105 L108 105 L100 134 Q80 142 60 134 Z"
            fill="url(#qbiBodyGrad)"
            stroke="var(--border-glass-active)"
            strokeWidth="1.2"
          />

          {/* Torso Chest Plate Display */}
          <rect
            x="64"
            y="112"
            width="32"
            height="16"
            rx="6"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Quantum Circuit glyph on chest */}
          <path
            d="M69 120 H75 L78 116 L82 124 L85 120 H91"
            stroke="#38bdf8"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Floating Magnetic Floating Hands */}
          <ellipse
            cx="25"
            cy="114"
            rx="7"
            ry="11"
            fill="url(#qbiBodyGrad)"
            stroke="var(--border-glass-active)"
            strokeWidth="1"
            className="qbi-left-hand"
          />
          <ellipse
            cx="135"
            cy="114"
            rx="7"
            ry="11"
            fill="url(#qbiBodyGrad)"
            stroke="var(--border-glass-active)"
            strokeWidth="1"
            className="qbi-right-hand"
          />

          {/* Repulsor Glow Exhaust */}
          <ellipse
            cx="80"
            cy="138"
            rx="14"
            ry="4.5"
            fill="url(#qbiAccentGrad)"
            opacity="0.8"
            filter="url(#qbiGlow)"
            className="qbi-thruster"
          />
        </svg>
      </div>

      {/* Interactive Label */}
      <span
        style={{
          marginTop: '6px',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '0.04em',
          color: 'var(--primary)',
          opacity: 0.85,
          transition: 'opacity 0.2s ease'
        }}
      >
        ✦ Qbi • Quantum Bot
      </span>
    </div>
  );
};

export default QuantumCompanion;
