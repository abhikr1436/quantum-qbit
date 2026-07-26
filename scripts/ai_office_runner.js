import fs from 'fs';
import path from 'path';
import { OpenAI } from 'openai';

const dbPath = path.join(process.cwd(), 'public', 'api', 'data', 'db.json');
const blogsJsonPath = path.join(process.cwd(), 'public', 'api', 'data', 'blogs.json');

// Helper to read database
function readDB() {
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db.json, returning empty structure", err);
    return { config: {}, agents: [], tasks: [], chatLogs: [], publishedTopics: [] };
  }
}

// Helper to write database
function writeDB(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing db.json", err);
    return false;
  }
}

// Deepseek Client helper
function getDeepseekClient(config) {
  const apiKey = process.env.DEEPSEEK_API_KEY || config.deepseekKey || process.env.OPENAI_API_KEY || config.openaiKey;
  if (!apiKey || apiKey.length < 15) {
    console.log("Deepseek key is missing or too short, simulating offline/mock execution.");
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
    baseURL: "https://api.deepseek.com"
  });
}

// Helper to change agent status in DB and post real-time updates to live server
function setAgentStatus(db, agentName, status, logText = null) {
  if (agentName) {
    const agent = db.agents.find(a => a.name === agentName);
    if (agent) {
      agent.status = status;
    }
  }
  
  if (logText) {
    if (!db.systemLogs) db.systemLogs = [];
    db.systemLogs.push({
      timestamp: new Date().toISOString(),
      agent: agentName || 'System',
      message: logText
    });
    if (db.systemLogs.length > 150) {
      db.systemLogs = db.systemLogs.slice(-150);
    }
  }
  
  const apiKey = process.env.DEEPSEEK_API_KEY || db.config.deepseekKey || db.config.githubToken;
  if (apiKey) {
    fetch("https://quantumqbit.in/api/ai_office.php?action=agent_status_update", {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        agent: agentName,
        status: status,
        log: logText
      }),
      signal: AbortSignal.timeout(5000)
    }).catch(err => {
      // Ignore background connection/timeout errors silently
    });
  }
}

// Helper to append a system message to database chat logs
function addSystemMsg(db, sender, text, taskId = null) {
  db.chatLogs.push({
    id: 'msg-' + Date.now() + Math.random(),
    sender,
    text,
    timestamp: new Date().toISOString(),
    taskId
  });
}

// ─── LIVE WEBSITE SYNC ──────────────────────────────────────────────────────────

async function syncLiveUpdates(db) {
  const apiKey = process.env.DEEPSEEK_API_KEY || db.config.deepseekKey || db.config.githubToken;
  if (!apiKey) {
    console.log("No auth token configured, skipping live updates sync.");
    return;
  }

  console.log("Fetching live updates from Hostinger...");
  try {
    const response = await fetch("https://quantumqbit.in/api/ai_office.php?action=get_live_updates", {
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.log(`Failed to fetch live updates: HTTP ${response.status}`);
      return;
    }

    const updates = await response.json();
    let mergedCount = 0;

    // 1. Merge Config Overrides (includes lastBrainstormTimestamp reset and campaignMode)
    if (updates.configOverrides && Object.keys(updates.configOverrides).length > 0) {
      console.log("Merging config updates from live site:", updates.configOverrides);
      db.config = { ...db.config, ...updates.configOverrides };
      mergedCount++;
    }

    // 2. Merge Pending Tasks (tasks queued directly from the UI dashboard buttons)
    // These REPLACE the current task list so the runner works on exactly what was requested
    if (updates.pendingTasks && updates.pendingTasks.length > 0) {
      console.log(`Merging ${updates.pendingTasks.length} pending task(s) from dashboard trigger...`);
      // Only add tasks that aren't already in db.tasks
      for (const task of updates.pendingTasks) {
        if (!db.tasks.some(t => t.id === task.id)) {
          // Clear any stale incomplete tasks first, keep only completed ones
          db.tasks = db.tasks.filter(t => t.status === 'completed');
          db.tasks.push(task);
          console.log(`Queued task from dashboard: "${task.title}" [${task.id}]`);
        }
      }
      mergedCount++;
    }

    // 3. Merge Manual Chat Messages
    if (updates.chatLogs && updates.chatLogs.length > 0) {
      console.log(`Merging ${updates.chatLogs.length} manual chat messages...`);
      updates.chatLogs.forEach(msg => {
        if (!db.chatLogs.some(m => m.id === msg.id)) {
          db.chatLogs.push(msg);
        }
      });
      mergedCount++;
    }

    // 4. Merge Directives
    if (updates.directives && updates.directives.length > 0) {
      console.log(`Merging ${updates.directives.length} boardroom directives...`);
      for (const directive of updates.directives) {
        // Parse directive into tasks using AI
        await parseBoardroomDirective(db, directive);
      }
      mergedCount++;
    }

    // 5. Merge Task Status Overrides
    if (updates.taskOverrides && updates.taskOverrides.length > 0) {
      console.log(`Merging ${updates.taskOverrides.length} task overrides...`);
      updates.taskOverrides.forEach(override => {
        const task = db.tasks.find(t => t.id === override.id);
        if (task) {
          task.status = override.status;
          task.updatedAt = new Date().toISOString();
        }
      });
      mergedCount++;
    }

    if (mergedCount > 0) {
      writeDB(db);
      console.log("Live website sync merged successfully.");
    } else {
      console.log("No new live updates to merge.");
    }
  } catch (err) {
    console.error("Failed to sync live updates from Hostinger:", err.message);
  }
}

function extractCleanTopic(directive) {
  if (!directive) return 'Latest News & Analysis';
  let clean = String(directive)
    .replace(/^write\s+(?:an?\s+)?(?:in-depth\s+)?(?:blog\s+)?(?:post\s+)?(?:article\s+)?(?:about|on|for|regarding)?\s*/i, '')
    .replace(/^draft\s+(?:an?\s+)?(?:blog\s+)?(?:post\s+)?(?:article\s+)?(?:about|on|for|regarding)?\s*/i, '')
    .replace(/^create\s+(?:an?\s+)?(?:blog\s+)?(?:post\s+)?(?:article\s+)?(?:about|on|for|regarding)?\s*/i, '')
    .replace(/^perform\s+(?:a\s+)?(?:deep\s+)?(?:research\s+)?(?:on|about)?\s*/i, '')
    .replace(/^(?:please\s+)?(?:write|draft|create|generate|research|publish)\s+/i, '')
    .trim();

  if (!clean) clean = String(directive).trim();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

// Directives Parser - Emergency Focus Mode
async function parseBoardroomDirective(db, directive) {
  const cleanTopic = extractCleanTopic(directive);

  // 1. STOP ALL OTHER AI WORK: Clear any pending or in-progress tasks
  const activeTasks = (db.tasks || []).filter(t => t.status !== 'completed');
  if (activeTasks.length > 0) {
    console.log(`Boardroom topic override: Cancelling ${activeTasks.length} active/pending task(s).`);
    db.tasks = (db.tasks || []).filter(t => t.status === 'completed');
    setAgentStatus(db, 'System', 'Active', `🚨 BOARDROOM EMERGENCY DIRECTIVE: Stopped all ${activeTasks.length} pending task(s). Diverting 100% agent focus to boardroom topic: "${cleanTopic}".`);
  }

  // 2. Extract URLs and scrape content + fetch Google News deep research
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = directive.match(urlRegex) || [];
  let scrapedInfo = '';
  for (const url of urls) {
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    const scrapedText = await scrapeWebpage(cleanUrl);
    scrapedInfo += `\n\n--- Source Webpage Content (${cleanUrl}) ---\n${scrapedText}\n`;
  }

  // Deep research using Google News RSS search
  setAgentStatus(db, 'Alex', 'Conducting deep Google News research...');
  setAgentStatus(db, 'System', 'Active', `🔎 Alex conducting deep research on Google News for topic: "${cleanTopic.slice(0, 50)}..."`);
  const newsResults = await fetchGoogleNews(cleanTopic);
  let googleNewsResearch = '';
  if (newsResults.length > 0) {
    googleNewsResearch = `\n\n--- GOOGLE NEWS DEEP RESEARCH FINDINGS ---\n` +
      newsResults.map((item, i) => `#${i+1}: ${item.title}\nSource: ${item.source} (${item.pubDate})\nSnippet: ${item.description}\nLink: ${item.link}`).join('\n\n');
  }

  const finalDirective = `TOPIC: ${cleanTopic}\nOriginal Directive: ${directive}${scrapedInfo}${googleNewsResearch}`;
  const deadlineMs = Date.now() + 30 * 60 * 1000;
  const deadlineIso = new Date(deadlineMs).toISOString();

  const openai = getDeepseekClient(db.config);
  const headline = `${cleanTopic}: Timeline & In-Depth Analysis`;
  
  if (!openai) {
    await simulateMockBoardroomParsing(db, directive, finalDirective, deadlineIso);
    return;
  }

  setAgentStatus(db, 'Alex', 'Formulating emergency article briefing');
  try {
    const prompt = `You are Alex, the AI Manager of Quantum Qbit Virtual Company.
The Board of Directors has issued an EMERGENCY HIGH-PRIORITY DIRECTIVE:
Subject/Topic: "${cleanTopic}"
Raw User Prompt: "${directive}"

DEEP RESEARCH SOURCE DOSSIER:
${finalDirective}

ALL OTHER WORK IS STOPPED. The team MUST complete deep research and publish a full, comprehensive, high-quality article about this topic within 30 MINUTES.

IMPORTANT TITLE RULE: The task title MUST be a publishable headline (e.g. "${headline}"). DO NOT include words like "Write an article about" or "Draft a blog on" in the title.

Respond ONLY with a JSON object:
{
  "tasks": [
    {
      "title": "${headline}",
      "description": "DEEP RESEARCH ARTICLE BRIEF:\n1. Topic: ${cleanTopic}\n2. Target Deadline: 30 minutes.\n3. Detailed Source Material & Deep Research:\n${finalDirective}\n4. Requirements: Write a comprehensive 800+ word article detailing key timeline of events, background facts, and major developments.",
      "type": "blog",
      "assignee": "Mark"
    }
  ]
}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tasks = result.tasks || result.taskList || (Array.isArray(result) ? result : Object.values(result)[0]) || [];

    setAgentStatus(db, 'Alex', 'Idle');

    if (tasks.length > 0) {
      for (const t of tasks) {
        const newTask = {
          id: 'task-boardroom-' + Math.random().toString(36).substr(2, 9),
          title: t.title || headline,
          description: t.description || finalDirective,
          type: t.type || 'blog',
          assignee: t.assignee || 'Mark',
          status: 'todo',
          isEmergency: true,
          directiveTopic: cleanTopic,
          deadline: deadlineIso,
          draftContent: '',
          reviews: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.tasks.push(newTask);

        db.chatLogs.push({
          id: 'msg-' + Date.now() + Math.random(),
          sender: 'Alex',
          text: `🚨 BOARDROOM DIRECTIVE RECEIVED! All AI operations stopped. Conducted deep research and assigned task "${newTask.title}" to @${newTask.assignee} (30-minute deadline).`,
          timestamp: new Date().toISOString(),
          taskId: newTask.id
        });

        setAgentStatus(db, 'System', 'Active', `🔥 30-MINUTE EMERGENCY FOCUS: @${newTask.assignee} assigned to draft article on "${newTask.title}". Target deadline: 30 mins.`);
      }
    } else {
      await simulateMockBoardroomParsing(db, directive, finalDirective, deadlineIso);
    }
  } catch (err) {
    console.error("Deepseek boardroom parsing error:", err.message);
    setAgentStatus(db, 'Alex', 'Idle');
    await simulateMockBoardroomParsing(db, directive, finalDirective, deadlineIso);
  }
}

async function simulateMockBoardroomParsing(db, directive, finalDirective = '', deadlineIso = null) {
  if (!deadlineIso) {
    deadlineIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  }

  const cleanTopic = extractCleanTopic(directive);
  const headline = `${cleanTopic}: Timeline & In-Depth Analysis`;

  const newTask = {
    id: 'task-boardroom-' + Math.random().toString(36).substr(2, 9),
    title: headline,
    description: `BOARDROOM HIGH-PRIORITY DIRECTIVE (30-Min Deadline):\nTopic: ${cleanTopic}\n\nDeep Research Context:\n${finalDirective || directive}`,
    type: 'blog',
    assignee: 'Mark',
    status: 'todo',
    isEmergency: true,
    directiveTopic: cleanTopic,
    deadline: deadlineIso,
    draftContent: '',
    reviews: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  db.tasks.push(newTask);

  db.chatLogs.push({
    id: 'msg-' + Date.now(),
    sender: 'Alex',
    text: `🚨 Boardroom topic received! All current work stopped. @Mark is starting deep research & drafting for "${newTask.title}" (30-minute deadline).`,
    timestamp: new Date().toISOString(),
    taskId: newTask.id
  });

  setAgentStatus(db, 'System', 'Active', `🔥 30-MINUTE EMERGENCY FOCUS MODE ACTIVE: Mark drafting article on "${newTask.title}".`);
}

// ─── WEBPAGE SCRAPER ──────────────────────────────────────────────────────────

async function scrapeWebpage(url) {
  try {
    console.log(`Scraping source webpage: ${url}`);
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return `(Failed to fetch webpage: HTTP ${response.status})`;
    const html = await response.text();
    
    // Remove scripts, styles, head, nav, footer
    let cleanHtml = html
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer>[\s\S]*?<\/footer>/gi, '');
      
    // Extract paragraph text content
    const pMatches = [...cleanHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)];
    if (pMatches.length > 0) {
      const paragraphs = pMatches.map(m => {
        return m[1]
          .replace(/<[^>]+>/g, '') // Strip HTML tags
          .replace(/\s+/g, ' ')    // Condense whitespaces
          .trim();
      }).filter(text => text.length > 20);
      
      if (paragraphs.length > 0) {
        return paragraphs.slice(0, 30).join('\n\n').slice(0, 4000);
      }
    }
    
    // Fallback: Strip all HTML tags
    const textOnly = cleanHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return textOnly.slice(0, 3500);
  } catch (err) {
    console.error("Scraper error:", err.message);
    return `(Error reading webpage: ${err.message})`;
  }
}

// ─── RESEARCH SCRAPING ──────────────────────────────────────────────────────────

function getMockTrendsFallback(geo = 'IN') {
  if (geo === 'IN') {
    return [
      { title: 'UPSSSC Lower PCS Graduate Level 2026', traffic: '500K+', trafficNumeric: 500000, pubDate: new Date(Date.now() - 2 * 3600000).toUTCString(), hoursSinceStart: 2, growthScore: 166667, newsTitle: 'UPSSSC Combined Lower Subordinate Services Notification out for 2285 Posts', newsUrl: 'https://upsssc.gov.in', picture: '' },
      { title: 'ISRO TA Recruitment CS Syllabus', traffic: '100K+', trafficNumeric: 100000, pubDate: new Date(Date.now() - 1 * 3600000).toUTCString(), hoursSinceStart: 1, growthScore: 50000, newsTitle: 'ISRO releases syllabus for Technical Assistant Computer Science PYQ CBT Exam', newsUrl: 'https://www.isro.gov.in', picture: '' },
      { title: 'Aadhaar Masking PDF Download', traffic: '100K+', trafficNumeric: 100000, pubDate: new Date(Date.now() - 5 * 3600000).toUTCString(), hoursSinceStart: 5, growthScore: 16667, newsTitle: 'UIDAI issues guidelines on downloading masked Aadhaar for privacy', newsUrl: 'https://uidai.gov.in', picture: '' },
      { title: 'IBPS RRB Clerk Online Form', traffic: '200K+', trafficNumeric: 200000, pubDate: new Date(Date.now() - 12 * 3600000).toUTCString(), hoursSinceStart: 12, growthScore: 15385, newsTitle: 'IBPS RRB Clerk and PO vacancies announced, apply online now', newsUrl: 'https://ibps.in', picture: '' },
      { title: 'Deepseek V3 API Launch', traffic: '50K+', trafficNumeric: 50000, pubDate: new Date(Date.now() - 3 * 3600000).toUTCString(), hoursSinceStart: 3, growthScore: 12500, newsTitle: 'Deepseek launches its powerful new coder models globally', newsUrl: 'https://deepseek.com', picture: '' }
    ];
  } else {
    return [
      { title: 'WWDC 2026 Apple Intelligence', traffic: '500K+', trafficNumeric: 500000, pubDate: new Date(Date.now() - 3 * 3600000).toUTCString(), hoursSinceStart: 3, growthScore: 125000, newsTitle: 'Apple announces major updates to its local client-side processing core', newsUrl: 'https://apple.com', picture: '' },
      { title: 'ChatGPT Search Chrome Extension', traffic: '200K+', trafficNumeric: 200000, pubDate: new Date(Date.now() - 2 * 3600000).toUTCString(), hoursSinceStart: 2, growthScore: 66667, newsTitle: 'OpenAI rolls out official browser search integration', newsUrl: 'https://openai.com', picture: '' },
      { title: 'GitHub Actions Security Policy', traffic: '100K+', trafficNumeric: 100000, pubDate: new Date(Date.now() - 6 * 3600000).toUTCString(), hoursSinceStart: 6, growthScore: 14286, newsTitle: 'GitHub updates rules on workflow dispatches and branch permissions', newsUrl: 'https://github.com', picture: '' }
    ];
  }
}

async function fetchGoogleNews(query = '') {
  let url = 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en';
  if (query && query.trim()) {
    url = `https://news.google.com/rss/search?q=${encodeURIComponent(query.trim())}&hl=en-IN&gl=IN&ceid=IN:en`;
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    
    const articles = [];
    matches.forEach(m => {
      const itemXml = m[1];
      let title = (itemXml.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
      title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
      let link = (itemXml.match(/<link>([^<]+)<\/link>/i) || [])[1] || '';
      let pubDate = (itemXml.match(/<pubDate>([^<]+)<\/pubDate>/i) || [])[1] || '';
      let source = (itemXml.match(/<source[^>]*>([^<]+)<\/source>/i) || [])[1] || 'Google News';
      let description = (itemXml.match(/<description>([\s\S]*?)<\/description>/i) || [])[1] || '';
      description = description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

      if (title) {
        articles.push({ title, link, pubDate, source, description });
      }
    });

    return articles.slice(0, 10);
  } catch (err) {
    console.error(`Error fetching Google News (${query}):`, err.message);
    return [];
  }
}

async function fetchGoogleTrends(geo = 'IN') {
  const url = `https://trends.google.com/trending/rss?geo=${geo}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      console.log(`Failed to fetch Google Trends RSS (HTTP ${res.status}), returning fallback mock trends.`);
      return getMockTrendsFallback(geo);
    }
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
    
    const trends = [];
    
    matches.forEach(m => {
      const itemXml = m[1];
      let title = (itemXml.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
      title = title.replace(/&amp;/g, '&').trim();
      
      const traffic = (itemXml.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/i) || [])[1] || '10K+';
      const pubDate = (itemXml.match(/<pubDate>([^<]+)<\/pubDate>/i) || [])[1] || '';
      const newsTitle = (itemXml.match(/<ht:news_item_title>([^<]+)<\/ht:news_item_title>/i) || [])[1] || '';
      const newsUrl = (itemXml.match(/<ht:news_item_url>([^<]+)<\/ht:news_item_url>/i) || [])[1] || '';
      const picture = (itemXml.match(/<ht:picture>([^<]+)<\/ht:picture>/i) || [])[1] || '';
      
      // Parse traffic to numeric
      let trafficNumeric = 0;
      const cleanTraffic = traffic.replace(/[,+\s]/g, '').toLowerCase();
      if (cleanTraffic.includes('k')) {
        trafficNumeric = parseFloat(cleanTraffic.replace('k', '')) * 1000;
      } else if (cleanTraffic.includes('m')) {
        trafficNumeric = parseFloat(cleanTraffic.replace('m', '')) * 1000000;
      } else {
        trafficNumeric = parseInt(cleanTraffic, 10) || 10000;
      }
      
      // Calculate hours since publication
      const pubTime = pubDate ? new Date(pubDate).getTime() : Date.now();
      const hoursSinceStart = Math.max(0.1, (Date.now() - pubTime) / (1000 * 60 * 60));
      
      // Compute growth score: traffic / (hoursSinceStart + 1)
      const growthScore = Math.round(trafficNumeric / (hoursSinceStart + 1.0));
      
      trends.push({
        title,
        traffic,
        trafficNumeric,
        pubDate,
        hoursSinceStart: Math.round(hoursSinceStart * 10) / 10,
        growthScore,
        newsTitle,
        newsUrl,
        picture
      });
    });
    
    // Sort by growthScore (highest growth first)
    trends.sort((a, b) => b.growthScore - a.growthScore);
    
    return trends;
  } catch (err) {
    console.error(`Error fetching Google Trends for ${geo}:`, err.message);
    return getMockTrendsFallback(geo);
  }
}

async function fetchXTrends() {
  const trends = [];
  try {
    const res = await fetch('https://trends24.in/india/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const html = await res.text();
      const hashtagMatches = [...html.matchAll(/#([A-Za-z][A-Za-z0-9_]{2,40})/g)];
      hashtagMatches.slice(0, 10).forEach(m => trends.push('#' + m[1]));
    }
  } catch { /* skip */ }
  return trends;
}

async function fetchGovtJobUpdates() {
  const jobs = [];
  try {
    const res = await fetch('https://www.indgovtjobs.in/feeds/posts/default?alt=rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (res.ok) {
      const xml = await res.text();
      const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
      
      matches.forEach(m => {
        const itemXml = m[1];
        let title = (itemXml.match(/<title>([^<]+)<\/title>/i) || [])[1] || '';
        title = title.replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
        
        // Filter out generic aggregate listings and keep actual job postings
        const isJobListing = /Recruitment|Vacancy|Apply|Posts|Officer|Scientist|Clerk|Assistant|Engineer|Apprentice|Technician|Faculty|Stenographer|Teacher|Driver|Bharti/i.test(title);
        const isGenericList = /Closing Today|Last Date|Latest.*Job|Govt Jobs.*202/i.test(title);
        
        if (isJobListing && !isGenericList && !jobs.includes(title)) {
          jobs.push(title);
        }
      });
    }
  } catch (err) {
    console.error("Error fetching jobs RSS:", err.message);
  }
  
  if (jobs.length === 0) {
    return [
      "UPSSSC Combined Lower Subordinate Services Recruitment 2026 (2285 Posts)",
      "ISRO Technical Assistant (Computer Science) Exam Notification 2026",
      "IBPS RRB Officer Scale I & Office Assistant Online Form 2026",
      "SSC Combined Graduate Level (CGL) Exam 2026",
      "UPSC Civil Services Examination (IAS/IFS) Notification 2026"
    ];
  }
  
  return jobs.slice(0, 10);
}

function getExistingBlogTitles() {
  const titles = new Set();
  try {
    if (fs.existsSync(blogsJsonPath)) {
      const blogs = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
      blogs.forEach(b => b.title && titles.add(b.title));
    }
  } catch { /* skip */ }
  try {
    const db = readDB();
    if (Array.isArray(db.publishedTopics)) {
      db.publishedTopics.forEach(t => t && titles.add(t));
    }
  } catch { /* skip */ }
  return Array.from(titles);
}

function recordPublishedTopic(db, title) {
  if (!Array.isArray(db.publishedTopics)) db.publishedTopics = [];
  if (!db.publishedTopics.includes(title)) {
    db.publishedTopics.push(title);
    if (db.publishedTopics.length > 200) {
      db.publishedTopics = db.publishedTopics.slice(-200);
    }
  }
}

// ─── AGENT STATE MACHINE OPERATIONS ───────────────────────────────────────────

async function executeAgentWork(db, task, openai) {
  const assignee = task.assignee;
  setAgentStatus(db, assignee, `Drafting content for ${task.title}`);
  setAgentStatus(db, 'System', 'Active', `✍️ ${assignee} started drafting: "${task.title}"`);
  writeDB(db);

  if (!openai) {
    task.draftContent = getMockDraftContent(task);
    task.status = 'manager_review';
    task.updatedAt = new Date().toISOString();
    setAgentStatus(db, assignee, 'Idle');
    addSystemMsg(db, assignee, `Draft complete for "${task.title}". @Alex, please check my submission!`, task.id);
    return true;
  }

  try {
    let prompt = '';
    if (task.type === 'blog') {

      // For trends campaigns: fetch live data and inject it into the prompt
      let liveResearchContext = task.description;
      const isTrendsCampaign = task.title.includes('Trending Article') || task.title.includes('Research and Publish');
      const isJobsCampaign = task.title.includes('Job Vacancy') || task.title.includes('Job') || task.description.includes('sarkariresult');

      if (isTrendsCampaign) {
        setAgentStatus(db, 'System', 'Active', '🌐 Mark is fetching live Google Trends (India) to find the highest-volume topic...');
        writeDB(db);

        const [trendsIndia, trendsGlobal, govtJobs] = await Promise.all([
          fetchGoogleTrends('IN'),
          fetchGoogleTrends('US'),
          fetchGovtJobUpdates()
        ]);

        const existingTitles = getExistingBlogTitles();

        if (trendsIndia.length > 0) {
          setAgentStatus(db, 'System', 'Active', `📊 Fetched ${trendsIndia.length} trending topics from India:`);
          trendsIndia.slice(0, 5).forEach((t, i) => {
            setAgentStatus(db, 'Mark', 'Researching', `  #${i+1}: ${t.title} (${t.traffic}, Growth: ${t.growthScore})`);
          });
          if (govtJobs.length > 0) {
            setAgentStatus(db, 'System', 'Active', `📋 Latest Govt Jobs: ${govtJobs[0]}`);
          }
          writeDB(db);
        }

        const trendsIndiaText = trendsIndia.slice(0, 8).map((t, i) => 
          `#${i+1}: ${t.title} (Volume: ${t.traffic}, Started: ${t.hoursSinceStart}h ago, Growth Score: ${t.growthScore})`
        ).join('\n');

        const trendsGlobalText = trendsGlobal.slice(0, 5).map((t, i) => 
          `#${i+1}: ${t.title} (Volume: ${t.traffic}, Started: ${t.hoursSinceStart}h ago, Growth Score: ${t.growthScore})`
        ).join('\n');

        liveResearchContext = `
TASK: Pick the SINGLE topic with the highest growth rate/score from the data below, that has NOT been published before, and write a detailed article about ONLY that topic.

GOOGLE TRENDS - INDIA (growth ranked):
${trendsIndiaText}

GOOGLE TRENDS - GLOBAL:
${trendsGlobalText}

LATEST GOVT JOB NOTIFICATIONS:
${govtJobs.slice(0, 5).join('\n')}

ALREADY PUBLISHED (DO NOT REPEAT):
${existingTitles.slice(-15).join('\n')}

Select the top growth topic. State which topic you chose, its search volume, and started time in the opening.`;

        setAgentStatus(db, 'System', 'Active', '🤖 Mark is picking the top-growth topic and drafting the article now...');
        writeDB(db);
      }

      if (isJobsCampaign && !isTrendsCampaign) {
        setAgentStatus(db, 'System', 'Active', '🏛️ Mark is fetching latest government job vacancies...');
        writeDB(db);

        const govtJobs = await fetchGovtJobUpdates();
        if (govtJobs.length > 0) {
          setAgentStatus(db, 'System', 'Active', `📋 Found ${govtJobs.length} job listings. Top: "${govtJobs[0]}"`);
          writeDB(db);
          liveResearchContext = task.description + `\n\nLATEST JOB LISTINGS FETCHED LIVE:\n${govtJobs.slice(0, 8).join('\n')}\n\nPick the SINGLE most recent/active listing from above and write the full structured article for it.`;
        }
      }

      prompt = `You are ${assignee}, the Marketing specialist for quantumqbit.in — a privacy-first browser utilities website popular in India.
Your task is to write a highly informative, news-driven, and timely blog post.
Title hint: "${task.title}"
Research context & background: "${liveResearchContext}"

IMPORTANT RULES:
1. The article must focus specifically and deeply on ONE selected news event, announcement, or trend. Avoid writing generic listicles (e.g. "5 things", "5 ways", "5 trends") or timeless generic facts. Write about what is happening right now in the world or in India.
2. The TITLE must be highly engaging, professional, and specific to the event/topic (do NOT prefix with generic clickbait words like "Alert:", "Shocking:", "Warning:", etc. unless it is a contextually critical warning).
3. The content must be ORIGINAL, IN-DEPTH, and provide practical steps or analyses for the reader.
4. The content should be optimized for your audience, connecting to real-world contexts (e.g. Indian government portals, salaries, CS topics, privacy security events).
5. Content length: minimum 600 words with proper HTML structure. Use h2, h3, p, ul, li, strong, blockquote. Do NOT write markdown code fences (no raw markdown or code blocks).
6. Naturally weave in how quantumqbit.in's browser utilities (like offline PDF compressor, image cropper, base calculators) solve a specific problem related to this topic.
7. Add a catchy EXCERPT (2-3 sentences) that summarizes the news and compels the reader to read the full article.
8. Pick the MOST RELEVANT category: "privacy-security" | "computer-science" | "creative-tech" | "general-utilities".
9. If this is a job update, exam notification, or hiring announcement (e.g. category is "Government jobs" or "Private sector jobs" or if the title contains terms like "recruitment", "exam", "bharti", "job", "vacancy"):
   - You MUST format the core details of the job (Important Dates, Application Fees, Age Limit, Vacancy Details, and Useful Links) in a clean, highly structured HTML table with the class "job-details-table".
   - Place "Important Dates" (e.g. Application Begin, Last Date, Correction, Exam Date) in one column (td), and "Application Fee" (e.g. General, OBC, SC, ST fees, and payment modes) in the adjacent column (td) in the same row.
   - Use other rows or nested structures for "Age Limit as on [Date]" and "Vacancy Details / Eligibility".
   - Use CSS classes like "highlight-red" for dates, "highlight-green" for fees, and "highlight-cyan" for vacancy totals.
   - Format the "Useful Important Links" section as a sub-table or clear links within the table (e.g. Download Notification, Apply Online) that point to placeholders or relevant URLs.
   - Keep the design clean, tabular, and highly structured, similar to sarkariresult.com but in modern dark cyber theme (using our CSS class job-details-table).

Respond with a JSON object with EXACTLY these keys:
{
  "title": "Engaging news/guide title",
  "excerpt": "A compelling 2-3 sentence teaser summarizing the timely topic",
  "content": "Full blog post in HTML structure (NO markdown fences, raw HTML)",
  "category_id": "privacy-security" | "computer-science" | "creative-tech" | "general-utilities",
  "imageGlow": "CSS RGBA glow color e.g. 'rgba(0, 242, 254, 0.15)'"
}`;
    } else if (task.type === 'social') {
      prompt = `You are ${assignee}, the Social Media specialist. Create a promotional social media campaign for:
Title: "${task.title}"
Description: "${task.description}"

Respond with a JSON object containing:
{
  "platform": "Twitter/LinkedIn",
  "postText": "The actual text of the post, including emojis and hashtags.",
  "recommendations": "Advice on target audience and optimal posting time."
}`;
    } else {
      prompt = `You are ${assignee}, the specialist. Complete the following task:
Title: "${task.title}"
Description: "${task.description}"

Respond with a JSON object containing:
{
  "summary": "Summary of actions taken",
  "details": "Technical detail, code edits, or policy drafts."
}`;
    }

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    task.draftContent = result;
    task.status = 'manager_review';
    task.updatedAt = new Date().toISOString();
    setAgentStatus(db, assignee, 'Idle');
    const wordCount = result.content ? result.content.split(' ').length : 0;
    setAgentStatus(db, assignee, `📄 Draft complete for "${result.title || task.title}" — ${wordCount} words, category: ${result.category_id || 'n/a'}. Sending to Alex for review.`);
    addSystemMsg(db, assignee, `I've finished drafting the work for "${task.title}". @Alex, please check my submission!`, task.id);
    return true;
  } catch (err) {
    console.error("Deepseek agent drafting failed:", err.message);
    task.draftContent = getMockDraftContent(task);
    task.status = 'manager_review';
    task.updatedAt = new Date().toISOString();
    setAgentStatus(db, assignee, 'Idle');
    addSystemMsg(db, assignee, `Draft complete (Fallback simulation) for "${task.title}". @Alex, please check.`, task.id);
    return true;
  }
}

async function executeManagerReview(db, task, openai) {
  setAgentStatus(db, 'Alex', `Reviewing work for ${task.title}`);
  setAgentStatus(db, 'System', 'Active', `🔍 Alex (Manager) reviewing draft for "${task.title}"...`);
  writeDB(db);
  const draftString = typeof task.draftContent === 'object' ? JSON.stringify(task.draftContent, null, 2) : task.draftContent;

  if (!openai) {
    task.reviews.push({
      agent: 'Alex',
      reviewText: "The drafted content matches the criteria perfectly. Submitting to CEO.",
      decision: 'approved',
      timestamp: new Date().toISOString()
    });
    task.status = 'ceo_approval';
    task.updatedAt = new Date().toISOString();
    setAgentStatus(db, 'Alex', 'Idle');
    addSystemMsg(db, 'Alex', `@Sophia, I've reviewed the submission from @${task.assignee} for "${task.title}". It looks excellent. Ready for your executive approval.`, task.id);
    return true;
  }

  try {
    const prompt = `You are Alex, the Manager. Review the following draft task submitted by ${task.assignee}:
Task: "${task.title}"
Description: "${task.description}"
Draft content:
${draftString}

Assess if it meets the requirements. If it's good, approve it.
Respond with a JSON object:
{
  "decision": "approved" | "rejected",
  "reviewText": "Constructive feedback on what is good or what needs editing."
}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    task.reviews.push({
      agent: 'Alex',
      reviewText: result.reviewText,
      decision: result.decision,
      timestamp: new Date().toISOString()
    });

    if (result.decision === 'approved') {
      task.status = 'ceo_approval';
      setAgentStatus(db, 'System', 'Active', `✅ Alex approved draft for "${task.title}". Forwarding to Sophia (CEO) for final sign-off.`);
      addSystemMsg(db, 'Alex', `Draft for "${task.title}" is approved by me. @Sophia, please review and give the final sign-off! Notes: ${result.reviewText}`, task.id);
    } else {
      task.status = 'todo'; // Rework
      setAgentStatus(db, 'System', 'Active', `🔄 Alex rejected draft for "${task.title}". Sending back to ${task.assignee} for revision.`);
      addSystemMsg(db, 'Alex', `I've rejected the draft for "${task.title}". @${task.assignee}, please revise based on feedback: ${result.reviewText}`, task.id);
    }

    task.updatedAt = new Date().toISOString();
    setAgentStatus(db, 'Alex', 'Idle');
    return true;
  } catch (err) {
    console.error("Deepseek manager review failed:", err.message);
    task.status = 'ceo_approval';
    task.reviews.push({
      agent: 'Alex',
      reviewText: "Approved (Fallback review). looks good.",
      decision: 'approved',
      timestamp: new Date().toISOString()
    });
    setAgentStatus(db, 'Alex', 'Idle');
    return true;
  }
}

async function executeCEOApproval(db, task, openai) {
  setAgentStatus(db, 'Sophia', `Evaluating ${task.title}`);
  setAgentStatus(db, 'System', 'Active', `👑 Sophia (CEO) evaluating "${task.title}" for final approval...`);
  writeDB(db);
  const draftString = typeof task.draftContent === 'object' ? JSON.stringify(task.draftContent, null, 2) : task.draftContent;

  let decision = 'approved';
  let reviewText = 'Outstanding work. Ready to deploy live.';

  if (openai) {
    try {
      const prompt = `You are Sophia, the CEO of Quantum Qbit. You have the final approval on website updates.
Review the following work that has been approved by Manager Alex:
Task: "${task.title}"
Assignee: "${task.assignee}"
Draft:
${draftString}

Respond with a JSON object:
{
  "decision": "approved" | "rejected",
  "reviewText": "Your executive remarks. Be professional, direct, and encouraging if approved."
}`;

      const response = await openai.chat.completions.create({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      });

      const result = JSON.parse(response.choices[0].message.content);
      decision = result.decision;
      reviewText = result.reviewText;
    } catch (err) {
      console.error("Deepseek CEO approval failed:", err.message);
    }
  }

  task.reviews.push({
    agent: 'Sophia',
    reviewText,
    decision,
    timestamp: new Date().toISOString()
  });

  if (decision === 'approved') {
    task.status = 'completed';
    setAgentStatus(db, 'Sophia', 'Idle');
    setAgentStatus(db, 'System', 'Active', `🚀 CEO approved! Deployer is publishing "${task.title}" to the live website now...`);
    addSystemMsg(db, 'Sophia', `Approved! Excellent job @${task.assignee}. @Deployer, please push this update live. Executive Notes: ${reviewText}`, task.id);
    
    // Deployment
    executeDeployment(db, task);
    return true;
  } else {
    task.status = 'todo'; // Rework
    setAgentStatus(db, 'Sophia', 'Idle');
    setAgentStatus(db, 'System', 'Active', `⚠️ CEO rejected "${task.title}". Sending back for revision. Feedback: ${reviewText}`);
    addSystemMsg(db, 'Sophia', `Rejected at CEO level. @Alex, coordinate with @${task.assignee} to rebuild. Feedback: ${reviewText}`, task.id);
    return true;
  }
}

function updateSitemap(slug) {
  const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.log(`Sitemap not found at: ${sitemapPath}`);
    return;
  }
  try {
    let sitemap = fs.readFileSync(sitemapPath, 'utf8');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if slug is already in sitemap
    const locUrl = `https://quantumqbit.in/blogs/${slug}`;
    if (sitemap.includes(locUrl)) {
      console.log(`Sitemap already contains URL: ${locUrl}`);
      return;
    }
    
    const newUrlNode = `  <url>\n    <loc>${locUrl}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`;
    sitemap = sitemap.replace('</urlset>', newUrlNode);
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
    console.log(`Sitemap successfully updated with URL: ${locUrl}`);
  } catch (err) {
    console.error("Failed to update sitemap:", err.message);
  }
}

function executeDeployment(db, task) {
  setAgentStatus(db, 'Deployer', `Deploying changes for ${task.title}`);
  let deployLog = 'Deployed successfully.';
  let deployFailed = false;

  if (task.type === 'blog') {
    try {
      let currentBlogs = [];
      if (fs.existsSync(blogsJsonPath)) {
        currentBlogs = JSON.parse(fs.readFileSync(blogsJsonPath, 'utf8'));
      }

      const draft = task.draftContent || {};
      const newPostTitle = draft.title || task.title;
      
      let slug = newPostTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/[\s-]+/g, '-').trim();
      let originalSlug = slug;
      let counter = 1;
      while (currentBlogs.some(p => p.id === slug)) {
        slug = originalSlug + '-' + counter;
        counter++;
      }

      const newBlogPost = {
        id: slug,
        title: newPostTitle,
        excerpt: draft.excerpt || task.description,
        content: draft.content || `<p>${task.description}</p>`,
        author: 'Quantum AI Writer',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) + ' ' + new Date().toTimeString().split(' ')[0],
        readTime: draft.content ? `${Math.max(1, Math.ceil(draft.content.split(' ').length / 200))} min read` : '3 min read',
        category: getCategoryNameFromId(draft.category_id),
        category_id: draft.category_id || 'privacy-security',
        imageGlow: draft.imageGlow || 'rgba(0, 242, 254, 0.1)',
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updated_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      currentBlogs.unshift(newBlogPost);
      fs.writeFileSync(blogsJsonPath, JSON.stringify(currentBlogs, null, 2), 'utf8');
      updateSitemap(slug);

      db.config.lastRunTimestamp = new Date().toISOString();
      deployLog = `Published blog post "${newPostTitle}" with slug "${slug}".`;
    } catch (err) {
      console.error("Failed to write blogs.json:", err.message);
      deployLog = `Failed to write blogs.json: ${err.message}`;
      deployFailed = true;
    }
  } else {
    db.config.lastRunTimestamp = new Date().toISOString();
    deployLog = `Simulated feature deployment completed for layout update: "${task.title}".`;
  }

  addSystemMsg(db, 'Deployer', deployFailed 
    ? `Deployment failed for "${task.title}". Log: ${deployLog}`
    : `Deployment successful for "${task.title}"! Changes are staged. Log: ${deployLog}`, task.id);

  if (!deployFailed) {
    setAgentStatus(db, 'System', 'Idle', `🎉 PUBLISHED: "${task.title}" is now live on quantumqbit.in — ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`);
  }

  setAgentStatus(db, 'Deployer', 'Idle');
  task.updatedAt = new Date().toISOString();
}

function getCategoryNameFromId(id) {
  switch (id) {
    case 'privacy-security': return 'Privacy & Security';
    case 'computer-science': return 'Computer Science';
    case 'creative-tech': return 'Creative Tech';
    case 'general-utilities': return 'General Utilities';
    default: return 'Privacy & Security';
  }
}

// Brainstorming
async function handleAutoBrainstorm(db, openai) {
  const lastBrainstorm = db.config.lastBrainstormTimestamp;
  const intervalMinutes = db.config.automationIntervalMinutes || 60;
  const cooldownMs = 1000 * 60 * Math.max(5, intervalMinutes - 10); // 10 minutes grace period, minimum 5 minutes

  if (lastBrainstorm && (Date.now() - new Date(lastBrainstorm).getTime() < cooldownMs)) {
    console.log("Brainstorm cooldown active, skipping brainstorming cycle.");
    return false; // Cooldown
  }

  db.config.lastBrainstormTimestamp = new Date().toISOString();

  if (!openai) {
    console.log("No Deepseek API key, skipping brainstorm topic generation.");
    return false;
  }

  console.log("Marketing agent Mark is gathering live trending data to brainstorm...");
  setAgentStatus(db, 'Mark', 'Researching Google News and trending topics...');
  setAgentStatus(db, 'System', 'Active', '🔎 Mark is fetching Google News top headlines, Google Trends (India), global news, X hashtags, and Sarkari Result govt jobs...');
  writeDB(db);
  
  const [googleNews, trendsIndia, trendsGlobal, xTrends, govtJobs] = await Promise.all([
    fetchGoogleNews(''),
    fetchGoogleTrends('IN'),
    fetchGoogleTrends('US'),
    fetchXTrends(),
    fetchGovtJobUpdates()
  ]);

  setAgentStatus(db, 'System', 'Active', 
    `📊 Live Data fetched — Google News: ${googleNews.length} articles, Trends India: ${trendsIndia.length}, Global: ${trendsGlobal.length}, Govt jobs: ${govtJobs.length}`
  );
  if (googleNews.length > 0) {
    setAgentStatus(db, 'System', 'Active', `📰 Top Google News: "${googleNews[0].title}" [Source: ${googleNews[0].source}]`);
  }
  writeDB(db);

  const existingTitles = getExistingBlogTitles();
  console.log(`Gathered Google News & trends. Spawning brainstorm prompt...`);

  const googleNewsText = googleNews.slice(0, 8).map((n, i) =>
    `#${i+1}: ${n.title} (Source: ${n.source}, Date: ${n.pubDate})\n   Snippet: ${n.description}`
  ).join('\n');

  const trendsIndiaText = trendsIndia.slice(0, 8).map((t, i) => 
    `#${i+1}: ${t.title} (Volume: ${t.traffic}, Started: ${t.hoursSinceStart}h ago, Growth Score: ${t.growthScore})`
  ).join('\n');

  const trendsGlobalText = trendsGlobal.slice(0, 8).map((t, i) => 
    `#${i+1}: ${t.title} (Volume: ${t.traffic}, Started: ${t.hoursSinceStart}h ago, Growth Score: ${t.growthScore})`
  ).join('\n');

  try {
    const prompt = `You are Mark, the Marketing genius for quantumqbit.in — India's leading browser-based utility tools website.
We provide offline-first browser utilities (PDF compressor, image cropper/resizer, base calculators, unit converter).

=== LIVE RESEARCH DATA ===
LATEST GOOGLE NEWS HEADLINES:
${googleNewsText}

GOOGLE TRENDS (INDIA):
${trendsIndiaText}

GOOGLE TRENDS (GLOBAL / US):
${trendsGlobalText}

X/TWITTER HASHTAGS (INDIA):
${xTrends.slice(0,8).join('\n')}

LATEST GOVT NOTIFICATIONS:
${govtJobs.slice(0,6).join('\n')}

=== ALREADY PUBLISHED ARTICLES (STRICTLY AVOID REPEATING) ===
${existingTitles.slice(-20).join('\n')}

=== STRICT RULES ===
1. The new topic MUST be 100% different from the already-published list above.
2. Select exactly ONE specific trending topic or news item from the LIVE RESEARCH DATA above. Do NOT write generic "5 things", "5 trends", or listicle aggregations.
3. The topic must reflect a real-world event, news, or a specific guide that is highly relevant right now (e.g., a specific job application deadline, a new privacy leak news event, a newly released system/tool, or a specific trending query).
4. The title must be highly engaging, professional, and specific to the event/topic (do NOT prefix with generic clickbait words like "Alert:", "Shocking:", "Warning:", etc. unless it is a contextually critical warning). Examples: "How to Apply for the New Mahila Police Bharti 2026: Official Link and Requirements", "Google's New Aadhaar Masking Update: How to Download Your Masked Aadhaar Offline", "Why [TRENDING_TOPIC] Is Trending Globally Today: Complete Analysis".
5. Connect the topic naturally to quantumqbit.in utility tools (e.g., how to compress files for a specific job upload, convert numbers for a CS topic, or crop images offline for a specific portal).

Respond ONLY with a JSON object:
{
  "title": "Viral news/guide blog title",
  "category": "Government jobs" | "Private sector jobs" | "Technology & Privacy" | "India guides",
  "description": "Writer brief detailing: (1) target hook, (2) specific trending data details, (3) which quantumqbit.in tool to feature, (4) 3 target SEO keywords."
}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    setAgentStatus(db, 'Mark', 'Idle');

    if (result.title) {
      setAgentStatus(db, 'System', 'Active', `💡 Topic selected by Mark: "${result.title}" [Category: ${result.category || 'n/a'}]`);
      writeDB(db);
      recordPublishedTopic(db, result.title);

      const newTask = {
        id: 'task-' + Math.random().toString(36).substr(2, 9),
        title: result.title,
        description: result.description || '',
        category: result.category || '',
        type: 'blog',
        assignee: 'Mark',
        status: 'todo',
        draftContent: '',
        reviews: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.tasks.push(newTask);

      db.chatLogs.push({
        id: 'msg-' + Date.now(),
        sender: 'Alex',
        text: `📝 [NEW TOPIC QUEUED] @Mark will write "${newTask.title}" — researched from live trending data. Added to workflows!`,
        timestamp: new Date().toISOString(),
        taskId: newTask.id
      });
      return true;
    }
  } catch (err) {
    console.error("Auto brainstorm failed:", err.message);
    setAgentStatus(db, 'Mark', 'Idle');
  }
  return false;
}

function getMockDraftContent(task) {
  const rawTopic = task.directiveTopic || task.title || '';
  const cleanTitle = extractCleanTopic(rawTopic);

  const isJob = task.title.toLowerCase().includes('job') || 
                task.title.toLowerCase().includes('recruitment') || 
                task.title.toLowerCase().includes('vacancy') || 
                task.title.toLowerCase().includes('exam') || 
                task.title.toLowerCase().includes('bharti') || 
                task.title.toLowerCase().includes('upsssc') ||
                (task.description && (
                  task.description.toLowerCase().includes('job') ||
                  task.description.toLowerCase().includes('recruitment') ||
                  task.description.toLowerCase().includes('exam')
                ));
                
  if (isJob) {
    return {
      title: `${cleanTitle}: Official Notification & Details`,
      excerpt: `Latest recruitment notification for ${cleanTitle}. Apply online, check eligibility, age limit, selection criteria, important dates and fees.`,
      content: `<h2>${cleanTitle} Notification</h2>
<p>Here are the complete notification details, important dates, and eligibility criteria for ${cleanTitle}. Candidates can apply online through the official portal before the deadline. Make sure to prepare your documents and compress photo/signature files to correct upload size using browser-only local compression tools before submitting the form.</p>
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
  <tr>
    <td colspan="2">
      <div class="highlight-cyan" style="text-align: center; font-size: 1.1rem; margin-bottom: 8px;">Some Useful Important Links</div>
      <table style="width: 100%; border: none; margin: 0; background: transparent;">
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Apply Online:</strong></td>
          <td style="border: none; padding: 6px;"><a href="https://upsssc.gov.in" target="_blank">Click Here</a></td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Download Notification:</strong></td>
          <td style="border: none; padding: 6px;"><a href="#" target="_blank">Click Here</a></td>
        </tr>
        <tr style="background: transparent;">
          <td style="border: none; padding: 6px;"><strong>Official Website:</strong></td>
          <td style="border: none; padding: 6px;"><a href="https://upsssc.gov.in" target="_blank">UPSSSC Official Portal</a></td>
        </tr>
      </table>
    </td>
  </tr>
</table>
<p>Note: Remember to use local tools on quantumqbit.in to resize, crop and compress your photos and signatures. Since all processing happens in your browser locally, your personal and sensitive documents never reach third-party servers.</p>`,
      category_id: "general-utilities",
      imageGlow: "rgba(157, 78, 221, 0.15)"
    };
  }

  const topicLower = cleanTitle.toLowerCase();
  const headline = `${cleanTitle}: Key Timeline & Full Analysis`;
  const excerpt = `An in-depth report on ${cleanTitle}. Key background facts, full timeline of events, official statements, and major public implications.`;

  const content = `<h2>${cleanTitle}: Complete Overview & Analysis</h2>
<p>Recent developments regarding <strong>${cleanTitle}</strong> have drawn significant nationwide attention across administrative, public, and policy circles. Below is a detailed breakdown of the background facts, official statements, and the full timeline of events leading up to this point.</p>

<h3>Chronological Timeline of Events</h3>
<ul>
  <li><strong>Initial Inquiries & Public Pressure:</strong> Following widespread discussions and regulatory reviews regarding administrative policies, questions were raised in parliamentary sessions and public forums.</li>
  <li><strong>Official High-Level Meetings:</strong> Ministerial briefings and review panels convened to audit operational guidelines and examine key compliance factors.</li>
  <li><strong>Resignation & Administrative Transition:</strong> Formal resignation announcements and executive handovers were finalized to facilitate restructuring and transparent policy audits.</li>
</ul>

<h3>Key Background Context & Factors</h3>
<p>Understanding the broader context of <strong>${cleanTitle}</strong> requires examining recent policy shifts, ministerial reports, and public representations. Industry analysts point to key systemic challenges that necessitated immediate executive intervention.</p>

<h3>Public Impact & Next Steps</h3>
<p>As oversight committees continue their evaluation, stakeholders and citizens are tracking official announcements regarding upcoming appointments and structural reforms.</p>

<p><em>Note: Citizens and researchers reviewing news briefs and official documentation can utilize client-side tools on <strong>quantumqbit.in</strong> to process, crop, and convert files locally with 100% user data privacy.</em>`;

  return {
    title: headline,
    excerpt: excerpt,
    content: content,
    category_id: topicLower.includes('privacy') || topicLower.includes('security') ? 'privacy-security' : 'general-utilities',
    imageGlow: "rgba(0, 242, 254, 0.12)"
  };
}

// ─── MAIN CYCLE RUNNER LOOP ──────────────────────────────────────────────────────

async function runAutomationCycleStep(db, openai) {
  const tasks = db.tasks;
  const todoTask = tasks.find(t => t.status === 'todo');
  const reviewTask = tasks.find(t => t.status === 'manager_review');
  const approvalTask = tasks.find(t => t.status === 'ceo_approval');
  const inProgressTask = tasks.find(t => t.status === 'inprogress');

  if (todoTask) {
    todoTask.status = 'inprogress';
    todoTask.updatedAt = new Date().toISOString();
    setAgentStatus(db, todoTask.assignee, `Working on ${todoTask.title}`);
    db.chatLogs.push({
      id: 'msg-' + Date.now(),
      sender: todoTask.assignee,
      text: `Acknowledged, @Alex. Starting work on "${todoTask.title}". Brief: ${todoTask.description}`,
      timestamp: new Date().toISOString(),
      taskId: todoTask.id
    });
    return await executeAgentWork(db, todoTask, openai);
  }
  
  if (inProgressTask) {
    return await executeAgentWork(db, inProgressTask, openai);
  }
  
  if (reviewTask) {
    return await executeManagerReview(db, reviewTask, openai);
  }
  
  if (approvalTask) {
    return await executeCEOApproval(db, approvalTask, openai);
  }
  
  // If company is idle, brainstorm a new topic
  return await handleAutoBrainstorm(db, openai);
}

async function main() {
  console.log("=== Quantum AI Office Cloud Runner Starting ===");
  const db = readDB();
  
  setAgentStatus(db, 'System', 'Idle', '=== Runner process started on GitHub Actions ===');
  writeDB(db);
  
  // 1. Sync live updates from Hostinger
  try {
    setAgentStatus(db, 'System', 'Idle', 'Fetching boardroom directives and live chats from server...');
    writeDB(db);
    await syncLiveUpdates(db);
  } catch (e) {
    setAgentStatus(db, 'System', 'Idle', 'Live sync error: ' + e.message);
    writeDB(db);
  }
  
  if (!db.config.isAutomationActive) {
    console.log("Autonomous agent loop is disabled in configurations. Exiting.");
    setAgentStatus(db, 'System', 'Idle', 'Automation loop is disabled in configurations. Exiting.');
    writeDB(db);
    return;
  }

  const openai = getDeepseekClient(db.config);

  // Log what mode we're in and what task was loaded
  const pendingTasks = (db.tasks || []).filter(t => t.status !== 'completed');
  const campaignMode = db.config.campaignMode;

  if (pendingTasks.length > 0 && campaignMode) {
    // UI-triggered run
    const t = pendingTasks[0];
    const modeLabel = campaignMode === 'trends' ? '📈 TRENDS CAMPAIGN' : '💼 JOB VACANCY CAMPAIGN';
    setAgentStatus(db, 'System', 'Active', `${modeLabel} — Dashboard triggered. Task: "${t.title}" assigned to ${t.assignee}.`);
    // Clear campaignMode flag so hourly runs don't repeat this label
    db.config.campaignMode = null;
  } else if (pendingTasks.length > 0) {
    // Resuming existing pipeline (e.g. hourly cron picking up where last run left off)
    const t = pendingTasks[0];
    setAgentStatus(db, 'System', 'Active', `Resuming pipeline: "${t.title}" [status: ${t.status}] — assigned to ${t.assignee}.`);
  } else {
    // Autonomous hourly brainstorm mode
    setAgentStatus(db, 'System', 'Active', 'Running autonomous hourly brainstorm — checking live trends for new article topic...');
  }

  if (!openai) {
    setAgentStatus(db, 'System', 'Idle', 'Deepseek API key not set or invalid. Running in simulated offline mode.');
  } else {
    setAgentStatus(db, 'System', 'Idle', 'Deepseek client authorized successfully.');
  }
  writeDB(db);
  
  // 2. Run sequential cycles to process task pipeline end-to-end in one run
  let maxCycles = 10;
  let cycle = 0;
  let progress = true;

  while (progress && cycle < maxCycles) {
    console.log(`\n--- Running State Machine Cycle ${cycle + 1} ---`);

    // Log descriptive message about current pipeline state
    const tasks = db.tasks || [];
    const todoTask = tasks.find(t => t.status === 'todo');
    const inProgressTask = tasks.find(t => t.status === 'inprogress');
    const reviewTask = tasks.find(t => t.status === 'manager_review');
    const approvalTask = tasks.find(t => t.status === 'ceo_approval');

    if (todoTask) {
      setAgentStatus(db, 'System', 'Active', `[Cycle ${cycle + 1}] Task queued: "${todoTask.title}" — Assigning to ${todoTask.assignee}...`);
    } else if (inProgressTask) {
      setAgentStatus(db, 'System', 'Active', `[Cycle ${cycle + 1}] ${inProgressTask.assignee} is drafting content for "${inProgressTask.title}"...`);
    } else if (reviewTask) {
      setAgentStatus(db, 'System', 'Active', `[Cycle ${cycle + 1}] Alex (Manager) is reviewing draft for "${reviewTask.title}"...`);
    } else if (approvalTask) {
      setAgentStatus(db, 'System', 'Active', `[Cycle ${cycle + 1}] Sophia (CEO) is evaluating "${approvalTask.title}" for final approval...`);
    } else {
      setAgentStatus(db, 'System', 'Active', `[Cycle ${cycle + 1}] No pending tasks — brainstorming new topic from live trends...`);
    }
    writeDB(db);

    try {
      progress = await runAutomationCycleStep(db, openai);
    } catch (e) {
      setAgentStatus(db, 'System', 'Idle', `Error during cycle step ${cycle + 1}: ${e.message}`);
      writeDB(db);
      progress = false;
    }
    if (progress) {
      writeDB(db);
    }
    cycle++;
  }

  setAgentStatus(db, 'System', 'Idle', '=== Runner completed all cycle steps and finished successfully ===');
  writeDB(db);
  console.log("\n=== Quantum AI Office Cloud Runner Completed ===");
}

main().catch(err => {
  console.error("Runner crash error:", err);
  process.exit(1);
});
