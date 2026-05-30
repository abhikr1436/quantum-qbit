import React, { useState, useEffect, useCallback } from 'react';
import { Users, MessageSquare, KanbanSquare, Sparkles, Search, Settings as SettingsIcon, RefreshCw, Layers, ShieldCheck } from 'lucide-react';
import { OrgChart } from './OrgChart';
import { WorkspaceChat } from './WorkspaceChat';
import { KanbanBoard } from './KanbanBoard';
import { Boardroom } from './Boardroom';
import { SeoDashboard } from './SeoDashboard';
import { AiSettings } from './AiSettings';

interface OfficeConfig {
  websitePath: string;
  deepseekKey: string;
  githubToken?: string;
  isAutomationActive: boolean;
  automationIntervalMinutes?: number;
  lastRunTimestamp?: string | null;
}

interface Agent {
  name: string;
  role: string;
  status: string;
  avatar: string;
  bio: string;
  tasksCount?: number;
}

interface TaskReview {
  agent: string;
  decision: 'approved' | 'rejected';
  reviewText: string;
  timestamp: string;
}

interface DraftContent {
  category_id?: string;
  title?: string;
  excerpt?: string;
  content?: string;
  imageGlow?: string;
  platform?: string;
  postText?: string;
  recommendations?: string;
}

interface OfficeTask {
  id: string;
  title: string;
  description: string;
  type: string;
  assignee: string;
  status: string;
  draftContent: DraftContent | string | null;
  reviews: TaskReview[];
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  taskId?: string;
}

interface SystemLog {
  timestamp: string;
  agent: string;
  message: string;
}

interface LocalOfficeDB {
  config: OfficeConfig;
  agents: Agent[];
  tasks: OfficeTask[];
  chatLogs: ChatMessage[];
  systemLogs: SystemLog[];
  publishedTopics: string[];
}

interface AiOfficeTabProps {
  isLocalMode?: boolean;
}


export const AiOfficeTab: React.FC<AiOfficeTabProps> = ({ isLocalMode = false }) => {
  const [activeTab, setActiveTab] = useState<'org' | 'chat' | 'tasks' | 'boardroom' | 'seo' | 'settings'>('boardroom');
  
  // Dashboard States
  const [config, setConfig] = useState<OfficeConfig | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<OfficeTask[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatMessage[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Automation / execution load states
  const [runLoopLoading, setRunLoopLoading] = useState(false);
  const [boardroomProcessing, setBoardroomProcessing] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Timer States
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [timerColor, setTimerColor] = useState<string>('rgba(255,255,255,0.6)');

  // Local Storage Database Mock logic
  const getLocalDB = () => {
    const local = localStorage.getItem('quantum_office_db');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        // Fallback
      }
    }
    const defaultDB = {
      config: {
        websitePath: '.',
        deepseekKey: 'sk-d98...e2bf2',
        githubToken: 'github_pat_11CD...zRHM9WRe',
        automationIntervalMinutes: 60,
        isAutomationActive: true,
        lastRunTimestamp: new Date().toISOString(),
        lastBrainstormTimestamp: new Date().toISOString()
      },
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
      chatLogs: [
        {
          id: 'welcome',
          sender: 'Sophia',
          text: 'Welcome to the Quantum Qbit Virtual Office! Here we brainstorm and build local-first features offline.',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ],
      systemLogs: [
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          agent: 'System',
          message: 'Local Simulation database initialized.'
        }
      ],
      publishedTopics: []
    };
    localStorage.setItem('quantum_office_db', JSON.stringify(defaultDB));
    return defaultDB;
  };

  const saveLocalDB = (db: LocalOfficeDB) => {
    localStorage.setItem('quantum_office_db', JSON.stringify(db));
  };

  // Local simulated blog publisher
  const publishBlogLocally = (title: string, draft: DraftContent | null) => {
    const localBlogsStr = localStorage.getItem('quantum_blogs');
    let blogs = [];
    if (localBlogsStr) {
      try {
        blogs = JSON.parse(localBlogsStr);
      } catch {
        // Fallback
      }
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
    const newBlog = {
      id: slug,
      title: title,
      excerpt: draft?.excerpt || "A new technical article published on the site.",
      content: draft?.content || `<p>This is the content for the blog post.</p>`,
      author: 'Quantum AI Writer (Simulated)',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      readTime: "4 min read",
      category: 'Privacy & Security',
      category_id: draft?.category_id || 'privacy-security',
      imageGlow: draft?.imageGlow || 'rgba(0, 242, 254, 0.1)',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
      updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };
    
    blogs.unshift(newBlog);
    localStorage.setItem('quantum_blogs', JSON.stringify(blogs));
  };

  // Asynchronous Client-side Simulation state machine
  const startLocalSimulation = (targetTaskId?: string) => {
    if (!isLocalMode) return;
    
    const db = getLocalDB();
    const tasks = db.tasks;
    const task = (targetTaskId ? tasks.find((t: OfficeTask) => t.id === targetTaskId) : tasks.find((t: OfficeTask) => t.status === 'todo')) as OfficeTask | undefined;
    
    if (!task) {
      simulateLocalBrainstorm();
      return;
    }
    
    const updateTaskStage = (status: string, agent: string, agentStatus: string, chatText: string, delay: number, next: () => void) => {
      setTimeout(() => {
        const currentDB = getLocalDB();
        const currentTask = currentDB.tasks.find((t: OfficeTask) => t.id === (task as OfficeTask).id);
        if (!currentTask) return;
        
        currentTask.status = status;
        currentTask.updatedAt = new Date().toISOString();
        
        currentDB.agents = currentDB.agents.map((a: Agent) => {
          if (a.name === agent) {
            return { ...a, status: agentStatus };
          }
          return a.status === agentStatus ? { ...a, status: 'Idle' } : a;
        });
        
        currentDB.chatLogs.push({
          id: 'msg-' + Date.now() + Math.random(),
          sender: agent,
          text: chatText,
          timestamp: new Date().toISOString(),
          taskId: currentTask.id
        });
        
        if (!currentDB.systemLogs) currentDB.systemLogs = [];
        currentDB.systemLogs.push({
          timestamp: new Date().toISOString(),
          agent: agent,
          message: `${agent} status changed to: ${agentStatus}`
        });
        
        saveLocalDB(currentDB);
        fetchDashboardData(false);
        next();
      }, delay);
    };
    
    updateTaskStage(
      'inprogress',
      task.assignee,
      'Drafting Content',
      `Acknowledged, @Alex. Starting work on "${task.title}".`,
      500,
      () => {
        let draft: DraftContent | string | null = 'Draft completed.';
        if (task.type === 'blog') {
          draft = {
            title: task.title,
            excerpt: "How local browser processing safeguards user data and improves speeds.",
            content: `<h2>Local Processing on Quantum Qbit</h2><p>In this article we discuss local first processing. This is a simulated local post generated during local dev testing mode.</p>`,
            category_id: "privacy-security",
            imageGlow: "rgba(0, 242, 254, 0.1)"
          };
        }
        
        setTimeout(() => {
          const currentDB = getLocalDB();
          const currentTask = currentDB.tasks.find((t: OfficeTask) => t.id === (task as OfficeTask).id);
          if (!currentTask) return;
          currentTask.draftContent = draft;
          saveLocalDB(currentDB);
          
          updateTaskStage(
            'manager_review',
            task.assignee,
            'Idle',
            `I've finished drafting the work for "${task.title}". @Alex, please check my submission!`,
            10,
            () => {
              setTimeout(() => {
                const innerDB = getLocalDB();
                const innerTask = innerDB.tasks.find((t: OfficeTask) => t.id === (task as OfficeTask).id);
                if (!innerTask) return;
                innerTask.reviews.push({
                  agent: 'Alex',
                  reviewText: 'Excellent draft. Fits our criteria perfectly. Submitting to CEO.',
                  decision: 'approved',
                  timestamp: new Date().toISOString()
                });
                saveLocalDB(innerDB);
                
                updateTaskStage(
                  'ceo_approval',
                  'Alex',
                  'Idle',
                  `Draft for "${task.title}" is approved by me. @Sophia, please review and give final sign-off!`,
                  10,
                  () => {
                    setTimeout(() => {
                      const finalDB = getLocalDB();
                      const finalTask = finalDB.tasks.find((t: OfficeTask) => t.id === (task as OfficeTask).id);
                      if (!finalTask) return;
                      finalTask.reviews.push({
                        agent: 'Sophia',
                        reviewText: 'Outstanding work. Pushing live.',
                        decision: 'approved',
                        timestamp: new Date().toISOString()
                      });
                      saveLocalDB(finalDB);
                      
                      updateTaskStage(
                        'completed',
                        'Sophia',
                        'Idle',
                        `Approved! Excellent job @${task.assignee}. @Deployer, please push this update live.`,
                        10,
                        () => {
                          setTimeout(() => {
                            const depDB = getLocalDB();
                            depDB.agents = depDB.agents.map((a: Agent) => 
                              a.name === 'Deployer' ? { ...a, status: 'Deploying' } : a
                            );
                            saveLocalDB(depDB);
                            fetchDashboardData(false);
                            
                            setTimeout(() => {
                              const doneDB = getLocalDB();
                              doneDB.agents = doneDB.agents.map((a: Agent) => 
                                a.name === 'Deployer' ? { ...a, status: 'Idle' } : a
                              );
                              doneDB.config.lastRunTimestamp = new Date().toISOString();
                              doneDB.chatLogs.push({
                                id: 'msg-' + Date.now() + Math.random(),
                                sender: 'Deployer',
                                text: `Deployment successful for "${task.title}"! Changes are live on local simulation.`,
                                timestamp: new Date().toISOString(),
                                taskId: task.id
                              });
                              
                              if (!doneDB.systemLogs) doneDB.systemLogs = [];
                              doneDB.systemLogs.push({
                                timestamp: new Date().toISOString(),
                                agent: 'Deployer',
                                message: `Simulated deployment complete: "${task.title}"`
                              });
                              
                              if (task.type === 'blog') {
                                publishBlogLocally(task.title, draft as DraftContent);
                              }
                              
                              saveLocalDB(doneDB);
                              fetchDashboardData(false);
                            }, 1500);
                          }, 500);
                        }
                      );
                    }, 1200);
                  }
                );
              }, 1200);
            }
          );
        }, 1500);
      }
    );
  };

  const simulateLocalBrainstorm = () => {
    const db = getLocalDB();
    db.agents = db.agents.map((a: Agent) => 
      a.name === 'Mark' ? { ...a, status: 'Researching trending topics...' } : a
    );
    
    if (!db.systemLogs) db.systemLogs = [];
    db.systemLogs.push({
      timestamp: new Date().toISOString(),
      agent: 'Mark',
      message: 'Mark started researching trending topics from Google Trends (Simulation)'
    });
    
    saveLocalDB(db);
    fetchDashboardData(false);
    
    setTimeout(() => {
      const innerDB = getLocalDB();
      const trends = [
        "ISRO Gaganyaan Space Mission Launch Schedule (Search Volume: 500K+)",
        "Delhi-NCR Storm and Weather Alert safety protocols (Search Volume: 200K+)",
        "Aadhaar card masking offline privacy instructions (Search Volume: 100K+)",
        "React 19 Server Components architecture migration (Search Volume: 50K+)"
      ];
      const selectedTrend = trends[Math.floor(Math.random() * trends.length)];
      const title = selectedTrend.split(' (')[0];
      
      innerDB.agents = innerDB.agents.map((a: Agent) => 
        a.name === 'Mark' ? { ...a, status: 'Idle' } : a
      );
      
      const newTask = {
        id: 'task-' + Math.random().toString(36).substr(2, 9),
        title: `How to guide for ${title}`,
        description: `Research context: ${selectedTrend}. Features unit converters or offline tools of quantumqbit.in. Keywords: ${title.split(' ')[0]}, offline converter, privacy secure.`,
        type: 'blog',
        assignee: 'Mark',
        status: 'todo',
        draftContent: null,
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      innerDB.tasks.push(newTask);
      
      innerDB.chatLogs.push({
        id: 'msg-' + Date.now() + Math.random(),
        sender: 'Alex',
        text: `📝 [NEW TOPIC QUEUED] @Mark will write "${newTask.title}" — researched from live trending data. Added to workflows!`,
        timestamp: new Date().toISOString(),
        taskId: newTask.id
      });
      
      saveLocalDB(innerDB);
      fetchDashboardData(false);
      
      startLocalSimulation(newTask.id);
    }, 1500);
  };

  // Fetch full dashboard state from PHP backend or LocalStorage
  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    if (isLocalMode) {
      const data = getLocalDB();
      setConfig(data.config || null);
      setAgents(data.agents || []);
      setTasks(data.tasks || []);
      setChatLogs(data.chatLogs || []);
      setSystemLogs(data.systemLogs || []);
      setErrorMsg(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=dashboard');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config || null);
        setAgents(data.agents || []);
        setTasks(data.tasks || []);
        setChatLogs(data.chatLogs || []);
        setSystemLogs(data.systemLogs || []);
        setErrorMsg(null);
      } else {
        setErrorMsg('Failed to read status data from AI Office backend.');
      }
    } catch {
      setErrorMsg('Cannot connect to AI Office PHP backend API.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [isLocalMode]);

  // Initial fetch + background syncing (every 6 seconds)
  useEffect(() => {
    Promise.resolve().then(() => fetchDashboardData(true));
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Countdown Timer logic based on lastRunTimestamp and automationIntervalMinutes
  useEffect(() => {
    const updateTimer = () => {
      if (!config) {
        setTimeLeft('--:--');
        setTimerColor('rgba(255,255,255,0.6)');
        return;
      }
      
      if (!config.isAutomationActive) {
        setTimeLeft('Disabled');
        setTimerColor('rgba(255,255,255,0.4)');
        return;
      }
      
      const lastRun = config.lastRunTimestamp;
      if (!lastRun) {
        setTimeLeft('Awaiting Run');
        setTimerColor('var(--primary, #00f2fe)');
        return;
      }
      
      const intervalMinutes = config.automationIntervalMinutes || 60;
      const lastRunTime = new Date(lastRun).getTime();
      const nextRunTime = lastRunTime + intervalMinutes * 60 * 1000;
      const now = Date.now();
      
      const diffMs = nextRunTime - now;
      if (diffMs <= 0) {
        const overdueMinutes = Math.abs(diffMs) / 60000;
        if (overdueMinutes > 15) {
          setTimeLeft('Overdue / Stalled');
          setTimerColor('#ef4444');
        } else {
          setTimeLeft('Running...');
          setTimerColor('#10b981');
        }
      } else {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        if (minutes < 5) {
          setTimerColor('#f59e0b');
        } else {
          setTimerColor('rgba(255,255,255,0.8)');
        }
      }
    };
    
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  }, [config]);

  // Update Settings
  const handleUpdateConfig = async (newConfig: Partial<OfficeConfig>) => {
    if (isLocalMode) {
      const db = getLocalDB();
      db.config = { ...db.config, ...newConfig };
      saveLocalDB(db);
      fetchDashboardData(false);
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=save_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig)
      });
      if (response.ok) {
        await fetchDashboardData(false);
      } else {
        throw new Error('Failed to update config.');
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Send workspace chat message
  const handleSendMessage = async (text: string) => {
    if (isLocalMode) {
      const db = getLocalDB();
      db.chatLogs.push({
        id: 'msg-' + Date.now() + Math.random(),
        sender: 'Board',
        text,
        timestamp: new Date().toISOString()
      });
      saveLocalDB(db);
      fetchDashboardData(false);
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender: 'Board', text })
      });
      if (response.ok) {
        await fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit boardroom mandate directive
  const handleSendDirective = async (text: string) => {
    setBoardroomProcessing(true);
    
    if (isLocalMode) {
      setTimeout(() => {
        const db = getLocalDB();
        if (!db.systemLogs) db.systemLogs = [];
        db.systemLogs.push({
          timestamp: new Date().toISOString(),
          agent: 'System',
          message: `Boardroom Directive received: "${text}"`
        });
        
        const isBlog = text.toLowerCase().includes('blog') || text.toLowerCase().includes('article') || text.toLowerCase().includes('write');
        const isSocial = text.toLowerCase().includes('social') || text.toLowerCase().includes('twitter') || text.toLowerCase().includes('post');
        
        let title = 'SEO Audit and Enhancements';
        let assignee = 'Codey';
        let type = 'feature';
        let desc = 'Review browser utility layouts and tags for optimal crawler parsing.';
        
        if (isBlog) {
          title = 'Write Trending Technical Article';
          assignee = 'Mark';
          type = 'blog';
          desc = `Draft an educational blog post on the topic requested by the board: "${text}"`;
        } else if (isSocial) {
          title = 'Promote Quantum Tools on Socials';
          assignee = 'Sarah';
          type = 'social';
          desc = `Draft a series of posts showcasing local-first tool performance based on: "${text}"`;
        }
        
        const newTask = {
          id: 'task-' + Math.random().toString(36).substr(2, 9),
          title,
          description: desc,
          type,
          assignee,
          status: 'todo',
          draftContent: null,
          reviews: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        db.tasks.push(newTask);
        
        db.chatLogs.push({
          id: 'msg-' + Date.now() + Math.random(),
          sender: 'Alex',
          text: `Board directive received. I've created task "${newTask.title}" and assigned it to @${newTask.assignee}.`,
          timestamp: new Date().toISOString(),
          taskId: newTask.id
        });
        
        saveLocalDB(db);
        fetchDashboardData(false);
        setBoardroomProcessing(false);
        
        startLocalSimulation(newTask.id);
      }, 800);
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=boardroom_submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directive: text })
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to submit directive');
      }
      await fetchDashboardData(false);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setBoardroomProcessing(false);
    }
  };

  // Trigger next step of the agent state machine loop (dispatches GitHub Action)
  const handleTriggerAgentLoop = async () => {
    setRunLoopLoading(true);
    
    if (isLocalMode) {
      setTimeout(() => {
        setRunLoopLoading(false);
        startLocalSimulation();
      }, 600);
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=trigger_cycle', {
        method: 'POST'
      });
      if (response.ok) {
        await fetchDashboardData(false);
        alert('GitHub Action runner triggered successfully in the cloud! It will process the next cycle shortly.');
      } else {
        const data = await response.json();
        alert('Trigger failed: ' + (data.error || 'Check Settings for valid GitHub Token.'));
      }
    } catch (err) {
      console.error(err);
      alert('Network error triggering background cycle.');
    } finally {
      setRunLoopLoading(false);
    }
  };

  // Manually override/update task status
  const handleUpdateTaskStatus = async (id: string, newStatus: string) => {
    if (isLocalMode) {
      const db = getLocalDB();
      const task = db.tasks.find((t: OfficeTask) => t.id === id);
      if (task) {
        task.status = newStatus;
        task.updatedAt = new Date().toISOString();
        saveLocalDB(db);
        fetchDashboardData(false);
      }
      return;
    }

    try {
      const response = await fetch('/api/ai_office.php?action=update_task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (response.ok) {
        await fetchDashboardData(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger SEO audit check
  const handleTriggerAudit = async () => {
    if (isLocalMode) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            score: 96,
            pagesScanned: ['/', '/blogs', '/about'],
            criticalIssues: 0,
            warnings: 2,
            passedChecks: 12
          });
        }, 1000);
      });
    }

    const response = await fetch('/api/ai_office.php?action=seo_audit');
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'SEO scan failed');
    }
    return response.json();
  };

  // Link view handler to auto-jump from chat to Kanban task card modal
  const handleViewTask = (id: string) => {
    setSelectedTaskId(id);
    setActiveTab('tasks');
  };

  const getActiveTaskCount = () => {
    return tasks.filter(t => t.status !== 'completed').length;
  };

  const getEnrichedAgents = (): Agent[] => {
    const activeTask = [...tasks].reverse().find(t => t.status !== 'completed');
    
    return agents.map(agent => {
      let status = agent.status;
      
      if (status === 'Idle') {
        if (activeTask) {
          if (activeTask.status === 'todo') {
            if (agent.name === 'Alex') status = 'Assigning directive briefing';
            else if (agent.name === 'Mark') status = 'Analyzing trends & keywords';
            else if (agent.name === 'Sophia') status = 'Monitoring team operations';
            else if (agent.name === 'Sarah') status = 'Monitoring site traffic';
            else if (agent.name === 'Codey') status = 'Auditing HTML tag hierarchy';
            else if (agent.name === 'Deployer') status = 'Checking build config';
            else if (agent.name === 'Harper') status = 'Aligning department roles';
          } else if (activeTask.status === 'inprogress') {
            if (agent.name === 'Mark' && activeTask.assignee === 'Mark') status = 'Drafting article content';
            else if (agent.name === 'Sarah' && activeTask.assignee === 'Sarah') status = 'Creating social blurbs';
            else if (agent.name === 'Codey' && activeTask.assignee === 'Codey') status = 'Building feature script';
            else if (agent.name === 'Alex') status = 'Monitoring draft progress';
            else if (agent.name === 'Sophia') status = 'Reviewing campaign focus';
            else if (agent.name === 'Sarah') status = 'Scheduling post calendars';
            else if (agent.name === 'Codey') status = 'Optimizing tool code elements';
            else if (agent.name === 'Deployer') status = 'Checking compiler constraints';
            else if (agent.name === 'Harper') status = 'Reviewing department logs';
          } else if (activeTask.status === 'manager_review') {
            if (agent.name === 'Alex') status = 'Auditing submission draft';
            else if (agent.name === 'Mark') status = 'Awaiting manager review';
            else if (agent.name === 'Sophia') status = 'Waiting for escalations';
            else if (agent.name === 'Sarah') status = 'Preparing social media assets';
            else if (agent.name === 'Codey') status = 'Verifying local style bindings';
            else if (agent.name === 'Deployer') status = 'Preparing package manifest';
            else if (agent.name === 'Harper') status = 'Updating personnel file records';
          } else if (activeTask.status === 'ceo_approval') {
            if (agent.name === 'Sophia') status = 'Evaluating final draft sign-off';
            else if (agent.name === 'Alex') status = 'Awaiting CEO approval';
            else if (agent.name === 'Mark') status = 'Awaiting publication release';
            else if (agent.name === 'Deployer') status = 'Staging web release files';
            else if (agent.name === 'Sarah') status = 'Finalizing social media banners';
            else if (agent.name === 'Codey') status = 'Running page performance check';
            else if (agent.name === 'Harper') status = 'Updating staff timesheets';
          }
        } else {
          if (agent.name === 'Sophia') status = 'Analyzing global visitor metrics';
          else if (agent.name === 'Alex') status = 'Formulating next task directive';
          else if (agent.name === 'Mark') status = 'Monitoring live Google trends';
          else if (agent.name === 'Sarah') status = 'Engaging with social communities';
          else if (agent.name === 'Codey') status = 'Refactoring browser tool styles';
          else if (agent.name === 'Deployer') status = 'Maintaining server infrastructure';
          else if (agent.name === 'Harper') status = 'Organizing team sync sessions';
        }
      }
      return { ...agent, status };
    });
  };

  const enrichedAgents = getEnrichedAgents();

  return (
    <div style={styles.dashboardLayout}>
      {/* Sidebar navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarLogo}>
          <Layers style={{ color: 'var(--primary, #00f2fe)' }} size={20} />
          <span style={styles.logoText}>Virtual Office</span>
        </div>

        <nav style={styles.sidebarMenu}>
          <div 
            onClick={() => setActiveTab('boardroom')} 
            style={{ ...styles.menuItem, ...(activeTab === 'boardroom' ? styles.menuItemActive : {}) }}
          >
            <Sparkles size={15} />
            <span>Boardroom Table</span>
          </div>
          
          <div 
            onClick={() => setActiveTab('tasks')} 
            style={{ ...styles.menuItem, ...(activeTab === 'tasks' ? styles.menuItemActive : {}) }}
          >
            <KanbanSquare size={15} />
            <span>Kanban Workflows</span>
            {getActiveTaskCount() > 0 && (
              <span style={styles.taskBadge}>{getActiveTaskCount()}</span>
            )}
          </div>

          <div 
            onClick={() => setActiveTab('chat')} 
            style={{ ...styles.menuItem, ...(activeTab === 'chat' ? styles.menuItemActive : {}) }}
          >
            <MessageSquare size={15} />
            <span>Workspace Chat</span>
          </div>

          <div 
            onClick={() => setActiveTab('org')} 
            style={{ ...styles.menuItem, ...(activeTab === 'org' ? styles.menuItemActive : {}) }}
          >
            <Users size={15} />
            <span>Company Staff</span>
          </div>

          <div 
            onClick={() => setActiveTab('seo')} 
            style={{ ...styles.menuItem, ...(activeTab === 'seo' ? styles.menuItemActive : {}) }}
          >
            <Search size={15} />
            <span>Google & SEO</span>
          </div>

          <div 
            onClick={() => setActiveTab('settings')} 
            style={{ ...styles.menuItem, ...(activeTab === 'settings' ? styles.menuItemActive : {}) }}
          >
            <SettingsIcon size={15} />
            <span>Settings</span>
          </div>
        </nav>

        {/* Global Agent loop status button at the footer */}
        <div style={styles.sidebarFooter}>
          <button 
            className="btn-primary" 
            style={styles.runLoopBtn}
            onClick={handleTriggerAgentLoop}
            disabled={runLoopLoading}
          >
            <RefreshCw size={14} className={runLoopLoading ? 'spin' : ''} />
            {runLoopLoading ? 'Dispatching...' : 'Trigger Cloud Cycle'}
          </button>
        </div>
      </aside>

      {/* Main dashboard viewport */}
      <main style={styles.mainViewport}>
        
        {/* Status Indicator banner */}
        <div style={styles.statusBanner} className="glass-card">
          <div style={styles.statusText}>
            <span style={{
              ...styles.statusDot,
              backgroundColor: agents.some(a => a.status !== 'Idle') ? 'var(--primary, #00f2fe)' : 'rgba(255,255,255,0.3)',
              boxShadow: agents.some(a => a.status !== 'Idle') ? '0 0 10px var(--primary, #00f2fe)' : 'none'
            }} />
            <span>
              <strong>Company Status:</strong>{' '}
              {agents.some(a => a.status !== 'Idle') ? (
                <span style={{ color: 'var(--primary, #00f2fe)', fontWeight: 600 }}>
                  Agents actively executing tasks in cloud
                </span>
              ) : (
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Ready for Board directives</span>
              )}
            </span>
          </div>

          <div style={{ 
            fontSize: '0.85rem', 
            color: timerColor, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '4px 10px', 
            borderRadius: '6px', 
            background: 'rgba(255,255,255,0.03)',
            border: `1px solid ${timerColor === 'rgba(255,255,255,0.8)' || timerColor === 'rgba(255,255,255,0.6)' ? 'rgba(255,255,255,0.08)' : timerColor + '30'}`
          }}>
            <RefreshCw size={12} className={timeLeft === 'Running...' ? 'spin' : ''} style={{ color: timerColor }} />
            <span>Next Article: <strong>{timeLeft}</strong></span>
            {timeLeft === 'Overdue / Stalled' && (
              <button 
                onClick={handleTriggerAgentLoop}
                disabled={runLoopLoading}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginLeft: '8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'background 0.2s'
                }}
              >
                <RefreshCw size={10} className={runLoopLoading ? 'spin' : ''} />
                Restart Loop
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} style={{ color: '#10b981' }} />
            <span>Serverless Agent Loop Active</span>
          </div>
        </div>

        {/* Display connection errors */}
        {errorMsg && (
          <div style={styles.errorBanner}>
            {errorMsg}
          </div>
        )}

        {loading ? (
          <div style={styles.loadingContainer}>
            <RefreshCw size={32} className="spin" style={{ color: 'var(--primary, #00f2fe)' }} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>Synchronizing Office Database...</span>
          </div>
        ) : (
          <div style={styles.tabContentContainer}>
            {activeTab === 'boardroom' && (
              <Boardroom 
                onSendDirective={handleSendDirective}
                isProcessing={boardroomProcessing}
                agents={enrichedAgents}
                systemLogs={systemLogs}
                tasks={tasks}
                timeLeft={timeLeft}
                timerColor={timerColor}
                runLoopLoading={runLoopLoading}
                onTriggerAgentLoop={handleTriggerAgentLoop}
              />
            )}
            
            {activeTab === 'tasks' && (
              <KanbanBoard 
                tasks={tasks}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onTriggerAgentLoop={handleTriggerAgentLoop}
                selectedTaskId={selectedTaskId}
                onClearSelectedTaskId={() => setSelectedTaskId(null)}
              />
            )}

            {activeTab === 'chat' && (
              <WorkspaceChat 
                chatLogs={chatLogs}
                onSendMessage={handleSendMessage}
                tasks={tasks}
                onViewTask={handleViewTask}
              />
            )}

            {activeTab === 'org' && (
              <OrgChart 
                agents={enrichedAgents}
                tasks={tasks}
              />
            )}

            {activeTab === 'seo' && (
              <SeoDashboard 
                onTriggerAudit={handleTriggerAudit}
              />
            )}

            {activeTab === 'settings' && (
              <AiSettings 
                config={config || { websitePath: '', deepseekKey: '', isAutomationActive: false }}
                onUpdateConfig={handleUpdateConfig}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
};

const styles = {
  dashboardLayout: {
    display: 'flex',
    gap: '24px',
    minHeight: '600px',
    color: '#fff',
    fontFamily: 'var(--font-sans)',
  },
  sidebar: {
    width: '240px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    boxSizing: 'border-box' as const,
  },
  sidebarLogo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '12px',
  },
  logoText: {
    fontWeight: 700,
    fontSize: '1.05rem',
    fontFamily: 'var(--font-heading)',
    background: 'linear-gradient(to right, #fff, rgba(255,255,255,0.7))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  sidebarMenu: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    color: 'rgba(255,255,255,0.6)',
    transition: 'all 0.2s ease',
  },
  menuItemActive: {
    background: 'rgba(0, 242, 254, 0.1)',
    color: 'var(--primary, #00f2fe)',
    fontWeight: 600,
  },
  taskBadge: {
    marginLeft: 'auto',
    background: 'rgba(0, 242, 254, 0.15)',
    color: 'var(--primary, #00f2fe)',
    padding: '1px 6px',
    borderRadius: '10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  },
  sidebarFooter: {
    marginTop: 'auto',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '20px',
  },
  runLoopBtn: {
    width: '100%',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    cursor: 'pointer',
  },
  mainViewport: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
    minWidth: 0,
  },
  statusBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  statusText: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.9rem',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid #ef4444',
    padding: '16px 24px',
    borderRadius: '12px',
    color: '#fecaca',
    fontSize: '0.9rem',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: '15px',
    padding: '80px 0',
  },
  tabContentContainer: {
    flex: 1,
    minHeight: 0,
  }
};
