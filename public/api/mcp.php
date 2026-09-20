<?php
// Model Context Protocol (MCP) Server for Quantum Qbit
// Supports JSON-RPC 2.0 direct POST and SSE (Server-Sent Events) streaming

$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-API-Key, X-Requested-With, Accept");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db_config.php';

$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$blogsFile = __DIR__ . '/data/blogs.json';
$persistentBlogsFile = $persistentDir . '/blogs.json';

// Retrieve valid API key
function getValidApiKey($configFile) {
    if (!file_exists(dirname($configFile))) {
        @mkdir(dirname($configFile), 0755, true);
    }
    $config = [];
    if (file_exists($configFile)) {
        $config = json_decode(file_get_contents($configFile), true);
        if (!is_array($config)) $config = [];
    }
    if (!isset($config['api_key']) || empty($config['api_key'])) {
        $config['api_key'] = 'qq_live_' . bin2hex(random_bytes(16));
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
    }
    return $config['api_key'];
}

$validApiKey = getValidApiKey($configFile);

// Extract supplied API key from headers or request
function getSuppliedKey() {
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        return trim($_SERVER['HTTP_X_API_KEY']);
    }
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
        if (stripos($authHeader, 'Bearer ') === 0) {
            return trim(substr($authHeader, 7));
        }
        return $authHeader;
    }
    if (isset($_GET['api_key'])) {
        return trim($_GET['api_key']);
    }
    return '';
}

// Check if request is asking for SSE connection
$acceptHeader = isset($_SERVER['HTTP_ACCEPT']) ? $_SERVER['HTTP_ACCEPT'] : '';
$isSSE = strpos($acceptHeader, 'text/event-stream') !== false || (isset($_GET['sse']) && $_GET['sse'] === '1');

// Handle GET requests
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($isSSE) {
        // SSE handshake for remote MCP clients
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no');

        $sessionId = 'mcp_' . bin2hex(random_bytes(12));
        $apiKeyParam = !empty($_GET['api_key']) ? '&api_key=' . urlencode($_GET['api_key']) : '';
        $endpointUrl = '/api/mcp.php?sessionId=' . $sessionId . $apiKeyParam;

        echo "event: endpoint\n";
        echo "data: " . $endpointUrl . "\n\n";
        flush();
        exit;
    } else {
        // Plain GET: return server descriptor
        header('Content-Type: application/json');
        echo json_encode([
            'name' => 'quantum-qbit-blogs',
            'version' => '1.0.0',
            'protocol' => 'mcp-2024-11-05',
            'description' => 'Quantum Qbit Blog Publishing Model Context Protocol (MCP) Server',
            'endpoint' => 'https://quantumqbit.in/api/mcp.php',
            'authentication' => 'Pass api_key as query parameter or X-API-Key header',
            'tools' => [
                'publish_blog',
                'get_blog_format_template',
                'list_recent_blogs'
            ]
        ], JSON_PRETTY_PRINT);
        exit;
    }
}

// POST: JSON-RPC 2.0 Handling
header('Content-Type: application/json');
$rawInput = file_get_contents('php://input');
$request = json_decode($rawInput, true);

if (!is_array($request) || !isset($request['method'])) {
    http_response_code(400);
    echo json_encode([
        'jsonrpc' => '2.0',
        'id' => null,
        'error' => [
            'code' => -32600,
            'message' => 'Invalid Request: Expected JSON-RPC 2.0 object with a method.'
        ]
    ]);
    exit;
}

$id = isset($request['id']) ? $request['id'] : null;
$method = $request['method'];
$params = isset($request['params']) && is_array($request['params']) ? $request['params'] : [];

// Helper functions for blog operations
function createSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

function calculateReadTime($html) {
    $words = str_word_count(strip_tags($html));
    $wpm = 200;
    $minutes = ceil($words / $wpm);
    return ($minutes > 0 ? $minutes : 1) . ' min read';
}

function extractXmlTag($text, $tags) {
    foreach ($tags as $tag) {
        $pattern = '/<' . preg_quote($tag, '/') . '[^>]*>(.*?)<\/' . preg_quote($tag, '/') . '>/is';
        if (preg_match($pattern, $text, $matches)) {
            return trim($matches[1]);
        }
    }
    return null;
}

function loadBlogs($blogsFile, $persistentBlogsFile) {
    $blogs = [];
    if (file_exists($persistentBlogsFile)) {
        $data = json_decode(file_get_contents($persistentBlogsFile), true);
        if (is_array($data) && !empty($data)) return $data;
    }
    if (file_exists($blogsFile)) {
        $data = json_decode(file_get_contents($blogsFile), true);
        if (is_array($data)) return $data;
    }
    return [];
}

// JSON-RPC Method Dispatcher
switch ($method) {
    // 1. Initialize Handshake
    case 'initialize':
        echo json_encode([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => [
                'protocolVersion' => '2024-11-05',
                'capabilities' => [
                    'tools' => (object)[]
                ],
                'serverInfo' => [
                    'name' => 'quantum-qbit-blogs',
                    'version' => '1.0.0',
                    'description' => 'Remote publishing tools for Quantum Qbit web utilities'
                ]
            ]
        ]);
        break;

    case 'notifications/initialized':
        // Client acknowledgment notification
        exit(0);

    // 2. Tools Discovery
    case 'tools/list':
        echo json_encode([
            'jsonrpc' => '2.0',
            'id' => $id,
            'result' => [
                'tools' => [
                    [
                        'name' => 'publish_blog',
                        'description' => 'Publish a new blog article directly to Quantum Qbit. You can either provide direct fields (title, category, content, summary) or the full Quantum Qbit custom tag format (<title>, <category>, <body>). Author is automatically set to Quantum Qbit Team.',
                        'inputSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'title' => [
                                    'type' => 'string',
                                    'description' => 'Engaging, SEO-optimized title of the article'
                                ],
                                'category' => [
                                    'type' => 'string',
                                    'description' => 'Category (e.g. "Privacy & Security", "Web Technology", "Developer Utilities")'
                                ],
                                'summary' => [
                                    'type' => 'string',
                                    'description' => 'A concise 2-sentence hook describing what this article covers'
                                ],
                                'content' => [
                                    'type' => 'string',
                                    'description' => 'HTML content of the article body (must be exhaustive 2,000+ words). Use <h2> for subheadings, <p> for paragraphs, <table> for tables, and <tip>Strategic Insight / Gamer Intel / Security Advisory: ...</tip> for contextual takeaways.'
                                ],
                                'format' => [
                                    'type' => 'string',
                                    'description' => 'Optional: The complete raw Quantum Qbit XML-like tag markup (<title>...</title><category>...</category><body>...</body>). Articles should be comprehensive 2,000+ words.'
                                ],
                                'tags' => [
                                    'type' => 'array',
                                    'items' => ['type' => 'string'],
                                    'description' => 'List of tags (e.g. ["Privacy", "WebAssembly", "Security"])'
                                ],
                                'cover_image' => [
                                    'type' => 'string',
                                    'description' => 'Optional high-resolution Unsplash image URL for the article header'
                                ],
                                'slug' => [
                                    'type' => 'string',
                                    'description' => 'Optional custom URL slug (auto-derived from title if omitted)'
                                ],
                                'api_key' => [
                                    'type' => 'string',
                                    'description' => 'Quantum Qbit secret publishing API key (optional if supplied via query parameter or header)'
                                ]
                            ],
                            'required' => []
                        ]
                    ],
                    [
                        'name' => 'get_blog_format_template',
                        'description' => 'Get the official Quantum Qbit writing template and markup guidelines for drafting high-quality articles of 2,000+ words.',
                        'inputSchema' => [
                            'type' => 'object',
                            'properties' => (object)[]
                        ]
                    ],
                    [
                        'name' => 'list_recent_blogs',
                        'description' => 'Retrieve recently published blog posts from Quantum Qbit to verify existing topics and avoid duplicates.',
                        'inputSchema' => [
                            'type' => 'object',
                            'properties' => [
                                'limit' => [
                                    'type' => 'number',
                                    'description' => 'Number of articles to return (default: 5)'
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]);
        break;

    // 3. Tool Execution
    case 'tools/call':
        $toolName = isset($params['name']) ? $params['name'] : '';
        $args = isset($params['arguments']) && is_array($params['arguments']) ? $params['arguments'] : [];

        // Check tool name
        if ($toolName === 'get_blog_format_template') {
            $template = "<!-- QUANTUM QBIT LONG-FORM FORMAT (2,000+ WORDS REQUIRED) -->\n"
                . "<title>Put an engaging, SEO-optimized title here</title>\n"
                . "<category>Your Category (e.g. AI Safety, Web Tech, Privacy, Geopolitics)</category>\n"
                . "<summary>Write a concise, 2-sentence hook describing what this article covers and why it matters.</summary>\n"
                . "<cover_image>https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe</cover_image>\n"
                . "<tags>Browser Privacy, WebAssembly, Security, Image Processing</tags>\n"
                . "<body>\n"
                . "  <p>Start with a strong, insightful introduction setting up the problem or landscape...</p>\n\n"
                . "  <h2>Deep Dive: Core Concepts & Architecture</h2>\n"
                . "  <p>Explain the topic with analytical depth, comprehensive background, and practical rigor across multiple detailed paragraphs...</p>\n\n"
                . "  <tip>Strategic Insight: Highlight a nuanced, contextual takeaway specific to this topic.</tip>\n\n"
                . "  <h2>Comparative Analysis & Benchmarks</h2>\n"
                . "  <table>\n"
                . "    <thead><tr><th>Metric</th><th>Client-Side (Quantum Qbit)</th><th>Legacy Cloud</th></tr></thead>\n"
                . "    <tbody><tr><td>Data Privacy</td><td>100% in RAM</td><td>Remote storage risk</td></tr></tbody>\n"
                . "  </table>\n\n"
                . "  <takeaways>\n"
                . "    <li>Key takeaway 1 on performance.</li>\n"
                . "    <li>Key takeaway 2 on privacy.</li>\n"
                . "  </takeaways>\n"
                . "</body>";

            echo json_encode([
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Quantum Qbit Blog Format Template:\n\n" . $template
                        ]
                    ]
                ]
            ]);
            break;
        }

        if ($toolName === 'list_recent_blogs') {
            $limit = isset($args['limit']) ? intval($args['limit']) : 5;
            if ($limit < 1) $limit = 5;
            if ($limit > 20) $limit = 20;

            $blogs = loadBlogs($blogsFile, $persistentBlogsFile);
            $sliced = array_slice($blogs, 0, $limit);
            $summaryList = [];
            foreach ($sliced as $b) {
                $summaryList[] = "• " . $b['title'] . "\n  Slug: " . $b['slug'] . " | Date: " . $b['date'] . " | Category: " . (isset($b['categoryLabel']) ? $b['categoryLabel'] : $b['category']) . "\n  Summary: " . $b['summary'] . "\n  URL: https://quantumqbit.in/blogs/" . $b['slug'];
            }

            echo json_encode([
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "Recent Quantum Qbit Articles (" . count($sliced) . "):\n\n" . implode("\n\n", $summaryList)
                        ]
                    ]
                ]
            ]);
            break;
        }

        if ($toolName === 'publish_blog') {
            // Validate authentication
            $key = getSuppliedKey();
            if (empty($key) && !empty($args['api_key'])) {
                $key = trim($args['api_key']);
            }

            if (empty($key) || !hash_equals($validApiKey, $key)) {
                echo json_encode([
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'result' => [
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => "Error: Unauthorized. Missing or invalid Quantum Qbit API key. Provide a valid 'api_key' argument or add ?api_key=YOUR_KEY to the MCP server URL."
                            ]
                        ],
                        'isError' => true
                    ]
                ]);
                break;
            }

            // Extract content
            $title = '';
            $category = 'Technology';
            $summary = '';
            $coverImage = '';
            $tags = [];
            $customSlug = '';
            $htmlContent = '';
            $rawMarkup = '';

            if (!empty($args['format'])) {
                $rawMarkup = $args['format'];
                $extractedTitle = extractXmlTag($rawMarkup, ['title']);
                if ($extractedTitle) $title = $extractedTitle;
                $extractedCat = extractXmlTag($rawMarkup, ['category']);
                if ($extractedCat) $category = $extractedCat;
                $extractedSummary = extractXmlTag($rawMarkup, ['summary', 'description', 'excerpt']);
                if ($extractedSummary) $summary = $extractedSummary;
                $extractedCover = extractXmlTag($rawMarkup, ['cover_image', 'cover', 'image']);
                if ($extractedCover) $coverImage = $extractedCover;
                $extractedTags = extractXmlTag($rawMarkup, ['tags', 'tag']);
                if ($extractedTags) $tags = array_filter(array_map('trim', explode(',', $extractedTags)));
                $extractedSlug = extractXmlTag($rawMarkup, ['slug']);
                if ($extractedSlug) $customSlug = createSlug($extractedSlug);

                $extractedBody = extractXmlTag($rawMarkup, ['body', 'content']);
                if ($extractedBody) {
                    $extractedBody = preg_replace_callback('/<tip[^>]*>(.*?)<\/tip>/is', function($m) {
                        return '<div class="blog-callout blog-tip"><span class="callout-icon">💡</span><div>' . trim($m[1]) . '</div></div>';
                    }, $extractedBody);
                    $extractedBody = preg_replace_callback('/<takeaways[^>]*>(.*?)<\/takeaways>/is', function($m) {
                        return '<div class="blog-takeaways"><h3>Key Takeaways</h3><ul>' . trim($m[1]) . '</ul></div>';
                    }, $extractedBody);
                    $htmlContent = $extractedBody;
                }
            }

            // Fallback / direct fields
            if (!empty($args['title'])) $title = trim($args['title']);
            if (!empty($args['category'])) $category = trim($args['category']);
            if (!empty($args['summary'])) $summary = trim($args['summary']);
            if (!empty($args['cover_image'])) $coverImage = trim($args['cover_image']);
            if (!empty($args['slug'])) $customSlug = createSlug($args['slug']);
            if (!empty($args['content']) && empty($htmlContent)) {
                $htmlContent = trim($args['content']);
            }
            if (!empty($args['tags']) && is_array($args['tags'])) {
                $tags = $args['tags'];
            }

            if (empty($title) || empty($htmlContent)) {
                echo json_encode([
                    'jsonrpc' => '2.0',
                    'id' => $id,
                    'result' => [
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => "Validation Error: Both 'title' and 'content' (or complete 'format' tags) are required to publish an article."
                            ]
                        ],
                        'isError' => true
                    ]
                ]);
                break;
            }

            if (empty($summary)) {
                $summary = substr(strip_tags($htmlContent), 0, 160) . '...';
            }
            if (empty($tags)) {
                $tags = [$category, 'Quantum Qbit', 'Web Tech'];
            }

            $baseSlug = !empty($customSlug) ? $customSlug : createSlug($title);
            if (empty($baseSlug)) $baseSlug = 'article-' . time();
            $slug = $baseSlug;

            $author = 'Quantum Qbit Team';
            $date = date('M d, Y');
            $publishedAt = time() * 1000;
            $readTime = calculateReadTime($htmlContent);
            $categoryId = createSlug($category);
            if (empty($categoryId)) $categoryId = 'general';

            $blogs = loadBlogs($blogsFile, $persistentBlogsFile);
            $existingSlugs = array_column($blogs, 'slug');
            $existingIds = array_column($blogs, 'id');
            $counter = 1;
            while (in_array($slug, $existingSlugs) || in_array($slug, $existingIds)) {
                $slug = $baseSlug . '-' . $counter;
                $counter++;
            }
            $blogId = $slug;

            $newBlog = [
                'id' => $blogId,
                'slug' => $slug,
                'title' => $title,
                'category' => $categoryId,
                'categoryLabel' => $category,
                'summary' => $summary,
                'readTime' => $readTime,
                'date' => $date,
                'publishedAt' => $publishedAt,
                'author' => $author,
                'tags' => array_values($tags),
                'coverImage' => $coverImage,
                'htmlContent' => $htmlContent,
                'rawMarkup' => !empty($rawMarkup) ? $rawMarkup : null,
                'content' => [
                    'intro' => $summary,
                    'sections' => [],
                    'takeaways' => []
                ]
            ];

            array_unshift($blogs, $newBlog);

            // Save to JSON
            if (!file_exists(dirname($blogsFile))) @mkdir(dirname($blogsFile), 0755, true);
            file_put_contents($blogsFile, json_encode($blogs, JSON_PRETTY_PRINT));
            if (!file_exists(dirname($persistentBlogsFile))) @mkdir(dirname($persistentBlogsFile), 0755, true);
            file_put_contents($persistentBlogsFile, json_encode($blogs, JSON_PRETTY_PRINT));

            // Save to MySQL DB if connection active
            $pdo = getDBConnection();
            if ($pdo) {
                try {
                    $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
                    $stmtCat->execute(['id' => $categoryId, 'name' => $category]);
                    $stmtBlog = $pdo->prepare("
                        INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
                        VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
                    ");
                    $stmtBlog->execute([
                        'id' => $blogId,
                        'title' => $title,
                        'excerpt' => $summary,
                        'content' => $htmlContent,
                        'author' => $author,
                        'date' => $date,
                        'read_time' => $readTime,
                        'category_id' => $categoryId,
                        'image_glow' => 'rgba(0, 242, 254, 0.15)'
                    ]);
                } catch (Exception $e) {}
            }

            $liveUrl = "https://quantumqbit.in/blogs/" . $slug;

            echo json_encode([
                'jsonrpc' => '2.0',
                'id' => $id,
                'result' => [
                    'content' => [
                        [
                            'type' => 'text',
                            'text' => "🎉 Blog Successfully Published to Quantum Qbit!\n\n"
                                . "• Title: " . $title . "\n"
                                . "• Category: " . $category . "\n"
                                . "• Author: " . $author . "\n"
                                . "• Published: " . $date . " (" . $readTime . ")\n"
                                . "• Live Article URL: " . $liveUrl . "\n\n"
                                . "The article is live on https://quantumqbit.in and visible to all readers immediately."
                        ]
                    ]
                ]
            ]);
            break;
        }

        // Unknown tool
        echo json_encode([
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => [
                'code' => -32601,
                'message' => 'Method not found: Unknown tool ' . htmlspecialchars($toolName)
            ]
        ]);
        break;

    default:
        echo json_encode([
            'jsonrpc' => '2.0',
            'id' => $id,
            'error' => [
                'code' => -32601,
                'message' => 'Method not found: ' . htmlspecialchars($method)
            ]
        ]);
        break;
}
