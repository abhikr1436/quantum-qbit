import type { BlogPost } from '../pages/Blogs';

const STORAGE_KEY = 'quantum_qbit_blogs_v2';
const EVENT_NAME = 'qq_blogs_updated';

export const INITIAL_DEFAULT_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'why-in-browser-image-editing-is-the-future-of-privacy',
    title: 'Why 100% In-Browser Image Editing is the Future of Digital Privacy',
    category: 'privacy',
    categoryLabel: 'Privacy & Security',
    summary: 'Explore why uploading confidential documents and photos to remote conversion servers creates massive security liabilities, and how modern Canvas & WebAssembly APIs solve this.',
    readTime: '4 min read',
    date: 'Sep 15, 2026',
    publishedAt: 1789420800000,
    author: 'Quantum Qbit Team',
    tags: ['Privacy', 'WebAssembly', 'HTML5 Canvas', 'Data Sovereignty'],
    content: {
      intro: 'In the modern web ecosystem, performing a task as simple as resizing an identity document or converting a photo format has traditionally required transmitting that file to a remote cloud server. This outdated server-bound paradigm poses severe privacy hazards that are no longer necessary.',
      sections: [
        {
          heading: 'The Hidden Risks of Server-Side Media Processing',
          body: [
            'When you upload an image to an online tool, that file is written to cloud storage buckets, logged across HTTP proxies, and processed by backend microservices. Even if a provider promises to delete your files within 1 hour, that data remains vulnerable to breach during transit, retention intervals, and automated server backups.',
            'Furthermore, image metadata—including EXIF GPS geolocation tags, device serial numbers, and timestamp identifiers—is often permanently cached in server request logs.'
          ],
          tip: 'Always check if an online photo editor requires a server upload. If it works offline without an internet connection, your data is 100% safe in your own RAM.'
        },
        {
          heading: 'How In-Browser Execution Solves This at the Architecture Level',
          body: [
            'With the advancement of HTML5 Canvas, OffscreenCanvas, and WebAssembly, modern client browsers can allocate multi-gigabyte memory arrays and perform high-resolution matrix transformations directly on your device GPU and CPU.',
            'When you edit or compress an image in Quantum Qbit, the pixel buffer is decoded into your local browser memory space. The browser executes the bilinear interpolation or quantization algorithm locally, and exports a Blob URL directly to your hard drive. Zero bytes travel across the network.'
          ]
        },
        {
          heading: 'Unmatched Velocity: Eliminating Network Latency',
          body: [
            'Network transfer times represent over 90% of the duration when using cloud utilities. Uploading a 25MB RAW photo on a mobile network can take 15 to 30 seconds, followed by cloud processing queues, followed by re-downloading.',
            'Local processing executes in sub-second timeframes (typically under 100 milliseconds) because there is no network transfer bottleneck.'
          ]
        }
      ],
      takeaways: [
        'Client-side execution provides absolute data sovereignty—files never leave your device.',
        'Eliminates upload/download bandwidth bottlenecks, delivering instantaneous sub-second speeds.',
        'Operates fully offline once loaded into browser cache, immune to server outages.'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Open Image Studio'
      }
    }
  },
  {
    id: '2',
    slug: 'mastering-client-side-pdf-operations-ocr-compression',
    title: 'Mastering Client-Side PDF Operations: Local Merging, OCR & Compression',
    category: 'pdf',
    categoryLabel: 'PDF Workflows',
    summary: 'A deep-dive into how PDF.js, Web Workers, and Tesseract.js empower browser-native document merging, optical character recognition, and multi-megabyte compression.',
    readTime: '5 min read',
    date: 'Sep 12, 2026',
    publishedAt: 1789161600000,
    author: 'Quantum Qbit Team',
    tags: ['PDF Tools', 'OCR', 'Tesseract', 'Document Security'],
    content: {
      intro: 'PDFs are the universal standard for legal contracts, academic publications, and corporate records. Managing sensitive multi-page archives locally has historically required bulky desktop software suites. Today, browser-native document pipelines rival native desktop apps.',
      sections: [
        {
          heading: 'Client-Side PDF Merging and Page Extraction',
          body: [
            'Using client-side JavaScript PDF parsers, documents are read as binary ArrayBuffers. The engine inspects the cross-reference tables (XRef), extracts individual page streams, re-indexes dictionary objects, and compiles a clean, standardized PDF binary.',
            'Because this happens directly within the browser tab, you can seamlessly combine dozens of receipts, contracts, and scans into a single cohesive document without waiting for server queues.'
          ],
          tip: 'When merging PDFs locally, page reordering is handled via memory pointers, meaning zero quality loss and negligible memory overhead.'
        },
        {
          heading: 'Extracting Text with In-Memory Tesseract OCR',
          body: [
            'Optical Character Recognition (OCR) enables scanned contracts and non-searchable document photos to be converted into editable text. Quantum Qbit runs a compiled WebAssembly port of the Tesseract OCR engine inside a background Web Worker.',
            'The Worker pre-processes the canvas bitmap using adaptive binarization and thresholding, then feeds character contours into neural network language models to extract high-accuracy text strings in real-time.'
          ]
        },
        {
          heading: 'Smart PDF Compression Techniques',
          body: [
            'Unoptimized PDFs often balloon in size due to uncompressed embedded JPEG artifacts and redundant color profiles. Our local compression engine dynamically recalculates image quality and downsamples high-DPI scans, easily reducing 15MB documents down to under 1.5MB for email attachment limits.'
          ]
        }
      ],
      takeaways: [
        'Web Workers allow multi-page OCR and compression without freezing your browser interface.',
        'Sensitive financial contracts and legal records remain strictly confidential on your machine.',
        'Produce optimized, standards-compliant PDF/A files ready for official submission.'
      ],
      relatedTool: {
        name: 'PDF Workshop',
        route: '/pdf-workshop',
        label: 'Open PDF Workshop'
      }
    }
  },
  {
    id: '3',
    slug: 'understanding-dpi-vs-resolution-passport-exam-portals',
    title: 'DPI vs Resolution: How to Accurately Prepare Photos for Government & Exam Portals',
    category: 'image',
    categoryLabel: 'Image Guides',
    summary: 'Demystifying Dots Per Inch (DPI), Pixel Dimensions, and JFIF/pHYs metadata chunks so your uploaded photos are never rejected by automated government validation portals.',
    readTime: '3 min read',
    date: 'Sep 08, 2026',
    publishedAt: 1788816000000,
    author: 'Quantum Qbit Team',
    tags: ['DPI', 'Passports', 'Government Portals', 'Image Resizing'],
    content: {
      intro: 'Nearly every government job application, passport portal, and university admission form requires photos to comply with strict dimensional and density requirements—such as "300 DPI, exactly 35mm x 45mm, under 50 KB". Understanding how DPI works ensures your uploads never get rejected.',
      sections: [
        {
          heading: 'DPI is Density, Not Pixel Count',
          body: [
            'A common misconception is that increasing DPI increases an image\'s pixel resolution. In reality, an image that is 600 × 600 pixels has exactly 360,000 pixels regardless of whether its metadata declares 72 DPI or 300 DPI.',
            'DPI (Dots Per Inch) is simply a physical print instruction header embedded in the file. When a government portal reads your photo, its automated scanner reads the JFIF metadata block in JPEG files or the pHYs chunk in PNG files to verify print density.'
          ],
          tip: 'To change DPI properly, the software must inject binary markers into the file header. Simply changing the file extension will fail portal checks.'
        },
        {
          heading: 'How Quantum Qbit Injects Exact DPI Metadata',
          body: [
            'Our Image Studio provides an automated DPI injector that writes standard APP0 JFIF density bytes (`0x01` unit specifier) directly into JPEG buffers, and inserts a calibrated `pHYs` chunk into PNG binaries.',
            'This guarantees 100% compliance with strict government portals (such as US State Dept, UK Passport Office, India SSC/UPSC, and Schengen visa systems) while keeping file size strictly within their prescribed limits.'
          ]
        }
      ],
      takeaways: [
        'DPI is a metadata header indicating how many pixels correspond to one physical inch of print.',
        'Use Image Studio to simultaneously resize dimensions, inject 300 DPI, and compress below KB caps.',
        'Never re-save photos through social media or messaging apps, as they strip DPI metadata.'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Tune DPI in Image Studio'
      }
    }
  },
  {
    id: '4',
    slug: 'lossless-vs-lossy-compression-guide',
    title: 'Lossless vs Lossy Compression: How to Cut File Sizes by 90% Without Visual Degradation',
    category: 'tech',
    categoryLabel: 'Web Tech',
    summary: 'A deep look at discrete cosine transforms (DCT), chroma subsampling (4:2:0), and modern WebP quantization techniques for lightning-fast web assets.',
    readTime: '4 min read',
    date: 'Sep 02, 2026',
    publishedAt: 1788297600000,
    author: 'Quantum Qbit Team',
    tags: ['Compression', 'WebP', 'Performance', 'Media Tech'],
    content: {
      intro: 'Whether you are preparing banners for a web application, sending resumes over email, or archiving family photo albums, file compression is essential. Choosing the right compression strategy allows you to reduce files by over 90% while keeping them visually indistinguishable from the original.',
      sections: [
        {
          heading: 'Lossy vs Lossless: Choosing the Right Trade-off',
          body: [
            'Lossless compression (such as PNG and standard Deflate) preserves every single pixel value with mathematical exactness. It is ideal for logos, screenshots with sharp text, and geometric illustrations.',
            'Lossy compression (such as JPEG and lossy WebP) takes advantage of human visual perception limitations. Human eyes are significantly more sensitive to variations in brightness (luminance) than to subtle variations in color (chrominance). By applying 4:2:0 chroma subsampling and frequency quantization, high-frequency details that the human eye cannot perceive are discarded, yielding massive size reductions.'
          ]
        },
        {
          heading: 'Why Modern WebP is the Optimal Format',
          body: [
            'WebP incorporates advanced spatial predictive coding derived from VP8 video frames. On average, a WebP file is 26% smaller than an equivalent PNG and 25-34% smaller than an equivalent JPEG at identical SSIM quality scores.',
            'Quantum Qbit allows instant 1-click conversion between PNG, JPEG, and WebP, alongside a target KB slider that automatically calculates optimal quantization factors.'
          ]
        }
      ],
      takeaways: [
        'Use WebP or optimized JPEG for photographic assets to save 80-90% file size.',
        'Keep screenshots, charts, and transparent graphics in PNG to prevent text fringing.',
        'Our local compressor lets you define an exact target KB limit (e.g. 50KB or 200KB).'
      ],
      relatedTool: {
        name: 'Image Studio',
        route: '/image-studio',
        label: 'Compress Images Locally'
      }
    }
  }
];

class BlogStorageService {
  private notifyListeners() {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }

  public getBlogs(): BlogPost[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        // Initialize with default posts
        this.saveBlogsToStorage(INITIAL_DEFAULT_POSTS);
        return INITIAL_DEFAULT_POSTS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      return INITIAL_DEFAULT_POSTS;
    } catch (e) {
      console.error('Failed to load blogs from storage:', e);
      return INITIAL_DEFAULT_POSTS;
    }
  }

  public getBlogByIdOrSlug(idOrSlug: string): BlogPost | undefined {
    const blogs = this.getBlogs();
    return blogs.find(
      (b) => b.id === idOrSlug || b.slug.toLowerCase() === idOrSlug.toLowerCase()
    );
  }

  private hasSynced = false;

  constructor() {
    // Attempt background sync with Hostinger server on load
    if (typeof window !== 'undefined') {
      setTimeout(() => this.syncWithServer(), 100);
    }
  }

  public async syncWithServer(): Promise<BlogPost[]> {
    try {
      const res = await fetch('/api/blogs_v2.php', {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // If server returned data (even empty array from deletions)
          const mappedPosts: BlogPost[] = data.map((item: any) => {
            // Support both our schema and PHP legacy schema
            const id = item.id || Date.now().toString();
            const slug = item.slug || id;
            const title = item.title || 'Untitled';
            const category = item.category_id || 'tech';
            const categoryLabel = item.category || item.categoryLabel || 'Web Tech';
            const summary = item.excerpt || item.summary || '';
            const readTime = item.readTime || item.read_time || '3 min read';
            const date = item.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const author = item.author || 'Quantum Qbit Team';
            const tags = Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(',') : [categoryLabel]);
            const coverImage = item.coverImage || undefined;
            const htmlContent = item.htmlContent || (typeof item.content === 'string' ? item.content : undefined);
            const rawMarkup = item.rawMarkup || undefined;

            return {
              id,
              slug,
              title,
              category,
              categoryLabel,
              summary,
              readTime,
              date,
              publishedAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
              author,
              tags,
              coverImage,
              htmlContent,
              rawMarkup,
              content: {
                intro: summary,
                sections: [],
                takeaways: Array.isArray(item.takeaways) ? item.takeaways : [],
                relatedTool: undefined
              }
            };
          });

          this.saveBlogsToStorage(mappedPosts);
          this.hasSynced = true;
          this.notifyListeners();
          return mappedPosts;
        }
      }
    } catch (e) {
      // Server offline or local dev without PHP; fallback to localStorage
    }
    return this.getBlogs();
  }

  public async saveBlog(blog: BlogPost): Promise<void> {
    const blogs = this.getBlogs();
    const existingIndex = blogs.findIndex((b) => b.id === blog.id || b.slug === blog.slug);

    if (existingIndex >= 0) {
      blogs[existingIndex] = blog;
    } else {
      blogs.unshift(blog); // Newest at the top
    }

    this.saveBlogsToStorage(blogs);
    this.notifyListeners();

    // Persist to Hostinger server
    try {
      await fetch('/api/blogs_v2.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: blog.id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.summary,
          content: blog.htmlContent || blog.summary,
          author: 'Quantum Qbit Team',
          category_id: blog.category,
          category: blog.categoryLabel,
          tags: blog.tags,
          coverImage: blog.coverImage,
          rawMarkup: blog.rawMarkup,
          takeaways: blog.content.takeaways
        })
      });
    } catch (e) {
      console.warn('Could not sync save with server, saved locally:', e);
    }
  }

  public async updateBlog(id: string, updates: Partial<BlogPost>): Promise<void> {
    const blogs = this.getBlogs();
    const idx = blogs.findIndex((b) => b.id === id);
    if (idx >= 0) {
      blogs[idx] = { ...blogs[idx], ...updates };
      this.saveBlogsToStorage(blogs);
      this.notifyListeners();

      try {
        const blog = blogs[idx];
        await fetch('/api/blogs_v2.php', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: blog.id,
            slug: blog.slug,
            title: blog.title,
            excerpt: blog.summary,
            content: blog.htmlContent || blog.summary,
            author: 'Quantum Qbit Team',
            category_id: blog.category,
            category: blog.categoryLabel,
            tags: blog.tags,
            coverImage: blog.coverImage,
            rawMarkup: blog.rawMarkup,
            takeaways: blog.content.takeaways
          })
        });
      } catch (e) {
        console.warn('Could not sync update with server, updated locally:', e);
      }
    }
  }

  public async deleteBlog(id: string): Promise<void> {
    const blogs = this.getBlogs().filter((b) => b.id !== id);
    this.saveBlogsToStorage(blogs);
    this.notifyListeners();

    try {
      await fetch(`/api/blogs_v2.php?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Could not sync delete with server, deleted locally:', e);
    }
  }

  public async deleteBatchBlogs(ids: string[]): Promise<void> {
    const idSet = new Set(ids);
    const blogs = this.getBlogs().filter((b) => !idSet.has(b.id));
    this.saveBlogsToStorage(blogs);
    this.notifyListeners();

    try {
      await fetch('/api/blogs_v2.php', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids })
      });
    } catch (e) {
      console.warn('Could not sync batch delete with server, deleted locally:', e);
    }
  }

  public async deleteAllBlogs(): Promise<void> {
    this.saveBlogsToStorage([]);
    this.notifyListeners();

    try {
      await fetch('/api/blogs_v2.php?action=delete_all', {
        method: 'DELETE',
        credentials: 'include'
      });
    } catch (e) {
      console.warn('Could not sync delete all with server, cleared locally:', e);
    }
  }

  public resetToDefaults(): void {
    this.saveBlogsToStorage(INITIAL_DEFAULT_POSTS);
    this.notifyListeners();
  }

  public exportBlogsJson(): string {
    return JSON.stringify(this.getBlogs(), null, 2);
  }

  public importBlogsJson(jsonString: string): { success: boolean; count?: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!Array.isArray(parsed)) {
        return { success: false, error: 'JSON root must be an array of articles.' };
      }
      this.saveBlogsToStorage(parsed);
      this.notifyListeners();
      return { success: true, count: parsed.length };
    } catch (e: any) {
      return { success: false, error: e.message || 'Invalid JSON format.' };
    }
  }

  private saveBlogsToStorage(blogs: BlogPost[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blogs));
    } catch (e) {
      console.error('Failed to save blogs to storage:', e);
    }
  }

  public subscribe(callback: () => void): () => void {
    const handler = () => callback();
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }
}

export const blogStorage = new BlogStorageService();
