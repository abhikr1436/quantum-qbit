<?php
// DeepSeek AI Backend Proxy for Quantum Qbit
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

@session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';

// Storage paths
$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$localConfig = __DIR__ . '/data/config.json';

// Helper to retrieve DeepSeek API key
function getDeepSeekApiKey($configFile, $localConfig) {
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['deepseek_api_key'])) {
            return trim($cfg['deepseek_api_key']);
        }
    }
    if (file_exists($localConfig)) {
        $cfg = json_decode(file_get_contents($localConfig), true);
        if (is_array($cfg) && !empty($cfg['deepseek_api_key'])) {
            return trim($cfg['deepseek_api_key']);
        }
    }
    // Check environment variable
    $envKey = getenv('DEEPSEEK_API_KEY');
    if (!empty($envKey)) {
        return trim($envKey);
    }
    return '';
}

$apiKey = getDeepSeekApiKey($configFile, $localConfig);

if (empty($apiKey)) {
    http_response_code(500);
    echo json_encode(['error' => 'DeepSeek API key is not configured in config.json. Please add "deepseek_api_key" to config.json in Hostinger.']);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!is_array($input) || empty($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing "messages" array in request body.']);
    exit;
}

$payload = [
    'model' => 'deepseek-chat',
    'messages' => $input['messages'],
    'temperature' => isset($input['temperature']) ? floatval($input['temperature']) : 0.7,
    'max_tokens' => isset($input['max_tokens']) ? intval($input['max_tokens']) : 4000
];

$ch = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Authorization: Bearer ' . $apiKey
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($curlError) {
    http_response_code(502);
    echo json_encode(['error' => 'cURL Error: ' . $curlError]);
    exit;
}

http_response_code($httpCode);
echo $response;
