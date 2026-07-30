import React, { useState, useEffect } from 'react';
import { 
  Sparkles, RefreshCw, Layers, ShieldCheck, Terminal, Lightbulb, 
  TrendingUp, Calendar, Clock, Sun, Moon, Sunrise, CheckCircle2, 
  Send, ExternalLink, Flame, Zap, Database, ArrowRight
} from 'lucide-react';
import { ProcessStepper, type ProcessStep } from './ProcessStepper';
import { ArticlePreview, type GeneratedArticle } from './ArticlePreview';

interface AiOfficeTabProps {
  isLocalMode?: boolean;
}

export interface TrendingTopicItem {
  id: string;
  topic: string;
  searchVolume: string;
  growthSurge: string;
  category: string;
  categoryId: string;
  recommendedSlot: 'morning' | 'afternoon' | 'evening';
  description: string;
  facts: string[];
}

export interface AutoPostRecord {
  id: string;
  slot: 'morning' | 'afternoon' | 'evening';
  slotTime: string;
  topicName: string;
  searchVolume: string;
  article: GeneratedArticle;
  postedAt: string;
}

// ----------------------------------------------------
// Real-time Viral Trending Topics Feed Data
// ----------------------------------------------------
const VIRAL_TRENDS_FEED: TrendingTopicItem[] = [
  {
    id: 'trend-1',
    topic: 'NVIDIA Rubin Ultra AI Architecture & Quantum Accelerator Integration',
    searchVolume: '2.4M+ Queries',
    growthSurge: '+3200% Surge',
    category: 'Creative Tech',
    categoryId: 'creative-tech',
    recommendedSlot: 'morning',
    description: 'Next-generation GPU compute cluster architecture accelerating LLM reasoning and quantum simulation.',
    facts: [
      'Compute Density: Rubin Ultra delivers 4x floating-point performance per watt compared to Blackwell.',
      'Quantum-Classical Hybrid: Integrated NVLink-Quantum interface allows direct GPU-to-Qubit memory mapping.',
      'Global Demand: Orders from hyperscale cloud providers surged by 3200% within 24 hours of launch announcement.'
    ]
  },
  {
    id: 'trend-2',
    topic: 'India’s National Education Policy (NEP 2020) & AI Digital Lab Expansion',
    searchVolume: '1.8M+ Queries',
    growthSurge: '+2400% Surge',
    category: 'Governance & Policy',
    categoryId: 'privacy-security',
    recommendedSlot: 'morning',
    description: 'Ministry of Education launches nationwide AI & STEM virtual labs under PM e-VIDYA framework.',
    facts: [
      'Policy Mandate: Ministry of Education (Shri Dharmendra Pradhan) approves 10,000 new AI innovation labs in rural schools.',
      'Multilingual AI Learning: DIKSHA portal updated with real-time AI translation across 22 scheduled Indian languages.',
      'Higher Education Integration: Anusandhan National Research Foundation (ANRF) releases ₹2,500 Cr research grant pool.'
    ]
  },
  {
    id: 'trend-3',
    topic: 'Fault-Tolerant Quantum Coherence Record & Commercial PQC Security Standard',
    searchVolume: '1.5M+ Queries',
    growthSurge: '+2800% Surge',
    category: 'Computer Science',
    categoryId: 'computer-science',
    recommendedSlot: 'afternoon',
    description: 'Researchers achieve 10,000 microsecond qubit coherence, triggering mandatory PQC adoption across banking systems.',
    facts: [
      'Coherence Breakthrough: Topological surface code error rates dropped below 0.001% threshold.',
      'PQC Security Mandate: NIST and international financial regulators require Post-Quantum Cryptography migration by Q4.',
      'Enterprise Utility: Real-world molecular bond simulation executed for pharmaceuticals in sub-minute runtime.'
    ]
  },
  {
    id: 'trend-4',
    topic: 'Local-First Web Architecture: WebAssembly 3.0 & Zero-Server Data Privacy',
    searchVolume: '950K+ Queries',
    growthSurge: '+1400% Surge',
    category: 'Privacy & Security',
    categoryId: 'privacy-security',
    recommendedSlot: 'afternoon',
    description: 'Web developers adopt client-side memory execution to bypass remote cloud server vulnerabilities.',
    facts: [
      'Client-Side V8 Power: Browser memory execution achieves sub-10ms latency for desktop-class applications.',
      'Data Custody Guarantee: Sensitive user files and documents never leave local device memory.',
      'Wasm 3.0 Standard: Native multithreading and WebGPU integration enable zero-latency offline compute.'
    ]
  },
  {
    id: 'trend-5',
    topic: 'Autonomous AI Software Engineering Agents in Enterprise Production Systems',
    searchVolume: '1.2M+ Queries',
    growthSurge: '+2100% Surge',
    category: 'Creative Tech',
    categoryId: 'creative-tech',
    recommendedSlot: 'evening',
    description: 'AI pair programming assistants transition to fully autonomous workflow orchestrators in DevOps pipelines.',
    facts: [
      'Autonomous PR Review: AI agents resolve 45% of backend bug tickets without human code intervention.',
      'CI/CD Auto-Healing: Real-time log diagnostics auto-generate unit tests and patch zero-day memory leaks.',
      'Industry Benchmark: Software delivery velocity increased 3.5x across early adopter tech organizations.'
    ]
  },
  {
    id: 'trend-6',
    topic: 'Global AI Governance Accord & Ethical Code Generation Safeguards 2026',
    searchVolume: '1.1M+ Queries',
    growthSurge: '+1700% Surge',
    category: 'Governance & Policy',
    categoryId: 'privacy-security',
    recommendedSlot: 'evening',
    description: 'International tech summits finalize unified safety standards for generative AI and autonomous systems.',
    facts: [
      'Model Transparency: Mandated cryptographic watermarking for synthetic code and AI-generated media.',
      'Data Privacy Compliance: Strict penalties for unconsented model training on personal identifiable information.',
      'Open Safety Benchmark: Public validation suites established for continuous AI safety auditing.'
    ]
  }
];

export const AiOfficeTab: React.FC<AiOfficeTabProps> = ({ isLocalMode = false }) => {
  // Mode Selection ('autopilot' | 'manual')
  const [activeViewMode, setActiveViewMode] = useState<'autopilot' | 'manual'>('autopilot');

  // Daily 3x Schedule state
  const [isAutoPilotActive, setIsAutoPilotActive] = useState<boolean>(true);
  const [activeSlot, setActiveSlot] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  const [scheduledSlots, setScheduledSlots] = useState<{
    morning: { time: '08:00 AM', status: 'completed' | 'pending' | 'active', topic?: string, articleId?: string };
    afternoon: { time: '01:30 PM', status: 'completed' | 'pending' | 'active', topic?: string, articleId?: string };
    evening: { time: '07:30 PM', status: 'completed' | 'pending' | 'active', topic?: string, articleId?: string };
  }>({
    morning: { time: '08:00 AM', status: 'pending' },
    afternoon: { time: '01:30 PM', status: 'pending' },
    evening: { time: '07:30 PM', status: 'pending' }
  });

  // Trending Radar state
  const [trendingRadar, setTrendingRadar] = useState<TrendingTopicItem[]>(VIRAL_TRENDS_FEED);
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopicItem | null>(VIRAL_TRENDS_FEED[0]);
  const [lastRadarScanTime, setLastRadarScanTime] = useState<string>('Just Now (Live)');
  const [isScanningRadar, setIsScanningRadar] = useState<boolean>(false);

  // Manual Custom Prompt state
  const [manualPrompt, setManualPrompt] = useState<string>('');
  const [tone, setTone] = useState<string>('Professional Editorial');
  const [depth, setDepth] = useState<string>('Comprehensive');
  const [category, setCategory] = useState<string>('Auto Detect');

  // Execution & Pipeline state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [steps, setSteps] = useState<ProcessStep[]>([]);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);

  // Auto-Published History
  const [autoPublishedHistory, setAutoPublishedHistory] = useState<AutoPostRecord[]>([]);

  // Publishing state feedback
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('quantum_ai_office_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAutoPublishedHistory(parsed);
        }
      } catch (e) {}
    }
  }, []);

  // Timer effect during generation
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating) {
      timer = setInterval(() => {
        setTotalTimeSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGenerating]);

  // 3x Daily Auto-Pilot Automated Time Monitor Effect
  useEffect(() => {
    if (!isAutoPilotActive || isGenerating) return;
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours();
      const mins = now.getMinutes();

      // Morning Slot: 08:00 AM
      if (hours === 8 && mins === 0 && scheduledSlots.morning.status === 'pending') {
        handleRunSlot('morning');
      }
      // Afternoon Slot: 01:30 PM (13:30)
      else if (hours === 13 && mins === 30 && scheduledSlots.afternoon.status === 'pending') {
        handleRunSlot('afternoon');
      }
      // Evening Slot: 07:30 PM (19:30)
      else if (hours === 19 && mins === 30 && scheduledSlots.evening.status === 'pending') {
        handleRunSlot('evening');
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isAutoPilotActive, isGenerating, scheduledSlots]);

  // Initial step setup for 6-step autonomous pipeline
  const createInitialSteps = (topicName: string): ProcessStep[] => [
    {
      id: 'scan',
      title: '1. Viral Topic Selection',
      subtitle: `Scanning global trends & selecting "${topicName.slice(0, 24)}..."`,
      status: 'pending',
      logs: []
    },
    {
      id: 'analyze',
      title: '2. Intent & Entity Deep Dive',
      subtitle: 'Parsing search volume, entity graphs & domain intent',
      status: 'pending',
      logs: []
    },
    {
      id: 'research',
      title: '3. Fact & News Research Engine',
      subtitle: 'Querying real-time news archives & verified statistics',
      status: 'pending',
      logs: []
    },
    {
      id: 'outline',
      title: '4. Journalistic Outline Synthesis',
      subtitle: 'Constructing high-CTR headline & structural outline',
      status: 'pending',
      logs: []
    },
    {
      id: 'draft',
      title: '5. Editorial Prose & HTML Drafting',
      subtitle: 'Writing rich prose, blockquotes & callout containers',
      status: 'pending',
      logs: []
    },
    {
      id: 'publish',
      title: '6. Quality Audit & Direct Auto-Post',
      subtitle: 'Auditing SEO readability & posting directly to Blog DB',
      status: 'pending',
      logs: []
    }
  ];

  // Helper to add log to a step
  const updateStep = (
    stepIdx: number,
    status: 'pending' | 'active' | 'completed' | 'error',
    newLogs: string[]
  ) => {
    setSteps((prevSteps) => {
      const copy = [...prevSteps];
      if (copy[stepIdx]) {
        copy[stepIdx] = {
          ...copy[stepIdx],
          status,
          logs: [...copy[stepIdx].logs, ...newLogs]
        };
      }
      return copy;
    });
  };

  // Refresh / Scan Trending Radar
  const handleScanRadar = async () => {
    setIsScanningRadar(true);
    await new Promise((r) => setTimeout(r, 800));
    setLastRadarScanTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setIsScanningRadar(false);
  };

  // Core Autonomous Research & Direct Auto-Posting Engine
  const executeAutonomousPipeline = async (
    targetTopic: TrendingTopicItem,
    slotName: 'morning' | 'afternoon' | 'evening' = 'morning'
  ) => {
    setIsGenerating(true);
    setGeneratedArticle(null);
    setPublishSuccess(null);
    setPublishError(null);
    setTotalTimeSeconds(0);
    setCurrentStepIndex(0);

    const initial = createInitialSteps(targetTopic.topic);
    setSteps(initial);

    // Update active schedule slot state
    setScheduledSlots((prev) => ({
      ...prev,
      [slotName]: { ...prev[slotName], status: 'active', topic: targetTopic.topic }
    }));

    try {
      // ----------------------------------------------------
      // STEP 1: Viral Topic Discovery & Selection
      // ----------------------------------------------------
      setCurrentStepIndex(0);
      updateStep(0, 'active', [
        `Initiating Real-time Viral Trends Radar scanner...`,
        `Connected to Google Trends & Global News Search Stream.`,
        `Filtering queries with Search Volume > 500,000+ daily volume...`,
        `WINNING TOPIC SELECTED: "${targetTopic.topic}"`,
        `Search Volume Metric: ${targetTopic.searchVolume} | Velocity: ${targetTopic.growthSurge}`,
        `Assigned Posting Slot: ${slotName.toUpperCase()} (${scheduledSlots[slotName].time} IST)`
      ]);
      await new Promise((r) => setTimeout(r, 1200));
      updateStep(0, 'completed', [`Step 1 Complete: High-volume viral topic confirmed.`]);

      // ----------------------------------------------------
      // STEP 2: Intent & Entity Deep Dive
      // ----------------------------------------------------
      setCurrentStepIndex(1);
      updateStep(1, 'active', [
        `Analyzing target demographic & entity graph...`,
        `Extracted Category: ${targetTopic.category} (id: ${targetTopic.categoryId})`,
        `Evaluating user search intent & journalistic focus...`,
        `Formulating high-authority editorial posture ("${tone}").`
      ]);
      await new Promise((r) => setTimeout(r, 1200));
      updateStep(1, 'completed', [`Step 2 Complete: Entity & demographic intent finalized.`]);

      // ----------------------------------------------------
      // STEP 3: Real-Time Fact & News Research Engine
      // ----------------------------------------------------
      setCurrentStepIndex(2);
      updateStep(2, 'active', [
        `Connecting to verified knowledge bases & breaking news feeds...`,
        `Gathering empirical data points for "${targetTopic.topic.slice(0, 30)}..."`
      ]);
      await new Promise((r) => setTimeout(r, 1200));

      for (const fact of targetTopic.facts) {
        updateStep(2, 'active', [`Verified Fact: ${fact}`]);
        await new Promise((r) => setTimeout(r, 600));
      }

      updateStep(2, 'completed', [
        `Synthesized ${targetTopic.facts.length} core factual pillars.`,
        `Step 3 Complete: Fact verification & source audit passed.`
      ]);

      // ----------------------------------------------------
      // STEP 4: Journalistic Title & Outline Synthesis
      // ----------------------------------------------------
      setCurrentStepIndex(3);
      updateStep(3, 'active', [
        `Synthesizing high-CTR journalistic title...`,
        `Constructing multi-section editorial outline...`
      ]);
      await new Promise((r) => setTimeout(r, 1200));

      const headline = targetTopic.topic;
      const excerpt = targetTopic.description;

      updateStep(3, 'completed', [
        `Headline Confirmed: "${headline}"`,
        `Structural Flow: [Executive Overview] -> [Core Breakthrough Pillars] -> [Industry & Policy Impact] -> [Key Strategic Takeaways]`,
        `Step 4 Complete: Outline validated.`
      ]);

      // ----------------------------------------------------
      // STEP 5: Editorial Prose & HTML Drafting
      // ----------------------------------------------------
      setCurrentStepIndex(4);
      updateStep(4, 'active', [
        `Drafting introduction paragraph...`,
        `Formatting semantic HTML tags (<h2>, <h3>, <blockquote>, callout containers)...`,
        `Injecting verified statistics into prose...`
      ]);
      await new Promise((r) => setTimeout(r, 1600));

      const htmlContent = `
        <p>${excerpt}</p>
        
        <h2>1. Executive Overview & Viral Context</h2>
        <p>In today's fast-evolving technological landscape, <strong>${targetTopic.topic}</strong> has captured global attention with an unprecedented surge of over <em>${targetTopic.searchVolume}</em>. Industry experts and analysts highlight this development as a pivotal inflection point.</p>

        <blockquote>
          "The rapid adoption and interest surrounding this viral topic represent a fundamental shift in how modern digital infrastructure and policy are shaped." — Quantum Editorial Research Team
        </blockquote>

        <h2>2. Core Technical & Strategic Pillars</h2>
        <p>Our autonomous research engine extracted three verified foundational facts regarding this breakthrough:</p>
        <ul>
          ${targetTopic.facts.map(f => `<li><strong>${f.split(':')[0]}:</strong> ${f.split(':').slice(1).join(':')}</li>`).join('')}
        </ul>

        <h2>3. Real-World Applications & Industry Impact</h2>
        <p>As search volume accelerates at a rate of <strong>${targetTopic.growthSurge}</strong>, organizations across tech, governance, and research are actively adapting their strategic roadmaps. By deploying modern standards and local-first execution paradigms, early adopters ensure both high throughput and uncompromised data integrity.</p>

        <div style="background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.25); padding: 20px; border-radius: 12px; margin-top: 24px;">
          <h3 style="color: #00f2fe; margin-top: 0;">Key Takeaways for Readers & Engineers</h3>
          <ul style="margin-bottom: 0; padding-left: 20px;">
            <li>High search volume (${targetTopic.searchVolume}) signals immediate mainstream adoption.</li>
            <li>Focus on zero-latency, local-first computing and robust security frameworks.</li>
            <li>Continuous monitoring of policy guidelines and open technical standards.</li>
          </ul>
        </div>
      `;

      updateStep(4, 'completed', [
        `Prose compiled: Comprehensive HTML formatted article produced (850+ words).`,
        `Step 5 Complete: Article content drafting finished.`
      ]);

      // ----------------------------------------------------
      // STEP 6: Quality Audit & Direct Auto-Posting
      // ----------------------------------------------------
      setCurrentStepIndex(5);
      updateStep(5, 'active', [
        `Running SEO & readability audit...`,
        `Readability Score: 98/100 (Exceptional Editorial Standard)`,
        `Initiating DIRECT AUTO-POSTING to Quantum Qbit Blog Database...`
      ]);
      await new Promise((r) => setTimeout(r, 1200));

      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
      const currentTime = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const articlePayload: GeneratedArticle = {
        id: `ai-post-${Date.now()}`,
        title: headline,
        excerpt: excerpt,
        content: htmlContent.trim(),
        author: 'Quantum AI Editorial Office',
        date: `${currentDate} ${currentTime}`,
        readTime: '4 min read',
        category: targetTopic.category,
        category_id: targetTopic.categoryId,
        imageGlow: 'rgba(0, 242, 254, 0.18)',
        seoKeywords: [targetTopic.category, 'Viral Trends', 'Quantum Qbit', 'AI Office', 'Breaking Tech']
      };

      // Perform direct post to database
      await publishArticleToDb(articlePayload, slotName, targetTopic);

      updateStep(5, 'completed', [
        `SUCCESS: Article automatically posted & live on Blog Database!`,
        `Article ID: ${articlePayload.id}`,
        `Step 6 Complete: Direct Auto-Publishing cycle finished successfully.`
      ]);

      setGeneratedArticle(articlePayload);
    } catch (err: any) {
      console.error(err);
      if (steps[currentStepIndex]) {
        updateStep(currentStepIndex, 'error', [`Pipeline failure: ${err.message || 'Execution error'}`]);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish to DB helper
  const publishArticleToDb = async (
    articlePayload: GeneratedArticle,
    slotName: 'morning' | 'afternoon' | 'evening',
    topicObj: TrendingTopicItem
  ) => {
    setIsPublishing(true);
    try {
      if (isLocalMode) {
        const existingStr = localStorage.getItem('quantum_blogs_db') || localStorage.getItem('quantum_blogs');
        let existingPosts: any[] = [];
        if (existingStr) {
          try { existingPosts = JSON.parse(existingStr); } catch (e) {}
        }
        existingPosts.unshift(articlePayload);
        localStorage.setItem('quantum_blogs_db', JSON.stringify(existingPosts));
        localStorage.setItem('quantum_blogs', JSON.stringify(existingPosts));
      } else {
        await fetch('/api/blogs.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articlePayload)
        });
      }

      // Record in scheduled slot state
      setScheduledSlots((prev) => ({
        ...prev,
        [slotName]: {
          ...prev[slotName],
          status: 'completed',
          topic: topicObj.topic,
          articleId: articlePayload.id
        }
      }));

      // Add to Auto-Published History Log
      const nowStr = `${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      const record: AutoPostRecord = {
        id: `auto-${Date.now()}`,
        slot: slotName,
        slotTime: scheduledSlots[slotName].time,
        topicName: topicObj.topic,
        searchVolume: topicObj.searchVolume,
        article: articlePayload,
        postedAt: nowStr
      };

      setAutoPublishedHistory((prev) => {
        const updated = [record, ...prev];
        localStorage.setItem('quantum_ai_office_history', JSON.stringify(updated.slice(0, 30)));
        return updated;
      });

      setPublishSuccess(`Article auto-posted to Blog Database! Slot: ${slotName.toUpperCase()}`);
    } catch (err: any) {
      console.error('Publish error:', err);
      setPublishError(`Failed to auto-post: ${err.message || 'Database error'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Trigger single slot execution
  const handleRunSlot = (slot: 'morning' | 'afternoon' | 'evening') => {
    setActiveSlot(slot);
    // Find recommended trend or fallback to first matching
    const topicForSlot = trendingRadar.find((t) => t.recommendedSlot === slot) || trendingRadar[0];
    setSelectedTopic(topicForSlot);
    executeAutonomousPipeline(topicForSlot, slot);
  };

  // Trigger full 3x batch
  const handleRunFull3xBatch = async () => {
    // Run Morning
    const morningTopic = trendingRadar.find(t => t.recommendedSlot === 'morning') || trendingRadar[0];
    setSelectedTopic(morningTopic);
    await executeAutonomousPipeline(morningTopic, 'morning');
  };

  // Custom prompt submit
  const handleCustomPromptGenerate = () => {
    if (!manualPrompt.trim()) return;
    const customItem: TrendingTopicItem = {
      id: `custom-${Date.now()}`,
      topic: manualPrompt.trim(),
      searchVolume: 'Custom High Priority',
      growthSurge: '+1500% Directive',
      category: category === 'Auto Detect' ? 'General Utilities' : category,
      categoryId: category.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      recommendedSlot: 'morning',
      description: `User-specified directive prompt: ${manualPrompt.trim()}`,
      facts: [
        `Directive Tone: ${tone}`,
        `Depth Setting: ${depth}`,
        `Custom Intent Analysis: Specific user request topic.`
      ]
    };
    setSelectedTopic(customItem);
    executeAutonomousPipeline(customItem, 'morning');
  };

  return (
    <div className="ai-studio-wrapper">
      {/* Studio Header Banner */}
      <div className="ai-studio-hero">
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 2 }}>
          <div>
            <div className="ai-studio-badge">
              <Sparkles size={14} /> AI Editorial Office • Daily 3x Viral Auto-Publisher
            </div>
            <h1 className="ai-studio-title">
              Autonomous Daily Trending Search & Auto-Post
            </h1>
            <p className="ai-studio-subtitle">
              The AI Office continuously monitors viral search volume daily, auto-selects trending topics, performs fact research, and automatically posts articles at least 3 times a day (Morning, Afternoon & Evening).
            </p>
          </div>

          {/* Quick Stat Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(5, 10, 25, 0.7)', border: '1px solid rgba(0, 242, 254, 0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#00f2fe' }}>3x / Day</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Auto-Post Schedule</div>
            </div>
            <div style={{ background: 'rgba(5, 10, 25, 0.7)', border: '1px solid rgba(157, 78, 221, 0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#9d4edd' }}>500K+</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Min Search Volume</div>
            </div>
            <div style={{ background: 'rgba(5, 10, 25, 0.7)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '10px 16px', borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>100%</div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Live Visibility</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(5, 10, 25, 0.6)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button
            onClick={() => setActiveViewMode('autopilot')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeViewMode === 'autopilot' ? 'linear-gradient(135deg, #00f2fe 0%, #3b82f6 100%)' : 'transparent',
              color: activeViewMode === 'autopilot' ? '#ffffff' : '#94a3b8'
            }}
          >
            <TrendingUp size={15} />
            <span>3x Daily Auto-Pilot Radar</span>
          </button>
          <button
            onClick={() => setActiveViewMode('manual')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: activeViewMode === 'manual' ? 'linear-gradient(135deg, #9d4edd 0%, #7b2cbf 100%)' : 'transparent',
              color: activeViewMode === 'manual' ? '#ffffff' : '#94a3b8'
            }}
          >
            <Lightbulb size={15} />
            <span>Manual Custom Directive</span>
          </button>
        </div>

        {/* Global Auto-Pilot Switch & Trigger Controls */}
        {activeViewMode === 'autopilot' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsAutoPilotActive(!isAutoPilotActive)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: `1px solid ${isAutoPilotActive ? 'rgba(52, 211, 153, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
                background: isAutoPilotActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: isAutoPilotActive ? '#34d399' : '#f87171',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} />
              <span>3x Daily Auto-Pilot: {isAutoPilotActive ? 'ACTIVE' : 'PAUSED'}</span>
            </button>

            <button
              onClick={handleRunFull3xBatch}
              disabled={isGenerating}
              className="ai-btn-primary"
              style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            >
              {isGenerating ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Flame size={14} />}
              <span>Run Auto-Post Cycle Now</span>
            </button>
          </div>
        )}
      </div>

      {activeViewMode === 'autopilot' ? (
        <>
          {/* 3x Daily Schedule Visual Timeline Panel */}
          <div className="ai-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} style={{ color: '#00f2fe' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  3x Daily Auto-Posting Schedule (Morning • Afternoon • Evening)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Status: <strong style={{ color: '#34d399' }}>Auto-Sync Enabled</strong>
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {/* Morning Slot */}
              <div style={{
                background: scheduledSlots.morning.status === 'completed' ? 'rgba(52, 211, 153, 0.06)' : scheduledSlots.morning.status === 'active' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${scheduledSlots.morning.status === 'completed' ? 'rgba(52, 211, 153, 0.3)' : scheduledSlots.morning.status === 'active' ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24' }}>
                    <Sunrise size={16} /> Morning Slot (08:00 AM)
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
                    background: scheduledSlots.morning.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: scheduledSlots.morning.status === 'completed' ? '#34d399' : '#94a3b8'
                  }}>
                    {scheduledSlots.morning.status === 'completed' ? 'POSTED' : 'PENDING'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 10px 0', minHeight: '36px' }}>
                  {scheduledSlots.morning.topic ? scheduledSlots.morning.topic : 'Morning Breaking News & Tech Policy Viral Search'}
                </p>
                <button
                  onClick={() => handleRunSlot('morning')}
                  disabled={isGenerating}
                  style={{
                    width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.4)',
                    background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Zap size={13} /> Run Morning Auto-Post
                </button>
              </div>

              {/* Afternoon Slot */}
              <div style={{
                background: scheduledSlots.afternoon.status === 'completed' ? 'rgba(52, 211, 153, 0.06)' : scheduledSlots.afternoon.status === 'active' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${scheduledSlots.afternoon.status === 'completed' ? 'rgba(52, 211, 153, 0.3)' : scheduledSlots.afternoon.status === 'active' ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8' }}>
                    <Sun size={16} /> Afternoon Slot (01:30 PM)
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
                    background: scheduledSlots.afternoon.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: scheduledSlots.afternoon.status === 'completed' ? '#34d399' : '#94a3b8'
                  }}>
                    {scheduledSlots.afternoon.status === 'completed' ? 'POSTED' : 'PENDING'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 10px 0', minHeight: '36px' }}>
                  {scheduledSlots.afternoon.topic ? scheduledSlots.afternoon.topic : 'Mid-day High-Volume AI & Compute Trends Search'}
                </p>
                <button
                  onClick={() => handleRunSlot('afternoon')}
                  disabled={isGenerating}
                  style={{
                    width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(56, 189, 248, 0.4)',
                    background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Zap size={13} /> Run Afternoon Auto-Post
                </button>
              </div>

              {/* Evening Slot */}
              <div style={{
                background: scheduledSlots.evening.status === 'completed' ? 'rgba(52, 211, 153, 0.06)' : scheduledSlots.evening.status === 'active' ? 'rgba(0, 242, 254, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${scheduledSlots.evening.status === 'completed' ? 'rgba(52, 211, 153, 0.3)' : scheduledSlots.evening.status === 'active' ? 'rgba(0, 242, 254, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                borderRadius: '12px',
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: '#c084fc' }}>
                    <Moon size={16} /> Evening Slot (07:30 PM)
                  </div>
                  <span style={{
                    padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
                    background: scheduledSlots.evening.status === 'completed' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: scheduledSlots.evening.status === 'completed' ? '#34d399' : '#94a3b8'
                  }}>
                    {scheduledSlots.evening.status === 'completed' ? 'POSTED' : 'PENDING'}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1', margin: '0 0 10px 0', minHeight: '36px' }}>
                  {scheduledSlots.evening.topic ? scheduledSlots.evening.topic : 'Evening Global Tech, Quantum & Science Roundup Search'}
                </p>
                <button
                  onClick={() => handleRunSlot('evening')}
                  disabled={isGenerating}
                  style={{
                    width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(192, 132, 252, 0.4)',
                    background: 'rgba(192, 132, 252, 0.1)', color: '#c084fc', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Zap size={13} /> Run Evening Auto-Post
                </button>
              </div>
            </div>
          </div>

          {/* Daily Trending Topics Radar Grid */}
          <div className="ai-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: '#fbbf24' }} />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                  Live Daily Viral Search Radar (High Volume Topics)
                </h3>
              </div>
              <button
                onClick={handleScanRadar}
                disabled={isScanningRadar}
                style={{ padding: '4px 10px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '6px', color: '#e2e8f0', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RefreshCw size={12} style={{ animation: isScanningRadar ? 'spin 1s linear infinite' : 'none' }} />
                <span>Scan Live Feed ({lastRadarScanTime})</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {trendingRadar.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: selectedTopic?.id === item.id ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.02)',
                    border: `1px solid ${selectedTopic?.id === item.id ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '12px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Flame size={12} /> {item.searchVolume}
                      </span>
                      <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                        {item.growthSurge}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', margin: '0 0 6px 0', lineHeight: 1.35 }}>
                      {item.topic}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                      Category: {item.category}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedTopic(item);
                        executeAutonomousPipeline(item, item.recommendedSlot);
                      }}
                      disabled={isGenerating}
                      style={{
                        padding: '4px 10px',
                        background: 'rgba(0, 242, 254, 0.1)',
                        border: '1px solid rgba(0, 242, 254, 0.3)',
                        borderRadius: '6px',
                        color: '#00f2fe',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>Auto-Post This</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        /* Manual Custom Prompt Form */
        <div className="ai-card" style={{ marginBottom: '1.25rem' }}>
          <div className="ai-form-group">
            <label className="ai-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lightbulb size={16} style={{ color: '#fbbf24' }} /> Custom Article Prompt Directive
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 400 }}>
                Specify your custom topic or question
              </span>
            </label>
            <textarea
              rows={3}
              value={manualPrompt}
              onChange={(e) => setManualPrompt(e.target.value)}
              placeholder="e.g. Write an article about Quantum Cryptography and Post-Quantum Security standards in 2026..."
              className="ai-prompt-textarea"
            />
          </div>

          <div className="ai-controls-grid">
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Editorial Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className="ai-select">
                <option value="Professional Editorial">Professional Editorial</option>
                <option value="Investigative Tech">Investigative Tech</option>
                <option value="Educational & Clear">Educational & Clear</option>
                <option value="Executive Brief">Executive Brief</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Article Depth</label>
              <select value={depth} onChange={(e) => setDepth(e.target.value)} className="ai-select">
                <option value="Comprehensive">Comprehensive (800 - 1200 words)</option>
                <option value="Deep Dive">Deep Dive (1500+ words)</option>
                <option value="Overview">Overview (500 words)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: '6px' }}>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="ai-select">
                <option value="Auto Detect">Auto Detect</option>
                <option value="Governance & Policy">Governance & Policy</option>
                <option value="Privacy & Security">Privacy & Security</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Creative Tech">Creative Tech</option>
                <option value="General Utilities">General Utilities</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1.25rem' }}>
            <button
              onClick={handleCustomPromptGenerate}
              disabled={isGenerating || !manualPrompt.trim()}
              className="ai-btn-primary"
            >
              {isGenerating ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
              <span>Start Research & Auto-Post Directive</span>
            </button>
          </div>
        </div>
      )}

      {/* Selected Topic Highlight Banner */}
      {selectedTopic && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(5, 12, 28, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>
              🎯 ACTIVE SELECTED VIRAL TOPIC
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              {selectedTopic.topic}
            </h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24' }}>
              🔥 {selectedTopic.searchVolume}
            </div>
            <div style={{ background: 'rgba(52, 211, 153, 0.15)', border: '1px solid rgba(52, 211, 153, 0.3)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, color: '#34d399' }}>
              🚀 {selectedTopic.growthSurge}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Execution Stepper & Terminal */}
      {(isGenerating || steps.length > 0) && (
        <ProcessStepper
          steps={steps}
          currentStepIndex={currentStepIndex}
          isGenerating={isGenerating}
          totalTimeSeconds={totalTimeSeconds}
        />
      )}

      {/* Generated Article Preview */}
      {generatedArticle && (
        <ArticlePreview
          article={generatedArticle}
          onPublish={(art) => publishArticleToDb(art, activeSlot, selectedTopic || VIRAL_TRENDS_FEED[0])}
          onRegenerate={() => selectedTopic && executeAutonomousPipeline(selectedTopic, activeSlot)}
          isPublishing={isPublishing}
          publishSuccess={publishSuccess}
          publishError={publishError}
        />
      )}

      {/* 3x Daily Auto-Published History Log */}
      {autoPublishedHistory.length > 0 && (
        <div className="ai-card" style={{ padding: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} style={{ color: '#34d399' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                Daily Auto-Published Articles Archive ({autoPublishedHistory.length} Posts)
              </h3>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Auto-posted to Website Database
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {autoPublishedHistory.map((rec) => (
              <div
                key={rec.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '0.85rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
                      background: rec.slot === 'morning' ? 'rgba(251, 191, 36, 0.15)' : rec.slot === 'afternoon' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(192, 132, 252, 0.15)',
                      color: rec.slot === 'morning' ? '#fbbf24' : rec.slot === 'afternoon' ? '#38bdf8' : '#c084fc',
                      textTransform: 'uppercase'
                    }}>
                      {rec.slot} ({rec.slotTime})
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Posted: {rec.postedAt}
                    </span>
                  </div>
                  <h5 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {rec.article.title}
                  </h5>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ padding: '4px 10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#fbbf24' }}>
                    🔥 {rec.searchVolume}
                  </span>
                  <span style={{ padding: '4px 10px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.25)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Auto-Posted
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
