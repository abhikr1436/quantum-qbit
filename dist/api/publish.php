<?php
require_once __DIR__ . '/cors.php';

// Session init (for optional cookie auth)
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}
@session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';

// Storage paths
$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$blogsFile = __DIR__ . '/data/blogs.json';
$persistentBlogsFile = $persistentDir . '/blogs.json';
$categoriesFile = __DIR__ . '/data/categories.json';

// Helper to get or initialize API Key
function getValidApiKey($configFile) {
    if (!file_exists(dirname($configFile))) {
        @mkdir(dirname($configFile), 0755, true);
    }
    $config = [];
    if (file_exists($configFile)) {
        $config = json_decode(file_get_contents($configFile), true);
        if (!is_array($config)) {
            $config = [];
        }
    }
    if (!isset($config['api_key']) || empty($config['api_key'])) {
        $config['api_key'] = 'qq_live_' . bin2hex(random_bytes(16));
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
    }
    return $config['api_key'];
}

$validApiKey = getValidApiKey($configFile);

// Extract supplied API key from headers or request
$suppliedKey = '';
if (isset($_SERVER['HTTP_X_API_KEY'])) {
    $suppliedKey = trim($_SERVER['HTTP_X_API_KEY']);
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    if (stripos($authHeader, 'Bearer ') === 0) {
        $suppliedKey = trim(substr($authHeader, 7));
    } else {
        $suppliedKey = $authHeader;
    }
} elseif (isset($_GET['api_key'])) {
    $suppliedKey = trim($_GET['api_key']);
}

// Read raw body
$rawInput = file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true);

if (empty($suppliedKey) && is_array($jsonInput) && isset($jsonInput['api_key'])) {
    $suppliedKey = trim($jsonInput['api_key']);
}

// Check authorization
$isAuthenticated = false;
if (!empty($suppliedKey) && hash_equals($validApiKey, $suppliedKey)) {
    $isAuthenticated = true;
} elseif (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    $isAuthenticated = true;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET Route: Public documentation / Status ping
if ($method === 'GET') {
    echo json_encode([
        'status' => 'online',
        'service' => 'Quantum Qbit Remote Blog Publishing API',
        'endpoint' => 'POST /api/publish.php',
        'authenticated' => $isAuthenticated,
        'documentation' => [
            'headers' => [
                'Content-Type' => 'application/json',
                'X-API-Key' => 'YOUR_SECRET_API_KEY'
            ],
            'formats' => [
                'tag_format' => [
                    'format' => '<title>Article Title</title>\n<category>Tech</category>\n<summary>Short summary...</summary>\n<body><p>Content...</p></body>'
                ],
                'json_format' => [
                    'title' => 'Article Title',
                    'category' => 'Technology',
                    'summary' => 'Short summary hook...',
                    'content' => '<p>HTML content here...</p>',
                    'cover_image' => 'https://images.unsplash.com/... (optional)',
                    'tags' => ['Tech', 'Privacy']
                ]
            ],
            'auto_generated' => [
                'author' => 'Quantum Qbit Team (Fixed)',
                'date' => 'Current timestamp automatically calculated',
                'read_time' => 'Calculated automatically from word count',
                'slug' => 'Auto-generated from title if omitted'
            ]
        ]
    ], JSON_PRETTY_PRINT);
    exit;
}

// All modifications require valid authentication
if (!$isAuthenticated) {
    http_response_code(401);
    echo json_encode([
        'error' => 'Unauthorized',
        'message' => 'Invalid or missing API key. Pass your key via header "X-API-Key: YOUR_KEY" or parameter "api_key".'
    ]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed. Use POST to publish an article.']);
    exit;
}

// Helpers
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

// Extract article details from payload
$title = '';
$category = 'Technology';
$summary = '';
$coverImage = '';
$tags = [];
$customSlug = '';
$htmlContent = '';

// Case A: Custom tag markup format
$markupText = '';
if (is_array($jsonInput) && (isset($jsonInput['format']) || isset($jsonInput['markup']) || isset($jsonInput['raw']))) {
    $markupText = isset($jsonInput['format']) ? $jsonInput['format'] : (isset($jsonInput['markup']) ? $jsonInput['markup'] : $jsonInput['raw']);
} elseif (is_string($rawInput) && (strpos($rawInput, '<title>') !== false || strpos($rawInput, '<category>') !== false)) {
    $markupText = $rawInput;
}

if (!empty($markupText)) {
    $extractedTitle = extractXmlTag($markupText, ['title']);
    if ($extractedTitle) $title = $extractedTitle;
    
    $extractedCat = extractXmlTag($markupText, ['category']);
    if ($extractedCat) $category = $extractedCat;

    $extractedSummary = extractXmlTag($markupText, ['summary', 'description', 'excerpt']);
    if ($extractedSummary) $summary = $extractedSummary;

    $extractedCover = extractXmlTag($markupText, ['cover_image', 'cover', 'image']);
    if ($extractedCover) $coverImage = $extractedCover;

    $extractedTags = extractXmlTag($markupText, ['tags', 'tag']);
    if ($extractedTags) {
        $tags = array_filter(array_map('trim', explode(',', $extractedTags)));
    }

    $extractedSlug = extractXmlTag($markupText, ['slug']);
    if ($extractedSlug) $customSlug = createSlug($extractedSlug);

    $extractedBody = extractXmlTag($markupText, ['body', 'content']);
    if ($extractedBody) {
        // Transform custom tags in body
        $extractedBody = preg_replace_callback('/<tip[^>]*>(.*?)<\/tip>/is', function($m) {
            return '<div class="blog-callout blog-tip"><span class="callout-icon">💡</span><div>' . trim($m[1]) . '</div></div>';
        }, $extractedBody);

        $extractedBody = preg_replace_callback('/<takeaways[^>]*>(.*?)<\/takeaways>/is', function($m) {
            return '<div class="blog-takeaways"><h3>Key Takeaways</h3><ul>' . trim($m[1]) . '</ul></div>';
        }, $extractedBody);

        $htmlContent = $extractedBody;
    }
}

// Case B: Direct JSON fields (or overrides)
if (is_array($jsonInput)) {
    if (!empty($jsonInput['title'])) $title = trim($jsonInput['title']);
    if (!empty($jsonInput['category'])) $category = trim($jsonInput['category']);
    if (!empty($jsonInput['categoryLabel'])) $category = trim($jsonInput['categoryLabel']);
    if (!empty($jsonInput['summary'])) $summary = trim($jsonInput['summary']);
    if (!empty($jsonInput['excerpt'])) $summary = trim($jsonInput['excerpt']);
    if (!empty($jsonInput['cover_image'])) $coverImage = trim($jsonInput['cover_image']);
    if (!empty($jsonInput['coverImage'])) $coverImage = trim($jsonInput['coverImage']);
    if (!empty($jsonInput['slug'])) $customSlug = createSlug($jsonInput['slug']);
    if (!empty($jsonInput['content']) && empty($htmlContent)) {
        if (is_array($jsonInput['content'])) {
            $htmlContent = '';
            foreach ($jsonInput['content'] as $p) {
                $htmlContent .= '<p>' . htmlspecialchars($p) . '</p>';
            }
        } else {
            $htmlContent = trim($jsonInput['content']);
        }
    }
    if (!empty($jsonInput['tags'])) {
        if (is_array($jsonInput['tags'])) {
            $tags = $jsonInput['tags'];
        } else {
            $tags = array_filter(array_map('trim', explode(',', $jsonInput['tags'])));
        }
    }
}

// Validation
if (empty($title)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Validation Error',
        'message' => 'Article title is required. Pass <title>...</title> in format or "title" in JSON.'
    ]);
    exit;
}

if (empty($htmlContent)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Validation Error',
        'message' => 'Article body content is required. Pass <body>...</body> in format or "content" in JSON.'
    ]);
    exit;
}

// Auto-derive summary if missing
if (empty($summary)) {
    $stripped = strip_tags($htmlContent);
    $summary = substr($stripped, 0, 160) . '...';
}

// Default tags if empty
if (empty($tags)) {
    $tags = [$category, 'Quantum Qbit', 'Web Tech'];
}

// Build ID and Slug
$baseSlug = !empty($customSlug) ? $customSlug : createSlug($title);
if (empty($baseSlug)) {
    $baseSlug = 'article-' . time();
}
$slug = $baseSlug;

// Mandatory policies
$author = 'Quantum Qbit Team';
$date = date('M d, Y');
$publishedAt = time() * 1000;
$readTime = calculateReadTime($htmlContent);
$categoryId = createSlug($category);
if (empty($categoryId)) $categoryId = 'general';

// Load existing blogs from JSON
function loadBlogsJson($file) {
    if (!file_exists($file)) return [];
    $content = file_get_contents($file);
    $decoded = json_decode($content, true);
    return is_array($decoded) ? $decoded : [];
}

function saveBlogsJson($file, $data) {
    if (!file_exists(dirname($file))) {
        @mkdir(dirname($file), 0755, true);
    }
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT)) !== false;
}

$blogs = loadBlogsJson($blogsFile);

// Check if persistent blogs file exists and has additional blogs
if (file_exists($persistentBlogsFile)) {
    $persBlogs = loadBlogsJson($persistentBlogsFile);
    if (!empty($persBlogs)) {
        $blogs = $persBlogs;
    }
}

// Ensure unique slug and ID
$existingSlugs = array_column($blogs, 'slug');
$existingIds = array_column($blogs, 'id');
$counter = 1;
while (in_array($slug, $existingSlugs) || in_array($slug, $existingIds)) {
    $slug = $baseSlug . '-' . $counter;
    $counter++;
}
$id = $slug;

// Construct complete blog record
$newBlog = [
    'id' => $id,
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
    'rawMarkup' => !empty($markupText) ? $markupText : null,
    'content' => [
        'intro' => $summary,
        'sections' => [],
        'takeaways' => []
    ]
];

// Prepend to list (latest published first)
array_unshift($blogs, $newBlog);

// Save to both public and persistent non-webroot storage
saveBlogsJson($blogsFile, $blogs);
saveBlogsJson($persistentBlogsFile, $blogs);

// Save to MySQL DB if connection is available
$pdo = getDBConnection();
if ($pdo) {
    try {
        // Ensure category exists
        $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
        $stmtCat->execute(['id' => $categoryId, 'name' => $category]);

        $stmtBlog = $pdo->prepare("
            INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
            VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
        ");
        $stmtBlog->execute([
            'id' => $id,
            'title' => $title,
            'excerpt' => $summary,
            'content' => $htmlContent,
            'author' => $author,
            'date' => $date,
            'read_time' => $readTime,
            'category_id' => $categoryId,
            'image_glow' => 'rgba(0, 242, 254, 0.15)'
        ]);
    } catch (Exception $e) {
        // Fallback JSON already saved successfully
    }
}

// Respond with 201 Created
http_response_code(201);
echo json_encode([
    'success' => true,
    'message' => 'Article published successfully via Quantum Qbit Remote API!',
    'blog' => [
        'id' => $newBlog['id'],
        'slug' => $newBlog['slug'],
        'title' => $newBlog['title'],
        'category' => $newBlog['categoryLabel'],
        'author' => $newBlog['author'],
        'date' => $newBlog['date'],
        'read_time' => $newBlog['readTime'],
        'url' => 'https://quantumqbit.in/blogs/' . $newBlog['slug'],
        'local_url' => '/blogs/' . $newBlog['slug']
    ]
], JSON_PRETTY_PRINT);
