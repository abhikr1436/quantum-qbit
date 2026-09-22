<?php
// DeepSeek AI Backend Proxy for Quantum Qbit
// Strictly authenticated: Requires active admin session or valid remote API key.

require_once __DIR__ . '/cors.php';

// Start PHP Session securely
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}
@session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST to generate AI drafts.']);
    exit;
}

require_once __DIR__ . '/db_config.php';

// Storage paths
$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$localConfig = __DIR__ . '/data/config.json';

// Helper to get publishing API key for server verification
function getStoredRemoteApiKey($configFile) {
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['api_key'])) {
            return trim($cfg['api_key']);
        }
    }
    return '';
}

// Check authorization
$isAdminSession = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
$isApiKeyValid = false;

$suppliedKey = '';
if (isset($_SERVER['HTTP_X_API_KEY'])) {
    $suppliedKey = trim($_SERVER['HTTP_X_API_KEY']);
} elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
    $authHeader = trim($_SERVER['HTTP_AUTHORIZATION']);
    if (stripos($authHeader, 'Bearer ') === 0) {
        $suppliedKey = trim(substr($authHeader, 7));
    }
}

if (!empty($suppliedKey)) {
    $validRemoteKey = getStoredRemoteApiKey($configFile);
    if (!empty($validRemoteKey) && hash_equals($validRemoteKey, $suppliedKey)) {
        $isApiKeyValid = true;
    }
}

if (!$isAdminSession && !$isApiKeyValid) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Administrator session or valid X-API-Key required.']);
    exit;
}

// Helper to retrieve DeepSeek API key
function getDeepSeekApiKey($configFile, $localConfig) {
    // 1. Persistent production config outside web root
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['deepseek_api_key'])) {
            return trim($cfg['deepseek_api_key']);
        }
    }
    // 2. Local config fallback
    if (file_exists($localConfig)) {
        $cfg = json_decode(file_get_contents($localConfig), true);
        if (is_array($cfg) && !empty($cfg['deepseek_api_key'])) {
            return trim($cfg['deepseek_api_key']);
        }
    }
    // 3. Environment variable fallback
    $envKey = getenv('DEEPSEEK_API_KEY');
    if (!empty($envKey)) {
        return trim($envKey);
    }
    return '';
}

$apiKey = getDeepSeekApiKey($configFile, $localConfig);

if (empty($apiKey)) {
    http_response_code(400);
    echo json_encode(['error' => 'DeepSeek API key is not configured on the server. Please add your key via the Admin Console or in config.json.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!is_array($input) || empty($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid "messages" array in request body.']);
    exit;
}

$temperature = isset($input['temperature']) ? min(1.0, max(0.0, floatval($input['temperature']))) : 0.7;
$maxTokens = isset($input['max_tokens']) ? min(8192, max(100, intval($input['max_tokens']))) : 8192;

$payload = [
    'model' => 'deepseek-chat',
    'messages' => $input['messages'],
    'temperature' => $temperature,
    'max_tokens' => $maxTokens
];

$ch = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'cURL Error contacting DeepSeek: ' . $curlError]);
    exit;
}

http_response_code($httpCode);
echo $response;