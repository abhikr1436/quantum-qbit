import React, { useState } from 'react';
import { Zap, Clock, Shield, Sparkles } from 'lucide-react';

export const BenchmarkShowcase: React.FC = () => {
  const [fileSize, setFileSize] = useState<'1MB' | '10MB' | '50MB'>('10MB');

  const data = {
    '1MB': [
      { name: 'Quantum Qbit (Client-Side WASM)', time: 0.04, label: '0.04s', isHighlight: true, note: 'Instant local memory buffer' },
      { name: 'Cloud SaaS Tool A', time: 3.2, label: '3.20s', isHighlight: false, note: 'Network upload + remote queue' },
      { name: 'Cloud SaaS Tool B', time: 6.8, label: '6.80s', isHighlight: false, note: 'Server spin-up & tracking ping' },
      { name: 'Traditional PHP/Node Backend', time: 11.4, label: '11.40s', isHighlight: false, note: 'Full server roundtrip' },
    ],
    '10MB': [
      { name: 'Quantum Qbit (Client-Side WASM)', time: 0.08, label: '0.08s', isHighlight: true, note: 'Instant local memory buffer' },
      { name: 'Cloud SaaS Tool A', time: 5.8, label: '5.80s', isHighlight: false, note: 'Network upload + remote queue' },
      { name: 'Cloud SaaS Tool B', time: 10.5, label: '10.50s', isHighlight: false, note: 'Server spin-up & tracking ping' },
      { name: 'Traditional PHP/Node Backend', time: 18.2, label: '18.20s', isHighlight: false, note: 'Full server roundtrip' },
    ],
    '50MB': [
      { name: 'Quantum Qbit (Client-Side WASM)', time: 0.22, label: '0.22s', isHighlight: true, note: 'Instant local memory buffer' },
      { name: 'Cloud SaaS Tool A', time: 14.6, label: '14.60s', isHighlight: false, note: 'Network upload + remote queue' },
      { name: 'Cloud SaaS Tool B', time: 26.3, label: '26.30s', isHighlight: false, note: 'Server spin-up & tracking ping' },
      { name: 'Traditional PHP/Node Backend', time: 42.0, label: '42.00s', isHighlight: false, note: 'Full server roundtrip' },
    ]
  };

  const currentList = data[fileSize];
  const maxTime = Math.max(...currentList.map(d => d.time));

  return (
    <div style={{ width: '100%' }}>
      {/* File Size Filter Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={16} style={{ color: 'var(--primary)' }} />
          Benchmark Task: Image Compression & PDF Processing
        </div>

        <div style={{ display: 'inline-flex', background: 'rgba(0, 0, 0, 0.05)', padding: '3px', borderRadius: '100px' }}>
          {(['1MB', '10MB', '50MB'] as const).map((size) => (
            <button
              key={size}
              onClick={() => setFileSize(size)}
              style={{
                background: fileSize === size ? 'var(--primary)' : 'transparent',
                color: fileSize === size ? '#FFFFFF' : 'var(--text-dark-secondary)',
                border: 'none',
                padding: '4px 14px',
                borderRadius: '100px',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {currentList.map((item, idx) => {
          const widthPercent = Math.max(6, (item.time / maxTime) * 100);

          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', fontWeight: item.isHighlight ? 700 : 500 }}>
                <span style={{ color: item.isHighlight ? 'var(--primary)' : 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {item.isHighlight && <Sparkles size={14} style={{ color: 'var(--primary)' }} />}
                  {item.name}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: item.isHighlight ? 'var(--primary)' : 'var(--text-dark-secondary)' }}>
                  {item.label}
                </span>
              </div>

              {/* Bar track */}
              <div
                style={{
                  height: '28px',
                  background: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${widthPercent}%`,
                    background: item.isHighlight
                      ? 'linear-gradient(90deg, #FF2E93 0%, #FF66B2 100%)'
                      : 'rgba(0, 0, 0, 0.12)',
                    borderRadius: '8px',
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    boxShadow: item.isHighlight ? '0 0 15px rgba(255, 46, 147, 0.4)' : 'none'
                  }}
                >
                  {item.isHighlight && (
                    <span style={{ fontSize: '0.7rem', color: '#FFFFFF', fontWeight: 700, letterSpacing: '0.04em' }}>
                      FASTEST
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.74rem', color: 'var(--text-dark-secondary)', paddingLeft: '2px' }}>
                {item.note}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BenchmarkShowcase;
