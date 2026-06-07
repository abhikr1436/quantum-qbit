import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sparkles, Briefcase, RefreshCw, Terminal, Trash2, 
  ShieldCheck, Play, TrendingUp, LayoutGrid, Users, 
  Settings, Search, Globe, Clock, ShieldAlert, MessageSquare
} from 'lucide-react';
import { Boardroom } from './Boardroom';
import { KanbanBoard } from './KanbanBoard';
import { SeoDashboard } from './SeoDashboard';
import { OrgChart } from './OrgChart';
import { AiSettings } from './AiSettings';
import { WorkspaceChat } from './WorkspaceChat';

interface OfficeConfig {
  websitePath: string;
  isAutomationActive: boolean;
  lastRunTimestamp?: string | null;
  lastBrainstormTimestamp?: string | null;
  deepseekKey?: string;
  githubToken?: string;
}

interface SystemLog {
  timestamp: string;
  agent: string;
  message: string;
}

interface Agent {
  name: string;
  role: string;
  avatar: string;
  bio: string;
  status: string;
}

interface OfficeTask {
  id: string;
  title: string;
  description: string;
  type: string;
  assignee: string;
  status: string;
  draftContent: any;
  reviews: any[];
  createdAt: string;
  updatedAt: string;
}

interface TrendItem {
  title: string;
  traffic: string;
  trafficNumeric: number;
  pubDate: string;
  pubDateIso: string;
  hoursSinceStart: number;
  growthScore: number;
  newsTitle: string;
  newsUrl: string;
  picture: string;
}

interface AiOfficeTabProps {
  isLocalMode?: boolean;
}

export const AiOfficeTab: React.FC<AiOfficeTabProps> = ({ isLocalMode = false }) => {
  // Navigation & Sub-Tabs state
  const [subTab, setSubTab] = useState<'console' | 'boardroom' | 'trends' | 'tasks' | 'seo' | 'org' | 'settings' | 'chat'>('console');
  
  // Database State
  const [config, setConfig] = useState<OfficeConfig | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<OfficeTask[]>([]);
  const [chatLogs, setChatLogs] = useState<any[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  
  // Terminal logs state (Console tab)
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('System Ready');
  const [statusColor, setStatusColor] = useState('rgba(255,255,255,0.7)');

  // Trends Explorer State
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsRegion, setTrendsRegion] = useState<'IN' | 'US'>('IN');
  const [trendsSearch, setTrendsSearch] = useState('');
  const [trendsTimeFilter, setTrendsTimeFilter] = useState<'all' | '4h' | '12h' | 'today' | 'yesterday'>('all');
  const [trendsSortBy, setTrendsSortBy] = useState<'growth' | 'volume' | 'time'>('growth');

  // Boardroom workflow states
  const [preFilledDirective, setPreFilledDirective] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll terminal container
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  // Load configuration & DB
  const fetchDashboardData = useCallback(async () => {
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          setConfig(parsed.config || null);
          setAgents(parsed.agents || []);
          setTasks(parsed.tasks || []);
          setChatLogs(parsed.chatLogs || []);
          setSystemLogs(parsed.systemLogs || []);
        } catch {
          // skip
        }
      } else {
        const defaultDB = {
          config: { websitePath: '.', isAutomationActive: true, lastRunTimestamp: new Date().toISOString() },
          agents: [
            { name: 'Sophia', role: 'CEO', avatar: '💼', bio: 'Visionary executive who makes final approvals on business objectives, web deployments, and articles. Ensures everything matches the high standards of Quantum Qbit.', status: 'Idle' },
            { name: 'Alex', role: 'Manager', avatar: '📋', bio: 'Coordinates task flows, parses board directives, assigns work to specialists, reviews drafts, and prepares reports for Sophia.', status: 'Idle' },
            { name: 'Mark', role: 'Marketing', avatar: '✍️', bio: 'Specializes in keyword optimization, content writing, SEO research, and drafting educational technical blogs.', status: 'Idle' },
            { name: 'Sarah', role: 'Social Media', avatar: '🐦', bio: 'Maintains company social media channels. Creates promotions, Twitter threads, LinkedIn summaries, and monitors online traffic.', status: 'Idle' },
            { name: 'Codey', role: 'IT Developer', avatar: '💻', bio: 'Full-stack coder. Inspects target page elements, updates components, and develops new utilities for local-first browsers.', status: 'Idle' },
            { name: 'Deployer', role: 'DevOps', avatar: '🚀', bio: 'Monitors build health, verifies code formats, compiles outputs, and pushes approved articles/code changes to website directories.', status: 'Idle' },
            { name: 'Harper', role: 'HR', avatar: '🤝', bio: 'Handles personnel details, team cohesion, drafts job postings, and aligns core values.', status: 'Idle' }
          ],
          tasks: [],
          chatLogs: [],
          systemLogs: []
        };
        localStorage.setItem('quantum_office_db', JSON.stringify(defaultDB));
        setConfig(defaultDB.config);
        setAgents(defaultDB.agents);
        setTasks([]);
        setChatLogs([]);
        setSystemLogs([]);
      }
      return;
    }

    try {
      const res = await fetch('/api/ai_office.php?action=dashboard');
      if (res.ok) {
        const data = await res.json();
        setConfig(data.config || null);
        setAgents(data.agents || []);
        setTasks(data.tasks || []);
        setChatLogs(data.chatLogs || []);
        setSystemLogs(data.systemLogs || []);
      }
    } catch (e) {
      console.error("Failed to load dashboard data", e);
    }
  }, [isLocalMode]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  // Fetch Google Trends RSS JSON via PHP backend (or mock locally)
  const fetchTrends = useCallback(async () => {
    setTrendsLoading(true);
    if (isLocalMode) {
      setTimeout(() => {
        const mockData: TrendItem[] = [
          {
            title: 'UPSSSC Lower PCS Graduate Level 2026',
            traffic: '500K+',
            trafficNumeric: 500000,
            pubDate: new Date(Date.now() - 2 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 2 * 3600000).toISOString(),
            hoursSinceStart: 2,
            growthScore: 166667,
            newsTitle: 'UPSSSC Combined Lower Subordinate Services Notification out for 2285 Posts',
            newsUrl: 'https://upsssc.gov.in',
            picture: ''
          },
          {
            title: 'ISRO TA Recruitment CS Syllabus',
            traffic: '100K+',
            trafficNumeric: 100000,
            pubDate: new Date(Date.now() - 1 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 1 * 3600000).toISOString(),
            hoursSinceStart: 1,
            growthScore: 50000,
            newsTitle: 'ISRO releases syllabus for Technical Assistant Computer Science PYQ CBT Exam',
            newsUrl: 'https://www.isro.gov.in',
            picture: ''
          },
          {
            title: 'Aadhaar Masking PDF Download',
            traffic: '100K+',
            trafficNumeric: 100000,
            pubDate: new Date(Date.now() - 5 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 5 * 3600000).toISOString(),
            hoursSinceStart: 5,
            growthScore: 16667,
            newsTitle: 'UIDAI issues guidelines on downloading masked Aadhaar for privacy',
            newsUrl: 'https://uidai.gov.in',
            picture: ''
          },
          {
            title: 'IBPS RRB Clerk Online Form',
            traffic: '200K+',
            trafficNumeric: 200000,
            pubDate: new Date(Date.now() - 12 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 12 * 3600000).toISOString(),
            hoursSinceStart: 12,
            growthScore: 15385,
            newsTitle: 'IBPS RRB Clerk and PO vacancies announced, apply online now',
            newsUrl: 'https://ibps.in',
            picture: ''
          },
          {
            title: 'Deepseek V3 API Launch',
            traffic: '50K+',
            trafficNumeric: 50000,
            pubDate: new Date(Date.now() - 3 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 3 * 3600000).toISOString(),
            hoursSinceStart: 3,
            growthScore: 12500,
            newsTitle: 'Deepseek launches its powerful new coder models globally',
            newsUrl: 'https://deepseek.com',
            picture: ''
          },
          {
            title: 'WWDC 2026 Apple Intelligence',
            traffic: '500K+',
            trafficNumeric: 500000,
            pubDate: new Date(Date.now() - 3 * 3600000).toUTCString(),
            pubDateIso: new Date(Date.now() - 3 * 3600000).toISOString(),
            hoursSinceStart: 3,
            growthScore: 125000,
            newsTitle: 'Apple announces major updates to its local client-side processing core',
            newsUrl: 'https://apple.com',
            picture: ''
          }
        ];
        // Filter mock data by geo region
        if (trendsRegion === 'IN') {
          setTrends(mockData.slice(0, 5));
        } else {
          setTrends(mockData.slice(5));
        }
        setTrendsLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch(`/api/ai_office.php?action=get_live_trends&geo=${trendsRegion}`);
      if (res.ok) {
        const data = await res.json();
        setTrends(data || []);
      }
    } catch (e) {
      console.error("Failed to load trends from RSS api", e);
    } finally {
      setTrendsLoading(false);
    }
  }, [trendsRegion, isLocalMode]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  // Helper to add terminal logs locally
  const addLog = (message: string, agent: string = 'System') => {
    const time = new Date().toLocaleTimeString();
    const formatted = `[${time}] [${agent.toUpperCase()}] ${message}`;
    setTerminalLogs(prev => [...prev, formatted]);
  };

  // Local simulated blog publisher
  const publishBlogLocally = (title: string, isJob: boolean) => {
    const localBlogsStr = localStorage.getItem('quantum_blogs');
    let blogs = [];
    if (localBlogsStr) {
      try {
        blogs = JSON.parse(localBlogsStr);
      } catch {
        // skip
      }
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
    const category = isJob ? 'General Utilities' : 'Privacy & Security';
    const categoryId = isJob ? 'general-utilities' : 'privacy-security';
    const imageGlow = isJob ? 'rgba(157, 78, 221, 0.15)' : 'rgba(0, 242, 254, 0.15)';
    const excerpt = isJob 
      ? `Latest recruitment notification for ${title}. Apply online, check eligibility, age limit, selection criteria, important dates and fees.`
      : `Detailed analytical guide exploring ${title}. Learn how client-side computing enhances speed and user data safety.`;

    const content = isJob ? `<h2>${title} Notification</h2>
<p>Here are the complete notification details, important dates, and eligibility criteria for ${title}. Candidates can apply online through the official portal before the deadline. Make sure to prepare your documents and compress photo/signature files to correct upload size using browser-only local compression tools before submitting the form.</p>
<table class="job-details-table">
  <tr>
    <td colspan="2" class="table-header-main">
      <h2>Uttar Pradesh Subordinate Service Selection Commission (UPSSSC)</h2>
      <h3>UPSSSC Lower PCS (Graduate Level) Recruitment 2026</h3>
      <div class="highlight-cyan" style="text-align: center;">Advt No. 07-Exam/2026 : Short Details of Notification</div>
    </td>
  </tr>
  <tr>
    <td>
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Important Dates</div>
      <ul>
        <li>Application Begin : <span class="highlight-green">29/05/2026</span></li>
        <li>Last Date for Apply Online : <span class="highlight-red">18/06/2026</span></li>
        <li>Last Date Pay Exam Fee : <span class="highlight-red">18/06/2026</span></li>
        <li>Correction Last Date : <span class="highlight-cyan">25/06/2026</span></li>
        <li>Exam Date : <span class="highlight-cyan">As Per Schedule</span></li>
      </ul>
    </td>
    <td>
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Application Fee</div>
      <ul>
        <li>General / OBC / EWS : <span class="highlight-green">25/-</span></li>
        <li>SC / ST : <span class="highlight-green">25/-</span></li>
        <li>PH (Divyang) : <span class="highlight-green">25/-</span></li>
        <li>Payment Mode : Online Debit/Credit Card, Net Banking</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Age Limit as on 01/07/2026</div>
      <ul>
        <li>Minimum Age : <strong>18 Years</strong></li>
        <li>Maximum Age : <strong>40 Years</strong></li>
        <li>Age Relaxation Extra as per UPSSSC Lower PCS Recruitment Rules.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Vacancy Details &amp; Eligibility (Total : 2285 Posts)</div>
      <ul>
        <li><strong>Post Name:</strong> Combined Lower Subordinate (Lower PCS)</li>
        <li><strong>Total Post:</strong> 2285</li>
        <li><strong>Eligibility:</strong> Bachelor Degree in Any Stream from Any Recognized University. For Executive Officer, Graduation with 'O' Level is required.</li>
      </ul>
    </td>
  </tr>
</table>` : `<h2>Understanding ${title}</h2>
<p>In standard web applications, every document upload, picture conversion, or password check is pushed to a remote server. While simple, it exposes sensitive user assets to database vulnerabilities and third-party leaks.</p>
<p>By utilizing modern HTML5 File APIs and client-side scripts, tools like those on <strong>quantumqbit.in</strong> process bytes entirely in the browser memory cache. Photos are modified on canvas, conversions happen locally, and no records ever leak to host registers. It's instant, costs zero bandwidth, and stays 100% private.</p>`;

    const newBlog = {
      id: slug,
      title: title,
      excerpt: excerpt,
      content: content,
      author: 'Quantum AI Writer (Simulated)',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + new Date().toTimeString().split(' ')[0],
      readTime: "4 min read",
      category: category,
      category_id: categoryId,
      imageGlow: imageGlow,
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    blogs.unshift(newBlog);
    localStorage.setItem('quantum_blogs', JSON.stringify(blogs));
  };

  // Local simulated execution state machine
  const executeLocalSimulation = (type: 'trends' | 'jobs') => {
    setIsRunning(true);
    setActiveTask(type === 'trends' ? 'Trending Content Campaign' : 'Job Vacancy Poster');
    setStatusMessage(type === 'trends' ? 'Researching Google Trends...' : 'Checking Government Portals...');
    setStatusColor('var(--primary, #00f2fe)');
    setTerminalLogs([]);

    const steps = type === 'trends' ? [
      { text: 'Initiating local simulation for Google Trends content campaign...', agent: 'System', delay: 1000 },
      { text: 'Querying Google Trends Daily RSS for region: India (IN)...', agent: 'Mark', delay: 1200 },
      { text: 'Found Google Trends query: "UPSSSC Lower PCS Graduate Level 2026" (Growth score: 166,667 searches/hour)', agent: 'Mark', delay: 1500 },
      { text: 'Selecting highest growth rate topic: "UPSSSC Lower PCS Graduate Level Recruitment 2026"', agent: 'Mark', delay: 1200 },
      { text: 'Alex (Manager) parsed search context and formulated writer directive.', agent: 'Alex', delay: 1000 },
      { text: 'Drafting structured HTML blog post with trending context and quantumqbit.in tool highlights...', agent: 'Mark', delay: 2000 },
      { text: 'Content draft complete. Excerpt generated: "Apply online for UPSSSC Lower PCS Advt No 07-Exam/2026..."', agent: 'Mark', delay: 1000 },
      { text: 'Sophia (CEO) performed quality audit. Draft meets 600-word criteria. Approved.', agent: 'Sophia', delay: 1200 },
      { text: 'Deployer (DevOps) compiled project builds and verified index files.', agent: 'Deployer', delay: 1500 },
      { text: 'Deploying article locally and updating index logs...', agent: 'Deployer', delay: 1000 },
      { text: 'Success! Trending article "UPSSSC Lower PCS Graduate Level Recruitment 2026" is now published.', agent: 'System', delay: 500 }
    ] : [
      { text: 'Initiating local simulation for Job Vacancy publisher...', agent: 'System', delay: 1000 },
      { text: 'Querying Sarkari Result and Government recruitment notifications...', agent: 'Mark', delay: 1500 },
      { text: 'Found active job posting: "UPSSSC Combined Lower Subordinate Services Graduate Level (2285 Posts)"', agent: 'Mark', delay: 1200 },
      { text: 'Extracting key details: Important dates, fee structures, age limit, and eligibility criteria...', agent: 'Mark', delay: 1800 },
      { text: 'Alex (Manager) validated details formatting request.', agent: 'Alex', delay: 1000 },
      { text: 'Formulating structured details HTML table with class "job-details-table" and highlighting CSS rules...', agent: 'Mark', delay: 2000 },
      { text: 'Drafting post text complete. Table structure validation passed.', agent: 'Mark', delay: 1000 },
      { text: 'Sophia (CEO) approved publication of Sarkari Result structured job article.', agent: 'Sophia', delay: 1200 },
      { text: 'Deployer (DevOps) staging files and compiling index.js...', agent: 'Deployer', delay: 1500 },
      { text: 'Writing details table to local database fallback...', agent: 'Deployer', delay: 1000 },
      { text: 'Success! Job Vacancy table for "UPSSSC Lower PCS Graduate Level 2285 Posts" is now published.', agent: 'System', delay: 500 }
    ];

    let currentStep = 0;

    const runNextStep = () => {
      if (currentStep >= steps.length) {
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Campaign Complete');
        setStatusColor('#10b981');
        
        // Actually publish the post
        const title = type === 'trends' 
          ? 'UPSSSC Lower PCS Graduate Level Recruitment 2026' 
          : 'UPSSSC Lower PCS Graduate Level 2285 Posts Job Vacancy';
        publishBlogLocally(title, type === 'jobs');
        
        const localDBStr = localStorage.getItem('quantum_office_db');
        if (localDBStr) {
          try {
            const db = JSON.parse(localDBStr);
            db.config.lastRunTimestamp = new Date().toISOString();
            localStorage.setItem('quantum_office_db', JSON.stringify(db));
            setConfig(db.config);
          } catch {
            // skip
          }
        }
        fetchDashboardData();
        return;
      }

      const step = steps[currentStep];
      setTimeout(() => {
        addLog(step.text, step.agent);
        currentStep++;
        runNextStep();
      }, step.delay);
    };

    runNextStep();
  };

  // Cloud backend trigger
  const triggerBackendAction = async (actionType: 'trigger_trends' | 'trigger_jobs') => {
    setIsRunning(true);
    setActiveTask(actionType === 'trigger_trends' ? 'Trending Content Campaign (Cloud)' : 'Job Vacancy Poster (Cloud)');
    setStatusMessage('Dispatching Cloud Runner...');
    setStatusColor('var(--secondary, #9d4ede)');
    setTerminalLogs([]);

    addLog(`Sending trigger dispatch request to backend API: /api/ai_office.php?action=${actionType}...`, 'System');

    try {
      const response = await fetch(`/api/ai_office.php?action=${actionType}`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        addLog(`Backend Response: ${data.message || 'Trigger successful.'}`, 'System');
        addLog('Connecting to cloud logs database... Polling in progress.', 'System');
        setStatusMessage('Cloud Execution Active (Polling)...');
        
        // Start polling the server logs
        startPollingLogs();
      } else {
        const err = await response.json();
        addLog(`Error: ${err.error || 'Backend failed to trigger cycle.'}`, 'System');
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Error Occurred');
        setStatusColor('#ef4444');
      }
    } catch (e) {
      addLog(`Network Error: ${e instanceof Error ? e.message : 'Connection failed.'}`, 'System');
      setIsRunning(false);
      setActiveTask(null);
      setStatusMessage('Network Error');
      setStatusColor('#ef4444');
    }
  };

  // Poll system logs from backend during cloud execution
  const startPollingLogs = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    let pollCount = 0;
    const poll = async () => {
      pollCount++;
      try {
        const res = await fetch('/api/ai_office.php?action=dashboard');
        if (res.ok) {
          const data = await res.json();
          if (data.systemLogs && Array.isArray(data.systemLogs)) {
            const formattedLogs = data.systemLogs.map((log: SystemLog) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              return `[${time}] [${log.agent.toUpperCase()}] ${log.message}`;
            });
            setTerminalLogs(formattedLogs);
          }
          
          const allLogs: SystemLog[] = data.systemLogs || [];
          const runnerDone = allLogs.some((l: SystemLog) => 
            l.message && l.message.includes('Runner completed all cycle steps')
          );
          
          const tasksList: Array<{ status: string }> = data.tasks || [];
          const allTasksDone = tasksList.length > 0 && tasksList.every((t: { status: string }) => t.status === 'completed');
          
          if ((runnerDone || allTasksDone) && pollCount > 3) {
            setIsRunning(false);
            setActiveTask(null);
            setStatusMessage('Cloud Campaign Complete ✓');
            setStatusColor('#10b981');
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            fetchDashboardData();
            return;
          }
        }
      } catch (e) {
        console.error("Polling logs error", e);
      }
      
      if (pollCount > 150) {
        setIsRunning(false);
        setActiveTask(null);
        setStatusMessage('Polling Timed Out — Check logs for last known status');
        setStatusColor('#f59e0b');
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    };
    
    poll();
    pollIntervalRef.current = setInterval(poll, 4000);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleAction = (type: 'trends' | 'jobs') => {
    if (isRunning) return;
    if (isLocalMode) {
      executeLocalSimulation(type);
    } else {
      triggerBackendAction(type === 'trends' ? 'trigger_trends' : 'trigger_jobs');
    }
  };

  // Subcomponents Handler wrappers
  const handleSendDirective = async (text: string) => {
    if (isLocalMode) {
      const newTask: OfficeTask = {
        id: 'task-' + Date.now(),
        title: text.length > 30 ? text.slice(0, 30) + '...' : text,
        description: text,
        type: 'blog',
        assignee: 'Mark',
        status: 'todo',
        draftContent: null,
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        const parsed = JSON.parse(local);
        parsed.tasks.push(newTask);
        parsed.systemLogs.push({
          timestamp: new Date().toISOString(),
          agent: 'Alex',
          message: `Board directive received. Created task "${newTask.title}".`
        });
        localStorage.setItem('quantum_office_db', JSON.stringify(parsed));
      }
      fetchDashboardData();
      return;
    }

    const res = await fetch('/api/ai_office.php?action=boardroom_submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ directive: text })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit directive');
    }
    setPreFilledDirective('');
    fetchDashboardData();
  };

  const handleTriggerAgentLoop = async () => {
    if (isLocalMode) {
      // Pick first todo task and complete it
      const todo = tasks.find(t => t.status === 'todo');
      if (todo) {
        handleUpdateTaskStatus(todo.id, 'completed');
      }
      return;
    }

    const res = await fetch('/api/ai_office.php?action=trigger_cycle', { method: 'POST' });
    if (res.ok) {
      setIsRunning(true);
      setStatusMessage('Cloud Running Execution...');
      startPollingLogs();
    } else {
      const err = await res.json();
      alert(`Error triggering loop: ${err.error}`);
    }
  };

  const handleUpdateTaskStatus = async (id: string, newStatus: string) => {
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        const parsed = JSON.parse(local);
        const task = parsed.tasks.find((t: any) => t.id === id);
        if (task) {
          task.status = newStatus;
          task.updatedAt = new Date().toISOString();
          if (newStatus === 'completed') {
            publishBlogLocally(task.title, task.title.toLowerCase().includes('job'));
          }
          localStorage.setItem('quantum_office_db', JSON.stringify(parsed));
        }
      }
      fetchDashboardData();
      return;
    }

    const res = await fetch('/api/ai_office.php?action=update_task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
    if (res.ok) {
      fetchDashboardData();
    }
  };

  const handleUpdateConfig = async (newConfig: any) => {
    if (isLocalMode) {
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        const parsed = JSON.parse(local);
        parsed.config = { ...parsed.config, ...newConfig };
        localStorage.setItem('quantum_office_db', JSON.stringify(parsed));
      }
      fetchDashboardData();
      return;
    }

    const res = await fetch('/api/ai_office.php?action=save_config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfig)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save configuration');
    }
    fetchDashboardData();
  };

  const handleSendMessage = async (text: string) => {
    if (isLocalMode) {
      const newMsg = {
        id: 'msg-' + Date.now(),
        sender: 'Board',
        text,
        timestamp: new Date().toISOString()
      };
      const local = localStorage.getItem('quantum_office_db');
      if (local) {
        const parsed = JSON.parse(local);
        parsed.chatLogs.push(newMsg);
        localStorage.setItem('quantum_office_db', JSON.stringify(parsed));
      }
      fetchDashboardData();
      return;
    }

    await fetch('/api/ai_office.php?action=chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender: 'Board', text })
    });
    fetchDashboardData();
  };

  const handleTriggerSeoAudit = async () => {
    if (isLocalMode) {
      return {
        score: 95,
        blogsCount: tasks.filter(t => t.status === 'completed').length + 3,
        issues: [
          { severity: 'medium', type: 'Alt Tags Check', desc: 'Some images in local dev templates missing alt description.' }
        ] as any
      };
    }
    const res = await fetch('/api/ai_office.php?action=seo_audit');
    if (res.ok) {
      return await res.json();
    }
    throw new Error('Failed to run audit');
  };

  const handleViewTask = (id: string) => {
    setSelectedTaskId(id);
    setSubTab('tasks');
  };

  const handleClearSelectedTaskId = () => {
    setSelectedTaskId(null);
  };

  // Launch a directive campaign for a selected trend in one click
  const handleLaunchCampaign = (trendTitle: string, traffic: string) => {
    const brief = `Write an in-depth article about the trending topic: "${trendTitle}" (Search Volume: ${traffic}). State why it is trending, cover details of the news, and naturally highlight how quantumqbit.in's browser-only processing utilities solve a related problem locally.`;
    setPreFilledDirective(brief);
    setSubTab('boardroom');
  };

  // Google Trends RSS Explorer filter/sort logic
  const getFilteredTrends = () => {
    let result = [...trends];

    // 1. Search filter
    if (trendsSearch.trim()) {
      const query = trendsSearch.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        (t.newsTitle && t.newsTitle.toLowerCase().includes(query))
      );
    }

    // 2. Started time filter
    if (trendsTimeFilter !== 'all') {
      result = result.filter(t => {
        const hrs = t.hoursSinceStart;
        if (trendsTimeFilter === '4h') return hrs <= 4;
        if (trendsTimeFilter === '12h') return hrs <= 12;
        if (trendsTimeFilter === 'today') return hrs <= 24;
        if (trendsTimeFilter === 'yesterday') return hrs > 24 && hrs <= 48;
        return true;
      });
    }

    // 3. Sorting logic
    result.sort((a, b) => {
      if (trendsSortBy === 'growth') {
        return b.growthScore - a.growthScore;
      }
      if (trendsSortBy === 'volume') {
        return b.trafficNumeric - a.trafficNumeric;
      }
      if (trendsSortBy === 'time') {
        return a.hoursSinceStart - b.hoursSinceStart; // smaller hours first (more recent)
      }
      return 0;
    });

    return result;
  };

  const filteredTrends = getFilteredTrends();

  // RENDER THE ACTIVE SUB-TAB INTERFACE
  const renderSubTabContent = () => {
    switch (subTab) {
      case 'console':
        return (
          <div style={styles.consoleGrid}>
            <div style={styles.actionGrid}>
              {/* Button 1: Trends */}
              <button 
                className="glass-card" 
                style={{ 
                  ...styles.actionButton, 
                  opacity: isRunning ? 0.6 : 1,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  borderColor: activeTask && activeTask.includes('Trending') ? 'var(--primary, #00f2fe)' : 'var(--border-glass)'
                }}
                disabled={isRunning}
                onClick={() => handleAction('trends')}
              >
                <div style={{ ...styles.btnIconContainer, background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.15), transparent)' }}>
                  <Sparkles size={28} style={{ color: 'var(--primary, #00f2fe)' }} />
                </div>
                <div style={styles.btnContent}>
                  <span style={styles.btnLabel}>Check Trends &amp; Publish</span>
                  <span style={styles.btnDesc}>Analyze real-time search volume queries in Google Trends, choose top topics, write guides, and publish content.</span>
                </div>
                <div className="btn-glow-cyan" style={styles.btnPlayGlow}>
                  <Play size={16} style={{ color: '#05070c' }} />
                </div>
              </button>

              {/* Button 2: Jobs */}
              <button 
                className="glass-card" 
                style={{ 
                  ...styles.actionButton, 
                  opacity: isRunning ? 0.6 : 1,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  borderColor: activeTask && activeTask.includes('Job') ? 'var(--secondary, #9d4ede)' : 'var(--border-glass)'
                }}
                disabled={isRunning}
                onClick={() => handleAction('jobs')}
              >
                <div style={{ ...styles.btnIconContainer, background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.15), transparent)' }}>
                  <Briefcase size={28} style={{ color: 'var(--secondary, #9d4ede)' }} />
                </div>
                <div style={styles.btnContent}>
                  <span style={styles.btnLabel}>Check &amp; Post Job Vacancy</span>
                  <span style={styles.btnDesc}>Scrape government or private sector vacancy lists, extract dates and fees, layout Sarkari Result details table, and publish.</span>
                </div>
                <div className="btn-glow-purple" style={styles.btnPlayGlow}>
                  <Play size={16} style={{ color: '#05070c' }} />
                </div>
              </button>
            </div>

            {/* Terminal logs panel */}
            <div className="glass-card" style={styles.terminalCard}>
              <div style={styles.terminalHeader}>
                <div style={styles.terminalHeaderLeft}>
                  <Terminal size={16} style={{ color: 'var(--primary, #00f2fe)' }} />
                  <span style={styles.terminalTitle}>Real-Time Execution Logs</span>
                </div>
                <div style={styles.terminalHeaderRight}>
                  <span style={{ ...styles.consoleStatusText, color: statusColor }}>
                    {isRunning && <RefreshCw size={12} className="spin-animation" style={{ marginRight: '6px' }} />}
                    {statusMessage}
                  </span>
                  <button style={styles.clearBtn} onClick={() => setTerminalLogs([])} title="Clear terminal console">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div ref={terminalBodyRef} style={styles.terminalBody}>
                {terminalLogs.length === 0 ? (
                  <div style={styles.terminalEmpty}>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>Console terminal is empty. Click one of the action campaigns above to trigger execution.</span>
                  </div>
                ) : (
                  terminalLogs.map((log, index) => {
                    let color = 'rgba(255, 255, 255, 0.8)';
                    if (log.includes('[SYSTEM]')) color = 'var(--primary, #00f2fe)';
                    else if (log.includes('[ALEX]')) color = '#f59e0b';
                    else if (log.includes('[MARK]')) color = '#38bdf8';
                    else if (log.includes('[SOPHIA]')) color = '#a78bfa';
                    else if (log.includes('[DEPLOYER]')) color = '#10b981';
                    else if (log.includes('Error') || log.includes('FAILED')) color = '#ef4444';
                    else if (log.includes('Success')) color = '#10b981';

                    return (
                      <div key={index} style={{ ...styles.logLine, color }}>
                        {log}
                      </div>
                    );
                  })
                )}
                {isRunning && (
                  <div style={styles.terminalCursorLine}>
                    <span style={styles.terminalCursor}></span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'boardroom':
        return (
          <Boardroom 
            onSendDirective={handleSendDirective}
            isProcessing={isRunning}
            agents={agents}
            systemLogs={systemLogs}
            tasks={tasks}
            timeLeft={config?.lastRunTimestamp ? 'Updated ' + new Date(config.lastRunTimestamp).toLocaleTimeString() : 'Ready'}
            onTriggerAgentLoop={handleTriggerAgentLoop}
            preFilledText={preFilledDirective}
          />
        );

      case 'trends':
        return (
          <div style={styles.trendsContainer}>
            {/* Explanatory algorithm banner */}
            <div className="glass-card" style={styles.algorithmCard}>
              <div style={styles.algoHeader}>
                <Sparkles size={18} style={{ color: 'var(--primary, #00f2fe)' }} />
                <span>Smart Hot-Rising Algorithm</span>
              </div>
              <p style={styles.algoText}>
                We calculate real-time trends using our Growth Index formula: 
                <strong style={{ color: 'var(--primary, #00f2fe)', fontFamily: 'monospace' }}> Traffic / (Hours Since Start + 1)</strong>. 
                This mathematically highlights topics that started very recently and are surging in search volume, allowing us to publish content before search results saturate.
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className="glass-card" style={styles.toolbarCard}>
              <div style={styles.searchBox}>
                <Search size={16} style={{ color: 'rgba(255,255,255,0.4)', marginLeft: '12px' }} />
                <input
                  type="text"
                  placeholder="Search live trends..."
                  style={styles.searchInput}
                  value={trendsSearch}
                  onChange={(e) => setTrendsSearch(e.target.value)}
                />
              </div>

              {/* Region Selector */}
              <div style={styles.toolbarSelectorGroup}>
                <Globe size={14} style={{ color: 'var(--primary, #00f2fe)' }} />
                <button 
                  style={{ ...styles.toggleButton, backgroundColor: trendsRegion === 'IN' ? 'rgba(0, 242, 254, 0.15)' : 'transparent', color: trendsRegion === 'IN' ? 'var(--primary, #00f2fe)' : '#888' }}
                  onClick={() => setTrendsRegion('IN')}
                >
                  India (IN)
                </button>
                <button 
                  style={{ ...styles.toggleButton, backgroundColor: trendsRegion === 'US' ? 'rgba(0, 242, 254, 0.15)' : 'transparent', color: trendsRegion === 'US' ? 'var(--primary, #00f2fe)' : '#888' }}
                  onClick={() => setTrendsRegion('US')}
                >
                  Global (US)
                </button>
              </div>

              {/* Started Time Filter */}
              <div style={styles.toolbarSelectorGroup}>
                <Clock size={14} style={{ color: 'var(--primary, #00f2fe)' }} />
                <select 
                  style={styles.dropdownSelect} 
                  value={trendsTimeFilter} 
                  onChange={(e: any) => setTrendsTimeFilter(e.target.value)}
                >
                  <option value="all">Any Started Time</option>
                  <option value="4h">Started within 4 hours</option>
                  <option value="12h">Started within 12 hours</option>
                  <option value="today">Started Today (&lt;24h)</option>
                  <option value="yesterday">Started Yesterday (24h-48h)</option>
                </select>
              </div>

              {/* Sort selector */}
              <div style={styles.toolbarSelectorGroup}>
                <TrendingUp size={14} style={{ color: 'var(--primary, #00f2fe)' }} />
                <select 
                  style={styles.dropdownSelect} 
                  value={trendsSortBy} 
                  onChange={(e: any) => setTrendsSortBy(e.target.value)}
                >
                  <option value="growth">Sort: Growth Score (Rising)</option>
                  <option value="volume">Sort: Search Volume (Max)</option>
                  <option value="time">Sort: Recency (Newest)</option>
                </select>
              </div>
            </div>

            {/* Grid display */}
            {trendsLoading ? (
              <div style={styles.trendsLoading}>
                <RefreshCw size={28} className="spin" style={{ color: 'var(--primary, #00f2fe)', marginBottom: '12px' }} />
                <span>Parsing Google Trends RSS Daily Feed...</span>
              </div>
            ) : filteredTrends.length === 0 ? (
              <div style={styles.trendsEmpty} className="glass-card">
                <Search size={32} style={{ opacity: 0.3 }} />
                <span>No trends match your filters. Try modifying your search or region.</span>
              </div>
            ) : (
              <div style={styles.trendsGrid}>
                {filteredTrends.map((trend, idx) => {
                  const isTopGrowth = idx === 0 && trendsSortBy === 'growth';
                  return (
                    <div 
                      key={trend.title} 
                      className="glass-card animate-fade-in" 
                      style={{
                        ...styles.trendCard,
                        borderColor: isTopGrowth ? 'var(--primary, #00f2fe)' : 'rgba(255, 255, 255, 0.08)',
                        boxShadow: isTopGrowth ? '0 0 20px rgba(0, 242, 254, 0.1)' : 'none',
                        background: isTopGrowth ? 'rgba(0, 242, 254, 0.02)' : 'rgba(255, 255, 255, 0.02)'
                      }}
                    >
                      {/* Top labels */}
                      <div style={styles.trendCardMeta}>
                        <span style={{
                          ...styles.hotBadge,
                          background: isTopGrowth ? 'rgba(0, 242, 254, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                          color: isTopGrowth ? 'var(--primary, #00f2fe)' : '#bbb'
                        }}>
                          {isTopGrowth ? '🔥 Growth Leader' : `#${idx+1} Trend`}
                        </span>
                        <span style={styles.growthBadge} title="Growth Index Score">
                          Growth Score: {trend.growthScore}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={styles.trendTitleText}>{trend.title}</h3>

                      {/* Info Row */}
                      <div style={styles.trendCardInfoRow}>
                        <div style={styles.infoRowItem}>
                          <TrendingUp size={13} style={{ color: 'var(--primary, #00f2fe)' }} />
                          <span>Search Volume: <strong>{trend.traffic}</strong></span>
                        </div>
                        <div style={styles.infoRowItem}>
                          <Clock size={13} style={{ color: 'rgba(255,255,255,0.4)' }} />
                          <span>Started: <strong>{trend.hoursSinceStart}h ago</strong></span>
                        </div>
                      </div>

                      <div style={styles.trendDivider} />

                      {/* Source details */}
                      {trend.newsTitle && (
                        <div style={styles.trendNewsBox}>
                          <span style={styles.newsLabel}>Linked Source News:</span>
                          <a 
                            href={trend.newsUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            style={styles.newsLink}
                            className="preset-card-hover"
                          >
                            {trend.newsTitle}
                          </a>
                        </div>
                      )}

                      {/* Command action */}
                      <button 
                        className="btn-primary" 
                        style={styles.campaignBtn}
                        onClick={() => handleLaunchCampaign(trend.title, trend.traffic)}
                      >
                        <Sparkles size={14} />
                        Launch Campaign
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'tasks':
        return (
          <KanbanBoard 
            tasks={tasks}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onTriggerAgentLoop={handleTriggerAgentLoop}
            selectedTaskId={selectedTaskId}
            onClearSelectedTaskId={handleClearSelectedTaskId}
          />
        );

      case 'seo':
        return (
          <SeoDashboard 
            onTriggerAudit={handleTriggerSeoAudit}
          />
        );

      case 'org':
        return (
          <OrgChart 
            agents={agents}
            tasks={tasks}
          />
        );

      case 'chat':
        return (
          <WorkspaceChat 
            chatLogs={chatLogs}
            onSendMessage={handleSendMessage}
            tasks={tasks}
            onViewTask={handleViewTask}
          />
        );

      case 'settings':
        return (
          <AiSettings 
            config={config as any}
            onUpdateConfig={handleUpdateConfig}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div className="glass-card" style={styles.headerCard}>
        <div style={styles.headerLeft}>
          <div style={{ 
            ...styles.statusDot, 
            backgroundColor: isRunning ? '#ef4444' : '#10b981', 
            boxShadow: isRunning ? '0 0 10px #ef4444' : '0 0 10px #10b981' 
          }}></div>
          <div>
            <h1 style={styles.title}>AI Virtual Office</h1>
            <p style={styles.subtitle}>Direct Campaign Operations &amp; Real-Time Logs Console</p>
          </div>
        </div>
        <div style={styles.headerRight}>
          <div style={styles.metaBadge}>
            <ShieldCheck size={14} style={{ color: 'var(--primary, #00f2fe)' }} />
            <span>Mode: <strong>{isLocalMode ? 'Local Dev Simulation' : 'Production (Cloud)'}</strong></span>
          </div>
          <div style={styles.metaBadge}>
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem', textAlign: 'right' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Action</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {config?.lastRunTimestamp ? new Date(config.lastRunTimestamp).toLocaleTimeString() : 'Never'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="glass-card" style={styles.tabNavbar}>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'console' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'console' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('console')}
        >
          <Terminal size={15} />
          <span>Console Logs</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'boardroom' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'boardroom' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('boardroom')}
        >
          <Briefcase size={15} />
          <span>Boardroom</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'trends' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'trends' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('trends')}
        >
          <TrendingUp size={15} />
          <span>Trends Explorer</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'tasks' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'tasks' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('tasks')}
        >
          <LayoutGrid size={15} />
          <span>Kanban Board</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'seo' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'seo' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('seo')}
        >
          <ShieldCheck size={15} />
          <span>SEO Ranks</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'chat' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'chat' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('chat')}
        >
          <MessageSquare size={15} />
          <span>Workspace Chat</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'org' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'org' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('org')}
        >
          <Users size={15} />
          <span>Team Org Chart</span>
        </button>
        <button 
          style={{ ...styles.tabNavbarButton, color: subTab === 'settings' ? 'var(--primary, #00f2fe)' : '#aaa', borderBottomColor: subTab === 'settings' ? 'var(--primary, #00f2fe)' : 'transparent' }}
          onClick={() => setSubTab('settings')}
        >
          <Settings size={15} />
          <span>Office Settings</span>
        </button>
      </div>

      {/* Rendering tab Content */}
      <div style={styles.tabBodyContainer}>
        {renderSubTabContent()}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px 24px 100px 24px',
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  headerCard: {
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'rgba(10, 15, 30, 0.4)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    transition: 'background-color 0.3s ease'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: 0
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px'
  },
  metaBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid var(--border-glass)',
    padding: '6px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)'
  },
  // Tab navbar styling
  tabNavbar: {
    display: 'flex',
    background: 'rgba(5, 7, 12, 0.5)',
    border: '1px solid var(--border-glass)',
    borderRadius: '12px',
    padding: '0 8px',
    overflowX: 'auto' as const,
    gap: '12px',
    scrollBehavior: 'smooth' as const,
    minHeight: '48px',
    alignItems: 'center'
  },
  tabNavbarButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '14px 16px',
    fontSize: '0.82rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap' as const,
    height: '100%',
    boxSizing: 'border-box' as const
  },
  tabBodyContainer: {
    minHeight: '400px'
  },
  // Console Tab View Styling
  consoleGrid: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px'
  },
  actionButton: {
    textAlign: 'left' as const,
    padding: '30px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '20px',
    background: 'rgba(15, 20, 35, 0.5)',
    border: '1px solid var(--border-glass)',
    borderRadius: '16px',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
  },
  btnIconContainer: {
    padding: '16px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  btnContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flexGrow: 1
  },
  btnLabel: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: 'var(--text-primary)'
  },
  btnDesc: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5
  },
  btnPlayGlow: {
    position: 'absolute' as const,
    bottom: '20px',
    right: '20px',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    boxShadow: '0 4px 12px rgba(255,255,255,0.2)',
    transition: 'transform 0.2s ease'
  },
  terminalCard: {
    background: 'rgba(5, 7, 12, 0.9)',
    border: '1px solid var(--border-glass-active)',
    borderRadius: '16px',
    padding: '0',
    overflow: 'hidden',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255,255,255,0.05)'
  },
  terminalHeader: {
    padding: '16px 20px',
    background: 'rgba(0, 0, 0, 0.3)',
    borderBottom: '1px solid var(--border-glass)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  terminalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  terminalTitle: {
    fontSize: '0.85rem',
    fontWeight: 600,
    fontFamily: 'monospace',
    letterSpacing: '1px',
    color: 'var(--text-primary)',
    textTransform: 'uppercase' as const
  },
  terminalHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  consoleStatusText: {
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center'
  },
  clearBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  terminalBody: {
    padding: '24px',
    height: '350px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '0.9rem',
    lineHeight: 1.5,
    backgroundColor: '#04060a'
  },
  terminalEmpty: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center' as const,
    padding: '0 20px'
  },
  logLine: {
    wordBreak: 'break-word' as const,
    letterSpacing: '0.5px'
  },
  terminalCursorLine: {
    display: 'flex',
    alignItems: 'center'
  },
  terminalCursor: {
    display: 'inline-block',
    width: '8px',
    height: '15px',
    backgroundColor: 'var(--primary, #00f2fe)',
    animation: 'blink 1s step-end infinite',
    marginLeft: '2px'
  },
  // Trends Explorer View Styling
  trendsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px'
  },
  algorithmCard: {
    padding: '20px',
    background: 'rgba(0, 242, 254, 0.02)',
    border: '1px solid rgba(0, 242, 254, 0.1)',
    borderRadius: '12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px'
  },
  algoHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#fff',
    fontFamily: 'var(--font-heading)'
  },
  algoText: {
    fontSize: '0.85rem',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
    margin: 0
  },
  toolbarCard: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(0,0,0,0.25)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    flexGrow: 1,
    minWidth: '220px'
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
    fontFamily: 'inherit'
  },
  toolbarSelectorGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    padding: '4px 12px',
    borderRadius: '8px',
    minHeight: '38px',
    boxSizing: 'border-box' as const
  },
  toggleButton: {
    background: 'transparent',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  dropdownSelect: {
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '0.8rem',
    fontWeight: 500,
    outline: 'none',
    cursor: 'pointer',
    paddingRight: '6px'
  },
  trendsLoading: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.9rem'
  },
  trendsEmpty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.9rem',
    gap: '12px',
    textAlign: 'center' as const
  },
  trendsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  trendCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.3s ease'
  },
  trendCardMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  hotBadge: {
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '0.72rem',
    fontWeight: 600
  },
  growthBadge: {
    fontSize: '0.72rem',
    color: 'var(--primary, #00f2fe)',
    background: 'rgba(0, 242, 254, 0.08)',
    border: '1px solid rgba(0, 242, 254, 0.15)',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: 600
  },
  trendTitleText: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#fff',
    margin: 0,
    lineHeight: 1.4,
    fontFamily: 'var(--font-heading)'
  },
  trendCardInfoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.6)'
  },
  infoRowItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  trendDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.06)'
  },
  trendNewsBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px'
  },
  newsLabel: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  newsLink: {
    fontSize: '0.82rem',
    color: 'var(--primary, #00f2fe)',
    textDecoration: 'none',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden'
  },
  campaignBtn: {
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    justifyContent: 'center',
    padding: '10px',
    fontSize: '0.82rem',
    fontWeight: 600,
    marginTop: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px'
  }
};
