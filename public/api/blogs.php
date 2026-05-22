<?php
// Enable CORS for local dev environment testing (if cross-origin)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Start PHP Session
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();
header('Content-Type: application/json');

$blogsFile = __DIR__ . '/data/blogs.json';

// Helper to load blogs, creating a default seed file if it doesn't exist
function getBlogs($blogsFile) {
    if (!file_exists(dirname($blogsFile))) {
        mkdir(dirname($blogsFile), 0755, true);
    }
    
    if (!file_exists($blogsFile)) {
        // Seed default blog posts
        $defaultBlogs = [
            [
                'id' => 'browser-privacy',
                'title' => 'Why Browser-Only Tools Are the Future of Web Utility Apps',
                'excerpt' => 'In an era of rising security concerns, running calculations, converting PDFs, and editing photos locally protects user data from server hazards.',
                'author' => 'Quantum Engineering Team',
                'date' => 'May 18, 2026',
                'readTime' => '4 min read',
                'category' => 'Privacy & Security',
                'imageGlow' => 'rgba(0, 242, 254, 0.1)',
                'content' => [
                    'In the early days of the web, performing complex file manipulations—like resizing high-resolution images or compiling documents—required powerful servers. Files were uploaded, processed remotely, and then sent back. While this worked, it introduced two major pain points: server network latency and privacy vulnerabilities.',
                    'Today, modern web browser standards have changed the game. Technologies like WebAssembly, HTML5 Canvas, and File System APIs allow modern browsers to execute high-performance desktop-grade code directly on the user\'s CPU.',
                    'By keeping operations 100% client-side, utility applications ensure that private photos and intellectual document drafts never touch a server database. There are no data leaks, no server costs to pass down as paywalls, and execution is sub-second, running completely offline.',
                    'At Quantum Qbit, our entire architectural design centers on local-first processing. When you convert images to PDF or apply canvas color filters in our Image Studio, all computations happen inside your browser memory cache. It is safe, clean, and instant.'
                ]
            ],
            [
                'id' => 'base-math',
                'title' => 'The Logic Behind Real-Time Cross-Input Number Base Conversions',
                'excerpt' => 'Understanding how computers translate binary, octal, decimal, and hexadecimal representations under the hood to optimize data structures.',
                'author' => 'Dr. Clara Chen',
                'date' => 'May 10, 2026',
                'readTime' => '5 min read',
                'category' => 'Computer Science',
                'imageGlow' => 'rgba(157, 78, 221, 0.1)',
                'content' => [
                    'To humans, numbers are decimal (base 10). To transistors, numbers are binary (base 2). To developers analyzing memory offsets or color palettes, numbers are hexadecimal (base 16). How do we bridge these bases without cognitive friction?',
                    'A base converter relies on positional notation. Each digit in a number represents a coefficient multiplied by the base raised to the power of its position index. For example, the binary sequence 1011 equates to (1 × 2³) + (0 × 2²) + (1 × 2¹) + (1 × 2⁰) = 11 in decimal.',
                    'Cross-input real-time conversion requires a reactive state tree. By standardizing any input base to a common central format (typically a standard base-10 JavaScript floating-point integer), we can instantly derive and output the other bases using native conversion algorithms.',
                    'For example, JavaScript\'s Number.toString(base) simplifies base translation in our Math Workbench. Typing in any text box updates the central decimal state, which immediately re-renders the remaining inputs, making base translation effortless and educational.'
                ]
            ],
            [
                'id' => 'image-optimization',
                'title' => 'Image Formats Decoded: Choosing Between JPG, PNG, and WEBP',
                'excerpt' => 'A deep dive into compression algorithms and when to use each format to achieve visual clarity while keeping load times minimal.',
                'author' => 'Marcus Vance',
                'date' => 'May 02, 2026',
                'readTime' => '3 min read',
                'category' => 'Creative Tech',
                'imageGlow' => 'rgba(0, 242, 254, 0.1)',
                'content' => [
                    'Web optimization depends heavily on visual assets. An unoptimized image can slow a web page to a crawl, harming SEO rankings and driving visitors away. Choosing the correct file format is the first line of defense.',
                    'JPEG (Joint Photographic Experts Group) uses lossy compression. It discards minor color data to compress natural scenery and photography into small file sizes, though it lacks transparency support.',
                    'PNG (Portable Network Graphics) uses lossless compression. It preserves every single pixel, making it ideal for logos, screenshots, and graphics requiring transparent backgrounds (alpha channel), albeit at the cost of larger file sizes.',
                    'WEBP, developed by Google, represents the modern standard. It provides both lossy and lossless compression, rendering files up to 30% smaller than JPEGs and PNGs while retaining comparable quality and alpha transparency. When using Quantum Qbit\'s Image Studio, saving as PNG is excellent for details, while converting to WEBP ensures your web app runs blazing fast.'
                ]
            ]
        ];
        file_put_contents($blogsFile, json_encode($defaultBlogs, JSON_PRETTY_PRINT));
        return $defaultBlogs;
    }
    
    $data = file_get_contents($blogsFile);
    return json_decode($data, true);
}

// Helper to save blogs
function saveBlogs($blogsFile, $blogs) {
    return file_put_contents($blogsFile, json_encode($blogs, JSON_PRETTY_PRINT)) !== false;
}

// Helper to calculate read time
function calculateReadTime($contentArray) {
    $fullText = implode(' ', $contentArray);
    $wordCount = str_word_count(strip_tags($fullText));
    $wpm = 200; // Average words per minute
    $minutes = ceil($wordCount / $wpm);
    return $minutes . ' min read';
}

// Helper to create a slug from a title
function createSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

$blogs = getBlogs($blogsFile);
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    echo json_encode($blogs);
    exit;
}

// All modifying routes require session authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($method === 'POST') {
    // Create new blog post
    $title = isset($input['title']) ? trim($input['title']) : '';
    $excerpt = isset($input['excerpt']) ? trim($input['excerpt']) : '';
    $author = isset($input['author']) ? trim($input['author']) : 'Admin';
    $category = isset($input['category']) ? trim($input['category']) : 'General';
    $imageGlow = isset($input['imageGlow']) ? trim($input['imageGlow']) : 'rgba(0, 242, 254, 0.1)';
    $content = isset($input['content']) && is_array($input['content']) ? $input['content'] : [];
    
    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content paragraphs are required']);
        exit;
    }
    
    // Create slug for ID, checking if unique
    $id = createSlug($title);
    $originalId = $id;
    $counter = 1;
    $idExists = true;
    while ($idExists) {
        $idExists = false;
        foreach ($blogs as $post) {
            if ($post['id'] === $id) {
                $idExists = true;
                $id = $originalId . '-' . $counter;
                $counter++;
                break;
            }
        }
    }
    
    $newPost = [
        'id' => $id,
        'title' => $title,
        'excerpt' => $excerpt,
        'author' => $author,
        'date' => date('M d, Y'),
        'readTime' => calculateReadTime($content),
        'category' => $category,
        'imageGlow' => $imageGlow,
        'content' => $content
    ];
    
    array_unshift($blogs, $newPost); // Add to beginning
    
    if (saveBlogs($blogsFile, $blogs)) {
        echo json_encode(['success' => true, 'post' => $newPost]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save blog post']);
    }
    
} elseif ($method === 'PUT') {
    // Update existing blog post
    $id = isset($input['id']) ? trim($input['id']) : '';
    
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    $foundIndex = -1;
    foreach ($blogs as $index => $post) {
        if ($post['id'] === $id) {
            $foundIndex = $index;
            break;
        }
    }
    
    if ($foundIndex === -1) {
        http_response_code(404);
        echo json_encode(['error' => 'Post not found']);
        exit;
    }
    
    // Update fields
    if (isset($input['title'])) $blogs[$foundIndex]['title'] = trim($input['title']);
    if (isset($input['excerpt'])) $blogs[$foundIndex]['excerpt'] = trim($input['excerpt']);
    if (isset($input['author'])) $blogs[$foundIndex]['author'] = trim($input['author']);
    if (isset($input['category'])) $blogs[$foundIndex]['category'] = trim($input['category']);
    if (isset($input['imageGlow'])) $blogs[$foundIndex]['imageGlow'] = trim($input['imageGlow']);
    if (isset($input['content']) && is_array($input['content'])) {
        $blogs[$foundIndex]['content'] = $input['content'];
        $blogs[$foundIndex]['readTime'] = calculateReadTime($input['content']);
    }
    
    if (saveBlogs($blogsFile, $blogs)) {
        echo json_encode(['success' => true, 'post' => $blogs[$foundIndex]]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to update blog post']);
    }
    
} elseif ($method === 'DELETE') {
    // Delete existing blog post
    $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($input['id']) ? trim($input['id']) : '');
    
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    $foundIndex = -1;
    foreach ($blogs as $index => $post) {
        if ($post['id'] === $id) {
            $foundIndex = $index;
            break;
        }
    }
    
    if ($foundIndex === -1) {
        http_response_code(404);
        echo json_encode(['error' => 'Post not found']);
        exit;
    }
    
    array_splice($blogs, $foundIndex, 1);
    
    if (saveBlogs($blogsFile, $blogs)) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete blog post']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
