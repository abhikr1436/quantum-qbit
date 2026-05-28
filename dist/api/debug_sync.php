<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/db_config.php';

$pdo = getDBConnection();
$blogsFile = __DIR__ . '/data/blogs.json';

echo "=== DIAGNOSTICS ===\n";
echo "PHP Version: " . phpversion() . "\n";
echo "Database DSN status: " . (getDBStatus()['status']) . "\n";
echo "Database Connection: " . ($pdo ? "Connected" : "Not Connected") . "\n";
echo "Blogs.json Path: " . $blogsFile . "\n";
echo "Blogs.json Exists: " . (file_exists($blogsFile) ? "Yes" : "No") . "\n";

if (file_exists($blogsFile)) {
    $content = file_get_contents($blogsFile);
    echo "Blogs.json Size: " . strlen($content) . " bytes\n";
    $json = json_decode($content, true);
    echo "Blogs.json JSON valid: " . (is_array($json) ? "Yes" : "No") . "\n";
    if (is_array($json)) {
        echo "Blogs in JSON file:\n";
        foreach ($json as $post) {
            echo "  - ID: " . $post['id'] . " | Title: " . $post['title'] . "\n";
        }
    }
}

if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT id, title FROM blogs");
        $posts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "\nBlogs in MySQL database:\n";
        $existingIds = [];
        foreach ($posts as $post) {
            echo "  - ID: " . $post['id'] . " | Title: " . $post['title'] . "\n";
            $existingIds[] = $post['id'];
        }
        
        echo "\nRunning Sync dry-run:\n";
        if (file_exists($blogsFile) && is_array($json)) {
            foreach ($json as $post) {
                if (!in_array($post['id'], $existingIds)) {
                    echo "  -> Found missing blog: " . $post['id'] . ". Attempting sync...\n";
                    
                    $catId = isset($post['category_id']) ? $post['category_id'] : 'privacy-security';
                    $htmlContent = is_array($post['content']) ? implode('', array_map(function($p){return "<p>$p</p>";}, $post['content'])) : $post['content'];
                    
                    $stmtBlog = $pdo->prepare("
                        INSERT INTO blogs (id, title, excerpt, content, author, date, read_time, category_id, image_glow) 
                        VALUES (:id, :title, :excerpt, :content, :author, :date, :read_time, :category_id, :image_glow)
                    ");
                    
                    $res = $stmtBlog->execute([
                        'id' => $post['id'],
                        'title' => $post['title'],
                        'excerpt' => $post['excerpt'],
                        'content' => $htmlContent,
                        'author' => $post['author'],
                        'date' => $post['date'],
                        'read_time' => isset($post['readTime']) ? $post['readTime'] : '3 min read',
                        'category_id' => $catId,
                        'image_glow' => isset($post['imageGlow']) ? $post['imageGlow'] : 'rgba(0, 242, 254, 0.1)'
                    ]);
                    
                    echo "     Result: " . ($res ? "Success" : "Failed") . "\n";
                } else {
                    echo "  - Blog already exists: " . $post['id'] . "\n";
                }
            }
        }
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
