import DOMPurify from 'dompurify';
import type { BlogPost } from '../pages/Blogs';

export interface ParseResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedBlog?: BlogPost;
}

/**
 * Standard Custom Tag Format that users can copy to clipboard
 */
export const AI_PROMPT_TEMPLATE = `<title>Put an engaging, SEO-optimized title here</title>
<category>Privacy & Security</category> <!-- Options: Privacy & Security | Image Studio | PDF Workflows | Web Tech -->
<summary>Write a concise, 2-sentence hook describing what this article covers and why it matters.</summary>
<cover_image>https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe</cover_image> <!-- Optional image URL -->
<tags>Browser Privacy, WebAssembly, Security, Image Processing</tags>
<slug>my-custom-url-slug</slug> <!-- Optional, auto-generated from title if omitted -->
<body>
  <p>Start with a strong, insightful introduction setting up the problem, historical context, or technical landscape...</p>

  <h2>Deep Dive: Core Concepts & Architecture</h2>
  <p>Explain how the technology works under the hood with technical rigor and clarity.</p>

  <tip>Pro-Tip: Highlight an actionable engineering takeaway, optimization technique, or best practice for the reader.</tip>

  <h2>Comparative Analysis & Benchmarks</h2>
  <p>Compare local client-side processing vs legacy cloud alternatives:</p>

  <table>
    <thead>
      <tr>
        <th>Evaluation Metric</th>
        <th>Client-Side (Quantum Qbit)</th>
        <th>Legacy Cloud Server</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Data Privacy</strong></td>
        <td>100% in RAM (Zero uploads)</td>
        <td>Transmitted to remote buckets</td>
      </tr>
      <tr>
        <td><strong>Latency</strong></td>
        <td>Sub-second (0ms network)</td>
        <td>Dependent on upload bandwidth</td>
      </tr>
      <tr>
        <td><strong>Offline Resilience</strong></td>
        <td>Fully works offline</td>
        <td>Fails without internet connection</td>
      </tr>
    </tbody>
  </table>

  <h2>Practical Implementation Steps</h2>
  <p>Provide clear guidance, architectural decisions, and considerations for users and developers.</p>
  
  <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b" alt="System Flowchart" />

  <takeaways>
    <li>Key takeaway 1 summarizing a core benefit or finding.</li>
    <li>Key takeaway 2 on security, performance, or privacy.</li>
    <li>Key takeaway 3 on practical recommendations.</li>
  </takeaways>
</body>`;

/**
 * Extracts content between XML-like tags <tagName>content</tagName>
 */
function extractTag(input: string, tagNames: string[]): string | null {
  for (const tag of tagNames) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = input.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Auto-generates a URL-friendly slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Formats current date and time for publication
 */
export function getAutoPublishedDate(): { displayDate: string; timestamp: number } {
  const now = new Date();
  const displayDate = now.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  return {
    displayDate,
    timestamp: now.getTime()
  };
}

/**
 * Parse structured markup into a valid BlogPost
 */
export function parseBlogMarkup(rawMarkup: string, existingId?: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!rawMarkup || !rawMarkup.trim()) {
    return {
      isValid: false,
      errors: ['Article markup cannot be empty. Please provide content.'],
      warnings: []
    };
  }

  // 1. Title Extraction
  const rawTitle = extractTag(rawMarkup, ['title', 'heading', 'h1']);
  if (!rawTitle) {
    errors.push('Missing required <title> tag. Example: <title>Your Title Here</title>');
  }
  const title = rawTitle ? rawTitle.replace(/<[^>]*>/g, '').trim() : 'Untitled Article';

  // 2. Category Extraction
  const rawCategory = extractTag(rawMarkup, ['category', 'cat', 'topic']);
  let categoryLabel = rawCategory ? rawCategory.replace(/<[^>]*>/g, '').trim() : 'Web Tech';
  let categoryKey: 'privacy' | 'image' | 'pdf' | 'tech' = 'tech';
  
  const lowerCat = categoryLabel.toLowerCase();
  if (lowerCat.includes('priv') || lowerCat.includes('secu')) {
    categoryKey = 'privacy';
    categoryLabel = 'Privacy & Security';
  } else if (lowerCat.includes('img') || lowerCat.includes('photo') || lowerCat.includes('dpi')) {
    categoryKey = 'image';
    categoryLabel = 'Image Studio';
  } else if (lowerCat.includes('pdf') || lowerCat.includes('doc')) {
    categoryKey = 'pdf';
    categoryLabel = 'PDF Workflows';
  } else {
    categoryKey = 'tech';
    if (!rawCategory) {
      categoryLabel = 'Web Tech';
      warnings.push('No <category> tag found; defaulted to "Web Tech".');
    }
  }

  // 3. Body Extraction
  let rawBody = extractTag(rawMarkup, ['body', 'content', 'article']);
  if (!rawBody) {
    // If user didn't wrap in <body>, strip header tags and take the rest
    const stripped = rawMarkup
      .replace(/<(title|category|summary|description|slug|tags|keywords|cover_image|cover|image)[^>]*>[\s\S]*?<\/\1>/gi, '')
      .trim();
    if (stripped.length > 50) {
      rawBody = stripped;
      warnings.push('No <body> tag found; parsed remaining content as article body.');
    } else {
      errors.push('Missing required <body> tag. Example: <body><p>Article content...</p></body>');
      rawBody = '';
    }
  }

  // 4. Summary / Description Extraction
  let summary = extractTag(rawMarkup, ['summary', 'description', 'excerpt', 'meta']);
  if (!summary) {
    // Auto-generate from first paragraph of body
    const pMatch = rawBody.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (pMatch && pMatch[1]) {
      const cleanP = pMatch[1].replace(/<[^>]*>/g, '').trim();
      summary = cleanP.slice(0, 180) + (cleanP.length > 180 ? '...' : '');
    } else {
      const plain = rawBody.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      summary = plain.slice(0, 180) + (plain.length > 180 ? '...' : '');
    }
    warnings.push('No <summary> tag found; generated summary from article body.');
  } else {
    summary = summary.replace(/<[^>]*>/g, '').trim();
  }

  // 5. Cover Image
  const coverImage = extractTag(rawMarkup, ['cover_image', 'cover', 'image_url']);

  // 6. Tags
  const rawTags = extractTag(rawMarkup, ['tags', 'keywords', 'labels']);
  let tags: string[] = [];
  if (rawTags) {
    tags = rawTags
      .split(/[,|\n]/)
      .map((t) => t.replace(/<[^>]*>/g, '').trim())
      .filter((t) => t.length > 0);
  }
  if (tags.length === 0) {
    tags = [categoryLabel, 'Client-Side', 'Quantum Qbit'];
  }

  // 7. Slug
  const customSlug = extractTag(rawMarkup, ['slug', 'url_slug']);
  const slug = customSlug ? generateSlug(customSlug) : generateSlug(title);

  // 8. Word Count & Read Time
  const cleanBodyText = rawBody.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = cleanBodyText.split(' ').filter(Boolean).length;
  const customReadTime = extractTag(rawMarkup, ['readtime', 'read_time', 'time']);
  const readTime = customReadTime 
    ? customReadTime.replace(/<[^>]*>/g, '').trim()
    : `${Math.max(1, Math.ceil(wordCount / 200))} min read`;

  // 9. Extract Key Takeaways if wrapped in <takeaways>
  const takeawaysMatch = rawBody.match(/<takeaways[^>]*>([\s\S]*?)<\/takeaways>/i);
  let takeaways: string[] = [];
  let bodyWithoutTakeaways = rawBody;

  if (takeawaysMatch) {
    bodyWithoutTakeaways = rawBody.replace(/<takeaways[^>]*>[\s\S]*?<\/takeaways>/i, '');
    const liMatches = Array.from(takeawaysMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
    if (liMatches.length > 0) {
      takeaways = liMatches.map((m) => m[1].replace(/<[^>]*>/g, '').trim());
    } else {
      takeaways = takeawaysMatch[1]
        .split('\n')
        .map((l) => l.replace(/^[*-•\d.]+\s*/, '').replace(/<[^>]*>/g, '').trim())
        .filter((l) => l.length > 0);
    }
  }

  if (takeaways.length === 0) {
    takeaways = [
      '100% in-browser client execution eliminates cloud security exposures.',
      'Sub-second processing speeds without bandwidth transfer queues.',
      'Full compliance ready for enterprise and government submissions.'
    ];
  }

  // 10. Transform custom <tip> tags into skeuomorphic glass tip callouts
  let processedHtml = bodyWithoutTakeaways.replace(
    /<tip[^>]*>([\s\S]*?)<\/tip>/gi,
    '<div class="blog-custom-tip-card"><div class="tip-icon">✨</div><div class="tip-body"><strong>Pro-Tip:</strong> $1</div></div>'
  );

  // Transform <callout> tags
  processedHtml = processedHtml.replace(
    /<callout[^>]*>([\s\S]*?)<\/callout>/gi,
    '<div class="blog-custom-callout-card"><div class="callout-icon">💡</div><div class="callout-body">$1</div></div>'
  );

  // Sanitize with DOMPurify allowing tables, images, videos, iframes
  const sanitizedHtml = DOMPurify.sanitize(processedHtml, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'target', 'loading', 'controls', 'autoplay', 'muted', 'loop']
  });

  // 11. Structured Fallback for Classic Reader (Sections & Intro)
  const introMatch = sanitizedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
  const intro = introMatch ? introMatch[1].replace(/<[^>]*>/g, '').trim() : summary;

  // Extract H2 sections for structured representation
  const sectionParts = sanitizedHtml.split(/<h2[^>]*>/i);
  const sections: { heading: string; body: string[]; tip?: string }[] = [];

  for (let i = 1; i < sectionParts.length; i++) {
    const part = sectionParts[i];
    const endH2 = part.indexOf('</h2>');
    if (endH2 !== -1) {
      const heading = part.slice(0, endH2).replace(/<[^>]*>/g, '').trim();
      const rest = part.slice(endH2 + 5);
      const paragraphs = Array.from(rest.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
        .map((m) => m[1].replace(/<[^>]*>/g, '').trim())
        .filter((p) => p.length > 0);
      
      sections.push({
        heading,
        body: paragraphs.length > 0 ? paragraphs : ['Refer to rich content view below.']
      });
    }
  }

  // Related Tool CTA mapping
  let relatedTool: BlogPost['content']['relatedTool'] = undefined;
  if (categoryKey === 'image') {
    relatedTool = {
      name: 'Image Studio',
      route: '/image-studio',
      label: 'Open Image Studio'
    };
  } else if (categoryKey === 'pdf') {
    relatedTool = {
      name: 'PDF Workshop',
      route: '/pdf-workshop',
      label: 'Open PDF Workshop'
    };
  } else {
    relatedTool = {
      name: 'Studio Hub',
      route: '/',
      label: 'Explore Studio Hub'
    };
  }

  const { displayDate, timestamp } = getAutoPublishedDate();

  const parsedBlog: BlogPost = {
    id: existingId || Date.now().toString(),
    slug,
    title,
    category: categoryKey,
    categoryLabel,
    summary,
    readTime,
    date: displayDate,
    publishedAt: timestamp,
    author: 'Quantum Qbit Team', // ALWAYS Quantum Qbit Team as requested
    tags,
    coverImage: coverImage || undefined,
    htmlContent: sanitizedHtml,
    rawMarkup,
    content: {
      intro,
      sections: sections.length > 0 ? sections : [
        {
          heading: 'Article Overview',
          body: [summary]
        }
      ],
      takeaways,
      relatedTool
    }
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedBlog
  };
}

/**
 * Reconstructs the custom format markup from an existing BlogPost for editing
 */
export function blogToMarkup(blog: BlogPost): string {
  if (blog.rawMarkup && blog.rawMarkup.trim()) {
    return blog.rawMarkup;
  }

  const tagList = blog.tags.join(', ');
  const takeawaysList = blog.content.takeaways.map((t) => `    <li>${t}</li>`).join('\n');
  
  let bodyContent = '';
  if (blog.htmlContent) {
    bodyContent = `  ${blog.htmlContent}\n`;
  } else {
    bodyContent = `  <p>${blog.content.intro}</p>\n\n`;
    for (const sec of blog.content.sections) {
      bodyContent += `  <h2>${sec.heading}</h2>\n`;
      for (const p of sec.body) {
        bodyContent += `  <p>${p}</p>\n`;
      }
      if (sec.tip) {
        bodyContent += `  <tip>${sec.tip}</tip>\n`;
      }
      bodyContent += `\n`;
    }
  }

  return `<title>${blog.title}</title>
<category>${blog.categoryLabel}</category>
<summary>${blog.summary}</summary>
${blog.coverImage ? `<cover_image>${blog.coverImage}</cover_image>\n` : ''}<tags>${tagList}</tags>
<slug>${blog.slug}</slug>
<body>
${bodyContent}  <takeaways>
${takeawaysList}
  </takeaways>
</body>`;
}
