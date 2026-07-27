<?php
// Enable CORS for local dev environment testing
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'status';

if ($action === 'status') {
    echo json_encode([
        'status' => 'online',
        'system' => 'AI Editorial & Research Studio',
        'timestamp' => date('Y-m-d H:i:s')
    ]);
    exit;
}

if ($action === 'publish_article') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);

    if (!$data || !isset($data['title']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid article data']);
        exit;
    }

    try {
        $pdo = getDBConnection();
        if ($pdo) {
            $stmt = $pdo->prepare("
                INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow)
                VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
                ON DUPLICATE KEY UPDATE 
                    title = VALUES(title),
                    excerpt = VALUES(excerpt),
                    content = VALUES(content),
                    author = VALUES(author),
                    read_time = VALUES(read_time),
                    category_id = VALUES(category_id)
            ");

            $catId = isset($data['category_id']) ? $data['category_id'] : 'general-utilities';
            $stmt->execute([
                'id' => isset($data['id']) ? $data['id'] : 'ai-post-' . time(),
                'title' => $data['title'],
                'excerpt' => isset($data['excerpt']) ? $data['excerpt'] : '',
                'content' => $data['content'],
                'author' => isset($data['author']) ? $data['author'] : 'Quantum Editorial Studio',
                'date' => isset($data['date']) ? $data['date'] : date('M d, Y H:i:s'),
                'read_time' => isset($data['readTime']) ? $data['readTime'] : '4 min read',
                'category_id' => $catId,
                'image_glow' => isset($data['imageGlow']) ? $data['imageGlow'] : 'rgba(0, 242, 254, 0.1)'
            ]);

            echo json_encode(['success' => true, 'message' => 'Article published to MySQL database!']);
            exit;
        }
    } catch (Exception $e) {
        // Fallback to JSON file
    }

    $blogsFile = __DIR__ . '/data/blogs.json';
    if (!file_exists(dirname($blogsFile))) {
        mkdir(dirname($blogsFile), 0755, true);
    }

    $existing = [];
    if (file_exists($blogsFile)) {
        $existing = json_decode(file_get_contents($blogsFile), true) ?: [];
    }

    array_unshift($existing, $data);
    file_put_contents($blogsFile, json_encode($existing, JSON_PRETTY_PRINT));

    echo json_encode(['success' => true, 'message' => 'Article saved to local JSON storage!']);
    exit;
}

echo json_encode(['status' => 'active', 'action' => $action]);
