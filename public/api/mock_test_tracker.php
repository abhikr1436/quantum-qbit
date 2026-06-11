<?php
// Enable CORS for local dev environment testing (if cross-origin)
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '*';
header("Access-Control-Allow-Origin: $origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
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

require_once __DIR__ . '/db_config.php';
$pdo = getDBConnection();
$fallbackFile = getQuantumDataDir() . '/mock_tests.json';

// Auto-migration: Create mock_test_attempts table if database is connected
if ($pdo) {
    try {
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS mock_test_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                session_id VARCHAR(100) UNIQUE NOT NULL,
                candidate_name VARCHAR(100) NOT NULL,
                roll_number VARCHAR(50) NOT NULL,
                test_name VARCHAR(255) NOT NULL,
                start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted BOOLEAN DEFAULT FALSE,
                marks INT DEFAULT NULL,
                total_marks INT DEFAULT NULL,
                time_spent VARCHAR(50) DEFAULT NULL,
                submitted_at TIMESTAMP NULL DEFAULT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");
    } catch (PDOException $e) {
        // Log or handle migration error silently, will use fallback or query error
    }
}

// Helper to get fallback attempts
function getFallbackAttempts($file) {
    if (!file_exists(dirname($file))) {
        @mkdir(dirname($file), 0755, true);
    }
    if (!file_exists($file)) {
        file_put_contents($file, json_encode([]));
        return [];
    }
    $data = file_get_contents($file);
    $arr = json_decode($data, true);
    return is_array($arr) ? $arr : [];
}

// Helper to save fallback attempts
function saveFallbackAttempts($file, $attempts) {
    return file_put_contents($file, json_encode($attempts, JSON_PRETTY_PRINT)) !== false;
}

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true);

$action = isset($_GET['action']) ? $_GET['action'] : (isset($input['action']) ? $input['action'] : '');

// 1. START ATTEMPT (Public)
if ($action === 'start') {
    $sessionId = isset($input['session_id']) ? trim($input['session_id']) : '';
    $candidateName = isset($input['candidate_name']) ? trim($input['candidate_name']) : '';
    $rollNumber = isset($input['roll_number']) ? trim($input['roll_number']) : '';
    $testName = isset($input['test_name']) ? trim($input['test_name']) : '';

    if (empty($sessionId) || empty($candidateName) || empty($rollNumber) || empty($testName)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required parameter: session_id, candidate_name, roll_number, or test_name']);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO mock_test_attempts (session_id, candidate_name, roll_number, test_name, start_time)
                VALUES (:session_id, :candidate_name, :roll_number, :test_name, NOW())
                ON DUPLICATE KEY UPDATE 
                    candidate_name = VALUES(candidate_name),
                    roll_number = VALUES(roll_number),
                    test_name = VALUES(test_name)
            ");
            $stmt->execute([
                'session_id' => $sessionId,
                'candidate_name' => $candidateName,
                'roll_number' => $rollNumber,
                'test_name' => $testName
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $attempts = getFallbackAttempts($fallbackFile);
        $foundKey = -1;
        foreach ($attempts as $idx => $att) {
            if ($att['session_id'] === $sessionId) {
                $foundKey = $idx;
                break;
            }
        }

        $now = date('Y-m-d H:i:s');
        if ($foundKey !== -1) {
            $attempts[$foundKey]['candidate_name'] = $candidateName;
            $attempts[$foundKey]['roll_number'] = $rollNumber;
            $attempts[$foundKey]['test_name'] = $testName;
        } else {
            $attempts[] = [
                'session_id' => $sessionId,
                'candidate_name' => $candidateName,
                'roll_number' => $rollNumber,
                'test_name' => $testName,
                'start_time' => $now,
                'submitted' => false,
                'marks' => null,
                'total_marks' => null,
                'time_spent' => null,
                'submitted_at' => null
            ];
        }

        if (saveFallbackAttempts($fallbackFile, $attempts)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save mock test start log to fallback file']);
        }
    }
    exit;
}

// 2. SUBMIT ATTEMPT (Public)
if ($action === 'submit') {
    $sessionId = isset($input['session_id']) ? trim($input['session_id']) : '';
    $marks = isset($input['marks']) ? intval($input['marks']) : 0;
    $totalMarks = isset($input['total_marks']) ? intval($input['total_marks']) : 0;
    $timeSpent = isset($input['time_spent']) ? trim($input['time_spent']) : '';

    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                UPDATE mock_test_attempts
                SET submitted = 1,
                    marks = :marks,
                    total_marks = :total_marks,
                    time_spent = :time_spent,
                    submitted_at = NOW()
                WHERE session_id = :session_id
            ");
            $stmt->execute([
                'marks' => $marks,
                'total_marks' => $totalMarks,
                'time_spent' => $timeSpent,
                'session_id' => $sessionId
            ]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        // Fallback JSON mode
        $attempts = getFallbackAttempts($fallbackFile);
        $foundKey = -1;
        foreach ($attempts as $idx => $att) {
            if ($att['session_id'] === $sessionId) {
                $foundKey = $idx;
                break;
            }
        }

        if ($foundKey === -1) {
            // Attempt is not yet in fallback, create it first then update
            $attempts[] = [
                'session_id' => $sessionId,
                'candidate_name' => 'Unknown Candidate',
                'roll_number' => 'N/A',
                'test_name' => 'Unknown Mock Test',
                'start_time' => date('Y-m-d H:i:s'),
                'submitted' => true,
                'marks' => $marks,
                'total_marks' => $totalMarks,
                'time_spent' => $timeSpent,
                'submitted_at' => date('Y-m-d H:i:s')
            ];
        } else {
            $attempts[$foundKey]['submitted'] = true;
            $attempts[$foundKey]['marks'] = $marks;
            $attempts[$foundKey]['total_marks'] = $totalMarks;
            $attempts[$foundKey]['time_spent'] = $timeSpent;
            $attempts[$foundKey]['submitted_at'] = date('Y-m-d H:i:s');
        }

        if (saveFallbackAttempts($fallbackFile, $attempts)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save mock test submission log to fallback file']);
        }
    }
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// Admin authenticated routes
// ─────────────────────────────────────────────────────────────────────────────
if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// 3. GET LIST (Admin)
if ($action === 'list') {
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM mock_test_attempts ORDER BY start_time DESC");
            $attempts = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($attempts);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        $attempts = getFallbackAttempts($fallbackFile);
        usort($attempts, function($a, $b) {
            return strcmp($b['start_time'], $a['start_time']);
        });
        echo json_encode($attempts);
    }
    exit;
}

// 4. DELETE ATTEMPT (Admin)
if ($method === 'DELETE' || $action === 'delete') {
    $sessionId = isset($_GET['session_id']) ? trim($_GET['session_id']) : (isset($input['session_id']) ? trim($input['session_id']) : '');
    
    if (empty($sessionId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing session_id']);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM mock_test_attempts WHERE session_id = :session_id");
            $stmt->execute(['session_id' => $sessionId]);
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        $attempts = getFallbackAttempts($fallbackFile);
        $filteredAttempts = [];
        foreach ($attempts as $att) {
            if ($att['session_id'] !== $sessionId) {
                $filteredAttempts[] = $att;
            }
        }
        if (saveFallbackAttempts($fallbackFile, $filteredAttempts)) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to update fallback database file']);
        }
    }
    exit;
}

// 5. CLEAR ALL ATTEMPTS LOG (Admin)
if ($action === 'clear_all') {
    if ($pdo) {
        try {
            $pdo->exec("DELETE FROM mock_test_attempts");
            echo json_encode(['success' => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
        }
    } else {
        if (saveFallbackAttempts($fallbackFile, [])) {
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to clear fallback database file']);
        }
    }
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Action or Method not allowed']);
