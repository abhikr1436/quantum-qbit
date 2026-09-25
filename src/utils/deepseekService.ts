export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekChatResponse {
  id: string;
  provider?: 'gemini' | 'deepseek';
  model?: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AutomationLogEntry {
  timestamp: number;
  date: string;
  title: string;
  slug: string;
  url: string;
  provider: string;
  model: string;
  word_count: number;
  read_time: string;
  duration_seconds: number;
  status: string;
}

/**
 * Send a multi-turn chat request to the secure server-side AI proxy.
 * Supports Google Gemini and DeepSeek with automatic failover.
 * Secret API keys are kept strictly in server-side storage (quantum_data/config.json).
 */
export async function sendDeepSeekChat(
  messages: ChatMessage[],
  provider: 'auto' | 'gemini' | 'deepseek' = 'auto'
): Promise<string> {
  const fullMessages = [
    {
      role: 'system' as const,
      content: `You are Chief AI Technology Editor & Lead Author for Quantum Qbit (quantumqbit.in).
Your job is to produce world-class, exhaustive articles of AT LEAST 2,000+ WORDS.

CRITICAL MANDATORY INSTRUCTIONS:
1. WORD COUNT: Produce an exhaustive, deeply researched long-form piece of AT LEAST 2,000+ WORDS across 6 to 8 structured sections.
2. DYNAMIC CONTEXTUAL CALLOUTS: Use topic-specific callouts inside <tip>...</tip>:
   - For Security & Privacy: <tip>Security Advisory: ...</tip>
   - For Web Technology: <tip>Engineering Advisory: ...</tip>
   - For Photo & Media: <tip>Optimization Intel: ...</tip>
   - For Career & Exam Portals: <tip>Candidate Advisory: ...</tip>
3. RICH FORMATTING: Include rich <h2> and <h3> subheadings, multi-column <table> comparison matrices, contextual <tip> callouts, step-by-step guides, and <takeaways>. Always format outputs cleanly with custom tags or HTML.`
    },
    ...messages
  ];

  const proxyRes = await fetch('/api/ai.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ messages: fullMessages, provider, max_tokens: 8192 })
  });

  const rawJson = await proxyRes.json().catch(() => ({}));

  if (!proxyRes.ok) {
    const errorMsg =
      rawJson.error ||
      `Server proxy returned HTTP ${proxyRes.status} (${proxyRes.statusText || 'Error'})`;
    throw new Error(errorMsg);
  }

  const data: DeepSeekChatResponse = rawJson;
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error('Received an empty response from the AI server.');
  }

  return data.choices[0].message.content;
}

/**
 * Trigger Autonomous AI Publication Engine on Hostinger backend
 */
export async function triggerAutonomousPublish(options?: {
  provider?: 'auto' | 'gemini' | 'deepseek';
  topic?: string;
  force?: boolean;
}): Promise<any> {
  const params = new URLSearchParams();
  if (options?.provider) params.set('provider', options.provider);
  if (options?.topic) params.set('topic', options.topic);
  if (options?.force) params.set('force', '1');

  const res = await fetch(`/api/cron_publish.php?${params.toString()}`, {
    method: 'POST',
    credentials: 'include'
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || data.message || `Server returned HTTP ${res.status}`);
  }

  return data;
}

/**
 * Fetch automation execution logs
 */
export async function fetchAutomationLogs(): Promise<AutomationLogEntry[]> {
  try {
    const res = await fetch('/api/cron_publish.php?action=logs', {
      credentials: 'include'
    });
    const data = await res.json();
    return data.success && Array.isArray(data.logs) ? data.logs : [];
  } catch {
    return [];
  }
}

/**
 * Fetch automation system status
 */
export async function fetchAutomationStatus(): Promise<{
  gemini_configured: boolean;
  deepseek_configured: boolean;
  ready: boolean;
  last_run: AutomationLogEntry | null;
}> {
  try {
    const res = await fetch('/api/cron_publish.php?action=status', {
      credentials: 'include'
    });
    const data = await res.json();
    return {
      gemini_configured: !!data.gemini_configured,
      deepseek_configured: !!data.deepseek_configured,
      ready: !!data.ready,
      last_run: data.last_run || null
    };
  } catch {
    return {
      gemini_configured: false,
      deepseek_configured: false,
      ready: false,
      last_run: null
    };
  }
}

/**
 * Prompt Template Generators
 */
export const PROMPT_TEMPLATES = [
  {
    id: 'sarkari-table',
    title: '📊 Sarkari / Job Details Table',
    prompt: 'Generate a complete, beautiful HTML job notification table (Important Dates, Vacancy Details, Application Fee, Eligibility Criteria) with clean HTML table tags.'
  },
  {
    id: 'topic-research',
    title: '🔍 In-Depth Topic Research',
    prompt: 'Perform detailed research on the topic: "[Insert Topic]". Provide key facts, technical concepts, pros/cons, real-world examples, and statistical data points.'
  },
  {
    id: 'article-outline',
    title: '📝 Article Outline & Structure',
    prompt: 'Create a comprehensive SEO-friendly blog post outline with H1 title, meta excerpt, H2 subheadings, bullet points, and key takeaways for the topic: "[Insert Topic]".'
  },
  {
    id: 'html-formatter',
    title: '✨ Polish & Format to HTML',
    prompt: 'Format the following draft into clean HTML paragraphs, bold highlights, subheadings (<h2>, <h3>), and bulleted lists suitable for blog publication:\n\n[Paste Draft Text Here]'
  }
];
