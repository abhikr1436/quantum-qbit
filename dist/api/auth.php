<?php
// Enable CORS for local dev environment testing (if cross-origin)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Start PHP Session with secure parameters
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
// Note: session.cookie_secure should be set to 1 if using HTTPS in production
if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
    ini_set('session.cookie_secure', 1);
}

session_start();
header('Content-Type: application/json');

$configFile = __DIR__ . '/data/config.json';

// Helper to initialize and retrieve configuration
function getConfig($configFile) {
    if (!file_exists(dirname($configFile))) {
        mkdir(dirname($configFile), 0755, true);
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
        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
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
        if ($authenticated) {
            require_once __DIR__ . '/db_config.php';
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
            'db' => $dbRes
        ]);
        break;
        
    case 'login':
        $passcode = isset($input['passcode']) ? $input['passcode'] : '';
        if (empty($passcode)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Passcode is required']);
            break;
        }
        
        $hash = isset($config['passcode_hash']) ? $config['passcode_hash'] : '';
        if (password_verify($passcode, $hash)) {
            $_SESSION['admin_logged_in'] = true;
            // Regenerate session ID for security
            session_regenerate_id(true);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Invalid passcode']);
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
        
        if (file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
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
        
        if (!file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT))) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => 'Failed to save configuration']);
            break;
        }
        
        // Test the connection immediately
        require_once __DIR__ . '/db_config.php';
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
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
        break;
}
