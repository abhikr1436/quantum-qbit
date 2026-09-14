import React, { useState } from 'react';
import { Copy, Check, Terminal, Play } from 'lucide-react';

export const TerminalMockup: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [activePreset, setActivePreset] = useState<'image' | 'pdf' | 'math'>('image');

  const presets = {
    image: {
      cmd: 'quantum-qbit image-optimize --input photo.png --format webp --quality 85',
      logs: [
        '⚡ [WASM] Threadpool allocated (8 cores detected).',
        '🔍 [CANVAS] Decoded 4000x3000 RGBA buffer (48MB raw).',
        '✨ [LOCAL] Bicubic resampling completed in 18ms.',
        '🔒 [PRIVACY] 0 bytes transmitted over network.',
        '✓ [OUTPUT] Saved photo.webp (1.2MB -> 180KB, -85% reduction) in 42ms.'
      ]
    },
    pdf: {
      cmd: 'quantum-qbit pdf-compress --input report.pdf --dpi 150 --clean-metadata',
      logs: [
        '⚡ [WASM] Initializing local PDF.js parser stream.',
        '📄 [PARSER] 24 pages vectorized in client memory.',
        '✨ [OPTIMIZE] Stream compression dictionary applied locally.',
        '🔒 [PRIVACY] File processed 100% inside sandbox RAM.',
        '✓ [OUTPUT] report_compressed.pdf (14.2MB -> 2.1MB) in 88ms.'
      ]
    },
    math: {
      cmd: 'quantum-qbit math-solve "e^(i*pi) + 1 = 0" --radix hex,bin',
      logs: [
        '⚡ [ENGINE] Symbolic differentiation & numerical solver ready.',
        '📐 [EVAL] Identity verified: e^(i*π) + 1 = 0 (Euler\'s Identity).',
        '🔢 [RADIX] Hex: 0x0 | Binary: 0b0000 | IEEE-754: 0x00000000.',
        '🔒 [PRIVACY] Executed in 0.4ms zero server latency.',
        '✓ [STATUS] Precision: 64-bit IEEE floating point standard.'
      ]
    }
  };

  const current = presets[activePreset];

  const handleCopy = () => {
    navigator.clipboard.writeText(current.cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderRadius: 'var(--radius-lg)',
        background: '#070A11',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 46, 147, 0.15)',
        overflow: 'hidden',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.84rem'
      }}
    >
      {/* Terminal Titlebar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B' }}></div>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }}></div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
            wasm-terminal@quantum-qbit:~
          </span>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['image', 'pdf', 'math'] as const).map((key) => (
            <button
              key={key}
              onClick={() => setActivePreset(key)}
              style={{
                background: activePreset === key ? 'rgba(255, 46, 147, 0.2)' : 'transparent',
                border: `1px solid ${activePreset === key ? 'var(--primary)' : 'rgba(255, 255, 255, 0.06)'}`,
                color: activePreset === key ? 'var(--primary)' : 'var(--text-muted)',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Command Line */}
      <div
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px dashed rgba(255, 255, 255, 0.06)',
          background: 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFFFFF', overflowX: 'auto' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>$</span>
          <span style={{ color: '#F8FAFC' }}>{current.cmd}</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#10B981' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            padding: '4px'
          }}
          title="Copy command"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Terminal Stream Logs */}
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '140px' }}>
        {current.logs.map((line, idx) => (
          <div
            key={idx}
            style={{
              color: line.includes('✓') ? '#10B981' : line.includes('🔒') ? '#FF2E93' : '#94A3B8',
              lineHeight: 1.5
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TerminalMockup;
