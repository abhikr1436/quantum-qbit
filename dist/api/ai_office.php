<?php
// Deprecated AI Editorial Studio Endpoint
// Strictly restricted: Unauthenticated operations are disabled for security.
require_once __DIR__ . '/cors.php';

ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

@session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden: This legacy endpoint is restricted. Use the official /api/publish.php API instead.']);
    exit;
}

echo json_encode([
    'status' => 'deprecated',
    'message' => 'AI Office is deprecated. Please use the official Admin Console or /api/publish.php.'
]);
