<?php
require_once __DIR__ . '/cors.php';

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
$persistentDir = getQuantumDataDir();
$persistentBlogsFile = $persistentDir . '/blogs.json';
$blogsFile = __DIR__ . '/data/blogs.json';
$categoriesFile = __DIR__ . '/data/categories.json';

// Helper to create category slugs
function createCategorySlugHelper($name) {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

// Built-in official seed articles to ensure server is never blank
function getDefaultSeedBlogs() {
    return [
        [
            'id' => '1',
            'slug' => 'why-in-browser-image-editing-is-the-future-of-privacy',
            'title' => 'Why 100% In-Browser Image Editing is the Future of Digital Privacy',
            'excerpt' => 'Explore why uploading confidential documents and photos to remote conversion servers creates massive security liabilities, and how modern Canvas & WebAssembly APIs solve this.',
            'content' => '<p>In the modern web ecosystem, performing a task as simple as resizing an identity document or converting a photo format has traditionally required transmitting that file to a remote cloud server. This outdated server-bound paradigm poses severe privacy hazards that are no longer necessary.</p><h2>The Hidden Risks of Server-Side Media Processing</h2><p>When you upload an image to an online tool, that file is written to cloud storage buckets, logged across HTTP proxies, and processed by backend microservices. Even if a provider promises to delete your files within 1 hour, that data remains vulnerable to breach during transit, retention intervals, and automated server backups.</p><tip>Always check if an online photo editor requires a server upload. If it works offline without an internet connection, your data is 100% safe in your own RAM.</tip><h2>How In-Browser Execution Solves This at the Architecture Level</h2><p>With the advancement of HTML5 Canvas, OffscreenCanvas, and WebAssembly, modern client browsers can allocate multi-gigabyte memory arrays and perform high-resolution matrix transformations directly on your device GPU and CPU.</p>',
            'author' => 'Quantum Qbit Team',
            'date' => 'Sep 15, 2026',
            'readTime' => '4 min read',
            'category_id' => 'privacy-security',
            'category' => 'Privacy & Security',
            'imageGlow' => 'rgba(0, 242, 254, 0.1)',
            'created_at' => '2026-09-15 00:00:00',
            'updated_at' => '2026-09-15 00:00:00'
        ],
        [
            'id' => '2',
            'slug' => 'mastering-client-side-pdf-operations-ocr-compression',
            'title' => 'Mastering Client-Side PDF Operations: Local Merging, OCR & Compression',
            'excerpt' => 'A deep-dive into how PDF.js, Web Workers, and Tesseract.js empower browser-native document merging, optical character recognition, and multi-megabyte compression.',
            'content' => '<p>PDFs are the universal standard for legal contracts, academic publications, and corporate records. Managing sensitive multi-page archives locally has historically required bulky desktop software suites. Today, browser-native document pipelines rival native desktop apps.</p><h2>Client-Side PDF Merging and Page Extraction</h2><p>Using client-side JavaScript PDF parsers, documents are read as binary ArrayBuffers. The engine inspects the cross-reference tables (XRef), extracts individual page streams, re-indexes dictionary objects, and compiles a clean, standardized PDF binary.</p>',
            'author' => 'Quantum Qbit Team',
            'date' => 'Sep 12, 2026',
            'readTime' => '5 min read',
            'category_id' => 'general-utilities',
            'category' => 'PDF Workflows',
            'imageGlow' => 'rgba(0, 242, 254, 0.1)',
            'created_at' => '2026-09-12 00:00:00',
            'updated_at' => '2026-09-12 00:00:00'
        ],
        [
            'id' => '3',
            'slug' => 'understanding-dpi-vs-resolution-passport-exam-portals',
            'title' => 'DPI vs Resolution: How to Accurately Prepare Photos for Government & Exam Portals',
            'excerpt' => 'Demystifying Dots Per Inch (DPI), Pixel Dimensions, and JFIF/pHYs metadata chunks so your uploaded photos are never rejected by automated government validation portals.',
            'content' => '<p>Nearly every government job application, passport portal, and university admission form requires photos to comply with strict dimensional and density requirements—such as "300 DPI, exactly 35mm x 45mm, under 50 KB". Understanding how DPI works ensures your uploads never get rejected.</p><h2>DPI is Density, Not Pixel Count</h2><p>A common misconception is that increasing DPI increases an image\'s pixel resolution. In reality, an image that is 600 × 600 pixels has exactly 360,000 pixels regardless of whether its metadata declares 72 DPI or 300 DPI.</p>',
            'author' => 'Quantum Qbit Team',
            'date' => 'Sep 08, 2026',
            'readTime' => '3 min read',
            'category_id' => 'creative-tech',
            'category' => 'Image Guides',
            'imageGlow' => 'rgba(0, 242, 254, 0.1)',
            'created_at' => '2026-09-08 00:00:00',
            'updated_at' => '2026-09-08 00:00:00'
        ],
        [
            'id' => '4',
            'slug' => 'lossless-vs-lossy-compression-guide',
            'title' => 'Lossless vs Lossy Compression: How to Cut File Sizes by 90% Without Visual Degradation',
            'excerpt' => 'A deep look at discrete cosine transforms (DCT), chroma subsampling (4:2:0), and modern WebP quantization techniques for lightning-fast web assets.',
            'content' => '<p>Whether you are preparing banners for a web application, sending resumes over email, or archiving family photo albums, file compression is essential. Choosing the right compression strategy allows you to reduce files by over 90% while keeping them visually indistinguishable from the original.</p><h2>Lossy vs Lossless: Choosing the Right Trade-off</h2><p>Lossless compression preserves every single pixel value with mathematical exactness. Lossy compression takes advantage of human visual perception limitations to yield massive size reductions.</p>',
            'author' => 'Quantum Qbit Team',
            'date' => 'Sep 02, 2026',
            'readTime' => '4 min read',
            'category_id' => 'computer-science',
            'category' => 'Web Tech',
            'imageGlow' => 'rgba(0, 242, 254, 0.1)',
            'created_at' => '2026-09-02 00:00:00',
            'updated_at' => '2026-09-02 00:00:00'
        ]
    ];
}

// Helper to load blogs from persistent storage
function getFallbackBlogs($blogsFile) {
    global $persistentBlogsFile;
    if (!empty($persistentBlogsFile) && file_exists($persistentBlogsFile)) {
        $pData = file_get_contents($persistentBlogsFile);
        $pParsed = json_decode($pData, true);
        if (is_array($pParsed) && !empty($pParsed)) {
            return $pParsed;
        }
    }
    if (file_exists($blogsFile)) {
        $data = file_get_contents($blogsFile);
        $parsed = json_decode($data, true);
        if (is_array($parsed) && !empty($parsed)) {
            return $parsed;
        }
    }
    // Return default seed if storage is empty
    return getDefaultSeedBlogs();
}

// Helper to save blogs to persistent storage and public fallback
function saveFallbackBlogs($blogsFile, $blogs) {
    global $persistentBlogsFile;
    if (!empty($persistentBlogsFile)) {
        if (!file_exists(dirname($persistentBlogsFile))) {
            @mkdir(dirname($persistentBlogsFile), 0755, true);
        }
        @file_put_contents($persistentBlogsFile, json_encode($blogs, JSON_PRETTY_PRINT));
    }
    if (!file_exists(dirname($blogsFile))) {
        @mkdir(dirname($blogsFile), 0755, true);
    }
    return @file_put_contents($blogsFile, json_encode($blogs, JSON_PRETTY_PRINT)) !== false;
}

// Helper to calculate read time for HTML
function calculateReadTimeHtml($html) {
    $words = str_word_count(strip_tags($html));
    $wpm = 200;
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

// 1. GET ROUTE (Public: Accessible by any visitor or device)
if ($method === 'GET') {
    if ($pdo) {
        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        } catch (PDOException $e) {}
        try {
            $pdo->exec("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
        } catch (PDOException $e) {}

        try {
            $stmt = $pdo->query("
                SELECT b.id, b.title, b.excerpt, b.content, b.author, b.date, b.read_time AS readTime, b.category_id, COALESCE(c.name, b.category_id) AS category, b.image_glow AS imageGlow, b.created_at, b.updated_at
                FROM blogs b
                LEFT JOIN categories c ON b.category_id = c.id
                ORDER BY COALESCE(b.updated_at, b.created_at) DESC, b.id DESC
            ");
            $posts = $stmt->fetchAll();
            
            // If MySQL is empty, seed with persistent storage or default seed
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
                    ON DUPLICATE KEY UPDATE title=VALUES(title), excerpt=VALUES(excerpt), content=VALUES(content), updated_at=NOW()
                ");
                
                foreach ($fallbackBlogs as $post) {
                    $catId = isset($post['category_id']) ? $post['category_id'] : createCategorySlugHelper(isset($post['category']) ? $post['category'] : 'General');
                    $htmlContent = is_array($post['content']) ? implode('', array_map(function($p) { return '<p>' . htmlspecialchars($p) . '</p>'; }, $post['content'])) : $post['content'];
                    
                    $stmtBlog->execute([
                        'id' => $post['id'],
                        'title' => $post['title'],
                        'excerpt' => $post['excerpt'],
                        'content' => $htmlContent,
                        'author' => isset($post['author']) ? $post['author'] : 'Quantum Qbit Team',
                        'date' => isset($post['date']) ? $post['date'] : date('M d, Y'),
                        'read_time' => isset($post['readTime']) ? $post['readTime'] : '4 min read',
                        'category_id' => $catId,
                        'image_glow' => isset($post['imageGlow']) ? $post['imageGlow'] : 'rgba(0, 242, 254, 0.1)'
                    ]);
                }
                
                // Re-fetch
                $stmt = $pdo->query("
                    SELECT b.id, b.title, b.excerpt, b.content, b.author, b.date, b.read_time AS readTime, b.category_id, c.name AS category, b.image_glow AS imageGlow, b.created_at, b.updated_at
                    FROM blogs b
                    LEFT JOIN categories c ON b.category_id = c.id
                    ORDER BY COALESCE(b.updated_at, b.created_at) DESC, b.id DESC
                ");
                $posts = $stmt->fetchAll();
            }
            
            echo json_encode($posts);
            exit;
        } catch (PDOException $e) {
            // DB failed: deliver from persistent storage
            $fallback = getFallbackBlogs($blogsFile);
            echo json_encode($fallback);
            exit;
        }
    } else {
        $fallback = getFallbackBlogs($blogsFile);
        echo json_encode($fallback);
        exit;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Authorization Check for Modifying Routes (POST, PUT, DELETE)
// ─────────────────────────────────────────────────────────────────────────────
$isAuthorized = false;
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    $isAuthorized = true;
} else {
    $suppliedKey = '';
    if (isset($_SERVER['HTTP_X_API_KEY'])) {
        $suppliedKey = trim($_SERVER['HTTP_X_API_KEY']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
        if (stripos($authHeader, 'Bearer ') === 0) {
            $suppliedKey = trim(substr($authHeader, 7));
        }
    } elseif (isset($_GET['api_key'])) {
        $suppliedKey = trim($_GET['api_key']);
    } elseif (is_array($input) && isset($input['api_key'])) {
        $suppliedKey = trim($input['api_key']);
    }
    
    $suppliedPasscode = '';
    if (isset($_SERVER['HTTP_X_PASSCODE'])) {
        $suppliedPasscode = trim($_SERVER['HTTP_X_PASSCODE']);
    } elseif (is_array($input) && isset($input['passcode'])) {
        $suppliedPasscode = trim($input['passcode']);
    }

    $persistentConfig = getQuantumDataDir() . '/config.json';
    if (file_exists($persistentConfig)) {
        $cfg = json_decode(file_get_contents($persistentConfig), true);
        if (is_array($cfg)) {
            // Check API key
            if (!empty($suppliedKey) && isset($cfg['api_key']) && hash_equals($cfg['api_key'], $suppliedKey)) {
                $isAuthorized = true;
            }
            // Check passcode supplied as key or explicit passcode
            if (!$isAuthorized && !empty($suppliedKey) && isset($cfg['passcode_hash']) && password_verify($suppliedKey, $cfg['passcode_hash'])) {
                $isAuthorized = true;
            }
            if (!$isAuthorized && !empty($suppliedPasscode) && isset($cfg['passcode_hash']) && password_verify($suppliedPasscode, $cfg['passcode_hash'])) {
                $isAuthorized = true;
            }
        }
    }
}

if (!$isAuthorized) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Please log into the Admin Console or provide valid API key.']);
    exit;
}

// Helper to look up category name
function getFallbackCategoryName($id, $categoriesFile) {
    if (file_exists($categoriesFile)) {
        $cats = json_decode(file_get_contents($categoriesFile), true);
        if (is_array($cats)) {
            foreach ($cats as $cat) {
                if ($cat['id'] === $id) return $cat['name'];
            }
        }
    }
    return ucwords(str_replace(['-', '_'], ' ', $id));
}

// 2. POST ROUTE (Create Article)
if ($method === 'POST') {
    $title = isset($input['title']) ? trim($input['title']) : '';
    $excerpt = isset($input['excerpt']) ? trim($input['excerpt']) : '';
    $author = 'Quantum Qbit Team';
    $categoryName = isset($input['category']) ? trim($input['category']) : (isset($input['categoryLabel']) ? trim($input['categoryLabel']) : 'General');
    $categoryId = isset($input['category_id']) && !empty($input['category_id']) ? trim($input['category_id']) : createCategorySlugHelper($categoryName);
    if (empty($categoryId)) {
        $categoryId = 'general';
    }
    $imageGlow = isset($input['imageGlow']) ? trim($input['imageGlow']) : 'rgba(0, 242, 254, 0.1)';
    $content = isset($input['content']) ? trim($input['content']) : '';
    
    if (empty($title) || empty($content)) {
        http_response_code(400);
        echo json_encode(['error' => 'Title and content are required']);
        exit;
    }
    
    $id = !empty($input['id']) ? trim($input['id']) : (!empty($input['slug']) ? trim($input['slug']) : createBlogSlug($title));
    $readTime = calculateReadTimeHtml($content);
    $date = date('M d, Y');
    
    $newPost = [
        'id' => $id,
        'slug' => $id,
        'title' => $title,
        'excerpt' => $excerpt,
        'content' => $content,
        'author' => $author,
        'date' => $date,
        'readTime' => $readTime,
        'category' => $categoryName,
        'category_id' => $categoryId,
        'imageGlow' => $imageGlow,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];

    // 1. Save to persistent JSON storage first (Guaranteed cloud persistence)
    $fallbackBlogs = getFallbackBlogs($blogsFile);
    $found = false;
    foreach ($fallbackBlogs as $k => $b) {
        if ($b['id'] === $id || (isset($b['slug']) && $b['slug'] === $id)) {
            $fallbackBlogs[$k] = array_merge($b, $newPost);
            $found = true;
            break;
        }
    }
    if (!$found) {
        array_unshift($fallbackBlogs, $newPost);
    }
    saveFallbackBlogs($blogsFile, $fallbackBlogs);

    // 2. Save to MySQL database if available
    if ($pdo) {
        try {
            $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
            $stmtCat->execute(['id' => $categoryId, 'name' => $categoryName]);

            $stmt = $pdo->prepare("
                INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
                VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title),
                    excerpt = VALUES(excerpt),
                    content = VALUES(content),
                    author = VALUES(author),
                    date = VALUES(date),
                    read_time = VALUES(read_time),
                    category_id = VALUES(category_id),
                    image_glow = VALUES(image_glow),
                    updated_at = NOW()
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
        } catch (PDOException $e) {
            // Log silently; JSON storage already succeeded
        }
    }

    echo json_encode(['success' => true, 'post' => $newPost]);
    exit;
}

// 3. PUT ROUTE (Update Article)
if ($method === 'PUT') {
    $id = isset($input['id']) ? trim($input['id']) : '';
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    $title = isset($input['title']) ? trim($input['title']) : '';
    $excerpt = isset($input['excerpt']) ? trim($input['excerpt']) : '';
    $author = 'Quantum Qbit Team';
    $categoryName = isset($input['category']) ? trim($input['category']) : (isset($input['categoryLabel']) ? trim($input['categoryLabel']) : 'General');
    $categoryId = isset($input['category_id']) && !empty($input['category_id']) ? trim($input['category_id']) : createCategorySlugHelper($categoryName);
    if (empty($categoryId)) {
        $categoryId = 'general';
    }
    $imageGlow = isset($input['imageGlow']) ? trim($input['imageGlow']) : 'rgba(0, 242, 254, 0.1)';
    $content = isset($input['content']) ? trim($input['content']) : '';
    $readTime = calculateReadTimeHtml($content);

    $updatedPost = [
        'id' => $id,
        'title' => $title,
        'excerpt' => $excerpt,
        'content' => $content,
        'author' => $author,
        'date' => date('M d, Y'),
        'readTime' => $readTime,
        'category' => $categoryName,
        'category_id' => $categoryId,
        'imageGlow' => $imageGlow,
        'updated_at' => date('Y-m-d H:i:s')
    ];

    // Update in persistent JSON
    $fallbackBlogs = getFallbackBlogs($blogsFile);
    foreach ($fallbackBlogs as $k => $b) {
        if ($b['id'] === $id) {
            $fallbackBlogs[$k] = array_merge($b, $updatedPost);
            break;
        }
    }
    saveFallbackBlogs($blogsFile, $fallbackBlogs);

    // Update in MySQL
    if ($pdo) {
        try {
            $stmtCat = $pdo->prepare("INSERT IGNORE INTO categories (id, name) VALUES (:id, :name)");
            $stmtCat->execute(['id' => $categoryId, 'name' => $categoryName]);

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
        } catch (PDOException $e) {}
    }

    echo json_encode(['success' => true]);
    exit;
}

// 4. DELETE ROUTE (Delete Single or Batch Articles)
if ($method === 'DELETE') {
    // Delete All
    if (isset($_GET['action']) && $_GET['action'] === 'delete_all') {
        if ($pdo) {
            try { $pdo->exec("DELETE FROM blogs"); } catch (PDOException $e) {}
        }
        saveFallbackBlogs($blogsFile, []);
        echo json_encode(['success' => true]);
        exit;
    }

    $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($input['id']) ? trim($input['id']) : '');
    $ids = isset($input['ids']) && is_array($input['ids']) ? $input['ids'] : [];

    // Batch Delete
    if (!empty($ids)) {
        if ($pdo) {
            try {
                $placeholders = implode(',', array_fill(0, count($ids), '?'));
                $stmt = $pdo->prepare("DELETE FROM blogs WHERE id IN ($placeholders)");
                $stmt->execute($ids);
            } catch (PDOException $e) {}
        }
        $blogs = getFallbackBlogs($blogsFile);
        $filtered = array_values(array_filter($blogs, function($p) use ($ids) {
            return !in_array($p['id'], $ids);
        }));
        saveFallbackBlogs($blogsFile, $filtered);
        echo json_encode(['success' => true, 'deletedCount' => count($ids)]);
        exit;
    }

    // Single Delete
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Post ID is required']);
        exit;
    }
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM blogs WHERE id = :id");
            $stmt->execute(['id' => $id]);
        } catch (PDOException $e) {}
    }
    
    $blogs = getFallbackBlogs($blogsFile);
    $filtered = array_values(array_filter($blogs, function($p) use ($id) {
        return $p['id'] !== $id;
    }));
    saveFallbackBlogs($blogsFile, $filtered);

    echo json_encode(['success' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
