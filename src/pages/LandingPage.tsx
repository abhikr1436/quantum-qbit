import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Image as ImageIcon, 
  FileText, 
  Calculator, 
  ShieldCheck, 
  Zap, 
  Lock, 
  BookOpen, 
  Award, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  Layers, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { navigate } from '../utils/router';
import Cerebrium3DRibbon from '../components/Cerebrium3DRibbon';
import CerebriumFeatureTabs from '../components/CerebriumFeatureTabs';
import HoldToAccelerate from '../components/HoldToAccelerate';
import { TiltCard } from '../components/TiltCard';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
}

export const LandingPage: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('/api/blogs.php');
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        } else {
          loadDefaultBlogs();
        }
      } catch {
        loadDefaultBlogs();
      }
    };

    const loadDefaultBlogs = () => {
      const defaultPosts: BlogPost[] = [
        {
          id: 'browser-privacy',
          title: "Why Browser-Only Tools Are the Future of Web Utility Apps",
          excerpt: "In an era of rising security concerns, running calculations, converting PDFs, and editing photos locally protects user data from server hazards.",
          author: "Quantum Team",
          date: "May 18, 2026",
          readTime: "4 MIN READ",
          category: "PRIVACY & SECURITY"
        },
        {
          id: 'base-math',
          title: "The Logic Behind Real-Time Cross-Input Number Base Conversions",
          excerpt: "Understanding how computers translate binary, octal, decimal, and hexadecimal representations under the hood to optimize data structures.",
          author: "Dr. Clara Chen",
          date: "May 10, 2026",
          readTime: "5 MIN READ",
          category: "COMPUTER SCIENCE"
        },
        {
          id: 'image-optimization',
          title: "Image Formats Decoded: Choosing Between JPG, PNG, WEBP, and BMP",
          excerpt: "A deep dive into compression algorithms and when to use each format to achieve visual clarity while keeping load times minimal.",
          author: "Marcus Vance",
          date: "May 02, 2026",
          readTime: "4 MIN READ",
          category: "CREATIVE TECH"
        }
      ];
      setPosts(defaultPosts);
    };

    fetchBlogs();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  return (
    <div style={{ position: 'relative', overflowX: 'hidden' }}>
      {/* 1. Hero Section (Cerebrium Dark Obsidian + 3D Ribbon) */}
      <section
        style={{
          position: 'relative',
          padding: 'clamp(50px, 8vw, 100px) 24px 60px 24px',
          minHeight: '88vh',
          display: 'flex',
          alignItems: 'center'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '40px', alignItems: 'center' }}>
          
          {/* Hero Left: Headline, Badge, CTAs, Tech Ticker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', zIndex: 2 }}>
            {/* Cerebrium Monospace Badge */}
            <div className="mono-badge" style={{ gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></span>
              SERVERLESS CLIENT-SIDE UTILITIES • V2.0
            </div>

            {/* Cerebrium Signature Headline with Hot Pink Highlight */}
            <h1
              style={{
                fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
                lineHeight: 1.08,
                fontWeight: 800,
                letterSpacing: '-0.04em',
                margin: 0,
                color: 'var(--text-primary)'
              }}
            >
              Real-time Web Utilities that <span className="cerebrium-highlight">scale</span> with you.
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 1.8vw, 1.22rem)',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '560px',
                margin: 0
              }}
            >
              Execute voice agents, image edits, PDF compression, and math equations with sub-second cold starts. 100% client-side privacy. Zero server latency.
            </p>

            {/* CTA Button Group */}
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' }}>
              <button
                className="btn-cerebrium-pink"
                onClick={() => navigate('/tools')}
              >
                Start Using Tools <ArrowRight size={16} />
              </button>
              <button
                className="btn-cerebrium-dark"
                onClick={() => navigate('/blogs')}
              >
                <BookOpen size={16} /> Read Articles
              </button>
            </div>

            {/* Cerebrium Tech & Engine Ticker */}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-glass)' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: '10px', letterSpacing: '0.06em' }}>
                POWERED BY CLIENT-SIDE STANDARDS
              </div>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={15} style={{ color: 'var(--primary)' }} /> WASM Core
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={15} style={{ color: 'var(--primary)' }} /> HTML5 Canvas 2D
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={15} style={{ color: 'var(--primary)' }} /> PDF.js
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={15} style={{ color: '#10B981' }} /> 0 Byte Upload
                </span>
              </div>
            </div>
          </div>

          {/* Hero Right: 3D Torus Ribbon & Floating Quantum Core */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '460px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1
            }}
          >
            <Cerebrium3DRibbon scrollY={scrollY} mousePos={mousePos} />

            {/* Floating Metric Badges with Cerebrium Styling */}
            <div
              className="glass-card"
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid var(--border-glass-active)',
                background: 'rgba(11, 15, 25, 0.85)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }}></div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>AVERAGE COLD START</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>0.048s Local</div>
              </div>
            </div>

            <div
              className="glass-card"
              style={{
                position: 'absolute',
                top: '30px',
                right: '20px',
                padding: '12px 18px',
                borderRadius: '14px',
                border: '1px solid var(--border-glass-active)',
                background: 'rgba(11, 15, 25, 0.85)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Lock size={16} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SECURITY PROTOCOL</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>100% Client RAM</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. "Why Quantum Qbit" Tabbed Section (Cerebrium Alabaster Container) */}
      <section className="container">
        <CerebriumFeatureTabs />
      </section>

      {/* 3. Touch & Hold Acceleration Showcase */}
      <section className="container" style={{ margin: '60px auto' }}>
        <HoldToAccelerate />
      </section>

      {/* 4. Tools Directory Bento Grid (Obsidian Dark with Hot Pink Accents) */}
      <section className="container" style={{ margin: '80px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <div className="mono-badge">
            <span>•</span> BROWSE TOOLS DIRECTORY
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>
            Production-Ready <span className="cerebrium-highlight">Client Utilities</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '580px', margin: 0, lineHeight: 1.6 }}>
            Run image transformations, document compilations, and mathematical algorithms offline without server limits.
          </p>
        </div>

        {/* Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Card 1: Image Studio */}
          <TiltCard className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }} maxTilt={8}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 46, 147, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="mono-badge">CANVAS WASM</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0' }}>Image Studio</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                Adjust colors, remove backgrounds, crop, resize, and convert formats in sub-second offline execution.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: 'auto' }}>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-editor')}>Editor</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-compressor')}>Compressor</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/remove-bg')}>BG Removal</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/image-converter')}>Converter</button>
            </div>
          </TiltCard>

          {/* Card 2: PDF Workshop */}
          <TiltCard className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }} maxTilt={8}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 46, 147, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="mono-badge">PDF.JS WORKER</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0' }}>PDF Workshop</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                Compress heavy PDF manuals, bundle photos into documents, and extract text drafts with client OCR.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: 'auto' }}>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/pdf-compressor')}>Compressor</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/images-to-pdf')}>Images to PDF</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/convert-to-pdf')}>Office to PDF</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/pdf-to-word')}>PDF to Word</button>
            </div>
          </TiltCard>

          {/* Card 3: Math Workbench */}
          <TiltCard className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }} maxTilt={8}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 46, 147, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calculator size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="mono-badge">IEEE-754 CORE</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0' }}>Math Workbench</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                Scientific notation calculator, cross-input Hex/Bin/Dec radix conversion, unit adapter, and 2D graph plotter.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: 'auto' }}>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-scientific')}>Scientific</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-base')}>Base Radix</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-unit')}>Unit Adapter</button>
              <button className="scroll-card-link-btn" onClick={() => navigate('/tools/math-solver')}>Equation Solver</button>
            </div>
          </TiltCard>

          {/* Card 4: Mock Tests */}
          <TiltCard className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '18px' }} maxTilt={8}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255, 46, 147, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="mono-badge">CBT SIMULATOR</span>
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 8px 0' }}>PYQ Mock Tests</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                Practice real Technical Assistant & Engineer competitive exams with standard Computer Based Test simulation.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
              <a
                href="/isro-ta-computer-science-pyq/"
                className="btn-cerebrium-pink"
                style={{ textDecoration: 'none', justifyContent: 'center', fontSize: '0.86rem', padding: '10px 16px' }}
              >
                ISRO TA CS Mock Test <ArrowRight size={14} />
              </a>
              <button className="btn-secondary" onClick={() => navigate('/mock-tests')} style={{ justifyContent: 'center', fontSize: '0.86rem', padding: '10px 16px' }}>
                Browse All Tests
              </button>
            </div>
          </TiltCard>
        </div>
      </section>

      {/* 5. Cerebrium Security & Compliance Section */}
      <section className="container" style={{ margin: '90px auto' }}>
        <div
          className="glass-card"
          style={{
            padding: 'clamp(40px, 6vw, 70px)',
            borderRadius: 'var(--radius-xl)',
            background: 'radial-gradient(ellipse at center, rgba(139, 30, 90, 0.15) 0%, rgba(11, 15, 25, 0.95) 75%)',
            border: '1px solid var(--border-glass-active)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}
        >
          <div className="mono-badge">
            <span>•</span> PRIVACY & SECURITY FIRST
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)', fontWeight: 800, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Stable, <span className="cerebrium-highlight">secure</span> and 100% private.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '640px', lineHeight: 1.65, margin: 0 }}>
            Because computation runs entirely on your device’s local CPU and GPU, your files, documents, and formulas never leave your browser window.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              width: '100%',
              maxWidth: '850px',
              marginTop: '20px'
            }}
          >
            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', textAlign: 'left' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Client Isolation
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '8px', lineHeight: 1.5 }}>
                Sandboxed execution inside the browser runtime prevents any unauthorized external memory access.
              </p>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', textAlign: 'left' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Zero Storage Risk
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '8px', lineHeight: 1.5 }}>
                Zero logs, zero database writes, and zero third-party cloud storage risks. Your files exist only in your RAM.
              </p>
            </div>

            <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-glass)', borderRadius: '16px', textAlign: 'left' }}>
              <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Free & Unrestricted
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '8px', lineHeight: 1.5 }}>
                No credit cards, no login gates, and no hidden subscriptions. Pure client utility for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Engineering Blog Section */}
      <section className="container" style={{ margin: '80px auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="mono-badge">
              <span>•</span> ENGINEERING & ARCHITECTURE
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, margin: '8px 0 0 0', letterSpacing: '-0.03em' }}>
              Latest Research & Guides
            </h2>
          </div>
          <button className="btn-secondary" onClick={() => navigate('/blogs')}>
            View All Articles <ArrowRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {posts.map((post) => (
            <TiltCard key={post.id} className="glass-card" style={{ padding: '26px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }} maxTilt={6}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="mono-badge" style={{ fontSize: '0.68rem' }}>{post.category}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{post.readTime}</span>
                </div>
                <h3
                  onClick={() => navigate(`/blogs/${post.id}`)}
                  style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.35, cursor: 'pointer', margin: '0 0 10px 0', transition: 'color 0.2s ease' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                >
                  {post.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {post.excerpt}
                </p>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{post.author}</span>
                <span onClick={() => navigate(`/blogs/${post.id}`)} style={{ color: 'var(--primary)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Read Article <ArrowRight size={12} />
                </span>
              </div>
            </TiltCard>
          ))}
        </div>
      </section>

      {/* 7. Bottom Conversion Banner */}
      <section className="container" style={{ margin: '100px auto 60px auto' }}>
        <div
          className="glass-card"
          style={{
            padding: 'clamp(40px, 6vw, 60px)',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(255, 46, 147, 0.12) 0%, rgba(139, 30, 90, 0.25) 50%, rgba(11, 15, 25, 0.95) 100%)',
            border: '1px solid var(--border-glass-active)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '30px',
            boxShadow: '0 20px 60px rgba(255, 46, 147, 0.15)'
          }}
        >
          <div style={{ maxWidth: '540px' }}>
            <div className="mono-badge" style={{ marginBottom: '10px' }}>
              <span>•</span> READY IN SUB-SECOND
            </div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)', fontWeight: 800, margin: '0 0 12px 0', letterSpacing: '-0.03em' }}>
              Start building with <span className="cerebrium-highlight">Quantum Qbit</span> now.
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, margin: 0 }}>
              No installation, no account creation, no tracking. Execute client-side web tools with sub-second speeds.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn-cerebrium-pink" onClick={() => navigate('/tools')}>
              Launch Web Utilities <ArrowRight size={16} />
            </button>
            <button className="btn-cerebrium-dark" onClick={() => navigate('/about')}>
              About Our Mission
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
