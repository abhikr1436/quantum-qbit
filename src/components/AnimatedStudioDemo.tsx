import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Crop, 
  Sliders, 
  Wand2, 
  Layers, 
  Check, 
  Play, 
  Pause, 
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { navigate } from '../utils/router';

export const AnimatedStudioDemo: React.FC = () => {
  const [activeWorkflow, setActiveWorkflow] = useState<'image' | 'pdf'>('image');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isClicking, setIsClicking] = useState<boolean>(false);

  // Total steps for each workflow (0 to 4 = 5 steps)
  const totalSteps = 5;

  // Auto-advance timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      // Trigger a simulated click pulse slightly before advancing step
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 280);

      setCurrentStep((prev) => (prev + 1) % totalSteps);
    }, 3800);

    return () => clearInterval(timer);
  }, [isPlaying, activeWorkflow]);

  const handleStepClick = (index: number) => {
    setIsClicking(true);
    setTimeout(() => setIsClicking(false), 250);
    setCurrentStep(index);
  };

  const imageSteps = [
    { title: '1. Drag & Drop', desc: 'Drop raw photo into canvas' },
    { title: '2. Resize & Crop', desc: 'Scale to exact dimensions' },
    { title: '3. Compress & DPI', desc: 'Cut KB size & boost to 300 DPI' },
    { title: '4. Remove BG', desc: 'AI isolates subject in memory' },
    { title: '5. Instant Save', desc: 'Download optimized lossless file' },
  ];

  const pdfSteps = [
    { title: '1. Add Documents', desc: 'Drop multiple invoices & scans' },
    { title: '2. Reorder Pages', desc: 'Rearrange order visually' },
    { title: '3. OCR Scan', desc: 'Extract editable text locally' },
    { title: '4. Smart Compress', desc: 'Reduce file from 14MB to 1.1MB' },
    { title: '5. Compile & Export', desc: 'Download unified document' },
  ];

  // Cursor coordinates for each step to simulate natural mouse movement
  const imageCursorPositions = [
    { x: '50%', y: '50%' }, // Center over drop area
    { x: '82%', y: '38%' }, // Over resize controls / handle
    { x: '78%', y: '68%' }, // Over DPI & compression slider
    { x: '45%', y: '28%' }, // Over 'Remove BG' magic wand button
    { x: '88%', y: '88%' }, // Over download button
  ];

  const pdfCursorPositions = [
    { x: '50%', y: '48%' }, // Drop multiple files
    { x: '35%', y: '55%' }, // Drag page 2 to page 1
    { x: '75%', y: '35%' }, // Click OCR scan
    { x: '80%', y: '65%' }, // Adjust compression
    { x: '88%', y: '88%' }, // Click export PDF
  ];

  const cursorCoord = activeWorkflow === 'image' 
    ? imageCursorPositions[currentStep] 
    : pdfCursorPositions[currentStep];

  return (
    <div style={styles.demoWrapper} className="glass-card">
      {/* Window Title Bar */}
      <div style={styles.windowTitleBar}>
        <div style={styles.windowDots}>
          <span style={{ ...styles.windowDot, backgroundColor: '#FF5F56' }} />
          <span style={{ ...styles.windowDot, backgroundColor: '#FFBD2E' }} />
          <span style={{ ...styles.windowDot, backgroundColor: '#27C93F' }} />
        </div>

        {/* Workflow Switcher Pills */}
        <div style={styles.modeTabs}>
          <button
            onClick={() => {
              setActiveWorkflow('image');
              setCurrentStep(0);
            }}
            style={{
              ...styles.modeTabBtn,
              ...(activeWorkflow === 'image' ? styles.modeTabBtnActive : {}),
            }}
          >
            <ImageIcon size={15} />
            <span>Image Studio Demo</span>
          </button>
          <button
            onClick={() => {
              setActiveWorkflow('pdf');
              setCurrentStep(0);
            }}
            style={{
              ...styles.modeTabBtn,
              ...(activeWorkflow === 'pdf' ? styles.modeTabBtnActive : {}),
            }}
          >
            <FileText size={15} />
            <span>PDF Workshop Demo</span>
          </button>
        </div>

        {/* Playback Controls */}
        <div style={styles.playbackControls}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={styles.controlIconBtn}
            title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            aria-label={isPlaying ? 'Pause simulation' : 'Play simulation'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={() => setCurrentStep(0)}
            style={styles.controlIconBtn}
            title="Restart simulation"
            aria-label="Restart simulation"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Step Progress Tracker */}
      <div style={styles.stepsTracker}>
        {(activeWorkflow === 'image' ? imageSteps : pdfSteps).map((step, idx) => (
          <div
            key={idx}
            onClick={() => handleStepClick(idx)}
            style={{
              ...styles.stepPill,
              ...(currentStep === idx ? styles.stepPillActive : {}),
              ...(currentStep > idx ? styles.stepPillCompleted : {}),
            }}
          >
            <div style={styles.stepPillTop}>
              <span style={styles.stepNum}>0{idx + 1}</span>
              {currentStep > idx ? (
                <Check size={12} style={{ color: 'var(--emerald)' }} />
              ) : currentStep === idx ? (
                <span style={styles.livePulseDot} />
              ) : null}
            </div>
            <span style={styles.stepTitleText}>{step.title}</span>
          </div>
        ))}
      </div>

      {/* Virtual Interactive Simulation Canvas */}
      <div style={styles.stage}>
        {/* Animated Virtual Mouse Cursor */}
        <div
          style={{
            ...styles.virtualCursor,
            left: cursorCoord.x,
            top: cursorCoord.y,
            transform: `translate(-5px, -5px) scale(${isClicking ? 0.82 : 1})`,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={styles.cursorSvg}>
            <path
              d="M3 3L10.07 19.97L12.58 12.58L19.97 10.07L3 3Z"
              fill="#00F0FF"
              stroke="#040810"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          {isClicking && <div style={styles.cursorClickRipple} />}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* WORKFLOW 1: IMAGE STUDIO ANIMATION                            */}
        {/* ------------------------------------------------------------- */}
        {activeWorkflow === 'image' && (
          <div style={styles.workflowStage}>
            {/* Simulation Header Tools */}
            <div style={styles.simToolHeader}>
              <div style={styles.simBreadcrumb}>
                <ImageIcon size={16} style={{ color: 'var(--primary)' }} />
                <span>portrait_studio_sample.png</span>
              </div>
              <div style={styles.simQuickActions}>
                <span
                  style={{
                    ...styles.simActionBtn,
                    ...(currentStep === 1 ? styles.simActionBtnActive : {}),
                  }}
                >
                  <Crop size={14} /> Crop: 1:1 Square
                </span>
                <span
                  style={{
                    ...styles.simActionBtn,
                    ...(currentStep === 3 ? styles.simActionBtnActive : {}),
                  }}
                >
                  <Wand2 size={14} style={{ color: 'var(--accent)' }} /> Remove Background
                </span>
              </div>
            </div>

            {/* Main Interactive Demo Canvas */}
            <div style={styles.simBodyGrid}>
              {/* Image Preview Canvas */}
              <div style={styles.simCanvasArea}>
                {/* Checkerboard Pattern for transparent BG */}
                <div style={styles.checkerboardPattern} />

                {/* The Animated Image Being Manipulated */}
                <div
                  style={{
                    ...styles.subjectImageCard,
                    width: currentStep >= 1 ? '240px' : '310px',
                    height: currentStep >= 1 ? '240px' : '280px',
                    boxShadow: currentStep === 1 ? '0 0 0 2px var(--primary), 0 10px 30px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.4)',
                  }}
                >
                  {/* Subject Silhouette / Avatar */}
                  <div
                    style={{
                      ...styles.subjectIllustration,
                      background: currentStep >= 3 
                        ? 'transparent' 
                        : 'linear-gradient(145deg, #1E293B, #0F172A)',
                    }}
                  >
                    {/* Glowing Subject Graphic */}
                    <div
                      style={{
                        ...styles.subjectGlowGraphic,
                        filter: currentStep >= 3 ? 'drop-shadow(0 0 18px rgba(0, 240, 255, 0.6))' : 'none',
                      }}
                    >
                      <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="8" r="5" fill="url(#avatarGrad)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                        <path
                          d="M3 21C3 16.58 7.03 13 12 13C16.97 13 21 16.58 21 21"
                          fill="url(#avatarGrad)"
                          stroke="rgba(255,255,255,0.4)"
                          strokeWidth="1"
                        />
                        <defs>
                          <linearGradient id="avatarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00F0FF" />
                            <stop offset="100%" stopColor="#A855F7" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>

                    {/* Step 3: Laser Background Removal Sweep Effect */}
                    {currentStep === 3 && (
                      <div style={styles.laserScanBeam} />
                    )}
                  </div>

                  {/* Crop Handles visible on step 1 */}
                  {currentStep === 1 && (
                    <div style={styles.cropOverlay}>
                      <span style={{ ...styles.cropHandle, top: '-4px', left: '-4px' }} />
                      <span style={{ ...styles.cropHandle, top: '-4px', right: '-4px' }} />
                      <span style={{ ...styles.cropHandle, bottom: '-4px', left: '-4px' }} />
                      <span style={{ ...styles.cropHandle, bottom: '-4px', right: '-4px' }} />
                      <div style={styles.cropDimensionTag}>800 × 800 px</div>
                    </div>
                  )}

                  {/* Background Removed Tag */}
                  {currentStep >= 3 && (
                    <div style={styles.bgRemovedTag}>
                      <Sparkles size={11} style={{ color: 'var(--primary)' }} />
                      <span>ALPHA TRANSPARENT</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Real-Time Live Inspector Sidebar */}
              <div style={styles.simInspector}>
                <h4 style={styles.inspectorHeading}>Live Parameters</h4>

                {/* Dimension Metric */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>Dimensions</span>
                    <span style={{ ...styles.metricValue, color: currentStep >= 1 ? 'var(--primary)' : 'inherit' }}>
                      {currentStep >= 1 ? '800 × 800 px (1:1)' : '1920 × 1080 px'}
                    </span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div
                      style={{
                        ...styles.metricProgressBarFill,
                        width: currentStep >= 1 ? '55%' : '100%',
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Smart File Size Metric */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>File Size (Compression)</span>
                    <span style={{ ...styles.metricValue, color: currentStep >= 2 ? 'var(--emerald)' : 'inherit' }}>
                      {currentStep >= 2 ? '142 KB (Saved 96%)' : '3.8 MB (Raw)'}
                    </span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div
                      style={{
                        ...styles.metricProgressBarFill,
                        width: currentStep >= 2 ? '18%' : '90%',
                        backgroundColor: 'var(--emerald)',
                      }}
                    />
                  </div>
                </div>

                {/* DPI Target Metric */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>DPI Density</span>
                    <span style={{ ...styles.metricValue, color: currentStep >= 2 ? 'var(--secondary)' : 'inherit' }}>
                      {currentStep >= 2 ? '300 DPI (Passport Grade)' : '72 DPI (Screen)'}
                    </span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div
                      style={{
                        ...styles.metricProgressBarFill,
                        width: currentStep >= 2 ? '100%' : '24%',
                        backgroundColor: 'var(--secondary)',
                      }}
                    />
                  </div>
                </div>

                {/* Step 4 & 5: Save & Download Trigger */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    className="btn-primary"
                    style={{
                      width: '100%',
                      transform: currentStep === 4 ? 'scale(1.04)' : 'none',
                      boxShadow: currentStep === 4 ? '0 0 25px var(--primary-glow)' : 'none',
                    }}
                  >
                    <Download size={16} />
                    <span>{currentStep === 4 ? 'Exporting Lossless PNG...' : 'Download Processed'}</span>
                  </button>
                  {currentStep === 4 && (
                    <div style={styles.downloadSuccessToast}>
                      <Check size={13} style={{ color: 'var(--emerald)' }} />
                      <span>Saved 100% locally in 0.08s</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* WORKFLOW 2: PDF WORKSHOP ANIMATION                            */}
        {/* ------------------------------------------------------------- */}
        {activeWorkflow === 'pdf' && (
          <div style={styles.workflowStage}>
            {/* Simulation Header Tools */}
            <div style={styles.simToolHeader}>
              <div style={styles.simBreadcrumb}>
                <FileText size={16} style={{ color: 'var(--secondary)' }} />
                <span>Executive_Portfolio_Compacted.pdf</span>
              </div>
              <div style={styles.simQuickActions}>
                <span
                  style={{
                    ...styles.simActionBtn,
                    ...(currentStep === 2 ? styles.simActionBtnActive : {}),
                  }}
                >
                  <Sparkles size={14} style={{ color: 'var(--primary)' }} /> Tesseract OCR Active
                </span>
              </div>
            </div>

            {/* PDF Multi-Page Workspace Simulation */}
            <div style={styles.simBodyGrid}>
              {/* Visual Page Sorter Canvas */}
              <div style={styles.simCanvasArea}>
                <div style={styles.pdfPageGrid}>
                  {/* Page 1 */}
                  <div
                    style={{
                      ...styles.pdfPageCard,
                      transform: currentStep === 1 ? 'translateY(-8px) rotate(-2deg)' : 'none',
                      borderColor: currentStep === 1 ? 'var(--primary)' : 'var(--glass-border)',
                    }}
                  >
                    <div style={styles.pdfPageHeader}>
                      <span style={styles.pdfPageNum}>PAGE 01</span>
                      <FileText size={12} />
                    </div>
                    <div style={styles.pdfLineSkeleton} />
                    <div style={{ ...styles.pdfLineSkeleton, width: '70%' }} />
                    <div style={{ ...styles.pdfLineSkeleton, width: '85%' }} />
                    <div style={styles.pdfImageSkeleton} />
                  </div>

                  {/* Page 2 */}
                  <div
                    style={{
                      ...styles.pdfPageCard,
                      borderColor: currentStep === 2 ? 'var(--secondary)' : 'var(--glass-border)',
                    }}
                  >
                    <div style={styles.pdfPageHeader}>
                      <span style={styles.pdfPageNum}>PAGE 02</span>
                      <FileText size={12} />
                    </div>
                    {currentStep >= 2 ? (
                      <div style={styles.ocrScannedTextWrap}>
                        <span style={styles.ocrTag}>OCR EXTRACTED</span>
                        <div style={styles.pdfCodeLine}>"Annual Growth Index: +42%"</div>
                        <div style={styles.pdfCodeLine}>"Certified Browser Memory Execution"</div>
                      </div>
                    ) : (
                      <>
                        <div style={styles.pdfLineSkeleton} />
                        <div style={{ ...styles.pdfLineSkeleton, width: '90%' }} />
                        <div style={{ ...styles.pdfLineSkeleton, width: '60%' }} />
                      </>
                    )}
                  </div>

                  {/* Page 3 */}
                  <div style={styles.pdfPageCard}>
                    <div style={styles.pdfPageHeader}>
                      <span style={styles.pdfPageNum}>PAGE 03</span>
                      <FileText size={12} />
                    </div>
                    <div style={styles.pdfLineSkeleton} />
                    <div style={{ ...styles.pdfLineSkeleton, width: '75%' }} />
                    <div style={styles.pdfImageSkeleton} />
                  </div>
                </div>
              </div>

              {/* PDF Settings & Inspector */}
              <div style={styles.simInspector}>
                <h4 style={styles.inspectorHeading}>Document Engine</h4>

                {/* Merge Count Metric */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>Total Pages</span>
                    <span style={styles.metricValue}>3 Pages Combined</span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div style={{ ...styles.metricProgressBarFill, width: '100%', backgroundColor: 'var(--secondary)' }} />
                  </div>
                </div>

                {/* PDF Compression Metric */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>File Size Compression</span>
                    <span style={{ ...styles.metricValue, color: currentStep >= 3 ? 'var(--emerald)' : 'inherit' }}>
                      {currentStep >= 3 ? '1.1 MB (Saved 91%)' : '12.4 MB'}
                    </span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div
                      style={{
                        ...styles.metricProgressBarFill,
                        width: currentStep >= 3 ? '14%' : '85%',
                        backgroundColor: 'var(--emerald)',
                      }}
                    />
                  </div>
                </div>

                {/* OCR Engine State */}
                <div style={styles.inspectorMetricBox}>
                  <div style={styles.inspectorMetricHeader}>
                    <span style={styles.metricLabel}>Client-Side OCR</span>
                    <span style={{ ...styles.metricValue, color: currentStep >= 2 ? 'var(--primary)' : 'inherit' }}>
                      {currentStep >= 2 ? '100% Accuracy (Local)' : 'Ready'}
                    </span>
                  </div>
                  <div style={styles.metricProgressBarTrack}>
                    <div
                      style={{
                        ...styles.metricProgressBarFill,
                        width: currentStep >= 2 ? '100%' : '30%',
                        backgroundColor: 'var(--primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Compile & Download Trigger */}
                <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                  <button
                    className="btn-primary"
                    style={{
                      width: '100%',
                      transform: currentStep === 4 ? 'scale(1.04)' : 'none',
                      boxShadow: currentStep === 4 ? '0 0 25px var(--secondary-glow)' : 'none',
                    }}
                  >
                    <Download size={16} />
                    <span>{currentStep === 4 ? 'Compiling PDF...' : 'Download Merged PDF'}</span>
                  </button>
                  {currentStep === 4 && (
                    <div style={styles.downloadSuccessToast}>
                      <Check size={13} style={{ color: 'var(--emerald)' }} />
                      <span>PDF Ready • 0 Bytes sent to cloud</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Direct Try It Yourself Action Strip */}
      <div style={styles.demoFooterStrip}>
        <div style={styles.footerNote}>
          <span style={styles.pulseGreenDot} />
          <span>This simulation reflects our actual client-side engine pipeline running locally in your browser.</span>
        </div>
        <button
          onClick={() => navigate(activeWorkflow === 'image' ? '/image-studio' : '/pdf-workshop')}
          className="liquid-glass-btn-primary"
          style={{ padding: '8px 20px', fontSize: '0.88rem' }}
        >
          <span>Try {activeWorkflow === 'image' ? 'Image Studio' : 'PDF Workshop'}</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  demoWrapper: {
    width: '100%',
    maxWidth: '1080px',
    margin: '0 auto',
    borderRadius: 'var(--radius-xl)',
    display: 'flex',
    flexDirection: 'column' as const,
    boxShadow: '0 24px 60px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.5)',
    border: '1px solid var(--glass-border-bright)',
    overflow: 'hidden',
  },
  windowTitleBar: {
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.35)',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  windowDots: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  windowDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
  },
  modeTabs: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '4px',
    borderRadius: 'var(--radius-full)',
    border: '1px solid var(--glass-border)',
  },
  modeTabBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '6px 14px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.84rem',
    fontWeight: 600,
    fontFamily: 'var(--font-heading)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'var(--transition-tactile)',
  },
  modeTabBtnActive: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)',
    color: 'var(--primary)',
    border: '1px solid var(--border-glass-active)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  playbackControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlIconBtn: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--glass-border)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  },
  stepsTracker: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '8px',
    padding: '12px 18px',
    background: 'rgba(0, 0, 0, 0.2)',
    borderBottom: '1px solid var(--glass-border)',
  },
  stepPill: {
    padding: '8px 12px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.02)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--glass-border)',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    transition: 'var(--transition-tactile)',
  },
  stepPillActive: {
    background: 'rgba(0, 240, 255, 0.08)',
    borderColor: 'var(--primary)',
    boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
  },
  stepPillCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  stepPillTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepNum: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  livePulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    boxShadow: '0 0 8px var(--primary)',
  },
  stepTitleText: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  stage: {
    position: 'relative' as const,
    minHeight: '440px',
    overflow: 'hidden',
    display: 'flex',
  },
  virtualCursor: {
    position: 'absolute' as const,
    zIndex: 100,
    pointerEvents: 'none' as const,
    transition: 'left 0.75s cubic-bezier(0.22, 1, 0.36, 1), top 0.75s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease',
  },
  cursorSvg: {
    filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
  },
  cursorClickRipple: {
    position: 'absolute' as const,
    top: '3px',
    left: '3px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '2px solid var(--primary)',
    animation: 'rippleWave 0.3s ease-out forwards',
  },
  workflowStage: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  simToolHeader: {
    padding: '10px 20px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255, 255, 255, 0.02)',
    flexWrap: 'wrap' as const,
    gap: '10px',
  },
  simBreadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-secondary)',
  },
  simQuickActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  simActionBtn: {
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.04)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--glass-border)',
    fontSize: '0.78rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  simActionBtnActive: {
    background: 'rgba(0, 240, 255, 0.12)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
    boxShadow: '0 0 10px var(--primary-glow)',
  },
  simBodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    minHeight: '380px',
  },
  simCanvasArea: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflow: 'hidden',
    borderRight: '1px solid var(--glass-border)',
  },
  checkerboardPattern: {
    position: 'absolute' as const,
    inset: 0,
    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.03) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.03) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '24px 24px',
    backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px',
  },
  subjectImageCard: {
    position: 'relative' as const,
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  subjectIllustration: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
    transition: 'background 0.5s ease',
  },
  subjectGlowGraphic: {
    transition: 'filter 0.4s ease',
  },
  laserScanBeam: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #FF2E93, #00F0FF, transparent)',
    boxShadow: '0 0 15px #FF2E93, 0 0 25px #00F0FF',
    animation: 'scanDown 2s infinite linear',
  },
  cropOverlay: {
    position: 'absolute' as const,
    inset: 0,
    border: '2px solid var(--primary)',
    pointerEvents: 'none' as const,
  },
  cropHandle: {
    position: 'absolute' as const,
    width: '10px',
    height: '10px',
    backgroundColor: 'var(--primary)',
    borderRadius: '2px',
    boxShadow: '0 0 6px rgba(0,0,0,0.8)',
  },
  cropDimensionTag: {
    position: 'absolute' as const,
    bottom: '6px',
    right: '6px',
    background: 'rgba(0,0,0,0.7)',
    color: '#fff',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontFamily: 'var(--font-mono)',
  },
  bgRemovedTag: {
    position: 'absolute' as const,
    bottom: '10px',
    left: '10px',
    background: 'rgba(0, 240, 255, 0.15)',
    border: '1px solid rgba(0, 240, 255, 0.4)',
    color: 'var(--primary)',
    padding: '3px 8px',
    borderRadius: 'var(--radius-full)',
    fontSize: '0.68rem',
    fontWeight: 700,
    letterSpacing: '0.05em',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backdropFilter: 'blur(8px)',
  },
  simInspector: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    background: 'rgba(0, 0, 0, 0.15)',
  },
  inspectorHeading: {
    fontSize: '0.92rem',
    fontWeight: 700,
    fontFamily: 'var(--font-heading)',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    color: 'var(--text-muted)',
  },
  inspectorMetricBox: {
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--glass-border)',
    borderRadius: 'var(--radius-md)',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  inspectorMetricHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: '0.82rem',
  },
  metricLabel: {
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  metricValue: {
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
    fontSize: '0.8rem',
    transition: 'color 0.3s ease',
  },
  metricProgressBarTrack: {
    width: '100%',
    height: '5px',
    borderRadius: '999px',
    background: 'rgba(0, 0, 0, 0.4)',
    overflow: 'hidden',
  },
  metricProgressBarFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease',
  },
  downloadSuccessToast: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '8px',
    fontSize: '0.78rem',
    color: 'var(--emerald)',
    fontWeight: 500,
  },
  pdfPageGrid: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'nowrap' as const,
  },
  pdfPageCard: {
    width: '130px',
    height: '180px',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(255, 255, 255, 0.05)',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--glass-border)',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    boxShadow: 'var(--shadow-pill)',
    transition: 'all 0.5s ease',
    overflow: 'hidden',
  },
  pdfPageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: 'var(--text-muted)',
  },
  pdfPageNum: {
    fontSize: '0.65rem',
    fontFamily: 'var(--font-mono)',
    fontWeight: 700,
  },
  pdfLineSkeleton: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.1)',
  },
  pdfImageSkeleton: {
    width: '100%',
    height: '40px',
    borderRadius: '4px',
    background: 'rgba(0, 240, 255, 0.08)',
    marginTop: 'auto',
  },
  ocrScannedTextWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    marginTop: '4px',
  },
  ocrTag: {
    fontSize: '0.62rem',
    fontWeight: 700,
    color: 'var(--secondary)',
    letterSpacing: '0.05em',
  },
  pdfCodeLine: {
    fontSize: '0.64rem',
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    lineHeight: 1.3,
  },
  demoFooterStrip: {
    padding: '12px 20px',
    background: 'rgba(0, 0, 0, 0.35)',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.82rem',
    color: 'var(--text-secondary)',
  },
  pulseGreenDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--emerald)',
    boxShadow: '0 0 8px var(--emerald)',
    flexShrink: 0,
  },
};

// Global keyframe for scan line & cursor ripple
if (typeof document !== 'undefined') {
  const styleEl = document.createElement('style');
  styleEl.innerHTML = `
    @keyframes scanDown {
      0% { top: 0%; opacity: 0.8; }
      50% { top: 95%; opacity: 1; }
      100% { top: 0%; opacity: 0.8; }
    }
    @keyframes rippleWave {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }
    @media (max-width: 768px) {
      .simBodyGrid {
        grid-template-columns: 1fr !important;
      }
    }
  `;
  document.head.appendChild(styleEl);
}

export default AnimatedStudioDemo;
