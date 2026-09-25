<?php
// Dual AI Backend Proxy (Google Gemini & DeepSeek) for Quantum Qbit
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

require_once __DIR__ . '/db_config.php';

// Storage paths
$persistentDir = getQuantumDataDir();
$configFile = $persistentDir . '/config.json';
$localConfig = __DIR__ . '/data/config.json';

// Helper to get publishing API key for server verification
function getStoredRemoteApiKey($configFile, $localConfig) {
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['api_key'])) {
            return trim($cfg['api_key']);
        }
    }
    if (file_exists($localConfig)) {
        $cfg = json_decode(file_get_contents($localConfig), true);
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
} elseif (isset($_GET['api_key'])) {
    $suppliedKey = trim($_GET['api_key']);
}

if (!empty($suppliedKey)) {
    $validRemoteKey = getStoredRemoteApiKey($configFile, $localConfig);
    if (!empty($validRemoteKey) && hash_equals($validRemoteKey, $suppliedKey)) {
        $isApiKeyValid = true;
    }
}

if (!$isAdminSession && !$isApiKeyValid) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized: Administrator session or valid X-API-Key required.']);
    exit;
}

// Key retrieval helpers
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
    $envKey = getenv('DEEPSEEK_API_KEY');
    return !empty($envKey) ? trim($envKey) : '';
}

function getGeminiApiKey($configFile, $localConfig) {
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (is_array($cfg) && !empty($cfg['gemini_api_key'])) {
            return trim($cfg['gemini_api_key']);
        }
    }
    if (file_exists($localConfig)) {
        $cfg = json_decode(file_get_contents($localConfig), true);
        if (is_array($cfg) && !empty($cfg['gemini_api_key'])) {
            return trim($cfg['gemini_api_key']);
        }
    }
    $envKey = getenv('GEMINI_API_KEY');
    return !empty($envKey) ? trim($envKey) : '';
}

$deepseekKey = getDeepSeekApiKey($configFile, $localConfig);
$geminiKey = getGeminiApiKey($configFile, $localConfig);

// Handle GET status inspection
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'online',
        'gemini_available' => !empty($geminiKey),
        'deepseek_available' => !empty($deepseekKey),
        'default_provider' => !empty($geminiKey) ? 'gemini' : (!empty($deepseekKey) ? 'deepseek' : 'none')
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST to generate AI drafts.']);
    exit;
}

if (empty($deepseekKey) && empty($geminiKey)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'No AI API keys configured. Please add deepseek_api_key or gemini_api_key in config.json.'
    ]);
    exit;
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!is_array($input) || empty($input['messages']) || !is_array($input['messages'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid "messages" array in request body.']);
    exit;
}

$requestedProvider = isset($input['provider']) ? strtolower(trim($input['provider'])) : 'auto';
$temperature = isset($input['temperature']) ? min(1.0, max(0.0, floatval($input['temperature']))) : 0.7;
$maxTokens = isset($input['max_tokens']) ? min(8192, max(100, intval($input['max_tokens']))) : 8192;

// Call Google Gemini API
function callGemini($apiKey, $messages, $temperature, $maxTokens, $model = 'gemini-2.5-flash') {
    $systemInstruction = '';
    $contents = [];

    foreach ($messages as $msg) {
        $role = isset($msg['role']) ? $msg['role'] : 'user';
        $text = isset($msg['content']) ? $msg['content'] : '';

        if ($role === 'system') {
            $systemInstruction .= ($systemInstruction ? "\n\n" : "") . $text;
        } elseif ($role === 'assistant') {
            $contents[] = [
                'role' => 'model',
                'parts' => [['text' => $text]]
            ];
        } else {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => $text]]
            ];
        }
    }

    if (empty($contents)) {
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => 'Hello']]
        ];
    }

    $payload = [
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => $temperature,
            'maxOutputTokens' => $maxTokens
        ]
    ];

    if (!empty($systemInstruction)) {
        $payload['systemInstruction'] = [
            'parts' => [['text' => $systemInstruction]]
        ];
    }

    // Try primary gemini-2.5-flash, fallback to gemini-1.5-flash if needed
    $modelsToTry = [$model, 'gemini-1.5-flash', 'gemini-2.0-flash'];
    $lastError = '';

    foreach ($modelsToTry as $m) {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$m}:generateContent?key=" . urlencode($apiKey);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 90);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            $lastError = 'cURL error: ' . $curlError;
            continue;
        }

        if ($httpCode === 200) {
            $json = json_decode($response, true);
            $candidateText = '';
            if (isset($json['candidates'][0]['content']['parts'][0]['text'])) {
                $candidateText = $json['candidates'][0]['content']['parts'][0]['text'];
            }

            if (!empty($candidateText)) {
                return [
                    'success' => true,
                    'provider' => 'gemini',
                    'model' => $m,
                    'text' => $candidateText
                ];
            }
        }
        $lastError = "Gemini model {$m} returned HTTP {$httpCode}: " . substr($response, 0, 250);
    }

    return ['success' => false, 'error' => $lastError];
}

// Call DeepSeek API
function callDeepSeek($apiKey, $messages, $temperature, $maxTokens) {
    $payload = [
        'model' => 'deepseek-chat',
        'messages' => $messages,
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
        return ['success' => false, 'error' => 'cURL Error contacting DeepSeek: ' . $curlError];
    }

    if ($httpCode === 200) {
        $json = json_decode($response, true);
        if (isset($json['choices'][0]['message']['content'])) {
            return [
                'success' => true,
                'provider' => 'deepseek',
                'model' => 'deepseek-chat',
                'text' => $json['choices'][0]['message']['content'],
                'raw' => $json
            ];
        }
    }

    return [
        'success' => false,
        'error' => "DeepSeek returned HTTP {$httpCode}: " . substr($response, 0, 250)
    ];
}

// Execute with fallback logic
$result = null;

if ($requestedProvider === 'gemini') {
    if (!empty($geminiKey)) {
        $result = callGemini($geminiKey, $input['messages'], $temperature, $maxTokens);
    } else {
        $result = ['success' => false, 'error' => 'Google Gemini API key is not configured in config.json.'];
    }
} elseif ($requestedProvider === 'deepseek') {
    if (!empty($deepseekKey)) {
        $result = callDeepSeek($deepseekKey, $input['messages'], $temperature, $maxTokens);
    } else {
        $result = ['success' => false, 'error' => 'DeepSeek API key is not configured in config.json.'];
    }
} else {
    // 'auto' mode: prefer Gemini for speed and tokens, fallback to DeepSeek (or vice-versa)
    if (!empty($geminiKey)) {
        $result = callGemini($geminiKey, $input['messages'], $temperature, $maxTokens);
        if (!$result['success'] && !empty($deepseekKey)) {
            // Fallback to DeepSeek
            $result = callDeepSeek($deepseekKey, $input['messages'], $temperature, $maxTokens);
        }
    } elseif (!empty($deepseekKey)) {
        $result = callDeepSeek($deepseekKey, $input['messages'], $temperature, $maxTokens);
    }
}

if (!$result || !$result['success']) {
    http_response_code(502);
    echo json_encode([
        'error' => isset($result['error']) ? $result['error'] : 'Failed to generate response from AI providers.'
    ]);
    exit;
}

// Format unified OpenAI-compatible response
echo json_encode([
    'id' => ($result['provider'] . '-' . bin2hex(random_bytes(8))),
    'object' => 'chat.completion',
    'provider' => $result['provider'],
    'model' => $result['model'],
    'choices' => [
        [
            'index' => 0,
            'message' => [
                'role' => 'assistant',
                'content' => $result['text']
            ],
            'finish_reason' => 'stop'
        ]
    ],
    'usage' => [
        'prompt_tokens' => 0,
        'completion_tokens' => str_word_count($result['text']),
        'total_tokens' => str_word_count($result['text'])
    ]
]);