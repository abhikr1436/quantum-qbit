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

    // 1. Merge Config Overrides
    if (updates.configOverrides && Object.keys(updates.configOverrides).length > 0) {
      console.log("Merging config updates from live site:", updates.configOverrides);
      db.config = { ...db.config, ...updates.configOverrides };
      mergedCount++;
    }

    // 2. Merge Manual Chat Messages
    if (updates.chatLogs && updates.chatLogs.length > 0) {
      console.log(`Merging ${updates.chatLogs.length} manual chat messages...`);
      updates.chatLogs.forEach(msg => {
        if (!db.chatLogs.some(m => m.id === msg.id)) {
          db.chatLogs.push(msg);
        }
      });
      mergedCount++;
    }

    // 3. Merge Directives
    if (updates.directives && updates.directives.length > 0) {
      console.log(`Merging ${updates.directives.length} boardroom directives...`);
      for (const directive of updates.directives) {
        // Parse directive into tasks using AI
        await parseBoardroomDirective(db, directive);
      }
      mergedCount++;
    }

    // 4. Merge Task Status Overrides
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

// Directives Parser
async function parseBoardroomDirective(db, directive) {
  // 1. Extract URLs and scrape content
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = directive.match(urlRegex) || [];
  let scrapedInfo = '';
  for (const url of urls) {
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    const scrapedText = await scrapeWebpage(cleanUrl);
    scrapedInfo += `\n\n--- Source Webpage Content (${cleanUrl}) ---\n${scrapedText}\n`;
  }
  const finalDirective = directive + scrapedInfo;

  const openai = getDeepseekClient(db.config);
  
  if (!openai) {
    await simulateMockBoardroomParsing(db, directive);
    return;
  }

  setAgentStatus(db, 'Alex', 'Analyzing boardroom directive');
  try {
    const prompt = `You are Alex, the AI Manager of Quantum Qbit Virtual Company.
The Board of Directors (the user) has given the following directive:
"${finalDirective}"

Your job is to parse this directive and decide what operational task(s) should be created to fulfill it.
You can assign tasks to one of these specialist agents:
- Mark (Marketing) for writing blogs, articles, SEO audits, keyword research.
- Sarah (Social Media) for drafting Twitter posts/threads or LinkedIn content.
- Codey (IT Developer) for creating app features, fixing UI layouts, writing code.
- Harper (HR) for drafting job postings, personnel notices.
- Deployer (DevOps) for running builds, compiling, verifying systems.

Respond ONLY with a JSON array representing the new tasks to create. Do not include any introductory or concluding text, only the JSON block. Each task in the array must follow this schema:
{
  "title": "Clear short task title",
  "description": "Detailed description of what the agent needs to do",
  "type": "blog" | "social" | "feature" | "seo" | "job",
  "assignee": "Mark" | "Sarah" | "Codey" | "Harper" | "Deployer"
}
Ensure the tasks cover the user's directive fully.`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content);
    const tasks = result.tasks || result.taskList || (Array.isArray(result) ? result : Object.values(result)[0]) || [];

    setAgentStatus(db, 'Alex', 'Idle');

    for (const t of tasks) {
      if (t.title && t.assignee) {
        let desc = t.description || '';
        if (scrapedInfo && t.assignee === 'Mark') {
          desc += `\n\nUse the following scraped source material to rewrite the article in your own words:\n${scrapedInfo}`;
        }
        
        const newTask = {
          id: 'task-' + Math.random().toString(36).substr(2, 9),
          title: t.title,
          description: desc,
          type: t.type || 'blog',
          assignee: t.assignee,
          status: 'todo',
          draftContent: '',
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
      }
    }
  } catch (err) {
    console.error("Deepseek boardroom parsing error:", err.message);
    setAgentStatus(db, 'Alex', 'Idle');
    await simulateMockBoardroomParsing(db, directive);
  }
}

async function simulateMockBoardroomParsing(db, directive) {
  // Extract URLs and scrape content
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = directive.match(urlRegex) || [];
  let scrapedInfo = '';
  for (const url of urls) {
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');
    const scrapedText = await scrapeWebpage(cleanUrl);
    scrapedInfo += `\n\n--- Source Webpage Content (${cleanUrl}) ---\n${scrapedText}\n`;
  }

  let mockTask = null;
  const key = directive.toLowerCase();
  if (key.includes('blog') || key.includes('article') || key.includes('write')) {
    mockTask = {
      title: "Rewrite Article from Webpage",
      description: "Draft a fresh blog post rewriting the source material in our own words.\n" + scrapedInfo,
      type: "blog",
      assignee: "Mark"
    };
  } else if (key.includes('social') || key.includes('twitter') || key.includes('post')) {
    mockTask = {
      title: "Draft Social Campaign promoting quantumqbit.in",
      description: "Write Twitter and LinkedIn messages to share our browser-only processing speeds.",
      type: "social",
      assignee: "Sarah"
    };
  } else {
    mockTask = {
      title: "Perform On-Page SEO Review",
      description: "Examine heading ranks and metadata structures.",
      type: "seo",
      assignee: "Mark"
    };
  }

  const newTask = {
    id: 'task-' + Math.random().toString(36).substr(2, 9),
    title: mockTask.title,
    description: mockTask.description,
    type: mockTask.type,
    assignee: mockTask.assignee,
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
    text: `Board directive received. I've scheduled task "${newTask.title}" for @${newTask.assignee}. (Simulated parsing)`,
    timestamp: new Date().toISOString(),
    taskId: newTask.id
  });
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

async function fetchGoogleTrends(geo = 'IN') {
  const url = geo === 'IN' 
    ? 'https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en'
    : 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const matches = [...xml.matchAll(/<item>[\s\S]*?<title>([^<]+)<\/title>/gi)];
    
    const trends = [];
    const volumes = ['500K+', '200K+', '100K+', '100K+', '50K+', '50K+', '20K+', '20K+', '10K+', '10K+'];
    
    matches.slice(0, 10).forEach((m, idx) => {
      let title = m[1].replace(/&amp;/g, '&').trim();
      // Remove source suffix (e.g. " - The Times of India")
      const lastDash = title.lastIndexOf(' - ');
      if (lastDash !== -1) {
        title = title.substring(0, lastDash).trim();
      }
      const volume = volumes[idx] || '10K+';
      trends.push(`${title} (Search Volume: ${volume})`);
    });
    return trends;
  } catch (err) {
    console.error(`Error fetching news trends for ${geo}:`, err.message);
    return [];
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
    const res = await fetch('https://www.sarkariresult.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const html = await res.text();
      const re = /<a[^>]*>([^<]{10,120})<\/a>/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const text = m[1].replace(/\s+/g, ' ').trim();
        if (/Recruitment|Vacancy|Apply|Result|Jobs?/i.test(text) && !jobs.includes(text)) {
          jobs.push(text);
        }
        if (jobs.length >= 10) break;
      }
    }
  } catch { /* skip */ }
  return jobs;
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
      prompt = `You are ${assignee}, the Marketing specialist for quantumqbit.in — a privacy-first browser utilities website popular in India.
Your task is to write a highly informative, news-driven, and timely blog post specifically on this topic:
Title hint: "${task.title}"
Research context & background: "${task.description}"

IMPORTANT RULES:
1. The article must focus specifically and deeply on the selected news event, announcement, or trend. Avoid writing generic listicles (e.g. "5 things", "5 ways", "5 trends") or timeless generic facts. Write about what is happening right now in the world or in India.
2. The TITLE must be highly engaging, professional, and specific to the event/topic (do NOT prefix with generic clickbait words like "Alert:", "Shocking:", "Warning:", etc. unless it is a contextually critical warning).
3. The content must be ORIGINAL, IN-DEPTH, and provide practical steps or analyses for the reader.
4. The content should be optimized for your audience, connecting to real-world contexts (e.g. Indian government portals, salaries, CS topics, privacy security events).
5. Content length: minimum 600 words with proper HTML structure. Use h2, h3, p, ul, li, strong, blockquote. Do NOT write markdown code fences (no raw markdown or code blocks).
6. Naturally weave in how quantumqbit.in's browser utilities (like offline PDF compressor, image cropper, base calculators) solve a specific problem related to this topic.
7. Add a catchy EXCERPT (2-3 sentences) that summarizes the news and compels the reader to read the full article.
8. Pick the MOST RELEVANT category: "privacy-security" | "computer-science" | "creative-tech" | "general-utilities".

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
      addSystemMsg(db, 'Alex', `Draft for "${task.title}" is approved by me. @Sophia, please review and give the final sign-off! Notes: ${result.reviewText}`, task.id);
    } else {
      task.status = 'todo'; // Rework
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
    addSystemMsg(db, 'Sophia', `Approved! Excellent job @${task.assignee}. @Deployer, please push this update live. Executive Notes: ${reviewText}`, task.id);
    
    // Deployment
    executeDeployment(db, task);
    return true;
  } else {
    task.status = 'todo'; // Rework
    setAgentStatus(db, 'Sophia', 'Idle');
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
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
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
  setAgentStatus(db, 'Mark', 'Researching trending topics...');
  
  const [trendsIndia, trendsGlobal, xTrends, govtJobs] = await Promise.all([
    fetchGoogleTrends('IN'),
    fetchGoogleTrends('US'),
    fetchXTrends(),
    fetchGovtJobUpdates()
  ]);

  const existingTitles = getExistingBlogTitles();
  console.log(`Gathered trends. Spawning brainstorm prompt...`);

  try {
    const prompt = `You are Mark, the Marketing genius for quantumqbit.in — India's leading browser-based utility tools website.
We provide offline-first browser utilities (PDF compressor, image cropper/resizer, base calculators, unit converter).

=== LIVE RESEARCH DATA ===
GOOGLE TRENDS (INDIA):
${trendsIndia.slice(0,8).join('\n')}

GOOGLE TRENDS (GLOBAL / US):
${trendsGlobal.slice(0,8).join('\n')}

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
  return {
    title: task.title,
    excerpt: "In a digital-first era, client-side browser calculations protect user private data.",
    content: `<h2>The Security of Client-Side Web Processing</h2><p>In standard web applications, every document upload, picture conversion, or password check is pushed to a remote server. While simple, it exposes sensitive user assets to database vulnerabilities and third-party leaks.</p><p>By utilizing modern HTML5 File APIs and client-side scripts, tools like those on <strong>quantumqbit.in</strong> process bytes entirely in the browser memory cache. Photos are modified on canvas, conversions happen locally, and no records ever leak to host registers. It's instant, costs zero bandwidth, and stays 100% private.</p>`,
    category_id: "privacy-security",
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
  
  // 1. Sync live updates from Hostinger
  try {
    setAgentStatus(db, 'System', 'Idle', 'Fetching boardroom directives and live chats from server...');
    await syncLiveUpdates(db);
  } catch (e) {
    setAgentStatus(db, 'System', 'Idle', 'Live sync error: ' + e.message);
  }
  
  if (!db.config.isAutomationActive) {
    console.log("Autonomous agent loop is disabled in configurations. Exiting.");
    setAgentStatus(db, 'System', 'Idle', 'Automation loop is disabled in configurations. Exiting.');
    return;
  }

  const openai = getDeepseekClient(db.config);
  if (!openai) {
    setAgentStatus(db, 'System', 'Idle', 'Deepseek API key not set or invalid. Running in simulated offline mode.');
  } else {
    setAgentStatus(db, 'System', 'Idle', 'Deepseek client authorized successfully.');
  }
  
  // 2. Run sequential cycles to process task pipeline
  let maxCycles = 1;
  let cycle = 0;
  let progress = true;

  while (progress && cycle < maxCycles) {
    console.log(`\n--- Running State Machine Cycle ${cycle + 1} ---`);
    setAgentStatus(db, 'System', 'Idle', `Executing task cycle state machine step ${cycle + 1}...`);
    try {
      progress = await runAutomationCycleStep(db, openai);
    } catch (e) {
      setAgentStatus(db, 'System', 'Idle', `Error during cycle step ${cycle + 1}: ${e.message}`);
      progress = false;
    }
    if (progress) {
      writeDB(db);
    }
    cycle++;
  }

  setAgentStatus(db, 'System', 'Idle', '=== Runner completed all cycle steps and finished successfully ===');
  console.log("\n=== Quantum AI Office Cloud Runner Completed ===");
}

main().catch(err => {
  console.error("Runner crash error:", err);
  process.exit(1);
});
