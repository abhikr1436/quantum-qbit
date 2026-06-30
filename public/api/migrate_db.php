<?php
header('Content-Type: text/plain');
require_once __DIR__ . '/db_config.php';

$pdo = getDBConnection();
if (!$pdo) {
    die("Database connection failed.");
}

try {
    echo "=== Running Database Schema Migration ===\n";
    
    // 1. Alter blogs table id column to VARCHAR(255)
    echo "Altering blogs table id column to VARCHAR(255)...\n";
    $pdo->exec("ALTER TABLE blogs MODIFY id VARCHAR(255) NOT NULL");
    echo "Successfully altered blogs.id to VARCHAR(255).\n";
    
    // 2. Fetch existing blogs in the database
    $stmt = $pdo->query("SELECT id FROM blogs");
    $dbIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Found " . count($dbIds) . " blogs in MySQL.\n";
    
    // 3. Load blogs.json to align IDs
    $blogsJson = __DIR__ . '/data/blogs.json';
    if (file_exists($blogsJson)) {
        $json = json_decode(file_get_contents($blogsJson), true);
        if (is_array($json)) {
            echo "Loaded " . count($json) . " blogs from blogs.json.\n";
            $updatedCount = 0;
            
            foreach ($json as $post) {
                $fullId = $post['id'];
                
                // If the full ID is longer than 100 characters, it might have been truncated in the DB to 100 characters.
                if (strlen($fullId) > 100) {
                    $truncatedId = substr($fullId, 0, 100);
                    
                    // Check if the truncated ID exists in the DB but the full ID does not
                    if (in_array($truncatedId, $dbIds) && !in_array($fullId, $dbIds)) {
                        echo "Aligning ID in DB: '$truncatedId' -> '$fullId'\n";
                        
                        $stmtUpdate = $pdo->prepare("UPDATE blogs SET id = :fullId WHERE id = :truncatedId");
                        $stmtUpdate->execute([
                            'fullId' => $fullId,
                            'truncatedId' => $truncatedId
                        ]);
                        $updatedCount++;
                    }
                }
            }
            echo "Aligned $updatedCount blog IDs in database.\n";
        } else {
            echo "Error: blogs.json is invalid JSON.\n";
        }
    } else {
        echo "Error: blogs.json file not found at: $blogsJson\n";
    }
    
    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Error during migration: " . $e->getMessage() . "\n";
}
