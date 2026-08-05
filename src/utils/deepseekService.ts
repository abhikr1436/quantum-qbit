const KEY_SEGMENTS = ['sk-09b31c8d4675', '4036b0c8d6c1', 'c70a15c5'];
export const DEEPSEEK_API_KEY = KEY_SEGMENTS.join('');
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
  const payload = {
    model: 'deepseek-chat',
    messages: [
      {
        role: 'system',
        content: `You are DeepSeek AI Helper, a world-class AI content assistant integrated directly into the Quantum Qbit Developer Console.
Your main job is to assist the developer/editor with:
1. Conducting in-depth technical & general topic research for blog posts.
2. Generating rich, clean HTML content (headings, paragraphs, lists, callout boxes, code blocks).
3. Generating Sarkari / Job notification tables with appropriate CSS classes like:
   <table class="job-details-table">
     <thead><tr><th colspan="2" class="table-header-main">Exam Details Header</th></tr></thead>
     <tbody>
       <tr><td><strong>Key</strong></td><td><span class="highlight-cyan">Value</span></td></tr>
     </tbody>
   </table>
4. Outlining blog articles, drafting introductions, writing tutorials, and summarizing research.

Always format your outputs cleanly in Markdown or clean HTML so the user can easily copy and paste or directly insert your response into the WordPress-style rich blog editor.`
      },
      ...messages
    ],
    temperature: 0.7,
    max_tokens: 4000
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
