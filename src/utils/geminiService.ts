/**
 * Gemini API Integration Service for AI Office
 * Uses Google Gemini 2.5 Flash / 1.5 Flash models to generate high-quality,
 * journalistic, SEO-optimized blog articles based on daily viral trends.
 */

const GEMINI_API_KEY = 'AIzaSyA8TYbl2LutR4ONIfhNRRwrQ_odoWCjkRQ';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const FALLBACK_GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

export interface GeminiArticleResult {
  title: string;
  excerpt: string;
  facts: string[];
  htmlContent: string;
  readTime: string;
  seoKeywords: string[];
}

export async function generateArticleWithGemini(
  topic: string,
  region: string = 'Global',
  category: string = 'General Tech',
  tone: string = 'Professional Editorial'
): Promise<GeminiArticleResult> {
  const prompt = `You are a senior tech journalist and AI editorial director for Quantum Qbit.
Write an in-depth, journalistic, and highly engaging blog article about the following viral trending topic:
Topic: "${topic}"
Region Focus: ${region}
Category: ${category}
Requested Editorial Tone: ${tone}

IMPORTANT FORMAT REQUIREMENTS:
Return ONLY a valid JSON object with no markdown formatting around the JSON string. The JSON must match this structure exactly:
{
  "title": "A captivating, high-CTR headline (not verbatim prompt)",
  "excerpt": "A compelling 2-sentence lead summary for social preview & meta description",
  "facts": [
    "Fact 1: Key technical specification or statistic",
    "Fact 2: Policy/industry milestone or adoption data",
    "Fact 3: Market/user impact benchmark"
  ],
  "htmlContent": "<p>Engaging opening paragraph...</p><h2>1. Section Title</h2><p>Prose with <strong>bold emphasis</strong>...</p><blockquote>\"Journalistic quote...\" — Industry Expert</blockquote><h2>2. Core Technical Pillars</h2><ul><li>...</li></ul><div style=\"background: rgba(0, 242, 254, 0.05); border: 1px solid rgba(0, 242, 254, 0.25); padding: 18px; border-radius: 12px; margin-top: 24px;\"><h3 style=\"color: #00f2fe; margin-top: 0;\">Key Takeaways for Readers</h3><ul><li>...</li></ul></div>",
  "readTime": "4 min read",
  "seoKeywords": ["Keyword1", "Keyword2", "Keyword3", "Keyword4"]
}`;

  const requestBody = {
    contents: [
      {
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  let response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    // Try fallback endpoint
    response = await fetch(FALLBACK_GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
  }

  if (!response.ok) {
    throw new Error(`Gemini API HTTP Error: ${response.status}`);
  }

  const data = await response.json();
  const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!textResponse) {
    throw new Error('Empty response from Gemini API');
  }

  // Clean JSON response (strip markdown fences if present)
  let cleanJsonStr = textResponse.trim();
  if (cleanJsonStr.startsWith('```json')) {
    cleanJsonStr = cleanJsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleanJsonStr.startsWith('```')) {
    cleanJsonStr = cleanJsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  const parsed = JSON.parse(cleanJsonStr);
  return {
    title: parsed.title || topic,
    excerpt: parsed.excerpt || `Latest viral analysis on ${topic}.`,
    facts: Array.isArray(parsed.facts) ? parsed.facts : [],
    htmlContent: parsed.htmlContent || `<p>${parsed.excerpt}</p>`,
    readTime: parsed.readTime || '4 min read',
    seoKeywords: Array.isArray(parsed.seoKeywords) ? parsed.seoKeywords : [category, region, 'Tech']
  };
}
