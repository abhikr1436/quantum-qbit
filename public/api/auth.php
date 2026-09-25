<?php
// Admin Authentication & Configuration Controller
require_once __DIR__ . '/cors.php';

// Start PHP Session with secure parameters
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/db_config.php';
$configFile = getQuantumDataDir() . '/config.json';

// Helper to initialize and retrieve configuration
function getConfig($configFile) {
    if (!file_exists(dirname($configFile))) {
        @mkdir(dirname($configFile), 0755, true);
    }
    
    $config = [];
    if (file_exists($configFile)) {
        $config = json_decode(file_get_contents($configFile), true);
        if (!is_array($config)) {
            $config = [];
        }
    }
    
    if (!isset($config['passcode_hash'])) {
        $defaultPasscode = 'quantumqbit2026';
        $config['passcode_hash'] = password_hash($defaultPasscode, PASSWORD_DEFAULT);
        @file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
    }
    
    return $config;
}

$config = getConfig($configFile);
$input = json_decode(file_get_contents('php://input'), true);

// Extract Action
$action = '';
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif (isset($input['action'])) {
    $action = $input['action'];
}

switch ($action) {
    case 'status':
        $authenticated = isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
        $dbRes = [];
        $hasDeepseek = !empty($config['deepseek_api_key']);
        $hasGemini = !empty($config['gemini_api_key']);
        $aiConfigured = $hasDeepseek || $hasGemini;

        $apiKey = '';
        if ($authenticated) {
            $apiKey = isset($config['api_key']) ? $config['api_key'] : '';
            $dbInfo = getDBStatus();
            $dbRes = [
                'status' => $dbInfo['status'],
                'message' => isset($dbInfo['message']) ? $dbInfo['message'] : '',
                'host' => isset($dbInfo['host']) ? $dbInfo['host'] : '',
                'dbname' => isset($dbInfo['dbname']) ? $dbInfo['dbname'] : '',
                'user' => isset($dbInfo['user']) ? $dbInfo['user'] : '',
            ];
        }

        echo json_encode([
            'authenticated' => $authenticated,
            'api_key' => $apiKey,
            'db' => $dbRes,
            'ai_configured' => $aiConfigured,
            'deepseek_configured' => $hasDeepseek,
            'gemini_configured' => $hasGemini
        ]);
        break;
        
    case 'login':
        // Rate limiting for brute-force protection
        $now = time();
        if (!isset($_SESSION['login_attempts'])) {
            $_SESSION['login_attempts'] = 0;
            $_SESSION['last_attempt_time'] = $now;
        }

        // Reset attempts if 5 minutes have passed
        if ($now - $_SESSION['last_attempt_time'] > 300) {
            $_SESSION['login_attempts'] = 0;
        }

        if ($_SESSION['login_attempts'] >= 5) {
            $retryAfter = 300 - ($now - $_SESSION['last_attempt_time']);
            http_response_code(429);
            echo json_encode([
                'success' => false,
                'error' => 'Too many failed login attempts. Please wait ' . max(1, $retryAfter) . ' seconds before trying again.'
            ]);
            break;
        }

        $passcode = isset($input['passcode']) ? $input['passcode'] : '';
        if (empty($passcode)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Passcode is required']);
            break;
        }
        
        $hash = isset($config['passcode_hash']) ? $config['passcode_hash'] : '';
        if (password_verify($passcode, $hash)) {
            $_SESSION['admin_logged_in'] = true;
            $_SESSION['login_attempts'] = 0;
            session_regenerate_id(true);

            // Ensure remote publishing API key exists
            if (!isset($config['api_key']) || empty($config['api_key'])) {
                $config['api_key'] = 'qq_live_' . bin2hex(random_bytes(16));
                @file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
            }

            echo json_encode([
                'success' => true,
                'api_key' => $config['api_key']
            ]);
        } else {
            $_SESSION['login_attempts']++;
            $_SESSION['last_attempt_time'] = $now;
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Invalid passcode. Access denied.'
            ]);
        }
        break;
        
    case 'logout':
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();
        echo json_encode(['success' => true]);
        break;
        
    case 'change_passcode':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }
        
        $newPasscode = isset($input['new_passcode']) ? $input['new_passcode'] : '';
        if (empty($newPasscode) || strlen($newPasscode) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Passcode must be at least 6 characters long']);
            break;
        }
        
        $hashed = password_hash($newPasscode, PASSWORD_DEFAULT);
        $config['passcode_hash'] = $hashed;
        
        if (@file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save configuration']);
        }
        break;

    case 'save_db_config':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }
        
        $dbHost = isset($input['db_host']) ? trim($input['db_host']) : '';
        $dbName = isset($input['db_name']) ? trim($input['db_name']) : '';
        $dbUser = isset($input['db_user']) ? trim($input['db_user']) : '';
        $dbPass = isset($input['db_pass']) ? $input['db_pass'] : '';
        
        $config['db_host'] = $dbHost;
        $config['db_name'] = $dbName;
        $config['db_user'] = $dbUser;
        $config['db_pass'] = $dbPass;
        
        if (!@file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save configuration']);
            break;
        }
        
        $dbInfo = getDBStatus();
        if ($dbInfo['status'] === 'connected') {
            echo json_encode([
                'success' => true, 
                'message' => 'Database configuration saved and connected successfully!',
                'db' => [
                    'status' => 'connected',
                    'host' => $dbHost,
                    'dbname' => $dbName,
                    'user' => $dbUser
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Saved, but connection failed: ' . $dbInfo['message'],
                'db' => [
                    'status' => 'error',
                    'message' => $dbInfo['message'],
                    'host' => $dbHost,
                    'dbname' => $dbName,
                    'user' => $dbUser
                ]
            ]);
        }
        break;
        
    case 'get_api_key':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }
        
        $apiKey = isset($config['api_key']) ? trim($config['api_key']) : '';
        if (empty($apiKey)) {
            $apiKey = 'qq_live_' . bin2hex(random_bytes(16));
            $config['api_key'] = $apiKey;
            @file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
        }
        
        echo json_encode(['success' => true, 'api_key' => $apiKey]);
        break;

    case 'regenerate_api_key':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }
        
        $newKey = 'qq_live_' . bin2hex(random_bytes(16));
        $config['api_key'] = $newKey;
        if (@file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
            echo json_encode(['success' => true, 'api_key' => $newKey]);
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save new API key']);
        }
        break;

    case 'get_ai_status':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }

        $deepseekKey = isset($config['deepseek_api_key']) ? trim($config['deepseek_api_key']) : '';
        $geminiKey = isset($config['gemini_api_key']) ? trim($config['gemini_api_key']) : '';

        $maskKey = function($k) {
            if (empty($k)) return '';
            $len = strlen($k);
            if ($len <= 8) return '••••••••';
            return substr($k, 0, 4) . str_repeat('•', max(4, $len - 8)) . substr($k, -4);
        };

        echo json_encode([
            'success' => true,
            'configured' => (!empty($deepseekKey) || !empty($geminiKey)),
            'deepseek_configured' => !empty($deepseekKey),
            'deepseek_masked' => $maskKey($deepseekKey),
            'gemini_configured' => !empty($geminiKey),
            'gemini_masked' => $maskKey($geminiKey),
            'masked_key' => $maskKey($deepseekKey ?: $geminiKey)
        ]);
        break;

    case 'save_ai_key':
        if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Unauthorized']);
            break;
        }

        $changed = false;
        if (isset($input['deepseek_api_key'])) {
            $config['deepseek_api_key'] = trim($input['deepseek_api_key']);
            $changed = true;
        }
        if (isset($input['gemini_api_key'])) {
            $config['gemini_api_key'] = trim($input['gemini_api_key']);
            $changed = true;
        }

        if ($changed) {
            if (@file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
                echo json_encode([
                    'success' => true,
                    'message' => 'AI keys updated securely on server!'
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['success' => false, 'error' => 'Failed to write configuration file on server.']);
            }
        } else {
            echo json_encode(['success' => true, 'message' => 'No changes made.']);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
