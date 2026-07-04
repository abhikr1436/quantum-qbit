<?php
// Enable CORS
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
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

// Helper to determine the file path for app-ads.txt
function getAdsFilePath() {
    // Try DOCUMENT_ROOT first (standard production web root)
    if (isset($_SERVER['DOCUMENT_ROOT']) && !empty($_SERVER['DOCUMENT_ROOT'])) {
        $docRoot = realpath($_SERVER['DOCUMENT_ROOT']);
        if ($docRoot) {
            return $docRoot . '/app-ads.txt';
        }
    }
    // Fallback relative to this API script (api is in public/api, app-ads.txt is in public/)
    return realpath(__DIR__ . '/../') . '/app-ads.txt';
}

$filePath = getAdsFilePath();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $content = '';
    if (file_exists($filePath)) {
        $content = file_get_contents($filePath);
    }
    echo json_encode([
        'success' => true,
        'content' => $content,
        'path' => $filePath
    ]);
    exit;
}

if ($method === 'POST') {
    // Session authorization check
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);
    $content = isset($input['content']) ? $input['content'] : null;

    if ($content === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Content field is required']);
        exit;
    }

    // Ensure the directory exists
    $dir = dirname($filePath);
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }

    // Write content
    if (file_put_contents($filePath, $content) !== false) {
        echo json_encode(['success' => true]);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Failed to write app-ads.txt to ' . $filePath]);
    }
    exit;
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
