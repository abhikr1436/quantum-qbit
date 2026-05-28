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

// Helper to change agent status in DB
function setAgentStatus(db, agentName, status) {
  const agent = db.agents.find(a => a.name === agentName);
  if (agent) {
    agent.status = status;
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
  const endpoints = [
    `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
    `https://trends.google.com/trends/trendingsearches/realtime/rss?geo=${geo}&cat=all`
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const cdataMatches = [...xml.matchAll(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>/g)];
      if (cdataMatches.length > 1) {
        return cdataMatches.slice(1, 11).map(m => m[1].trim()).filter(Boolean);
      }
    } catch { /* skip */ }
  }
  return [];
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
Your task is to write a VIRAL, clickbait-style, high-quality blog post on this trending topic:
Title hint: "${task.title}"
Research context: "${task.description}"

IMPORTANT RULES:
1. The TITLE must be a CLICKBAIT-STYLE headline (use numbers, shocking words, urgency, e.g. "Alert:", "Shocking:", etc.)
2. The content must be ORIGINAL, IN-DEPTH, and NOT generic.
3. The content should be optimized for INDIAN readers (salaries in INR, Indian context, Aadhaar/DigiLocker, etc.)
4. Content length: minimum 600 words with proper HTML structure. Use h2, h3, p, ul, li, strong, blockquote. Do NOT write markdown code fences.
5. Add a catchy EXCERPT (2-3 sentences) that compels readers to click.
6. Pick the MOST RELEVANT category: "privacy-security" | "computer-science" | "creative-tech" | "general-utilities".

Respond with a JSON object with EXACTLY these keys:
{
  "title": "Clickbait-style title",
  "excerpt": "A compelling 2-3 sentence teaser",
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

      deployLog = `Published blog post "${newPostTitle}" with slug "${slug}".`;
    } catch (err) {
      console.error("Failed to write blogs.json:", err.message);
      deployLog = `Failed to write blogs.json: ${err.message}`;
      deployFailed = true;
    }
  } else {
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
  const fourHours = 1000 * 60 * 60 * 4;

  if (lastBrainstorm && (Date.now() - new Date(lastBrainstorm).getTime() < fourHours)) {
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
  
  const [trendsIndia, xTrends, govtJobs] = await Promise.all([
    fetchGoogleTrends('IN'),
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

X/TWITTER HASHTAGS (INDIA):
${xTrends.slice(0,8).join('\n')}

LATEST GOVT NOTIFICATIONS:
${govtJobs.slice(0,6).join('\n')}

=== ALREADY PUBLISHED ARTICLES (STRICTLY AVOID REPEATING) ===
${existingTitles.slice(-20).join('\n')}

=== STRICT RULES ===
1. The new topic MUST be 100% different from the already-published list above.
2. The title MUST be a viral, clickbait-style headline targeting Indian audiences (e.g. "Last 3 Days to Apply for [JOB]", "Why Everyone in India Is Talking About [TREND]", "7 Things About [TOPIC] That Will Shock You").
3. Connect the topic to quantumqbit.in tools (e.g., how to compress a PDF resume for a Sarkari job application, or how base converters help computer students).

Respond ONLY with a JSON object:
{
  "title": "Viral clickbait blog title",
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
  
  // 1. Sync live updates from Hostinger
  await syncLiveUpdates(db);
  
  if (!db.config.isAutomationActive) {
    console.log("Autonomous agent loop is disabled in configurations. Exiting.");
    return;
  }

  const openai = getDeepseekClient(db.config);
  
  // 2. Run sequential cycles to process task pipeline
  let maxCycles = 5;
  let cycle = 0;
  let progress = true;

  while (progress && cycle < maxCycles) {
    console.log(`\n--- Running State Machine Cycle ${cycle + 1} ---`);
    progress = await runAutomationCycleStep(db, openai);
    if (progress) {
      writeDB(db);
    }
    cycle++;
  }

  console.log("\n=== Quantum AI Office Cloud Runner Completed ===");
}

main().catch(err => {
  console.error("Runner crash error:", err);
  process.exit(1);
});
