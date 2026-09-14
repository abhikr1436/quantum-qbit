import React, { useState } from 'react';
import { Zap, ShieldCheck, Lock, Activity, ArrowRight, Cpu, HardDrive, CheckCircle } from 'lucide-react';
import BenchmarkShowcase from './BenchmarkShowcase';
import TerminalMockup from './TerminalMockup';

export const CerebriumFeatureTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabs = [
    {
      id: 'cold-starts',
      title: 'Sub-Second Cold Starts',
      subtitle: 'Spin up WebAssembly computing pipelines in 0.05s without waiting for server queues or remote container spin-up.',
      badge: '0.05S EXECUTION'
    },
    {
      id: 'privacy',
      title: 'Your Files, Your Device',
      subtitle: 'Everything executes 100% inside your browser memory buffer. No files uploaded to remote servers or third-party cloud.',
      badge: 'ZERO UPLOAD'
    },
    {
      id: 'cli-workflow',
      title: 'Real-Time Web Assembly',
      subtitle: 'Native multithreaded compilation utilizing local CPU hardware acceleration through Web Workers and HTML5 Canvas.',
      badge: 'MULTI-THREADED'
    },
    {
      id: 'observability',
      title: 'Instant Observability & Zero Ads',
      subtitle: 'Transparent local execution diagnostics, memory allocation trackers, and zero intrusive tracking beacons.',
      badge: 'CLEAN SANDBOX'
    }
  ];

  return (
    <div
      className="alabaster-container"
      style={{
        padding: 'clamp(32px, 5vw, 64px)',
        margin: '60px 0'
      }}
    >
      {/* Header Inside Alabaster Container */}
      <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div className="mono-badge">
          <span>•</span> WHY QUANTUM QBIT
        </div>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 800, color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          Built for speed, <span className="cerebrium-highlight" style={{ textShadow: 'none' }}>engineered for privacy.</span>
        </h2>
        <p style={{ color: 'var(--text-dark-secondary)', fontSize: '1.05rem', maxWidth: '620px', lineHeight: 1.6, margin: 0 }}>
          Experience desktop-grade utility performance directly in your browser without sacrificing privacy or waiting on network roundtrips.
        </p>
      </div>

      {/* Grid: Left Tabs, Right Interactive Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'start'
        }}
      >
        {/* Left Side: Vertical Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map((tab, idx) => {
            const isActive = activeTab === idx;
            return (
              <div
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                style={{
                  padding: '20px 24px',
                  borderRadius: '16px',
                  background: isActive ? '#FFFFFF' : 'transparent',
                  boxShadow: isActive ? '0 10px 30px rgba(0, 0, 0, 0.05)' : 'none',
                  border: isActive ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative'
                }}
              >
                {/* Active Hot-Pink Indicator Line on Left */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '0',
                      top: '16px',
                      bottom: '16px',
                      width: '4px',
                      borderRadius: '4px',
                      background: 'var(--primary)'
                    }}
                  />
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: isActive ? 'var(--text-dark)' : 'var(--text-dark-secondary)', margin: 0 }}>
                    {tab.title}
                  </h3>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.68rem',
                      color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                      fontWeight: 700,
                      background: isActive ? 'rgba(255, 46, 147, 0.1)' : 'rgba(0, 0, 0, 0.04)',
                      padding: '2px 8px',
                      borderRadius: '100px'
                    }}
                  >
                    {tab.badge}
                  </span>
                </div>

                <p style={{ fontSize: '0.9rem', color: 'var(--text-dark-secondary)', lineHeight: 1.5, margin: 0 }}>
                  {tab.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Side: Interactive Display Panel */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.06)',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            minHeight: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}
        >
          {activeTab === 0 && <BenchmarkShowcase />}
          {activeTab === 1 && <TerminalMockup />}
          {activeTab === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 46, 147, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Cpu size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>Client Hardware Elastic Core</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dark-secondary)' }}>Automated concurrency scaling with zero remote server limits</p>
                </div>
              </div>

              {/* Architecture Node Map */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
                <div style={{ padding: '16px', background: 'var(--bg-alabaster)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>THREAD 01 • WASM</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>Canvas 2D / WebGL</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dark-secondary)', marginTop: '4px' }}>Sub-second pixel buffers</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-alabaster)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>THREAD 02 • WORKER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>PDF.js Vector Core</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dark-secondary)', marginTop: '4px' }}>Offline document parser</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-alabaster)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>THREAD 03 • WORKER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>Tesseract OCR Engine</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dark-secondary)', marginTop: '4px' }}>Client-side text extractor</div>
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-alabaster)', borderRadius: '12px' }}>
                  <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontWeight: 700 }}>THREAD 04 • WORKER</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)', marginTop: '4px' }}>Math Calculus Engine</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dark-secondary)', marginTop: '4px' }}>IEEE-754 radix conversion</div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255, 46, 147, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={22} style={{ color: 'var(--primary)' }} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-dark)' }}>Live Sandbox Telemetry</h4>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dark-secondary)' }}>100% private in-browser memory diagnostics</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-alabaster)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-dark-secondary)' }}>Remote Network Sockets</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10B981' }}>0 (BLOCKED)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-alabaster)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-dark-secondary)' }}>Ad Injection / Tracking Beacons</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10B981' }}>0 (ZERO TRACKING)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-alabaster)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-dark-secondary)' }}>Average Client Cold Start</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>0.048s</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-alabaster)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.86rem', color: 'var(--text-dark-secondary)' }}>Local RAM Usage</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-dark)' }}>&lt; 35 MB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CerebriumFeatureTabs;
