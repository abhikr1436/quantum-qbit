export const DEEPSEEK_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEEPSEEK_API_KEY) ||
  '';
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekChatResponse {
  id: string;
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

/**
 * Send a multi-turn chat request to DeepSeek API
 */
export async function sendDeepSeekChat(
  messages: ChatMessage[],
  apiKey: string = DEEPSEEK_API_KEY
): Promise<string> {
  const fullMessages = [
    {
      role: 'system' as const,
      content: `You are DeepSeek AI Editorial Director & Lead Writer for Quantum Qbit.
Your main job is to assist the developer/editor with drafting, writing, and researching world-class blog articles.

CRITICAL MANDATORY INSTRUCTIONS:
1. WORD COUNT: Whenever generating or drafting a blog article, you MUST produce an exhaustive, deeply researched long-form piece of AT LEAST 2,000+ WORDS. Never provide brief summaries or truncated overviews. Expand every section with multi-faceted depth, historical/industry context, empirical case studies, comparative metrics, and technical/strategic rigor across 6 to 10 comprehensive sections.
2. DYNAMIC CONTEXTUAL CALLOUTS (NO REPETITIVE "PRO-TIP"): Never repeat prefixes like "Pro-Tip: Pro-Tip:". Contextualize all highlight callouts inside <tip>...</tip> directly to the article subject:
   - For Geopolitics & Defense: <tip>Strategic Insight: ...</tip> or <tip>Diplomatic Context: ...</tip>
   - For Gaming & Tech: <tip>Gamer's Intel: ...</tip> or <tip>Buyer's Note: ...</tip>
   - For Security & Privacy: <tip>Security Advisory: ...</tip>
   - For Markets & Economy: <tip>Market Signal: ...</tip>
   - For Software & Engineering: <tip>Engineering Advisory: ...</tip>
3. RICH FORMATTING: Include rich <h2> and <h3> subheadings, multi-column <table> comparison matrices, contextual <tip> callouts, and <takeaways>. Always format outputs cleanly with custom tags or HTML.`
    },
    ...messages
  ];

  // 1. Try server-side proxy on Hostinger first (reads key from config.json)
  try {
    const proxyRes = await fetch('/api/ai.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: fullMessages, max_tokens: 8192 })
    });
    if (proxyRes.ok) {
      const data: DeepSeekChatResponse = await proxyRes.json();
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
      }
    }
  } catch (proxyErr) {
    // Fallback to direct client-side call
  }

  // 2. Direct fallback to DeepSeek API endpoint
  const payload = {
    model: 'deepseek-chat',
    messages: fullMessages,
    temperature: 0.7,
    max_tokens: 8192
  };

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const msg = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`DeepSeek API Error: ${msg}`);
  }

  const data: DeepSeekChatResponse = await response.json();
  if (!data.choices || data.choices.length === 0 || !data.choices[0].message) {
    throw new Error('Received an empty response from DeepSeek API.');
  }

  return data.choices[0].message.content;
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
