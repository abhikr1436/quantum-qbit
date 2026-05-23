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

require_once __DIR__ . '/db_config.php';
$pdo = getDBConnection();
$blogsFile = __DIR__ . '/data/blogs.json';
$categoriesFile = __DIR__ . '/data/categories.json';

// Helper to create category slugs
function createCategorySlugHelper($name) {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

// Helper to load blogs from JSON fallback
function getFallbackBlogs($blogsFile) {
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
                'category_id' => 'privacy-security',
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
                'category_id' => 'computer-science',
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
                'category_id' => 'creative-tech',
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

// Helper to save blogs to JSON fallback
function saveFallbackBlogs($blogsFile, $blogs) {
    return file_put_contents($blogsFile, json_encode($blogs, JSON_PRETTY_PRINT)) !== false;
}

// Helper to calculate read time for HTML
function calculateReadTimeHtml($html) {
    $words = str_word_count(strip_tags($html));
    $wpm = 200; // Average words per minute
    $minutes = ceil($words / $wpm);
    return ($minutes > 0 ? $minutes : 1) . ' min read';
}

// Helper to create a slug from a title
function createBlogSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

// 1. GET ROUTE (Public)
if ($method === 'GET') {
    if ($pdo) {
        // Run migrations to ensure columns exist
        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        } catch (PDOException $e) {}
        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        } catch (PDOException $e) {}

        try {
            $stmt = $pdo->query("
                SELECT b.id, b.title, b.excerpt, b.content, b.author, b.date, b.read_time AS readTime, b.category_id, c.name AS category, b.image_glow AS imageGlow, b.created_at, b.updated_at
                FROM blogs b
                LEFT JOIN categories c ON b.category_id = c.id
                ORDER BY COALESCE(b.updated_at, b.created_at) DESC, STR_TO_DATE(b.date, '%b %d, %Y') DESC, b.id DESC
            ");
            $posts = $stmt->fetchAll();
            
            // Seed MySQL if database has no posts
            if (empty($posts)) {
                $defaultCategories = [
                    ['id' => 'privacy-security', 'name' => 'Privacy & Security'],
                    ['id' => 'computer-science', 'name' => 'Computer Science'],
                    ['id' => 'creative-tech', 'name' => 'Creative Tech'],
                    ['id' => 'general-utilities', 'name' => 'General Utilities']
                ];
                $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
                foreach ($defaultCategories as $cat) {
                    $stmtCat->execute(['id' => $cat['id'], 'name' => $cat['name']]);
                }
                
                $fallbackBlogs = getFallbackBlogs($blogsFile);
                $stmtBlog = $pdo->prepare("
                    INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
                    VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
                ");
                
                foreach ($fallbackBlogs as $post) {
                    $catId = isset($post['category_id']) ? $post['category_id'] : createCategorySlugHelper($post['category']);
                    
                    // Convert paragraph array to HTML paragraphs
                    $htmlContent = '';
                    if (is_array($post['content'])) {
                        foreach ($post['content'] as $para) {
                            $htmlContent .= '<p>' . htmlspecialchars($para) . '</p>';
                        }
                    } else {
                        $htmlContent = $post['content'];
                    }
                    
                    $stmtBlog->execute([
                        'id' => $post['id'],
                        'title' => $post['title'],
                        'excerpt' => $post['excerpt'],
                        'content' => $htmlContent,
                        'author' => $post['author'],
                        'date' => $post['date'],
                        'read_time' => $post['readTime'],
                        'category_id' => $catId,
                        'image_glow' => $post['imageGlow']
                    ]);
                }
                
                // Re-fetch
                $stmt = $pdo->query("
                    SELECT b.id, b.title, b.excerpt, b.content, b.author, b.date, b.read_time AS readTime, b.category_id, c.name AS category, b.image_glow AS imageGlow, b.created_at, b.updated_at
                    FROM blogs b
                    LEFT JOIN categories c ON b.category_id = c.id
                    ORDER BY COALESCE(b.updated_at, b.created_at) DESC, STR_TO_DATE(b.date, '%b %d, %Y') DESC, b.id DESC
                ");
                $posts = $stmt->fetchAll();
            }
            
            echo json_encode($posts);
        } catch (PDOException $e) {
            $fallback = getFallbackBlogs($blogsFile);
            usort($fallback, function($a, $b) {
                $ta = isset($a['updated_at']) ? $a['updated_at'] : (isset($a['created_at']) ? $a['created_at'] : '');
                $tb = isset($b['updated_at']) ? $b['updated_at'] : (isset($b['created_at']) ? $b['created_at'] : '');
                if ($ta && $tb && $ta !== $tb) {
                    return strcmp($tb, $ta);
                }
                $da = isset($a['date']) ? strtotime($a['date']) : 0;
                $db = isset($b['date']) ? strtotime($b['date']) : 0;
                if ($da !== $db) {
                    return $db - $da;
                }
                return strcmp($b['id'], $a['id']);
            });
            echo json_encode($fallback);
        }
    } else {
        $fallback = getFallbackBlogs($blogsFile);
        usort($fallback, function($a, $b) {
            $ta = isset($a['updated_at']) ? $a['updated_at'] : (isset($a['created_at']) ? $a['created_at'] : '');
            $tb = isset($b['updated_at']) ? $b['updated_at'] : (isset($b['created_at']) ? $b['created_at'] : '');
            if ($ta && $tb && $ta !== $tb) {
                return strcmp($tb, $ta);
            }
            $da = isset($a['date']) ? strtotime($a['date']) : 0;
            $db = isset($b['date']) ? strtotime($b['date']) : 0;
            if ($da !== $db) {
                return $db - $da;
            }
            return strcmp($b['id'], $a['id']);
        });
        echo json_encode($fallback);
    }
    exit;
}

// All modifying routes require session authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Helper to look up category name inside fallback
function getFallbackCategoryName($id, $categoriesFile) {
    if (file_exists($categoriesFile)) {
        $cats = json_decode(file_get_contents($categoriesFile), true);
        if (is_array($cats)) {
            foreach ($cats as $cat) {
                if ($cat['id'] === $id) return $cat['name'];
            }
        }
    }
    // Default mapped fallbacks
    switch($id) {
        case 'privacy-security': return 'Privacy & Security';
        case 'computer-science': return 'Computer Science';
        case 'creative-tech': return 'Creative Tech';
        case 'general-utilities': return 'General Utilities';
        default: return ucfirst(str_replace('-', ' ', $id));
    }
}

// 2. POST ROUTE (Create)
if ($method === 'POST') {
    $title = isset($input['title']) ? trim($input['title']) : '';
    $excerpt = isset($input['excerpt']) ? trim($input['excerpt']) : '';
    $author = isset($input['author']) ? trim($input['author']) : 'Admin';
    $categoryId = isset($input['category_id']) ? trim($input['category_id']) : 'privacy-security';
    $imageGlow = isset($input['imageGlow']) ? trim($input['imageGlow']) : 'rgba(0, 242, 254, 0.1)';
    $content = isset($input['content']) ? trim($input['content']) : ''; // HTML String
    
    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required']);
        exit;
    }
    
    $id = createBlogSlug($title);
    $originalId = $id;
    
    if ($pdo) {
        try {
            // Ensure unique ID
            $idExists = true;
            $counter = 1;
            while ($idExists) {
                $stmt = $pdo->prepare("SELECT id FROM blogs WHERE id = :id");
                $stmt->execute(['id' => $id]);
                if ($stmt->fetch()) {
                    $id = $originalId . '-' . $counter;
                    $counter++;
                } else {
                    $idExists = false;
                }
            }
            
            $readTime = calculateReadTimeHtml($content);
            $date = date('M d, Y');
            
            $stmt = $pdo->prepare("
                INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
                VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
            ");
            $stmt->execute([
                'id' => $id,
                'title' => $title,
                'excerpt' => $excerpt,
                'content' => $content,
                'author' => $author,
                'date' => $date,
                'read_time' => $readTime,
                'category_id' => $categoryId,
                'image_glow' => $imageGlow
            ]);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $blogs = getFallbackBlogs($blogsFile);
        $idExists = true;
        $counter = 1;
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
        
        $readTime = calculateReadTimeHtml($content);
        $categoryName = getFallbackCategoryName($categoryId, $categoriesFile);
        
        $newPost = [
            'id' => $id,
            'title' => $title,
            'excerpt' => $excerpt,
            'content' => $content, // Saved directly as string HTML
            'author' => $author,
            'date' => date('M d, Y'),
            'readTime' => $readTime,
            'category' => $categoryName,
            'category_id' => $categoryId,
            'imageGlow' => $imageGlow,
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        array_unshift($blogs, $newPost);
        if (saveFallbackBlogs($blogsFile, $blogs)) {
            echo json_encode(['success' => true, 'post' => $newPost]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save blog post']);
        }
    }
    exit;
}

// 3. PUT ROUTE (Update)
if ($method === 'PUT') {
    $id = isset($input['id']) ? trim($input['id']) : '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    $title = isset($input['title']) ? trim($input['title']) : '';
    $excerpt = isset($input['excerpt']) ? trim($input['excerpt']) : '';
    $author = isset($input['author']) ? trim($input['author']) : '';
    $categoryId = isset($input['category_id']) ? trim($input['category_id']) : '';
    $imageGlow = isset($input['imageGlow']) ? trim($input['imageGlow']) : '';
    $content = isset($input['content']) ? trim($input['content']) : '';
    
    if ($pdo) {
        try {
            // Check if exists
            $stmt = $pdo->prepare("SELECT id FROM blogs WHERE id = :id");
            $stmt->execute(['id' => $id]);
            if (!$stmt->fetch()) {
                http_response_code(404);
                echo json_encode(['error' => 'Post not found']);
                exit;
            }
            
            $readTime = calculateReadTimeHtml($content);
            
            $stmt = $pdo->prepare("
                UPDATE blogs 
                SET title = :title, excerpt = :excerpt, content = :content, author = :author, 
                    date = :date, read_time = :read_time, category_id = :category_id, image_glow = :image_glow,
                    updated_at = NOW()
                WHERE id = :id
            ");
            $stmt->execute([
                'id' => $id,
                'title' => $title,
                'excerpt' => $excerpt,
                'content' => $content,
                'author' => $author,
                'date' => date('M d, Y'),
                'read_time' => $readTime,
                'category_id' => $categoryId,
                'image_glow' => $imageGlow
            ]);
            
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $blogs = getFallbackBlogs($blogsFile);
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
        
        $categoryName = getFallbackCategoryName($categoryId, $categoriesFile);
        $readTime = calculateReadTimeHtml($content);
        
        $blogs[$foundIndex]['title'] = $title;
        $blogs[$foundIndex]['excerpt'] = $excerpt;
        $blogs[$foundIndex]['content'] = $content;
        $blogs[$foundIndex]['author'] = $author;
        $blogs[$foundIndex]['category'] = $categoryName;
        $blogs[$foundIndex]['category_id'] = $categoryId;
        $blogs[$foundIndex]['imageGlow'] = $imageGlow;
        $blogs[$foundIndex]['readTime'] = $readTime;
        $blogs[$foundIndex]['date'] = date('M d, Y');
        $blogs[$foundIndex]['updated_at'] = date('Y-m-d H:i:s');
        
        if (saveFallbackBlogs($blogsFile, $blogs)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update blog post']);
        }
    }
    exit;
}

// 4. DELETE ROUTE (Delete)
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($input['id']) ? trim($input['id']) : '');
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM blogs WHERE id = :id");
            $stmt->execute(['id' => $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $blogs = getFallbackBlogs($blogsFile);
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
        if (saveFallbackBlogs($blogsFile, $blogs)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete blog post']);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
