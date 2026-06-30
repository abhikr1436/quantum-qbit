<?php
header('Content-Type: application/json');
require_once __DIR__ . '/db_config.php';

$results = [];

$blogsJson = __DIR__ . '/data/blogs.json';
$dbJson = getQuantumDataDir() . '/db.json';
$liveUpdates = getQuantumDataDir() . '/live_updates.json';

$results['blogs_json_exists'] = file_exists($blogsJson);
if (file_exists($blogsJson)) {
    $results['blogs_json_size'] = filesize($blogsJson);
    $content = file_get_contents($blogsJson);
    $decoded = json_decode($content, true);
    if ($decoded === null) {
        $results['blogs_json_valid'] = false;
        $results['blogs_json_error'] = json_last_error_msg();
    } else {
        $results['blogs_json_valid'] = true;
        $results['blogs_json_count'] = count($decoded);
        $results['blogs_json_latest'] = array_slice($decoded, 0, 3);
    }
}

$results['db_json_exists'] = file_exists($dbJson);
if (file_exists($dbJson)) {
    $results['db_json_size'] = filesize($dbJson);
    $content = file_get_contents($dbJson);
    $decoded = json_decode($content, true);
    if ($decoded === null) {
        $results['db_json_valid'] = false;
        $results['db_json_error'] = json_last_error_msg();
    } else {
        $results['db_json_valid'] = true;
        $results['db_json_latest_logs'] = array_slice(isset($decoded['systemLogs']) ? $decoded['systemLogs'] : [], -10);
    }
}

$dbStatus = getDBStatus();
$results['db_status'] = $dbStatus['status'];
$results['db_message'] = isset($dbStatus['message']) ? $dbStatus['message'] : '';

$pdo = getDBConnection();
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM blogs");
        $results['db_blogs_count'] = $stmt->fetch()['count'];
        
        $stmt = $pdo->query("SELECT id, title, date FROM blogs ORDER BY date DESC LIMIT 5");
        $results['db_blogs_latest'] = $stmt->fetchAll();
    } catch (Exception $e) {
        $results['db_query_error'] = $e->getMessage();
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
