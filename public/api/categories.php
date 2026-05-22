<?php
// Enable CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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
$categoriesFile = __DIR__ . '/data/categories.json';

// Helper to create category slugs
function createCategorySlug($name) {
    $slug = strtolower($name);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    return trim($slug, '-');
}

// Helper to load fallback categories
function getFallbackCategories($categoriesFile) {
    if (!file_exists(dirname($categoriesFile))) {
        mkdir(dirname($categoriesFile), 0755, true);
    }
    if (!file_exists($categoriesFile)) {
        $defaultCategories = [
            ['id' => 'privacy-security', 'name' => 'Privacy & Security'],
            ['id' => 'computer-science', 'name' => 'Computer Science'],
            ['id' => 'creative-tech', 'name' => 'Creative Tech'],
            ['id' => 'general-utilities', 'name' => 'General Utilities']
        ];
        file_put_contents($categoriesFile, json_encode($defaultCategories, JSON_PRETTY_PRINT));
        return $defaultCategories;
    }
    return json_decode(file_get_contents($categoriesFile), true);
}

// Helper to save fallback categories
function saveFallbackCategories($categoriesFile, $categories) {
    return file_put_contents($categoriesFile, json_encode($categories, JSON_PRETTY_PRINT)) !== false;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

if ($method === 'GET') {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT id, name FROM categories ORDER BY name ASC");
            $categories = $stmt->fetchAll();
            
            // Seed if empty in database
            if (empty($categories)) {
                $defaultCategories = [
                    ['id' => 'privacy-security', 'name' => 'Privacy & Security'],
                    ['id' => 'computer-science', 'name' => 'Computer Science'],
                    ['id' => 'creative-tech', 'name' => 'Creative Tech'],
                    ['id' => 'general-utilities', 'name' => 'General Utilities']
                ];
                $stmtInsert = $pdo->prepare("INSERT INTO categories (id, name) VALUES (:id, :name)");
                foreach ($defaultCategories as $cat) {
                    $stmtInsert->execute(['id' => $cat['id'], 'name' => $cat['name']]);
                }
                $categories = $defaultCategories;
            }
            echo json_encode($categories);
        } catch (PDOException $e) {
            // Database query failed, load JSON fallback
            echo json_encode(getFallbackCategories($categoriesFile));
        }
    } else {
        echo json_encode(getFallbackCategories($categoriesFile));
    }
    exit;
}

// All modifying routes require session authentication
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

if ($method === 'POST') {
    $name = isset($input['name']) ? trim($input['name']) : '';
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Category name is required']);
        exit;
    }
    
    $id = createCategorySlug($name);
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid category name']);
        exit;
    }
    
    if ($pdo) {
        try {
            // Check if exists
            $stmt = $pdo->prepare("SELECT id FROM categories WHERE id = :id");
            $stmt->execute(['id' => $id]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['error' => 'Category already exists']);
                exit;
            }
            
            $stmt = $pdo->prepare("INSERT INTO categories (id, name) VALUES (:id, :name)");
            $stmt->execute(['id' => $id, 'name' => $name]);
            echo json_encode(['success' => true, 'category' => ['id' => $id, 'name' => $name]]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $categories = getFallbackCategories($categoriesFile);
        foreach ($categories as $cat) {
            if ($cat['id'] === $id) {
                http_response_code(400);
                echo json_encode(['error' => 'Category already exists']);
                exit;
            }
        }
        
        $newCat = ['id' => $id, 'name' => $name];
        $categories[] = $newCat;
        if (saveFallbackCategories($categoriesFile, $categories)) {
            echo json_encode(['success' => true, 'category' => $newCat]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save categories']);
        }
    }
    exit;
}

if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? trim($_GET['id']) : (isset($input['id']) ? trim($input['id']) : '');
    if (empty($id)) {
        http_response_code(400);
        echo json_encode(['error' => 'Category ID is required']);
        exit;
    }
    
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM categories WHERE id = :id");
            $stmt->execute(['id' => $id]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $categories = getFallbackCategories($categoriesFile);
        $foundIndex = -1;
        foreach ($categories as $index => $cat) {
            if ($cat['id'] === $id) {
                $foundIndex = $index;
                break;
            }
        }
        
        if ($foundIndex === -1) {
            http_response_code(404);
            echo json_encode(['error' => 'Category not found']);
            exit;
        }
        
        array_splice($categories, $foundIndex, 1);
        
        // Also remove / update references in blogs fallback file if possible
        // To be safe, we just let them disconnect or delete blogs (cascading deletes in JSON is manual)
        $blogsFile = __DIR__ . '/data/blogs.json';
        if (file_exists($blogsFile)) {
            $blogs = json_decode(file_get_contents($blogsFile), true);
            if (is_array($blogs)) {
                $updatedBlogs = array_filter($blogs, function($blog) use ($id) {
                    return $blog['category_id'] !== $id && (!isset($blog['category']) || createCategorySlug($blog['category']) !== $id);
                });
                file_put_contents($blogsFile, json_encode(array_values($updatedBlogs), JSON_PRETTY_PRINT));
            }
        }
        
        if (saveFallbackCategories($categoriesFile, $categories)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to delete category']);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
